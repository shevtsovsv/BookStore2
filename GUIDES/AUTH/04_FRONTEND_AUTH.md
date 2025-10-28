# 🌐 Урок 4: Frontend авторизация

## 🎯 Клиентская часть авторизации

В этом уроке изучим, как реализована авторизация на клиенте в BookStore2: формы, валидация, работа с токенами и управление состоянием пользователя.

## 📁 Структура Frontend файлов

```
public/
├── html/
│   ├── register.html          # Форма регистрации
│   ├── login.html             # Форма входа
│   └── profile.html           # Профиль пользователя (будущее)
├── scripts/
│   ├── auth-utils.js          # Утилиты для работы с авторизацией
│   ├── register.js            # Логика страницы регистрации
│   ├── login.js               # Логика страницы входа
│   └── profile.js             # Логика профиля (будущее)
└── style/
    └── style.css              # Стили для форм авторизации
```

## 🏗 auth-utils.js - Основные утилиты

### Полный код auth-utils.js:

```javascript
// public/scripts/auth-utils.js

// =============================================================================
// УПРАВЛЕНИЕ JWT ТОКЕНАМИ
// =============================================================================

const AuthToken = {
  // Сохранение токена в localStorage
  save: (token) => {
    try {
      if (!token) {
        console.warn("Попытка сохранить пустой токен");
        return false;
      }
      localStorage.setItem("authToken", token);
      console.log("Токен успешно сохранен");
      return true;
    } catch (error) {
      console.error("Ошибка сохранения токена:", error);
      return false;
    }
  },

  // Получение токена из localStorage
  get: () => {
    try {
      const token = localStorage.getItem("authToken");
      return token;
    } catch (error) {
      console.error("Ошибка получения токена:", error);
      return null;
    }
  },

  // Удаление токена
  remove: () => {
    try {
      localStorage.removeItem("authToken");
      console.log("Токен удален");
      return true;
    } catch (error) {
      console.error("Ошибка удаления токена:", error);
      return false;
    }
  },

  // Декодирование токена (без проверки подписи!)
  decode: (token) => {
    try {
      if (!token) return null;

      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Неверный формат JWT токена");
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Ошибка декодирования токена:", error);
      return null;
    }
  },

  // Проверка валидности токена
  isValid: (token) => {
    try {
      if (!token) return false;

      const decoded = AuthToken.decode(token);
      if (!decoded || !decoded.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp <= currentTime;

      if (isExpired) {
        console.log("Токен истёк");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Ошибка валидации токена:", error);
      return false;
    }
  },

  // Получение времени истечения токена
  getExpiration: (token) => {
    const decoded = AuthToken.decode(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  },

  // Проверка времени до истечения
  getTimeToExpire: (token) => {
    const decoded = AuthToken.decode(token);
    if (!decoded) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  },
};

// =============================================================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЕМ
// =============================================================================

const Auth = {
  // Проверка аутентификации
  isAuthenticated: () => {
    const token = AuthToken.get();
    return token && AuthToken.isValid(token);
  },

  // Получение текущего пользователя
  getCurrentUser: () => {
    const token = AuthToken.get();
    if (!token || !AuthToken.isValid(token)) {
      return null;
    }

    const decoded = AuthToken.decode(token);
    return decoded
      ? {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
        }
      : null;
  },

  // Сохранение данных пользователя после входа
  login: (token, userData) => {
    try {
      // Сохраняем токен
      if (!AuthToken.save(token)) {
        throw new Error("Не удалось сохранить токен");
      }

      // Сохраняем дополнительные данные пользователя
      if (userData) {
        localStorage.setItem("userData", JSON.stringify(userData));
      }

      // Обновляем интерфейс
      Auth.updateNavigation();
      Auth.updateCartIcon();
      Auth.updateCartCount();

      return true;
    } catch (error) {
      console.error("Ошибка входа:", error);
      return false;
    }
  },

  // Выход из системы
  logout: () => {
    try {
      // Удаляем токен и данные пользователя
      AuthToken.remove();
      localStorage.removeItem("userData");

      // Обновляем интерфейс
      Auth.updateNavigation();
      Auth.updateCartIcon();

      console.log("Пользователь вышел из системы");
      return true;
    } catch (error) {
      console.error("Ошибка выхода:", error);
      return false;
    }
  },

  // Обновление навигации в зависимости от статуса авторизации
  updateNavigation: () => {
    try {
      const user = Auth.getCurrentUser();
      const menu = document.getElementById("main-menu");

      if (!menu) {
        console.warn("Меню навигации не найдено");
        return;
      }

      const registerLink = document.getElementById("register-link");
      const loginLink = document.getElementById("login-link");

      if (user) {
        // Пользователь авторизован - показываем имя и кнопку выхода
        if (registerLink) {
          registerLink.innerHTML = `${user.firstName || user.username}`;
          registerLink.href = "#";
          registerLink.onclick = (e) => {
            e.preventDefault();
            Auth.showUserMenu(e);
          };
        }

        if (loginLink) {
          loginLink.innerHTML = "Выход";
          loginLink.href = "#";
          loginLink.onclick = (e) => {
            e.preventDefault();
            Auth.handleLogout();
          };
        }
      } else {
        // Пользователь не авторизован - показываем ссылки регистрации и входа
        if (registerLink) {
          registerLink.innerHTML = "Регистрация";
          registerLink.href = "register.html";
          registerLink.onclick = null;
        }

        if (loginLink) {
          loginLink.innerHTML = "Вход";
          loginLink.href = "login.html";
          loginLink.onclick = null;
        }
      }
    } catch (error) {
      console.error("Ошибка обновления навигации:", error);
    }
  },

  // Показ меню пользователя
  showUserMenu: (event) => {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Удаляем существующее меню
    const existingMenu = document.querySelector(".user-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    // Создаем новое меню
    const menu = document.createElement("div");
    menu.className = "user-menu";
    menu.innerHTML = `
      <div class="user-menu-content">
        <p><strong>${user.firstName} ${user.lastName}</strong></p>
        <p>${user.email}</p>
        <button onclick="Auth.handleLogout()">Выйти</button>
      </div>
    `;

    // Позиционируем меню
    const rect = event.target.getBoundingClientRect();
    menu.style.position = "absolute";
    menu.style.top = rect.bottom + 5 + "px";
    menu.style.right = "20px";
    menu.style.zIndex = "1000";

    document.body.appendChild(menu);

    // Закрываем меню при клике вне его
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 100);
  },

  // Обработка выхода
  handleLogout: () => {
    if (confirm("Вы уверены, что хотите выйти?")) {
      Auth.logout();

      // Перенаправляем на главную страницу
      if (
        window.location.pathname !== "/" &&
        window.location.pathname !== "/index.html"
      ) {
        window.location.href = "../index.html";
      }
    }
  },

  // Обновление иконки корзины
  updateCartIcon: () => {
    const cartLink = document.getElementById("cart-link");
    if (cartLink) {
      if (Auth.isAuthenticated()) {
        cartLink.style.display = "inline-flex";
      } else {
        cartLink.style.display = "none";
      }
    }
  },

  // Обновление счетчика корзины
  updateCartCount: async () => {
    try {
      if (!Auth.isAuthenticated()) {
        const cartCount = document.getElementById("cart-count");
        if (cartCount) {
          cartCount.classList.add("hidden");
        }
        return;
      }

      const response = await Auth.makeAuthenticatedRequest("/api/cart");
      if (response && response.ok) {
        const cartData = await response.json();
        const totalItems = cartData.items
          ? cartData.items.reduce((sum, item) => sum + item.quantity, 0)
          : 0;

        const cartCount = document.getElementById("cart-count");
        if (cartCount) {
          cartCount.textContent = totalItems;
          cartCount.classList.toggle("hidden", totalItems === 0);
        }
      }
    } catch (error) {
      console.error("Ошибка обновления счетчика корзины:", error);
    }
  },
};

// =============================================================================
// HTTP ЗАПРОСЫ С АУТЕНТИФИКАЦИЕЙ
// =============================================================================

// Расширяем объект Auth методами для HTTP запросов
Auth.makeAuthenticatedRequest = async (url, options = {}) => {
  const token = AuthToken.get();

  if (!token || !AuthToken.isValid(token)) {
    throw new Error("Требуется авторизация");
  }

  const authOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, authOptions);

    // Если токен истёк или недействителен
    if (response.status === 401) {
      console.log("Токен недействителен, выполняем выход");
      Auth.logout();

      // Перенаправляем на страницу входа
      if (!window.location.pathname.includes("login.html")) {
        window.location.href = window.location.pathname.includes("html/")
          ? "login.html"
          : "html/login.html";
      }
      throw new Error("Сессия истекла");
    }

    return response;
  } catch (error) {
    console.error("Ошибка аутентифицированного запроса:", error);
    throw error;
  }
};

// =============================================================================
// ВАЛИДАЦИЯ ФОРМ
// =============================================================================

const FormValidator = {
  // Валидация email
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      message: emailRegex.test(email) ? "" : "Некорректный формат email",
    };
  },

  // Валидация пароля
  validatePassword: (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Минимум ${minLength} символов`);
    }
    if (!hasUpperCase) {
      errors.push("Минимум одна заглавная буква");
    }
    if (!hasLowerCase) {
      errors.push("Минимум одна строчная буква");
    }
    if (!hasNumbers) {
      errors.push("Минимум одна цифра");
    }

    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? errors.join(", ") : "",
    };
  },

  // Валидация username
  validateUsername: (username) => {
    const minLength = 3;
    const maxLength = 30;
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (username.length < minLength) {
      return {
        isValid: false,
        message: `Минимум ${minLength} символа`,
      };
    }

    if (username.length > maxLength) {
      return {
        isValid: false,
        message: `Максимум ${maxLength} символов`,
      };
    }

    if (!usernameRegex.test(username)) {
      return {
        isValid: false,
        message: "Только латинские буквы, цифры и подчеркивание",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Валидация совпадения паролей
  validatePasswordMatch: (password, confirmPassword) => {
    return {
      isValid: password === confirmPassword,
      message: password === confirmPassword ? "" : "Пароли не совпадают",
    };
  },
};

// =============================================================================
// УВЕДОМЛЕНИЯ
// =============================================================================

const Notifications = {
  show: (message, type = "info", duration = 5000) => {
    // Создаем контейнер для уведомлений если его нет
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1100;
      `;
      document.body.appendChild(container);
    }

    // Создаем уведомление
    const notification = document.createElement("div");
    notification.className = `notification ${type} show`;
    notification.textContent = message;

    // Добавляем уведомление
    container.appendChild(notification);

    // Автоматически удаляем через указанное время
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  },

  success: (message) => Notifications.show(message, "success"),
  error: (message) => Notifications.show(message, "error"),
  warning: (message) => Notifications.show(message, "warning"),
  info: (message) => Notifications.show(message, "info"),
};

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================================================

// Автоматическая инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  // Обновляем навигацию
  Auth.updateNavigation();
  Auth.updateCartIcon();

  // Обновляем счетчик корзины если пользователь авторизован
  if (Auth.isAuthenticated()) {
    Auth.updateCartCount();
  }

  // Проверяем токен каждые 5 минут
  setInterval(() => {
    const token = AuthToken.get();
    if (token && !AuthToken.isValid(token)) {
      console.log("Токен истёк, выполняем автоматический выход");
      Auth.logout();
      Notifications.warning("Сессия истекла. Пожалуйста, войдите снова.");
    }
  }, 5 * 60 * 1000); // 5 минут

  console.log("Auth utils загружены и инициализированы");
});

// Экспорт для использования в других модулях (если нужно)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Auth, AuthToken, FormValidator, Notifications };
}
```

## 📝 register.js - Логика регистрации

### Полный код register.js:

```javascript
// public/scripts/register.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("registerBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");

  // Элементы формы
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Автоматическое создание username из email
  emailInput.addEventListener("input", function () {
    if (!usernameInput.value) {
      const emailPart = this.value.split("@")[0];
      usernameInput.value = emailPart.replace(/[^a-zA-Z0-9]/g, "");
    }
  });

  // Валидация в реальном времени
  passwordInput.addEventListener("input", validatePassword);
  confirmPasswordInput.addEventListener("input", validatePasswordMatch);
  emailInput.addEventListener("blur", validateEmail);
  usernameInput.addEventListener("blur", validateUsername);

  // Обработка отправки формы
  form.addEventListener("submit", handleSubmit);

  // Функция валидации пароля
  function validatePassword() {
    const password = passwordInput.value;
    const validation = FormValidator.validatePassword(password);

    // Показываем/скрываем требования к паролю
    const requirements = document.querySelector(".password-requirements");
    if (requirements) {
      const items = requirements.querySelectorAll("li");

      // Проверяем каждое требование
      const hasMinLength = password.length >= 6;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);

      if (items.length >= 4) {
        items[0].style.color = hasMinLength ? "#27ae60" : "#e74c3c";
        items[1].style.color = hasUpperCase ? "#27ae60" : "#e74c3c";
        items[2].style.color = hasLowerCase ? "#27ae60" : "#e74c3c";
        items[3].style.color = hasNumbers ? "#27ae60" : "#e74c3c";
      }
    }

    setFieldValidation(passwordInput, validation.isValid, validation.message);
  }

  // Функция валидации совпадения паролей
  function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword) {
      const validation = FormValidator.validatePasswordMatch(
        password,
        confirmPassword
      );
      setFieldValidation(
        confirmPasswordInput,
        validation.isValid,
        validation.message
      );
    }
  }

  // Функция валидации email
  function validateEmail() {
    const email = emailInput.value;
    if (email) {
      const validation = FormValidator.validateEmail(email);
      setFieldValidation(emailInput, validation.isValid, validation.message);
    }
  }

  // Функция валидации username
  function validateUsername() {
    const username = usernameInput.value;
    if (username) {
      const validation = FormValidator.validateUsername(username);
      setFieldValidation(usernameInput, validation.isValid, validation.message);
    }
  }

  // Установка визуальной валидации поля
  function setFieldValidation(field, isValid, message) {
    const errorElement = document.getElementById(field.id + "-error");

    if (isValid) {
      field.classList.remove("error");
      field.classList.add("valid");
    } else {
      field.classList.remove("valid");
      field.classList.add("error");
    }

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? "block" : "none";
    }
  }

  // Проверка валидности всей формы
  function isFormValid() {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Проверяем обязательные поля
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return false;
    }

    // Проверяем email
    if (!FormValidator.validateEmail(email).isValid) {
      return false;
    }

    // Проверяем username (если указан)
    if (username && !FormValidator.validateUsername(username).isValid) {
      return false;
    }

    // Проверяем пароль
    if (!FormValidator.validatePassword(password).isValid) {
      return false;
    }

    // Проверяем совпадение паролей
    if (
      !FormValidator.validatePasswordMatch(password, confirmPassword).isValid
    ) {
      return false;
    }

    return true;
  }

  // Обработка отправки формы
  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid()) {
      Notifications.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    // Показываем загрузку
    setLoading(true);

    try {
      // Собираем данные формы
      const formData = {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        username:
          usernameInput.value.trim() ||
          emailInput.value.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""),
        password: passwordInput.value,
      };

      // Отправляем запрос на сервер
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Успешная регистрация
        Notifications.success("Регистрация прошла успешно!");

        // Сохраняем токен и данные пользователя
        Auth.login(result.token, result.user);

        // Перенаправляем на главную страницу через 2 секунды
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2000);
      } else {
        // Ошибка регистрации
        const errorMessage = result.message || "Ошибка регистрации";
        Notifications.error(errorMessage);

        // Показываем конкретные ошибки валидации
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error) => {
            console.error("Ошибка валидации:", error);
          });
        }
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        Notifications.error("Ошибка подключения к серверу");
      } else {
        Notifications.error("Произошла неожиданная ошибка");
      }
    } finally {
      setLoading(false);
    }
  }

  // Функция управления состоянием загрузки
  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.style.display = "none";
      btnLoader.style.display = "inline";
    } else {
      submitBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoader.style.display = "none";
    }
  }

  // Проверяем, авторизован ли уже пользователь
  if (Auth.isAuthenticated()) {
    Notifications.info("Вы уже авторизованы");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1000);
  }

  console.log("Скрипт регистрации загружен");
});
```

## 🚪 login.js - Логика входа

### Код login.js:

```javascript
// public/scripts/login.js

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const submitBtn = document.getElementById("loginBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");

  // Элементы формы
  const loginInput = document.getElementById("login");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");

  // Обработка отправки формы
  form.addEventListener("submit", handleSubmit);

  // Валидация в реальном времени
  loginInput.addEventListener("input", clearErrors);
  passwordInput.addEventListener("input", clearErrors);

  // Очистка ошибок при вводе
  function clearErrors() {
    const errorElements = form.querySelectorAll(".error-message");
    errorElements.forEach((el) => {
      el.style.display = "none";
      el.textContent = "";
    });

    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      input.classList.remove("error");
    });
  }

  // Проверка валидности формы
  function isFormValid() {
    const login = loginInput.value.trim();
    const password = passwordInput.value;

    if (!login) {
      setFieldError(loginInput, "Введите логин или email");
      return false;
    }

    if (!password) {
      setFieldError(passwordInput, "Введите пароль");
      return false;
    }

    return true;
  }

  // Установка ошибки для поля
  function setFieldError(field, message) {
    field.classList.add("error");

    const errorElement = document.getElementById(field.id + "-error");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  // Обработка отправки формы
  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid()) {
      return;
    }

    // Показываем загрузку
    setLoading(true);

    try {
      // Собираем данные формы
      const formData = {
        login: loginInput.value.trim(),
        password: passwordInput.value,
      };

      // Отправляем запрос на сервер
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Успешный вход
        Notifications.success(
          `Добро пожаловать, ${result.user.firstName || result.user.username}!`
        );

        // Сохраняем токен и данные пользователя
        Auth.login(result.token, result.user);

        // Получаем URL для перенаправления (если был сохранен)
        const redirectUrl =
          sessionStorage.getItem("redirectAfterLogin") || "../index.html";
        sessionStorage.removeItem("redirectAfterLogin");

        // Перенаправляем через 1 секунду
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        // Ошибка входа
        const errorMessage = result.message || "Ошибка входа в систему";
        Notifications.error(errorMessage);

        // Фокусируемся на поле пароля для повторного ввода
        passwordInput.value = "";
        passwordInput.focus();
      }
    } catch (error) {
      console.error("Ошибка входа:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        Notifications.error("Ошибка подключения к серверу");
      } else {
        Notifications.error("Произошла неожиданная ошибка");
      }
    } finally {
      setLoading(false);
    }
  }

  // Функция управления состоянием загрузки
  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.style.display = "none";
      btnLoader.style.display = "inline";
    } else {
      submitBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoader.style.display = "none";
    }
  }

  // Проверяем, авторизован ли уже пользователь
  if (Auth.isAuthenticated()) {
    Notifications.info("Вы уже авторизованы");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1000);
  }

  console.log("Скрипт входа загружен");
});
```

## 🎨 CSS стили для форм

### Дополнительные стили для валидации:

```css
/* Стили для валидации полей */
.form-group input.valid {
  border-color: #27ae60;
  background-color: #f8fff9;
}

.form-group input.error {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

.form-group input.valid:focus {
  border-color: #27ae60;
  box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.2);
}

.form-group input.error:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
}

/* Требования к паролю */
.password-requirements ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  list-style: none;
}

.password-requirements li {
  position: relative;
  margin: 4px 0;
  font-size: 12px;
  transition: color 0.3s ease;
}

.password-requirements li::before {
  content: "•";
  position: absolute;
  left: -15px;
  color: inherit;
}

/* Анимация загрузки кнопки */
.btn-loader {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-loader::after {
  content: "";
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

## 🔄 Интеграция с другими страницами

### Пример интеграции в каталог товаров:

```javascript
// В файле book-catalog.js
document.addEventListener("DOMContentLoaded", function () {
  // Проверяем авторизацию при загрузке
  if (!Auth.isAuthenticated()) {
    // Скрываем кнопки "Добавить в корзину"
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach((btn) => {
      btn.textContent = "Войти для покупки";
      btn.onclick = () => {
        sessionStorage.setItem("redirectAfterLogin", window.location.href);
        window.location.href = "html/login.html";
      };
    });
  }
});
```

## 🧪 Практические задания

### Задание 1: Добавление "Запомнить меня"

Реализуйте функциональность checkbox "Запомнить меня" в форме входа.

### Задание 2: Восстановление пароля

Создайте форму для восстановления пароля с отправкой email.

### Задание 3: Профиль пользователя

Создайте страницу профиля где пользователь может изменить свои данные.

### Задание 4: Валидация в реальном времени

Добавьте визуальную индикацию силы пароля в реальном времени.

---

**Следующий урок:** [Урок 5: Регистрация пользователей](05_USER_REGISTRATION.md) 🚀

**Практика:** Протестируйте все формы авторизации и изучите работу с токенами в браузере!
