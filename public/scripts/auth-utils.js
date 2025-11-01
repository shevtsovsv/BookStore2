/**
 * Утилиты для работы с аутентификацией
 * Управление токенами, проверка авторизации, навигация
 */

// Константы для localStorage
const AUTH_TOKEN_KEY = "bookstore_auth_token";
const USER_DATA_KEY = "bookstore_user_data";

/**
 * Управление токенами
 */
const AuthToken = {
  // Сохранить токен
  save(token) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error("Ошибка сохранения токена:", error);
      return false;
    }
  },

  // Получить токен
  get() {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("Ошибка получения токена:", error);
      return null;
    }
  },

  // Удалить токен
  remove() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return true;
    } catch (error) {
      console.error("Ошибка удаления токена:", error);
      return false;
    }
  },

  // Проверить наличие токена
  exists() {
    return !!this.get();
  },
};

/**
 * Управление данными пользователя
 */
const UserData = {
  // Сохранить данные пользователя
  save(userData) {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Ошибка сохранения данных пользователя:", error);
      return false;
    }
  },

  // Получить данные пользователя
  get() {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Ошибка получения данных пользователя:", error);
      return null;
    }
  },

  // Удалить данные пользователя
  remove() {
    try {
      localStorage.removeItem(USER_DATA_KEY);
      return true;
    } catch (error) {
      console.error("Ошибка удаления данных пользователя:", error);
      return false;
    }
  },
};

/**
 * Основные функции аутентификации
 */
const Auth = {
  // Проверить, авторизован ли пользователь
  isAuthenticated() {
    return AuthToken.exists() && UserData.get() !== null;
  },

  // Получить текущего пользователя
  getCurrentUser() {
    if (this.isAuthenticated()) {
      return UserData.get();
    }
    return null;
  },

  // Войти в систему (сохранить токен и данные)
  login(token, userData) {
    const tokenSaved = AuthToken.save(token);
    const userSaved = UserData.save(userData);

    if (tokenSaved && userSaved) {
      console.log("Пользователь успешно авторизован:", userData.email);
      this.updateNavigation();
      return true;
    }

    console.error("Ошибка авторизации пользователя");
    return false;
  },

  // Выйти из системы
  logout() {
    AuthToken.remove();
    UserData.remove();
    console.log("Пользователь вышел из системы");
    this.updateNavigation();

    // Перенаправить на главную страницу
    window.location.href = "../index.html";
  },

  // Обновить навигацию в зависимости от состояния авторизации
  updateNavigation() {
    const isAuth = this.isAuthenticated();
    const user = this.getCurrentUser();

    // Найти элементы навигации
    const registerLink = document.querySelector('a[href*="register"]');
    const loginLink = document.querySelector('a[href*="login"]');

    if (isAuth && user) {
      // Пользователь авторизован - показать имя и кнопку выхода
      if (registerLink) {
        registerLink.textContent = user.firstName || user.email;
        registerLink.href = "#";
        registerLink.onclick = (e) => {
          e.preventDefault();
          this.showUserMenu(e.target);
        };
      }

      if (loginLink) {
        loginLink.textContent = "Выход";
        loginLink.href = "#";
        loginLink.onclick = (e) => {
          e.preventDefault();
          this.logout();
        };
      }
    } else {
      // Пользователь не авторизован - показать стандартные ссылки
      if (registerLink) {
        registerLink.textContent = "Регистрация";
        registerLink.href = "/html/register.html";
        registerLink.onclick = null;
      }

      if (loginLink) {
        loginLink.textContent = "Вход";
        loginLink.href = "/html/login.html";
        loginLink.onclick = null;
      }
    }

    // Добавить или обновить иконку корзины
    this.updateCartIcon();
  },

  // Обновить иконку корзины
  updateCartIcon() {
    const menu = document.querySelector(".menu");
    if (!menu) return;

    // Проверить, есть ли уже иконка корзины
    let cartIcon = menu.querySelector(".cart-icon");
    let cartLi = cartIcon ? cartIcon.closest("li") : null;

    // Если пользователь авторизован
    if (this.isAuthenticated()) {
      if (!cartIcon) {
        // Определить правильный путь к корзине
        const isOnIndexPage = window.location.pathname === "/" || window.location.pathname.endsWith("index.html");
        const cartUrl = isOnIndexPage ? "html/cart.html" : "cart.html";
        
        // Создать иконку корзины
        cartLi = document.createElement("li");
        cartLi.innerHTML = `
          <a href="${cartUrl}" class="cart-icon" title="Корзина">
            <span class="cart-icon-text">🛒</span>
            <span class="cart-count" id="cart-count">0</span>
          </a>
        `;
        menu.appendChild(cartLi);
        cartIcon = cartLi.querySelector(".cart-icon");
      }
      // Обновить счетчик корзины
      this.updateCartCount();
    } else {
      // Если не авторизован - удалить иконку корзины
      if (cartLi) {
        cartLi.remove();
      }
    }
  },

  // Обновить счетчик товаров в корзине
  async updateCartCount() {
    try {
      const token = AuthToken.get();
      if (!token) return;

      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const cartCount = document.getElementById("cart-count");
        if (cartCount && data.data && data.data.summary) {
          cartCount.textContent = data.data.summary.totalItems || 0;
        }
      }
    } catch (error) {
      console.log("Ошибка получения счетчика корзины:", error);
    }
  },

  // Показать меню пользователя
  showUserMenu(element) {
    // Простое меню пользователя
    const menu = document.createElement("div");
    menu.className = "user-menu";
    menu.innerHTML = `
            <div class="user-menu-content">
                <p>Добро пожаловать, ${this.getCurrentUser().firstName}!</p>
                <button onclick="Auth.logout()">Выйти</button>
            </div>
        `;

    // Позиционировать меню
    menu.style.position = "absolute";
    menu.style.top = element.offsetTop + element.offsetHeight + "px";
    menu.style.left = element.offsetLeft + "px";
    menu.style.zIndex = "1000";

    document.body.appendChild(menu);

    // Удалить меню при клике вне его
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 100);
  },

  // Получить заголовки для API запросов
  getAuthHeaders() {
    const token = AuthToken.get();
    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
  },

  // Проверить ответ API на ошибки авторизации
  handleApiResponse(response) {
    if (response.status === 401) {
      console.log("Токен истек или недействителен");
      this.logout();
      return false;
    }
    return true;
  },
};

/**
 * Утилиты для работы с формами
 */
const FormUtils = {
  // Показать уведомление
  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
      notification.style.display = "none";
    }, 5000);
  },

  // Показать ошибку в поле
  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const fieldElement = document.getElementById(fieldId);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }

    if (fieldElement) {
      fieldElement.classList.add("error");
    }
  },

  // Очистить ошибки формы
  clearFormErrors() {
    const errorElements = document.querySelectorAll(".error-message");
    const fieldElements = document.querySelectorAll(".form-group input.error");

    errorElements.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });

    fieldElements.forEach((el) => {
      el.classList.remove("error");
    });
  },

  // Показать состояние загрузки кнопки
  setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const btnText = button.querySelector(".btn-text");
    const btnLoader = button.querySelector(".btn-loader");

    if (loading) {
      button.disabled = true;
      if (btnText) btnText.style.display = "none";
      if (btnLoader) btnLoader.style.display = "inline";
    } else {
      button.disabled = false;
      if (btnText) btnText.style.display = "inline";
      if (btnLoader) btnLoader.style.display = "none";
    }
  },

  // Валидация email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Валидация пароля
  validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push("Минимум 8 символов");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Минимум 1 заглавная буква");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Строчные английские буквы");
    }

    if (!/\d.*\d/.test(password)) {
      errors.push("Минимум 2 цифры");
    }

    if (!/^[A-Za-z\d@$!%*?&]+$/.test(password)) {
      errors.push("Только английские буквы, цифры и символы @$!%*?&");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  },

  // Простая проверка (для обратной совместимости)
  validatePasswordSimple(password) {
    return this.validatePassword(password).isValid;
  },
};

/**
 * Утилиты для перенаправлений
 */
const NavigationUtils = {
  // Перенаправить на страницу после успешной авторизации
  redirectAfterLogin() {
    // Проверить, есть ли сохраненная страница для возврата
    const returnUrl = sessionStorage.getItem("returnUrl");

    if (returnUrl) {
      sessionStorage.removeItem("returnUrl");
      window.location.href = returnUrl;
    } else {
      // По умолчанию перенаправить на каталог
      window.location.href = "book.html";
    }
  },

  // Сохранить текущую страницу для возврата после входа
  saveReturnUrl() {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem("returnUrl", currentPath);
  },

  // Проверить, требует ли страница авторизации
  requireAuth() {
    if (!Auth.isAuthenticated()) {
      this.saveReturnUrl();
      window.location.href = "login.html";
      return false;
    }
    return true;
  },
};

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  // Обновить навигацию в зависимости от состояния авторизации
  Auth.updateNavigation();

  console.log(
    "Auth utils initialized. User authenticated:",
    Auth.isAuthenticated()
  );
});

// Экспорт для использования в других скриптах
window.Auth = Auth;
window.AuthToken = AuthToken;
window.UserData = UserData;
window.FormUtils = FormUtils;
window.NavigationUtils = NavigationUtils;
