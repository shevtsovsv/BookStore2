# Урок 20: JavaScript архитектура для авторизации

# Динамическая навигация и авторизация

Меню в header обновляется через JS:

- Для неавторизованного пользователя: ссылки "Регистрация" и "Вход" ведут на абсолютные пути `/html/register.html` и `/html/login.html`.
- Для авторизованного пользователя: "Регистрация" заменяется на имя, "Вход" — на "Выход".

Это реализовано через функцию `updateNavigation()` в `auth-utils.js`.

В интеграции с формами:

- Кнопка отправки формы показывает loader, успешное или ошибочное состояние.
- Ошибки отображаются динамически, поля подсвечиваются.
- Все обработчики реализованы в `register.js` и `auth-utils.js`.

## Обзор урока

В заключительном уроке серии мы создадим полную JavaScript архитектуру для системы авторизации. Изучим современные паттерны организации кода, управление состоянием, интеграцию с API, обработку ошибок и создание переиспользуемых компонентов.

### Цели урока

- Создать модульную архитектуру JavaScript приложения
- Реализовать управление состоянием авторизации
- Интегрировать с backend API
- Обеспечить надежную обработку ошибок
- Создать систему событий и уведомлений
- Реализовать кэширование и оптимизацию

### Архитектурные принципы

- **Модульность** - разделение на независимые модули
- **Переиспользуемость** - компоненты можно использовать повторно
- **Тестируемость** - код легко тестировать
- **Производительность** - оптимизация загрузки и выполнения
- **Безопасность** - защита от XSS и других атак

## Часть 1: Основная архитектура

### 1.1 Базовый Application Controller

```javascript
// auth-app.js - Главный контроллер приложения

/**
 * Главный класс приложения авторизации
 */
class AuthApplication {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: "/api",
      tokenStorageKey: "authToken",
      userStorageKey: "currentUser",
      refreshThreshold: 5 * 60 * 1000, // 5 минут до истечения
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.modules = new Map();
    this.eventBus = new EventBus();
    this.storage = new AuthStorage(this.config);
    this.api = new AuthAPI(this.config, this.eventBus);
    this.router = new AuthRouter(this.eventBus);
    this.state = new AuthState(this.eventBus);

    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Инициализация приложения
   */
  async init() {
    if (this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInit();
    return this.initPromise;
  }

  async _performInit() {
    try {
      console.log("Initializing AuthApplication...");

      // Инициализируем основные модули
      await this.storage.init();
      await this.api.init();
      await this.state.init();
      await this.router.init();

      // Регистрируем модули авторизации
      this.registerModule("validator", new AuthValidator());
      this.registerModule("notifications", new NotificationManager());
      this.registerModule("hints", new SmartHints());
      this.registerModule("ux", new UXComponents());

      // Настраиваем обработчики событий
      this.setupEventHandlers();

      // Проверяем существующую авторизацию
      await this.checkExistingAuth();

      // Запускаем автоматическое обновление токенов
      this.startTokenRefresh();

      this.isInitialized = true;
      this.eventBus.emit("app:initialized");

      console.log("AuthApplication initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AuthApplication:", error);
      this.eventBus.emit("app:initError", error);
      throw error;
    }
  }

  /**
   * Регистрация модуля
   */
  registerModule(name, module) {
    if (this.modules.has(name)) {
      console.warn(`Module '${name}' is already registered`);
      return;
    }

    this.modules.set(name, module);

    // Если модуль имеет метод init, вызываем его
    if (typeof module.init === "function") {
      module.init(this);
    }

    this.eventBus.emit("module:registered", { name, module });
  }

  /**
   * Получение модуля
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    // Обработка событий авторизации
    this.eventBus.on("auth:login:success", this.handleLoginSuccess.bind(this));
    this.eventBus.on("auth:login:error", this.handleLoginError.bind(this));
    this.eventBus.on("auth:logout", this.handleLogout.bind(this));
    this.eventBus.on("auth:token:expired", this.handleTokenExpired.bind(this));
    this.eventBus.on(
      "auth:token:refresh:success",
      this.handleTokenRefreshSuccess.bind(this)
    );
    this.eventBus.on(
      "auth:token:refresh:error",
      this.handleTokenRefreshError.bind(this)
    );

    // Обработка API ошибок
    this.eventBus.on("api:error", this.handleApiError.bind(this));
    this.eventBus.on("api:network:error", this.handleNetworkError.bind(this));

    // Обработка роутинга
    this.eventBus.on("route:change", this.handleRouteChange.bind(this));
    this.eventBus.on("route:protected", this.handleProtectedRoute.bind(this));
  }

  /**
   * Проверка существующей авторизации
   */
  async checkExistingAuth() {
    const token = this.storage.getToken();
    const user = this.storage.getUser();

    if (token && user) {
      try {
        // Проверяем валидность токена
        const isValid = await this.api.validateToken(token);

        if (isValid) {
          this.state.setAuthenticated(user, token);
          this.eventBus.emit("auth:restored", { user, token });
        } else {
          await this.clearAuth();
        }
      } catch (error) {
        console.warn("Failed to validate existing token:", error);
        await this.clearAuth();
      }
    }
  }

  /**
   * Запуск автоматического обновления токенов
   */
  startTokenRefresh() {
    const checkInterval = 60 * 1000; // Проверяем каждую минуту

    setInterval(() => {
      const token = this.storage.getToken();
      const expiration = this.storage.getTokenExpiration();

      if (token && expiration) {
        const timeUntilExpiry = expiration - Date.now();

        if (timeUntilExpiry <= this.config.refreshThreshold) {
          this.refreshToken();
        }
      }
    }, checkInterval);
  }

  /**
   * Обновление токена
   */
  async refreshToken() {
    const refreshToken = this.storage.getRefreshToken();

    if (!refreshToken) {
      this.eventBus.emit("auth:token:expired");
      return;
    }

    try {
      const response = await this.api.refreshToken(refreshToken);
      this.eventBus.emit("auth:token:refresh:success", response);
    } catch (error) {
      this.eventBus.emit("auth:token:refresh:error", error);
    }
  }

  /**
   * Обработчики событий
   */
  handleLoginSuccess(data) {
    this.storage.saveAuth(data);
    this.state.setAuthenticated(data.user, data.token);

    const notifications = this.getModule("notifications");
    if (notifications) {
      notifications.showSuccess("Вход выполнен успешно");
    }
  }

  handleLoginError(error) {
    console.error("Login error:", error);

    const notifications = this.getModule("notifications");
    if (notifications) {
      notifications.showError(this.getErrorMessage(error));
    }
  }

  async handleLogout() {
    await this.clearAuth();
    this.router.navigate("/login");

    const notifications = this.getModule("notifications");
    if (notifications) {
      notifications.showInfo("Вы вышли из системы");
    }
  }

  handleTokenExpired() {
    this.clearAuth();
    this.router.navigate("/login?reason=expired");

    const notifications = this.getModule("notifications");
    if (notifications) {
      notifications.showWarning("Сессия истекла. Войдите снова");
    }
  }

  handleTokenRefreshSuccess(data) {
    this.storage.saveAuth(data);
    this.state.updateToken(data.token);
    console.log("Token refreshed successfully");
  }

  handleTokenRefreshError(error) {
    console.error("Token refresh failed:", error);
    this.eventBus.emit("auth:token:expired");
  }

  handleApiError(error) {
    console.error("API Error:", error);

    if (error.status === 401) {
      this.eventBus.emit("auth:token:expired");
    } else if (error.status === 403) {
      this.router.navigate("/403");
    } else if (error.status >= 500) {
      const notifications = this.getModule("notifications");
      if (notifications) {
        notifications.showError("Ошибка сервера. Попробуйте позже");
      }
    }
  }

  handleNetworkError(error) {
    console.error("Network Error:", error);

    const notifications = this.getModule("notifications");
    if (notifications) {
      notifications.showError("Проблемы с подключением. Проверьте интернет");
    }
  }

  handleRouteChange(route) {
    console.log("Route changed:", route);
  }

  handleProtectedRoute(route) {
    if (!this.state.isAuthenticated()) {
      this.router.navigate(`/login?redirect=${encodeURIComponent(route)}`);
    }
  }

  /**
   * Очистка данных авторизации
   */
  async clearAuth() {
    this.storage.clearAuth();
    this.state.clearAuth();
    this.eventBus.emit("auth:cleared");
  }

  /**
   * Получение понятного сообщения об ошибке
   */
  getErrorMessage(error) {
    const errorMessages = {
      INVALID_CREDENTIALS: "Неверный логин или пароль",
      ACCOUNT_LOCKED: "Аккаунт заблокирован",
      EMAIL_NOT_VERIFIED: "Email не подтвержден",
      USER_NOT_FOUND: "Пользователь не найден",
      EMAIL_ALREADY_EXISTS: "Email уже зарегистрирован",
      USERNAME_ALREADY_EXISTS: "Логин уже занят",
      WEAK_PASSWORD: "Пароль слишком простой",
      VALIDATION_ERROR: "Ошибка валидации данных",
    };

    return errorMessages[error.code] || error.message || "Произошла ошибка";
  }

  /**
   * Публичный API для форм
   */
  async login(credentials) {
    try {
      const response = await this.api.login(credentials);
      this.eventBus.emit("auth:login:success", response);
      return { success: true, data: response };
    } catch (error) {
      this.eventBus.emit("auth:login:error", error);
      return { success: false, error };
    }
  }

  async register(userData) {
    try {
      const response = await this.api.register(userData);
      this.eventBus.emit("auth:register:success", response);
      return { success: true, data: response };
    } catch (error) {
      this.eventBus.emit("auth:register:error", error);
      return { success: false, error };
    }
  }

  async logout() {
    try {
      await this.api.logout();
      this.eventBus.emit("auth:logout");
      return { success: true };
    } catch (error) {
      // Даже если logout на сервере не удался, очищаем локальные данные
      this.eventBus.emit("auth:logout");
      return { success: true };
    }
  }

  /**
   * Получение текущего состояния
   */
  getState() {
    return this.state.getState();
  }

  /**
   * Уничтожение приложения
   */
  destroy() {
    this.eventBus.removeAllListeners();
    this.modules.clear();
    this.isInitialized = false;
  }
}
```

### 1.2 Event Bus для связи компонентов

```javascript
// event-bus.js - Система событий

/**
 * Простая и эффективная система событий
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.maxListeners = 100;
  }

  /**
   * Подписка на событие
   */
  on(event, callback, options = {}) {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event);

    if (listeners.length >= this.maxListeners) {
      console.warn(
        `Maximum listeners (${this.maxListeners}) exceeded for event: ${event}`
      );
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      id: this.generateId(),
    };

    listeners.push(listener);

    // Сортируем по приоритету (выше приоритет = раньше выполнение)
    listeners.sort((a, b) => b.priority - a.priority);

    return listener.id;
  }

  /**
   * Подписка на событие (одноразовая)
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * Отписка от события
   */
  off(event, callbackOrId) {
    if (!this.listeners.has(event)) {
      return false;
    }

    const listeners = this.listeners.get(event);
    let index = -1;

    if (typeof callbackOrId === "function") {
      // Поиск по функции
      index = listeners.findIndex(
        (listener) => listener.callback === callbackOrId
      );
    } else if (typeof callbackOrId === "string") {
      // Поиск по ID
      index = listeners.findIndex((listener) => listener.id === callbackOrId);
    }

    if (index !== -1) {
      listeners.splice(index, 1);

      if (listeners.length === 0) {
        this.listeners.delete(event);
      }

      return true;
    }

    return false;
  }

  /**
   * Генерация события
   */
  emit(event, data = null) {
    if (!this.listeners.has(event)) {
      return [];
    }

    const listeners = this.listeners.get(event);
    const results = [];
    const toRemove = [];

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];

      try {
        const result = listener.callback(data, event);
        results.push(result);

        if (listener.once) {
          toRemove.push(i);
        }
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }

    // Удаляем одноразовые слушатели (в обратном порядке, чтобы не сбить индексы)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      listeners.splice(toRemove[i], 1);
    }

    if (listeners.length === 0) {
      this.listeners.delete(event);
    }

    return results;
  }

  /**
   * Асинхронная генерация события
   */
  async emitAsync(event, data = null) {
    if (!this.listeners.has(event)) {
      return [];
    }

    const listeners = this.listeners.get(event);
    const results = [];
    const toRemove = [];

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];

      try {
        const result = await listener.callback(data, event);
        results.push(result);

        if (listener.once) {
          toRemove.push(i);
        }
      } catch (error) {
        console.error(`Error in async event listener for '${event}':`, error);
        results.push({ error });
      }
    }

    // Удаляем одноразовые слушатели
    for (let i = toRemove.length - 1; i >= 0; i--) {
      listeners.splice(toRemove[i], 1);
    }

    if (listeners.length === 0) {
      this.listeners.delete(event);
    }

    return results;
  }

  /**
   * Удаление всех слушателей события
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Получение списка событий
   */
  getEvents() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Получение количества слушателей для события
   */
  getListenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }

  /**
   * Генерация уникального ID
   */
  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Отладочная информация
   */
  debug() {
    const info = {};
    for (const [event, listeners] of this.listeners) {
      info[event] = listeners.length;
    }
    return info;
  }
}
```

### 1.3 Управление состоянием авторизации

```javascript
// auth-state.js - Управление состоянием

/**
 * Класс для управления состоянием авторизации
 */
class AuthState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = {
      isAuthenticated: false,
      user: null,
      token: null,
      permissions: [],
      loading: false,
      error: null,
      lastActivity: null,
    };

    this.watchers = new Map();
    this.stateHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * Инициализация состояния
   */
  async init() {
    this.updateLastActivity();

    // Отслеживание активности пользователя
    this.trackUserActivity();

    console.log("AuthState initialized");
  }

  /**
   * Получение текущего состояния
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Установка аутентифицированного состояния
   */
  setAuthenticated(user, token) {
    const previousState = { ...this.state };

    this.state = {
      ...this.state,
      isAuthenticated: true,
      user: { ...user },
      token,
      permissions: user.permissions || [],
      error: null,
      loading: false,
    };

    this.updateLastActivity();
    this.saveToHistory(previousState);
    this.notifyStateChange("authenticated", previousState);

    this.eventBus.emit("state:authenticated", this.state);
  }

  /**
   * Очистка авторизации
   */
  clearAuth() {
    const previousState = { ...this.state };

    this.state = {
      isAuthenticated: false,
      user: null,
      token: null,
      permissions: [],
      loading: false,
      error: null,
      lastActivity: this.state.lastActivity,
    };

    this.saveToHistory(previousState);
    this.notifyStateChange("unauthenticated", previousState);

    this.eventBus.emit("state:unauthenticated", this.state);
  }

  /**
   * Обновление токена
   */
  updateToken(token) {
    const previousState = { ...this.state };

    this.state.token = token;
    this.updateLastActivity();

    this.saveToHistory(previousState);
    this.notifyStateChange("tokenUpdated", previousState);

    this.eventBus.emit("state:tokenUpdated", this.state);
  }

  /**
   * Установка состояния загрузки
   */
  setLoading(loading, operation = null) {
    const previousState = { ...this.state };

    this.state.loading = loading;

    if (operation) {
      this.state.currentOperation = operation;
    } else {
      delete this.state.currentOperation;
    }

    this.notifyStateChange("loadingChanged", previousState);
    this.eventBus.emit("state:loadingChanged", { loading, operation });
  }

  /**
   * Установка ошибки
   */
  setError(error) {
    const previousState = { ...this.state };

    this.state.error = error;
    this.state.loading = false;

    this.saveToHistory(previousState);
    this.notifyStateChange("error", previousState);

    this.eventBus.emit("state:error", { error, state: this.state });
  }

  /**
   * Очистка ошибки
   */
  clearError() {
    if (this.state.error) {
      const previousState = { ...this.state };
      this.state.error = null;

      this.notifyStateChange("errorCleared", previousState);
      this.eventBus.emit("state:errorCleared", this.state);
    }
  }

  /**
   * Проверка аутентификации
   */
  isAuthenticated() {
    return this.state.isAuthenticated && this.state.token && this.state.user;
  }

  /**
   * Проверка прав доступа
   */
  hasPermission(permission) {
    if (!this.isAuthenticated()) {
      return false;
    }

    return (
      this.state.permissions.includes(permission) ||
      this.state.permissions.includes("admin")
    );
  }

  /**
   * Проверка роли
   */
  hasRole(role) {
    if (!this.isAuthenticated()) {
      return false;
    }

    return this.state.user.role === role || this.state.user.role === "admin";
  }

  /**
   * Получение пользователя
   */
  getUser() {
    return this.state.user ? { ...this.state.user } : null;
  }

  /**
   * Получение токена
   */
  getToken() {
    return this.state.token;
  }

  /**
   * Подписка на изменения состояния
   */
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }

    this.watchers.get(key).push(callback);

    // Возвращаем функцию для отписки
    return () => {
      const callbacks = this.watchers.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Уведомление о изменении состояния
   */
  notifyStateChange(changeType, previousState) {
    this.watchers.forEach((callbacks, key) => {
      if (key === changeType || key === "all") {
        callbacks.forEach((callback) => {
          try {
            callback(this.state, previousState, changeType);
          } catch (error) {
            console.error("Error in state watcher:", error);
          }
        });
      }
    });
  }

  /**
   * Сохранение в историю состояний
   */
  saveToHistory(state) {
    this.stateHistory.push({
      state: { ...state },
      timestamp: Date.now(),
    });

    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Получение истории состояний
   */
  getHistory() {
    return [...this.stateHistory];
  }

  /**
   * Обновление времени последней активности
   */
  updateLastActivity() {
    this.state.lastActivity = Date.now();
  }

  /**
   * Отслеживание активности пользователя
   */
  trackUserActivity() {
    const activityEvents = ["click", "keypress", "scroll", "mousemove"];
    let activityTimeout;

    const updateActivity = () => {
      this.updateLastActivity();
      this.eventBus.emit("user:activity", this.state.lastActivity);

      // Сбрасываем таймер неактивности
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.eventBus.emit("user:idle", this.state.lastActivity);
      }, 5 * 60 * 1000); // 5 минут неактивности
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Начальная установка таймера
    updateActivity();
  }

  /**
   * Сериализация состояния для отладки
   */
  serialize() {
    return JSON.stringify(
      {
        ...this.state,
        token: this.state.token ? "[HIDDEN]" : null,
      },
      null,
      2
    );
  }

  /**
   * Восстановление состояния из данных
   */
  restore(stateData) {
    const previousState = { ...this.state };

    this.state = {
      ...this.state,
      ...stateData,
      lastActivity: Date.now(),
    };

    this.saveToHistory(previousState);
    this.notifyStateChange("restored", previousState);

    this.eventBus.emit("state:restored", this.state);
  }
}
```

### 1.4 API клиент с ретраями и кэшированием

```javascript
// auth-api.js - API клиент для авторизации

/**
 * Продвинутый API клиент с поддержкой ретраев, кэширования и оптимизации
 */
class AuthAPI {
  constructor(config, eventBus) {
    this.config = config;
    this.eventBus = eventBus;

    this.baseURL = config.apiBaseUrl || "/api";
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.timeout = config.timeout || 30000;

    this.cache = new Map();
    this.requestQueue = new Map();
    this.interceptors = {
      request: [],
      response: [],
    };

    this.setupDefaultInterceptors();
  }

  /**
   * Инициализация API клиента
   */
  async init() {
    // Проверяем доступность API
    try {
      await this.healthCheck();
      console.log("API client initialized successfully");
    } catch (error) {
      console.warn("API health check failed:", error);
    }
  }

  /**
   * Настройка стандартных перехватчиков
   */
  setupDefaultInterceptors() {
    // Перехватчик запросов
    this.addRequestInterceptor((config) => {
      // Добавляем токен авторизации
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Добавляем стандартные заголовки
      config.headers = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...config.headers,
      };

      this.eventBus.emit("api:request:start", config);
      return config;
    });

    // Перехватчик ответов
    this.addResponseInterceptor(
      (response) => {
        this.eventBus.emit("api:request:success", response);
        return response;
      },
      (error) => {
        this.eventBus.emit("api:request:error", error);
        return this.handleApiError(error);
      }
    );
  }

  /**
   * Добавление перехватчика запросов
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Добавление перехватчика ответов
   */
  addResponseInterceptor(onSuccess, onError) {
    this.interceptors.response.push({ onSuccess, onError });
  }

  /**
   * Основной метод для выполнения запросов
   */
  async request(endpoint, options = {}) {
    const config = {
      method: "GET",
      headers: {},
      ...options,
      url: `${this.baseURL}${endpoint}`,
    };

    // Применяем перехватчики запросов
    for (const interceptor of this.interceptors.request) {
      config = (await interceptor(config)) || config;
    }

    // Проверяем кэш для GET запросов
    if (config.method === "GET" && config.cache !== false) {
      const cached = this.getCached(config.url);
      if (cached) {
        return cached;
      }
    }

    // Дедупликация одинаковых запросов
    const requestKey = this.getRequestKey(config);
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    // Выполняем запрос с ретраями
    const requestPromise = this.executeRequestWithRetry(config);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;

      // Кэшируем успешные GET запросы
      if (config.method === "GET" && config.cache !== false) {
        this.setCached(config.url, response, config.cacheTTL);
      }

      return response;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  /**
   * Выполнение запроса с ретраями
   */
  async executeRequestWithRetry(config) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest(config);
      } catch (error) {
        lastError = error;

        // Не повторяем для клиентских ошибок (4xx)
        if (error.status >= 400 && error.status < 500) {
          break;
        }

        // Последняя попытка
        if (attempt === this.maxRetries) {
          break;
        }

        // Экспоненциальная задержка
        const delay = this.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);

        this.eventBus.emit("api:retry", { attempt, error, config });
      }
    }

    throw lastError;
  }

  /**
   * Выполнение одного запроса
   */
  async executeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
        credentials: "same-origin",
      });

      clearTimeout(timeoutId);

      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url,
        data: null,
      };

      // Парсим ответ
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData.data = await response.json();
      } else {
        responseData.data = await response.text();
      }

      // Проверяем успешность
      if (!response.ok) {
        const error = new Error(
          responseData.data?.message || response.statusText
        );
        error.status = response.status;
        error.response = responseData;
        throw error;
      }

      // Применяем перехватчики ответов
      let finalResponse = responseData;
      for (const interceptor of this.interceptors.response) {
        if (interceptor.onSuccess) {
          finalResponse =
            (await interceptor.onSuccess(finalResponse)) || finalResponse;
        }
      }

      return finalResponse.data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Обрабатываем ошибки отмены
      if (error.name === "AbortError") {
        const timeoutError = new Error("Request timeout");
        timeoutError.code = "TIMEOUT";
        throw timeoutError;
      }

      // Обрабатываем сетевые ошибки
      if (!error.status) {
        error.code = "NETWORK_ERROR";
        this.eventBus.emit("api:network:error", error);
      }

      // Применяем перехватчики ошибок
      for (const interceptor of this.interceptors.response) {
        if (interceptor.onError) {
          const result = await interceptor.onError(error);
          if (result !== undefined) {
            return result;
          }
        }
      }

      throw error;
    }
  }

  /**
   * Обработка API ошибок
   */
  handleApiError(error) {
    this.eventBus.emit("api:error", error);

    // Логируем ошибки для отладки
    console.error("API Error:", {
      message: error.message,
      status: error.status,
      url: error.response?.url,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }

  /**
   * HTTP методы
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: data,
      cache: false,
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: data,
      cache: false,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
      cache: false,
    });
  }

  /**
   * Методы авторизации
   */
  async login(credentials) {
    const response = await this.post("/auth/login", credentials);
    return response;
  }

  async register(userData) {
    const response = await this.post("/auth/register", userData);
    return response;
  }

  async logout() {
    try {
      await this.post("/auth/logout");
    } catch (error) {
      // Игнорируем ошибки logout на сервере
      console.warn("Logout error:", error);
    }
  }

  async refreshToken(refreshToken) {
    const response = await this.post("/auth/refresh", { refreshToken });
    return response;
  }

  async validateToken(token) {
    try {
      await this.get("/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkEmail(email) {
    const response = await this.post("/auth/check-email", { email });
    return response;
  }

  async checkUsername(username) {
    const response = await this.post("/auth/check-username", { username });
    return response;
  }

  async resetPassword(email) {
    const response = await this.post("/auth/reset-password", { email });
    return response;
  }

  async confirmReset(token, newPassword) {
    const response = await this.post("/auth/confirm-reset", {
      token,
      newPassword,
    });
    return response;
  }

  /**
   * Проверка здоровья API
   */
  async healthCheck() {
    return this.get("/health");
  }

  /**
   * Получение токена авторизации
   */
  getAuthToken() {
    // Получаем токен из localStorage или sessionStorage
    return (
      localStorage.getItem(this.config.tokenStorageKey) ||
      sessionStorage.getItem(this.config.tokenStorageKey)
    );
  }

  /**
   * Кэширование
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCached(key, data, ttl = 300000) {
    // 5 минут по умолчанию
    this.cache.set(key, {
      data: data,
      expires: Date.now() + ttl,
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Вспомогательные методы
   */
  getRequestKey(config) {
    return `${config.method}:${config.url}:${JSON.stringify(
      config.body || {}
    )}`;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

Это основная архитектура. Продолжу с остальными компонентами в следующей части файла для соблюдения лимитов размера.
