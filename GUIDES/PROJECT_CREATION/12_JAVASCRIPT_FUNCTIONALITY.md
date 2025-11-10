# ⚡ JavaScript функциональность

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 5-6 часов  
> **Предварительные требования:** Завершение части 11

## 🎯 Цели этой части

В этой части вы создадите современную JavaScript архитектуру для:

- Интерактивного каталога книг
- Системы аутентификации
- Корзины покупок
- Уведомлений и модальных окон
- Адаптивного интерфейса

---

## 📁 Структура JavaScript файлов

### 1. Утилитарные функции

Обновите файл `public/scripts/utils.js`:

```javascript
/* ===================================
   УТИЛИТАРНЫЕ ФУНКЦИИ
   =================================== */

const Utils = {
  // Дебаунс функция
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Троттлинг функция
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Форматирование цены
  formatPrice(price, currency = "₽") {
    if (typeof price !== "number") return price;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
      .format(price)
      .replace("RUB", currency);
  },

  // Форматирование даты
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return new Intl.DateTimeFormat("ru-RU", {
      ...defaultOptions,
      ...options,
    }).format(new Date(date));
  },

  // Форматирование относительного времени
  formatRelativeTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    const intervals = [
      { label: "год", seconds: 31536000 },
      { label: "месяц", seconds: 2592000 },
      { label: "неделя", seconds: 604800 },
      { label: "день", seconds: 86400 },
      { label: "час", seconds: 3600 },
      { label: "минута", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count > 0) {
        return this.pluralize(count, interval.label);
      }
    }

    return "только что";
  },

  // Плюрализация
  pluralize(count, word) {
    const forms = {
      год: ["год", "года", "лет"],
      месяц: ["месяц", "месяца", "месяцев"],
      неделя: ["неделя", "недели", "недель"],
      день: ["день", "дня", "дней"],
      час: ["час", "часа", "часов"],
      минута: ["минута", "минуты", "минут"],
    };

    const wordForms = forms[word] || [word, word, word];

    if (count % 10 === 1 && count % 100 !== 11) {
      return `${count} ${wordForms[0]} назад`;
    } else if (
      [2, 3, 4].includes(count % 10) &&
      ![12, 13, 14].includes(count % 100)
    ) {
      return `${count} ${wordForms[1]} назад`;
    } else {
      return `${count} ${wordForms[2]} назад`;
    }
  },

  // Экранирование HTML
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },

  // Генерация уникального ID
  generateId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Проверка валидности email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Проверка силы пароля
  getPasswordStrength(password) {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push("Минимум 8 символов");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Строчные буквы");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Заглавные буквы");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Цифры");

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push("Специальные символы");

    const strength = [
      "Очень слабый",
      "Слабый",
      "Средний",
      "Хороший",
      "Отличный",
    ][score];
    const color = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"][
      score
    ];

    return { score, strength, color, feedback };
  },

  // Копирование в буфер обмена
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  },

  // Загрузка изображения с прелоадером
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  // Создание слага из строки
  createSlug(text) {
    const cyrillicMap = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "yo",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    };

    return text
      .toLowerCase()
      .split("")
      .map((char) => cyrillicMap[char] || char)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },

  // Анимация скролла к элементу
  scrollToElement(element, offset = 0) {
    const elementPosition =
      element.getBoundingClientRect().top + window.pageYOffset;
    const targetPosition = elementPosition - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  },

  // Проверка видимости элемента в viewport
  isElementInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= windowHeight + threshold &&
      rect.right <= windowWidth + threshold
    );
  },

  // Обрезка текста с многоточием
  truncateText(text, length, suffix = "...") {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + suffix;
  },

  // Получение параметров URL
  getUrlParams() {
    return new URLSearchParams(window.location.search);
  },

  // Обновление URL без перезагрузки страницы
  updateUrl(params, title = null) {
    const url = new URL(window.location);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    window.history.pushState({}, title || document.title, url);
  },

  // Сохранение в localStorage с обработкой ошибок
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn("localStorage недоступен:", e);
        return false;
      }
    },

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn("Ошибка чтения из localStorage:", e);
        return defaultValue;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.warn("Ошибка удаления из localStorage:", e);
        return false;
      }
    },

    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.warn("Ошибка очистки localStorage:", e);
        return false;
      }
    },
  },

  // Управление куками
  cookies: {
    set(name, value, days = 7) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    },

    get(name) {
      const nameEQ = name + "=";
      const ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
          return c.substring(nameEQ.length, c.length);
      }
      return null;
    },

    remove(name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },
  },
};

// Глобальные константы
const CONSTANTS = {
  API_BASE_URL: "/api",
  ITEMS_PER_PAGE: 12,
  SEARCH_DEBOUNCE_TIME: 500,
  NOTIFICATION_DURATION: 5000,
  MAX_CART_QUANTITY: 10,
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB

  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },

  THEMES: {
    LIGHT: "light",
    DARK: "dark",
    AUTO: "auto",
  },

  USER_ROLES: {
    USER: "user",
    ADMIN: "admin",
  },

  ORDER_STATUSES: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  },
};

// Экспорт для Node.js (если нужно)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Utils, CONSTANTS };
}
```

### 2. API клиент

Обновите файл `public/scripts/api.js`:

```javascript
/* ===================================
   API КЛИЕНТ
   =================================== */

class ApiClient {
  constructor(baseURL = CONSTANTS.API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = Utils.storage.get("authToken");
    this.refreshToken = Utils.storage.get("refreshToken");
  }

  // Установка токена авторизации
  setAuthToken(token, refreshToken = null) {
    this.token = token;
    this.refreshToken = refreshToken;
    Utils.storage.set("authToken", token);
    if (refreshToken) {
      Utils.storage.set("refreshToken", refreshToken);
    }
  }

  // Удаление токенов
  clearAuthTokens() {
    this.token = null;
    this.refreshToken = null;
    Utils.storage.remove("authToken");
    Utils.storage.remove("refreshToken");
  }

  // Основной метод для HTTP запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Добавление токена авторизации
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      // Обработка 401 ошибки (неавторизован)
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          // Повторный запрос с новым токеном
          config.headers.Authorization = `Bearer ${this.token}`;
          return await fetch(url, config);
        } else {
          // Редирект на страницу входа
          window.location.href = "/login";
          return;
        }
      }

      // Проверка успешности запроса
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Ошибка сети или сервера", 0, {
        originalError: error,
      });
    }
  }

  // Обновление токена авторизации
  async refreshAuthToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuthToken(data.data.accessToken, data.data.refreshToken);
        return true;
      } else {
        this.clearAuthTokens();
        return false;
      }
    } catch (error) {
      this.clearAuthTokens();
      return false;
    }
  }

  // GET запрос
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: "GET" });
  }

  // POST запрос
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT запрос
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // PATCH запрос
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // DELETE запрос
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Загрузка файла
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append("file", file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.request(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // Убираем Content-Type для FormData
    });
  }

  // =================
  // API МЕТОДЫ
  // =================

  // Аутентификация
  async login(email, password, rememberMe = false) {
    return this.post("/auth/login", { email, password, rememberMe });
  }

  async register(userData) {
    return this.post("/auth/register", userData);
  }

  async logout() {
    try {
      await this.post("/auth/logout", { refreshToken: this.refreshToken });
    } finally {
      this.clearAuthTokens();
    }
  }

  async forgotPassword(email) {
    return this.post("/auth/forgot-password", { email });
  }

  async resetPassword(token, password) {
    return this.post("/auth/reset-password", { token, password });
  }

  async getProfile() {
    return this.get("/auth/profile");
  }

  async updateProfile(userData) {
    return this.put("/auth/profile", userData);
  }

  // Книги
  async getBooks(params = {}) {
    return this.get("/books", params);
  }

  async getBook(id) {
    return this.get(`/books/${id}`);
  }

  async searchBooks(query, params = {}) {
    return this.get("/books", { search: query, ...params });
  }

  async getBookRecommendations(bookId) {
    return this.get(`/books/${bookId}/recommendations`);
  }

  async autocompleteBooks(query) {
    return this.get("/books/search/autocomplete", { q: query });
  }

  // Категории
  async getCategories(params = {}) {
    return this.get("/categories", params);
  }

  async getCategory(id) {
    return this.get(`/categories/${id}`);
  }

  async getCategoryTree() {
    return this.get("/categories/tree");
  }

  // Авторы
  async getAuthors(params = {}) {
    return this.get("/authors", params);
  }

  async getAuthor(id) {
    return this.get(`/authors/${id}`);
  }

  async autocompleteAuthors(query) {
    return this.get("/authors/search/autocomplete", { q: query });
  }

  // Издательства
  async getPublishers(params = {}) {
    return this.get("/publishers", params);
  }

  async getPublisher(id) {
    return this.get(`/publishers/${id}`);
  }

  // Корзина
  async getCart() {
    return this.get("/cart");
  }

  async addToCart(bookId, quantity = 1) {
    return this.post("/cart/add", { bookId, quantity });
  }

  async updateCartItem(itemId, quantity) {
    return this.put(`/cart/update/${itemId}`, { quantity });
  }

  async removeFromCart(itemId) {
    return this.delete(`/cart/remove/${itemId}`);
  }

  async clearCart() {
    return this.delete("/cart/clear");
  }

  async validateCart() {
    return this.get("/cart/validate");
  }

  async syncCartPrices() {
    return this.post("/cart/sync-prices");
  }

  // Заказы
  async getOrders(params = {}) {
    return this.get("/orders", params);
  }

  async getOrder(id) {
    return this.get(`/orders/${id}`);
  }

  async createOrder(orderData) {
    return this.post("/orders", orderData);
  }

  async cancelOrder(id) {
    return this.put(`/orders/${id}/cancel`);
  }

  async repeatOrder(id) {
    return this.post(`/orders/${id}/repeat`);
  }

  // Статистика
  async getStats() {
    return this.get("/stats");
  }

  async getPopularBooks(limit = 10) {
    return this.get("/stats/popular-books", { limit });
  }
}

// Класс ошибки API
class ApiError extends Error {
  constructor(message, status = 0, data = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

// Создание глобального экземпляра API клиента
const api = new ApiClient();

// Экспорт для Node.js (если нужно)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ApiClient, ApiError, api };
}
```

### 3. Система уведомлений

Создайте файл `public/scripts/notifications.js`:

```javascript
/* ===================================
   СИСТЕМА УВЕДОМЛЕНИЙ
   =================================== */

class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.defaultDuration = CONSTANTS.NOTIFICATION_DURATION;
    this.maxNotifications = 5;
    this.init();
  }

  init() {
    // Создание контейнера для уведомлений
    this.container = document.getElementById("toastContainer");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toastContainer";
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  // Показ уведомления
  show(message, type = "info", options = {}) {
    const notification = this.createNotification(message, type, options);
    this.addNotification(notification);
    return notification.id;
  }

  // Различные типы уведомлений
  success(message, options = {}) {
    return this.show(message, "success", options);
  }

  error(message, options = {}) {
    return this.show(message, "error", { duration: 0, ...options }); // Ошибки не автоскрываются
  }

  warning(message, options = {}) {
    return this.show(message, "warning", options);
  }

  info(message, options = {}) {
    return this.show(message, "info", options);
  }

  // Создание элемента уведомления
  createNotification(message, type, options) {
    const id = Utils.generateId("notification");
    const {
      title = null,
      duration = this.defaultDuration,
      closable = true,
      actions = [],
      html = false,
    } = options;

    const notification = {
      id,
      type,
      message,
      title,
      duration,
      closable,
      actions,
      html,
      element: null,
      timer: null,
    };

    notification.element = this.createElement(notification);
    return notification;
  }

  // Создание DOM элемента уведомления
  createElement(notification) {
    const element = document.createElement("div");
    element.className = `toast toast-${notification.type}`;
    element.setAttribute("data-notification-id", notification.id);

    const iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    const icon = iconMap[notification.type] || iconMap.info;

    element.innerHTML = `
      <div class="toast-icon">
        <i class="${icon}"></i>
      </div>
      <div class="toast-content">
        ${
          notification.title
            ? `<div class="toast-title">${notification.title}</div>`
            : ""
        }
        <div class="toast-message">
          ${
            notification.html
              ? notification.message
              : Utils.escapeHtml(notification.message)
          }
        </div>
        ${
          notification.actions.length > 0
            ? this.createActionsHTML(notification.actions)
            : ""
        }
      </div>
      ${
        notification.closable
          ? `
        <button class="toast-close" aria-label="Закрыть">
          <i class="fas fa-times"></i>
        </button>
      `
          : ""
      }
      ${
        notification.duration > 0
          ? `
        <div class="toast-progress">
          <div class="toast-progress-bar"></div>
        </div>
      `
          : ""
      }
    `;

    // Обработчики событий
    this.attachEventListeners(element, notification);

    return element;
  }

  // Создание HTML для действий
  createActionsHTML(actions) {
    return `
      <div class="toast-actions">
        ${actions
          .map(
            (action, index) => `
          <button class="toast-action-btn" data-action-index="${index}">
            ${action.text}
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  // Прикрепление обработчиков событий
  attachEventListeners(element, notification) {
    // Закрытие уведомления
    const closeBtn = element.querySelector(".toast-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.hide(notification.id);
      });
    }

    // Обработчики действий
    const actionBtns = element.querySelectorAll(".toast-action-btn");
    actionBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        const action = notification.actions[index];
        if (action && typeof action.handler === "function") {
          action.handler();
        }
        if (action.closeOnClick !== false) {
          this.hide(notification.id);
        }
      });
    });

    // Пауза при наведении
    element.addEventListener("mouseenter", () => {
      this.pauseTimer(notification.id);
    });

    element.addEventListener("mouseleave", () => {
      this.resumeTimer(notification.id);
    });
  }

  // Добавление уведомления в контейнер
  addNotification(notification) {
    // Ограничение количества уведомлений
    if (this.notifications.size >= this.maxNotifications) {
      const firstNotification = this.notifications.keys().next().value;
      this.hide(firstNotification);
    }

    this.notifications.set(notification.id, notification);
    this.container.appendChild(notification.element);

    // Анимация появления
    requestAnimationFrame(() => {
      notification.element.classList.add("toast-show");
    });

    // Автоматическое скрытие
    if (notification.duration > 0) {
      this.startTimer(notification.id, notification.duration);
    }

    return notification.id;
  }

  // Скрытие уведомления
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    this.clearTimer(id);
    notification.element.classList.add("toast-hide");

    // Удаление после анимации
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 300);
  }

  // Скрытие всех уведомлений
  hideAll() {
    this.notifications.forEach((_, id) => {
      this.hide(id);
    });
  }

  // Управление таймерами
  startTimer(id, duration) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const progressBar = notification.element.querySelector(
      ".toast-progress-bar"
    );
    if (progressBar) {
      progressBar.style.animationDuration = `${duration}ms`;
      progressBar.style.animationName = "toast-progress";
    }

    notification.timer = setTimeout(() => {
      this.hide(id);
    }, duration);
  }

  pauseTimer(id) {
    const notification = this.notifications.get(id);
    if (!notification || !notification.timer) return;

    clearTimeout(notification.timer);
    notification.timer = null;

    const progressBar = notification.element.querySelector(
      ".toast-progress-bar"
    );
    if (progressBar) {
      progressBar.style.animationPlayState = "paused";
    }
  }

  resumeTimer(id) {
    const notification = this.notifications.get(id);
    if (!notification || notification.timer) return;

    const progressBar = notification.element.querySelector(
      ".toast-progress-bar"
    );
    if (progressBar) {
      progressBar.style.animationPlayState = "running";
      // Получение оставшегося времени и перезапуск таймера
      const computedStyle = window.getComputedStyle(progressBar);
      const animationDuration =
        parseFloat(computedStyle.animationDuration) * 1000;
      // Упрощенная логика - можно улучшить для точного подсчета оставшегося времени
      this.startTimer(id, animationDuration);
    }
  }

  clearTimer(id) {
    const notification = this.notifications.get(id);
    if (notification && notification.timer) {
      clearTimeout(notification.timer);
      notification.timer = null;
    }
  }

  // Обновление уведомления
  update(id, updates) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    Object.assign(notification, updates);

    // Обновление содержимого
    if (updates.message) {
      const messageEl = notification.element.querySelector(".toast-message");
      if (messageEl) {
        messageEl.textContent = updates.message;
      }
    }

    if (updates.title) {
      const titleEl = notification.element.querySelector(".toast-title");
      if (titleEl) {
        titleEl.textContent = updates.title;
      }
    }
  }
}

// CSS стили для уведомлений (будут добавлены в components.css)
const notificationStyles = `
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  padding: 16px;
  pointer-events: auto;
  position: relative;
  transform: translateX(100%);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  overflow: hidden;
}

.toast-show {
  transform: translateX(0);
  opacity: 1;
}

.toast-hide {
  transform: translateX(100%);
  opacity: 0;
}

.toast-success { border-left: 4px solid #10b981; }
.toast-error { border-left: 4px solid #ef4444; }
.toast-warning { border-left: 4px solid #f59e0b; }
.toast-info { border-left: 4px solid #06b6d4; }

.toast-icon {
  margin-right: 12px;
  font-size: 20px;
}

.toast-success .toast-icon { color: #10b981; }
.toast-error .toast-icon { color: #ef4444; }
.toast-warning .toast-icon { color: #f59e0b; }
.toast-info .toast-icon { color: #06b6d4; }

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f2937;
}

.toast-message {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  margin-left: 12px;
  padding: 0;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #6b7280;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #f3f4f6;
}

.toast-progress-bar {
  height: 100%;
  background: #06b6d4;
  width: 100%;
  transform-origin: left;
}

@keyframes toast-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.toast-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.toast-action-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #374151;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  transition: all 0.2s;
}

.toast-action-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}
`;

// Создание глобального экземпляра
const notifications = new NotificationManager();

// Экспорт
if (typeof module !== "undefined" && module.exports) {
  module.exports = { NotificationManager, notifications };
}
```

### 4. Система управления темами

Создайте файл `public/scripts/theme-manager.js`:

```javascript
/* ===================================
   УПРАВЛЕНИЕ ТЕМАМИ
   =================================== */

class ThemeManager {
  constructor() {
    this.currentTheme = CONSTANTS.THEMES.LIGHT;
    this.prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    this.init();
  }

  init() {
    // Загрузка сохраненной темы
    const savedTheme = Utils.storage.get("theme", CONSTANTS.THEMES.AUTO);
    this.setTheme(savedTheme);

    // Слушатель изменения системной темы
    this.prefersDarkScheme.addEventListener("change", (e) => {
      if (this.currentTheme === CONSTANTS.THEMES.AUTO) {
        this.applyTheme(
          e.matches ? CONSTANTS.THEMES.DARK : CONSTANTS.THEMES.LIGHT
        );
      }
    });

    // Создание элементов управления темой
    this.createThemeToggle();
  }

  setTheme(theme) {
    this.currentTheme = theme;
    Utils.storage.set("theme", theme);

    switch (theme) {
      case CONSTANTS.THEMES.LIGHT:
        this.applyTheme(CONSTANTS.THEMES.LIGHT);
        break;
      case CONSTANTS.THEMES.DARK:
        this.applyTheme(CONSTANTS.THEMES.DARK);
        break;
      case CONSTANTS.THEMES.AUTO:
        this.applyTheme(
          this.prefersDarkScheme.matches
            ? CONSTANTS.THEMES.DARK
            : CONSTANTS.THEMES.LIGHT
        );
        break;
    }

    this.updateThemeToggle();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    // Обновление мета-тега для мобильных браузеров
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content =
        theme === CONSTANTS.THEMES.DARK ? "#1e293b" : "#ffffff";
    }

    // Событие изменения темы
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme, currentTheme: this.currentTheme },
      })
    );
  }

  toggleTheme() {
    const themes = [
      CONSTANTS.THEMES.LIGHT,
      CONSTANTS.THEMES.DARK,
      CONSTANTS.THEMES.AUTO,
    ];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  createThemeToggle() {
    // Проверяем, есть ли уже кнопка переключения темы
    if (document.querySelector(".theme-toggle")) return;

    const toggle = document.createElement("button");
    toggle.className = "theme-toggle";
    toggle.setAttribute("aria-label", "Переключить тему");
    toggle.innerHTML = '<i class="fas fa-sun"></i>';

    toggle.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Добавляем в header
    const userActions = document.querySelector(".user-actions");
    if (userActions) {
      userActions.insertBefore(toggle, userActions.firstChild);
    }
  }

  updateThemeToggle() {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;

    const icons = {
      [CONSTANTS.THEMES.LIGHT]: "fas fa-sun",
      [CONSTANTS.THEMES.DARK]: "fas fa-moon",
      [CONSTANTS.THEMES.AUTO]: "fas fa-adjust",
    };

    const titles = {
      [CONSTANTS.THEMES.LIGHT]: "Светлая тема",
      [CONSTANTS.THEMES.DARK]: "Темная тема",
      [CONSTANTS.THEMES.AUTO]: "Автоматическая тема",
    };

    toggle.innerHTML = `<i class="${icons[this.currentTheme]}"></i>`;
    toggle.setAttribute("title", titles[this.currentTheme]);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getEffectiveTheme() {
    if (this.currentTheme === CONSTANTS.THEMES.AUTO) {
      return this.prefersDarkScheme.matches
        ? CONSTANTS.THEMES.DARK
        : CONSTANTS.THEMES.LIGHT;
    }
    return this.currentTheme;
  }
}

// CSS стили для переключателя темы
const themeToggleStyles = `
.theme-toggle {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  margin-right: 8px;
}

.theme-toggle:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color-hover);
  color: var(--text-primary);
}

.theme-toggle i {
  font-size: 16px;
}

@media (max-width: 768px) {
  .theme-toggle {
    width: 36px;
    height: 36px;
    padding: 6px;
  }
  
  .theme-toggle i {
    font-size: 14px;
  }
}
`;

// Создание глобального экземпляра
const themeManager = new ThemeManager();

// Экспорт
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ThemeManager, themeManager };
}
```

---

## 📋 Задания для самопроверки

1. **Добавьте систему кэширования** для API запросов
2. **Реализуйте обработку offline режима** с Service Worker
3. **Создайте систему аналитики** для отслеживания действий пользователей
4. **Добавьте виртуальную прокрутку** для больших списков книг

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Современная JavaScript архитектура  
✅ Система уведомлений  
✅ Управление темами  
✅ API клиент с обработкой ошибок

**Следующий шаг:** [13_USER_INTERFACE.md](13_USER_INTERFACE.md) - создание интерактивного пользовательского интерфейса.

---

_Время выполнения: ~5-6 часов_  
_Сложность: 🟡 Средняя_
