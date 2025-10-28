# 📝 Урок 16: Создание страницы регистрации

# Актуальные особенности интерфейса регистрации

В текущей реализации:

- Все поля формы используют динамические классы `.valid` и `.invalid` для визуальной обратной связи.
- Сообщения об ошибках появляются только при наличии ошибки, скрываются автоматически.
- Блок требований к паролю отображает актуальные правила, синхронизированные с JS-валидацией (спецсимволы разрешены, но не обязательны).
- Все ссылки на регистрацию и вход абсолютные (`/html/register.html`, `/html/login.html`), навигация управляется через JS.
- Валидация и обработка ошибок реализованы через функции `FormUtils.showFieldError` и `FormUtils.clearFormErrors`.
- Меню в header динамически обновляется в зависимости от состояния авторизации.

## 🎯 Цель урока

Создать полноценную страницу регистрации с современным дизайном, валидацией в реальном времени и отличным пользовательским опытом.

## 📋 Структура страницы регистрации

### 🏗️ HTML структура

Создадим файл `public/html/register.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Регистрация - BookStore</title>

    <!-- SEO meta tags -->
    <meta
      name="description"
      content="Создайте аккаунт в BookStore и получите доступ к тысячам книг"
    />
    <meta name="robots" content="index, follow" />

    <!-- Open Graph для социальных сетей -->
    <meta property="og:title" content="Регистрация - BookStore" />
    <meta property="og:description" content="Присоединяйтесь к BookStore" />
    <meta property="og:type" content="website" />

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="../img/favicon.ico" />

    <!-- Подключаем шрифты -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Стили -->
    <link rel="stylesheet" href="../style/main.css" />
    <link rel="stylesheet" href="../style/auth.css" />
    <link rel="stylesheet" href="../style/forms.css" />
    <link rel="stylesheet" href="../style/components.css" />

    <!-- Preload критически важных ресурсов -->
    <link rel="preload" href="../scripts/auth-utils.js" as="script" />
    <link rel="preload" href="../scripts/validation.js" as="script" />
  </head>
  <body class="auth-page">
    <!-- Прелоадер -->
    <div id="page-loader" class="page-loader">
      <div class="loader-spinner"></div>
      <p>Загрузка...</p>
    </div>

    <!-- Основной контейнер -->
    <div class="auth-container" id="auth-container" style="display: none;">
      <!-- Навигация -->
      <nav class="auth-nav">
        <div class="nav-container">
          <a href="../index.html" class="nav-brand">
            <img src="../img/logo.png" alt="BookStore" class="logo" />
            <span class="brand-text">BookStore</span>
          </a>

          <div class="nav-links">
            <a href="../index.html" class="nav-link">🏠 Главная</a>
            <a href="../catalog.html" class="nav-link">📚 Каталог</a>
            <a href="login.html" class="nav-link">🔐 Вход</a>
          </div>
        </div>
      </nav>

      <!-- Основной контент -->
      <main class="auth-main">
        <div class="auth-wrapper">
          <!-- Левая сторона - информация -->
          <div class="auth-info">
            <div class="info-content">
              <h1 class="info-title">Присоединяйтесь к BookStore</h1>
              <p class="info-description">
                Создайте аккаунт и получите доступ к:
              </p>

              <ul class="info-features">
                <li class="feature-item">
                  <span class="feature-icon">📚</span>
                  <div class="feature-text">
                    <strong>Тысячи книг</strong>
                    <span>в нашем каталоге</span>
                  </div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">❤️</span>
                  <div class="feature-text">
                    <strong>Избранное</strong>
                    <span>сохраняйте понравившиеся книги</span>
                  </div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">🛒</span>
                  <div class="feature-text">
                    <strong>Корзина</strong>
                    <span>удобные покупки</span>
                  </div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">🎯</span>
                  <div class="feature-text">
                    <strong>Рекомендации</strong>
                    <span>персональные подборки</span>
                  </div>
                </li>
                <li class="feature-item">
                  <span class="feature-icon">💰</span>
                  <div class="feature-text">
                    <strong>Скидки</strong>
                    <span>эксклюзивные предложения</span>
                  </div>
                </li>
              </ul>

              <div class="info-stats">
                <div class="stat-item">
                  <span class="stat-number">10,000+</span>
                  <span class="stat-label">Довольных читателей</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">50,000+</span>
                  <span class="stat-label">Книг в каталоге</span>
                </div>
              </div>
            </div>

            <!-- Декоративная иллюстрация -->
            <div class="auth-illustration">
              <div class="illustration-books">
                <div class="book book-1"></div>
                <div class="book book-2"></div>
                <div class="book book-3"></div>
              </div>
            </div>
          </div>

          <!-- Правая сторона - форма -->
          <div class="auth-form-container">
            <div class="form-wrapper">
              <!-- Заголовок формы -->
              <div class="form-header">
                <h2 class="form-title">Создать аккаунт</h2>
                <p class="form-subtitle">Заполните данные для регистрации</p>
              </div>

              <!-- Уведомления -->
              <div id="notification-container" class="notification-container">
                <!-- Уведомления добавляются динамически -->
              </div>

              <!-- Форма регистрации -->
              <form id="register-form" class="auth-form" novalidate>
                <!-- Имя и фамилия в одной строке -->
                <div class="form-row">
                  <div class="form-group">
                    <label for="firstName" class="form-label">
                      Имя <span class="required">*</span>
                    </label>
                    <div class="input-container">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        class="form-input"
                        placeholder="Введите ваше имя"
                        required
                        autocomplete="given-name"
                        maxlength="50"
                        pattern="^[А-Яа-яЁёA-Za-z\s-]{2,50}$"
                        title="Имя должно содержать от 2 до 50 символов (буквы, пробелы, дефисы)"
                      />
                      <div class="input-icon">
                        <span class="icon icon-user"></span>
                      </div>
                      <div class="validation-icon">
                        <span class="icon icon-check success-icon"></span>
                        <span class="icon icon-x error-icon"></span>
                      </div>
                    </div>
                    <div class="field-feedback">
                      <span class="error-message" id="firstName-error"></span>
                      <span
                        class="success-message"
                        id="firstName-success"
                      ></span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="lastName" class="form-label">
                      Фамилия <span class="required">*</span>
                    </label>
                    <div class="input-container">
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        class="form-input"
                        placeholder="Введите вашу фамилию"
                        required
                        autocomplete="family-name"
                        maxlength="50"
                        pattern="^[А-Яа-яЁёA-Za-z\s-]{2,50}$"
                        title="Фамилия должна содержать от 2 до 50 символов (буквы, пробелы, дефисы)"
                      />
                      <div class="input-icon">
                        <span class="icon icon-user"></span>
                      </div>
                      <div class="validation-icon">
                        <span class="icon icon-check success-icon"></span>
                        <span class="icon icon-x error-icon"></span>
                      </div>
                    </div>
                    <div class="field-feedback">
                      <span class="error-message" id="lastName-error"></span>
                      <span
                        class="success-message"
                        id="lastName-success"
                      ></span>
                    </div>
                  </div>
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label for="email" class="form-label">
                    Email <span class="required">*</span>
                  </label>
                  <div class="input-container">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="form-input"
                      placeholder="example@domain.com"
                      required
                      autocomplete="email"
                      maxlength="100"
                    />
                    <div class="input-icon">
                      <span class="icon icon-mail"></span>
                    </div>
                    <div class="validation-icon">
                      <span class="icon icon-check success-icon"></span>
                      <span class="icon icon-x error-icon"></span>
                      <span class="icon icon-spinner loading-icon"></span>
                    </div>
                  </div>
                  <div class="field-feedback">
                    <span class="error-message" id="email-error"></span>
                    <span class="success-message" id="email-success"
                      >Email доступен</span
                    >
                    <span class="info-message" id="email-info"
                      >Проверяем доступность...</span
                    >
                  </div>
                </div>

                <!-- Username (опционально) -->
                <div class="form-group">
                  <label for="username" class="form-label">
                    Логин <span class="optional">(необязательно)</span>
                  </label>
                  <div class="input-container">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      class="form-input"
                      placeholder="Будет создан автоматически"
                      autocomplete="username"
                      maxlength="30"
                      pattern="^[a-zA-Z0-9._-]{3,30}$"
                      title="Логин должен содержать от 3 до 30 символов (буквы, цифры, точки, дефисы, подчеркивания)"
                    />
                    <div class="input-icon">
                      <span class="icon icon-at"></span>
                    </div>
                    <div class="validation-icon">
                      <span class="icon icon-check success-icon"></span>
                      <span class="icon icon-x error-icon"></span>
                      <span class="icon icon-spinner loading-icon"></span>
                    </div>
                  </div>
                  <div class="field-feedback">
                    <span class="error-message" id="username-error"></span>
                    <span class="success-message" id="username-success"
                      >Логин доступен</span
                    >
                    <span class="info-message" id="username-info"
                      >Проверяем доступность...</span
                    >
                    <span class="help-text"
                      >Если не указан, будет создан автоматически из email</span
                    >
                  </div>
                </div>

                <!-- Пароль -->
                <div class="form-group">
                  <label for="password" class="form-label">
                    Пароль <span class="required">*</span>
                  </label>
                  <div class="input-container">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      class="form-input"
                      placeholder="Создайте надежный пароль"
                      required
                      autocomplete="new-password"
                      maxlength="128"
                      minlength="8"
                    />
                    <div class="input-icon">
                      <span class="icon icon-lock"></span>
                    </div>
                    <button
                      type="button"
                      class="password-toggle"
                      id="password-toggle"
                    >
                      <span class="icon icon-eye" id="password-eye"></span>
                    </button>
                    <div class="validation-icon">
                      <span class="icon icon-check success-icon"></span>
                      <span class="icon icon-x error-icon"></span>
                    </div>
                  </div>

                  <!-- Индикатор силы пароля -->
                  <div class="password-strength" id="password-strength">
                    <div class="strength-bar">
                      <div class="strength-fill" id="strength-fill"></div>
                    </div>
                    <span class="strength-text" id="strength-text"
                      >Введите пароль</span
                    >
                  </div>

                  <!-- Требования к паролю -->
                  <div class="password-requirements" id="password-requirements">
                    <div class="requirement-item" id="req-length">
                      <span class="req-icon">○</span>
                      <span class="req-text">Минимум 8 символов</span>
                    </div>
                    <div class="requirement-item" id="req-lowercase">
                      <span class="req-icon">○</span>
                      <span class="req-text">Строчная буква (a-z)</span>
                    </div>
                    <div class="requirement-item" id="req-uppercase">
                      <span class="req-icon">○</span>
                      <span class="req-text">Заглавная буква (A-Z)</span>
                    </div>
                    <div class="requirement-item" id="req-number">
                      <span class="req-icon">○</span>
                      <span class="req-text">Минимум 2 цифры</span>
                    </div>
                    <div class="requirement-item" id="req-special">
                      <span class="req-icon">○</span>
                      <span class="req-text">Специальный символ (@$!%*?&)</span>
                    </div>
                  </div>

                  <div class="field-feedback">
                    <span class="error-message" id="password-error"></span>
                  </div>
                </div>

                <!-- Подтверждение пароля -->
                <div class="form-group">
                  <label for="confirmPassword" class="form-label">
                    Подтверждение пароля <span class="required">*</span>
                  </label>
                  <div class="input-container">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      class="form-input"
                      placeholder="Повторите пароль"
                      required
                      autocomplete="new-password"
                      maxlength="128"
                    />
                    <div class="input-icon">
                      <span class="icon icon-lock-check"></span>
                    </div>
                    <button
                      type="button"
                      class="password-toggle"
                      id="confirm-password-toggle"
                    >
                      <span
                        class="icon icon-eye"
                        id="confirm-password-eye"
                      ></span>
                    </button>
                    <div class="validation-icon">
                      <span class="icon icon-check success-icon"></span>
                      <span class="icon icon-x error-icon"></span>
                    </div>
                  </div>
                  <div class="field-feedback">
                    <span
                      class="error-message"
                      id="confirmPassword-error"
                    ></span>
                    <span class="success-message" id="confirmPassword-success"
                      >Пароли совпадают</span
                    >
                  </div>
                </div>

                <!-- Согласие на обработку данных -->
                <div class="form-group checkbox-group">
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      name="agreeTerms"
                      class="checkbox-input"
                      required
                    />
                    <label for="agree-terms" class="checkbox-label">
                      <span class="checkbox-box">
                        <span class="icon icon-check"></span>
                      </span>
                      <span class="checkbox-text">
                        Я согласен с
                        <a href="../terms.html" target="_blank" class="link">
                          условиями использования
                        </a>
                        и
                        <a href="../privacy.html" target="_blank" class="link">
                          политикой конфиденциальности
                        </a>
                        <span class="required">*</span>
                      </span>
                    </label>
                  </div>
                  <div class="field-feedback">
                    <span class="error-message" id="agreeTerms-error"></span>
                  </div>
                </div>

                <!-- Подписка на новости (опционально) -->
                <div class="form-group checkbox-group">
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      id="subscribe-newsletter"
                      name="subscribeNewsletter"
                      class="checkbox-input"
                      checked
                    />
                    <label for="subscribe-newsletter" class="checkbox-label">
                      <span class="checkbox-box">
                        <span class="icon icon-check"></span>
                      </span>
                      <span class="checkbox-text">
                        Получать новости о новых книгах и акциях
                      </span>
                    </label>
                  </div>
                  <div class="field-feedback">
                    <span class="help-text"
                      >Вы можете отписаться в любое время</span
                    >
                  </div>
                </div>

                <!-- Кнопка регистрации -->
                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn btn-primary btn-large"
                    id="register-btn"
                  >
                    <span class="btn-content">
                      <span class="btn-text">Создать аккаунт</span>
                      <span class="btn-loader" style="display: none;">
                        <span class="icon icon-spinner spinning"></span>
                        Создаем аккаунт...
                      </span>
                    </span>
                  </button>
                </div>

                <!-- Альтернативные способы регистрации -->
                <div class="form-divider">
                  <span class="divider-text">или</span>
                </div>

                <div class="social-auth">
                  <button
                    type="button"
                    class="btn btn-social btn-google"
                    disabled
                  >
                    <span class="social-icon">
                      <img
                        src="../img/icons/google.svg"
                        alt="Google"
                        width="20"
                        height="20"
                      />
                    </span>
                    <span class="btn-text">Продолжить с Google</span>
                  </button>

                  <button
                    type="button"
                    class="btn btn-social btn-facebook"
                    disabled
                  >
                    <span class="social-icon">
                      <img
                        src="../img/icons/facebook.svg"
                        alt="Facebook"
                        width="20"
                        height="20"
                      />
                    </span>
                    <span class="btn-text">Продолжить с Facebook</span>
                  </button>
                </div>
              </form>

              <!-- Ссылка на вход -->
              <div class="form-footer">
                <p class="footer-text">
                  Уже есть аккаунт?
                  <a href="login.html" class="link link-primary"> Войти </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Футер -->
      <footer class="auth-footer">
        <div class="footer-container">
          <div class="footer-links">
            <a href="../about.html" class="footer-link">О нас</a>
            <a href="../help.html" class="footer-link">Помощь</a>
            <a href="../terms.html" class="footer-link">Условия</a>
            <a href="../privacy.html" class="footer-link">Конфиденциальность</a>
          </div>
          <p class="footer-copyright">© 2024 BookStore. Все права защищены.</p>
        </div>
      </footer>
    </div>

    <!-- Модальные окна -->
    <!-- Модальное окно успешной регистрации -->
    <div id="success-modal" class="modal" style="display: none;">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="success-icon-large">
            <span class="icon icon-check-circle"></span>
          </div>
          <h3 class="modal-title">Аккаунт создан!</h3>
        </div>
        <div class="modal-body">
          <p class="modal-text">
            Добро пожаловать в BookStore! Ваш аккаунт успешно создан.
          </p>
          <p class="modal-subtext">
            Сейчас вы будете перенаправлены на главную страницу.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" id="success-continue">
            Продолжить
          </button>
        </div>
      </div>
    </div>

    <!-- Скрипты -->
    <script src="../scripts/notifications.js"></script>
    <script src="../scripts/auth-utils.js"></script>
    <script src="../scripts/validation.js"></script>
    <script src="../scripts/form-helpers.js"></script>
    <script src="../scripts/register.js"></script>

    <script>
      // Инициализация страницы
      document.addEventListener("DOMContentLoaded", function () {
        // Скрываем прелоадер
        const loader = document.getElementById("page-loader");
        const container = document.getElementById("auth-container");

        setTimeout(() => {
          loader.style.display = "none";
          container.style.display = "block";
          container.classList.add("fade-in");
        }, 500);

        // Проверяем, не авторизован ли уже пользователь
        if (typeof Auth !== "undefined" && Auth.isAuthenticated()) {
          window.location.href = "../index.html";
          return;
        }

        console.log("📝 Страница регистрации загружена");
      });
    </script>
  </body>
</html>
```

## 🎨 CSS стили для страницы регистрации

Создадим файл `public/style/auth.css`:

```css
/* Основные стили для страниц авторизации */
.auth-page {
  font-family: var(--font-family);
  background: var(--bg-secondary);
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

/* Прелоадер */
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-4);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Контейнер авторизации */
.auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.auth-container.fade-in {
  opacity: 1;
}

/* Навигация */
.auth-nav {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: var(--spacing-4) 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-primary);
}

.nav-brand .logo {
  height: 40px;
  margin-right: var(--spacing-3);
}

.brand-text {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--primary-color);
}

.nav-links {
  display: flex;
  gap: var(--spacing-6);
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--primary-color);
}

/* Основной контент */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8) var(--spacing-6);
}

.auth-wrapper {
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-16);
  align-items: center;
}

/* Информационная секция */
.auth-info {
  position: relative;
}

.info-content {
  max-width: 500px;
}

.info-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-6) 0;
  line-height: 1.2;
}

.info-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-8) 0;
  line-height: 1.6;
}

.info-features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-10) 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.feature-icon {
  font-size: var(--text-2xl);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-xl);
}

.feature-text {
  display: flex;
  flex-direction: column;
}

.feature-text strong {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.feature-text span {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.info-stats {
  display: flex;
  gap: var(--spacing-8);
  margin-top: var(--spacing-8);
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-number {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--primary-color);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}

/* Иллюстрация */
.auth-illustration {
  position: absolute;
  top: 50%;
  right: -100px;
  transform: translateY(-50%);
  opacity: 0.1;
  z-index: -1;
}

.illustration-books {
  position: relative;
  width: 200px;
  height: 200px;
}

.book {
  position: absolute;
  width: 60px;
  height: 80px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.book-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: 20px;
  left: 20px;
  transform: rotate(-15deg);
}

.book-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  top: 40px;
  left: 70px;
  transform: rotate(10deg);
}

.book-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 60px;
  left: 120px;
  transform: rotate(-5deg);
}

/* Контейнер формы */
.auth-form-container {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-10);
  position: relative;
  overflow: hidden;
}

.auth-form-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--primary-color),
    var(--primary-light)
  );
}

.form-wrapper {
  max-width: 400px;
  margin: 0 auto;
}

/* Заголовок формы */
.form-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.form-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.form-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: var(--text-base);
}

/* Футер */
.auth-footer {
  background: white;
  border-top: 1px solid var(--gray-200);
  padding: var(--spacing-6) 0;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-6);
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-4);
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--primary-color);
}

.footer-copyright {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .auth-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-8);
    text-align: center;
  }

  .auth-info {
    order: 2;
  }

  .auth-form-container {
    order: 1;
  }

  .auth-illustration {
    display: none;
  }
}

@media (max-width: 768px) {
  .auth-main {
    padding: var(--spacing-4);
  }

  .auth-form-container {
    padding: var(--spacing-6);
  }

  .nav-container {
    padding: 0 var(--spacing-4);
  }

  .nav-links {
    gap: var(--spacing-4);
  }

  .info-features .feature-item {
    margin-bottom: var(--spacing-4);
  }

  .info-stats {
    justify-content: center;
    gap: var(--spacing-6);
  }

  .footer-links {
    flex-wrap: wrap;
    gap: var(--spacing-4);
  }
}

@media (max-width: 480px) {
  .info-title {
    font-size: var(--text-2xl);
  }

  .form-title {
    font-size: var(--text-2xl);
  }

  .feature-item {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-2);
  }

  .feature-icon {
    font-size: var(--text-xl);
    width: 40px;
    height: 40px;
  }

  .info-stats {
    flex-direction: column;
    gap: var(--spacing-4);
  }
}
```

## 📝 JavaScript для регистрации

Создадим файл `public/scripts/register.js`:

```javascript
// public/scripts/register.js

class RegistrationManager {
  constructor() {
    this.form = null;
    this.fields = {};
    this.validators = {};
    this.isSubmitting = false;

    this.initializeForm();
    this.setupValidation();
    this.setupEventListeners();
  }

  initializeForm() {
    this.form = document.getElementById("register-form");

    // Получаем все поля формы
    this.fields = {
      firstName: document.getElementById("firstName"),
      lastName: document.getElementById("lastName"),
      email: document.getElementById("email"),
      username: document.getElementById("username"),
      password: document.getElementById("password"),
      confirmPassword: document.getElementById("confirmPassword"),
      agreeTerms: document.getElementById("agree-terms"),
      subscribeNewsletter: document.getElementById("subscribe-newsletter"),
    };

    // Кнопки
    this.submitBtn = document.getElementById("register-btn");
    this.passwordToggle = document.getElementById("password-toggle");
    this.confirmPasswordToggle = document.getElementById(
      "confirm-password-toggle"
    );
  }

  setupValidation() {
    // Настраиваем валидаторы для каждого поля
    this.validators = {
      firstName: new FieldValidator("firstName", {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[А-Яа-яЁёA-Za-z\s-]{2,50}$/,
        message: "Имя должно содержать от 2 до 50 символов (только буквы)",
      }),

      lastName: new FieldValidator("lastName", {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[А-Яа-яЁёA-Za-z\s-]{2,50}$/,
        message: "Фамилия должна содержать от 2 до 50 символов (только буквы)",
      }),

      email: new EmailValidator("email", {
        required: true,
        checkAvailability: true,
        apiEndpoint: "/api/auth/check-email",
      }),

      username: new UsernameValidator("username", {
        required: false,
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9._-]{3,30}$/,
        checkAvailability: true,
        apiEndpoint: "/api/auth/check-username",
      }),

      password: new PasswordValidator("password", {
        required: true,
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: 2,
        requireSpecialChars: true,
        allowedSpecialChars: "@$!%*?&",
      }),

      confirmPassword: new ConfirmPasswordValidator("confirmPassword", {
        required: true,
        matchField: "password",
      }),

      agreeTerms: new CheckboxValidator("agreeTerms", {
        required: true,
        message: "Необходимо согласиться с условиями использования",
      }),
    };
  }

  setupEventListeners() {
    // Обработка отправки формы
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Валидация в реальном времени
    Object.keys(this.fields).forEach((fieldName) => {
      const field = this.fields[fieldName];
      const validator = this.validators[fieldName];

      if (field && validator) {
        // При потере фокуса
        field.addEventListener("blur", () => {
          validator.validate(field.value);
        });

        // При вводе (с задержкой)
        if (fieldName !== "agreeTerms") {
          let timeout;
          field.addEventListener("input", () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              validator.validate(field.value);
            }, 300);
          });
        }

        // Для чекбоксов
        if (field.type === "checkbox") {
          field.addEventListener("change", () => {
            validator.validate(field.checked);
          });
        }
      }
    });

    // Переключение видимости пароля
    if (this.passwordToggle) {
      this.passwordToggle.addEventListener("click", () => {
        this.togglePasswordVisibility("password");
      });
    }

    if (this.confirmPasswordToggle) {
      this.confirmPasswordToggle.addEventListener("click", () => {
        this.togglePasswordVisibility("confirmPassword");
      });
    }

    // Генерация username из email
    this.fields.email.addEventListener("input", () => {
      if (!this.fields.username.value) {
        this.suggestUsername();
      }
    });

    // Проверка силы пароля
    this.fields.password.addEventListener("input", () => {
      this.updatePasswordStrength();
    });

    // Проверка совпадения паролей
    this.fields.confirmPassword.addEventListener("input", () => {
      this.checkPasswordMatch();
    });
  }

  togglePasswordVisibility(fieldName) {
    const field = this.fields[fieldName];
    const toggle =
      fieldName === "password"
        ? this.passwordToggle
        : this.confirmPasswordToggle;
    const eye = toggle.querySelector(".icon");

    if (field.type === "password") {
      field.type = "text";
      eye.classList.remove("icon-eye");
      eye.classList.add("icon-eye-off");
    } else {
      field.type = "password";
      eye.classList.remove("icon-eye-off");
      eye.classList.add("icon-eye");
    }
  }

  suggestUsername() {
    const email = this.fields.email.value;
    if (email && email.includes("@")) {
      const suggested = email.split("@")[0].toLowerCase();
      this.fields.username.placeholder = `Предлагаем: ${suggested}`;
    }
  }

  updatePasswordStrength() {
    const password = this.fields.password.value;
    const strengthBar = document.getElementById("strength-fill");
    const strengthText = document.getElementById("strength-text");
    const requirements = document.getElementById("password-requirements");

    if (!password) {
      strengthBar.style.width = "0%";
      strengthBar.className = "strength-fill";
      strengthText.textContent = "Введите пароль";
      this.updatePasswordRequirements(password);
      return;
    }

    const strength = this.calculatePasswordStrength(password);

    // Обновляем индикатор
    strengthBar.style.width = `${strength.percentage}%`;
    strengthBar.className = `strength-fill strength-${strength.level}`;
    strengthText.textContent = strength.text;

    // Обновляем требования
    this.updatePasswordRequirements(password);
  }

  calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];

    // Длина
    if (password.length >= 8) score += 20;
    else feedback.push("минимум 8 символов");

    // Строчные буквы
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push("строчные буквы");

    // Заглавные буквы
    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push("заглавные буквы");

    // Цифры (минимум 2)
    const numbers = (password.match(/\d/g) || []).length;
    if (numbers >= 2) score += 20;
    else feedback.push("минимум 2 цифры");

    // Специальные символы
    if (/[@$!%*?&]/.test(password)) score += 15;
    else feedback.push("специальные символы");

    // Бонусы
    if (password.length > 12) score += 10;
    if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 5;

    // Определяем уровень
    let level, text;
    if (score < 40) {
      level = "weak";
      text = "Слабый";
    } else if (score < 70) {
      level = "medium";
      text = "Средний";
    } else if (score < 90) {
      level = "strong";
      text = "Сильный";
    } else {
      level = "very-strong";
      text = "Очень сильный";
    }

    return {
      score,
      percentage: Math.min(score, 100),
      level,
      text,
      feedback,
    };
  }

  updatePasswordRequirements(password) {
    const requirements = {
      "req-length": password.length >= 8,
      "req-lowercase": /[a-z]/.test(password),
      "req-uppercase": /[A-Z]/.test(password),
      "req-number": (password.match(/\d/g) || []).length >= 2,
      "req-special": /[@$!%*?&]/.test(password),
    };

    Object.keys(requirements).forEach((reqId) => {
      const element = document.getElementById(reqId);
      const icon = element.querySelector(".req-icon");
      const isValid = requirements[reqId];

      if (isValid) {
        element.classList.add("valid");
        icon.textContent = "✓";
        icon.style.color = "var(--success-color)";
      } else {
        element.classList.remove("valid");
        icon.textContent = "○";
        icon.style.color = "var(--gray-400)";
      }
    });
  }

  checkPasswordMatch() {
    const password = this.fields.password.value;
    const confirmPassword = this.fields.confirmPassword.value;
    const validator = this.validators.confirmPassword;

    if (confirmPassword) {
      const isMatch = password === confirmPassword;
      validator.setValidationState(
        isMatch,
        isMatch ? "Пароли совпадают" : "Пароли не совпадают"
      );
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) return;

    // Валидируем все поля
    const isValid = await this.validateAllFields();

    if (!isValid) {
      Notifications.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    this.isSubmitting = true;
    this.setSubmitState(true);

    try {
      const formData = this.getFormData();
      const response = await this.submitRegistration(formData);

      if (response.success) {
        await this.handleSuccessfulRegistration(response);
      } else {
        this.handleRegistrationError(response);
      }
    } catch (error) {
      this.handleNetworkError(error);
    } finally {
      this.isSubmitting = false;
      this.setSubmitState(false);
    }
  }

  async validateAllFields() {
    const validationPromises = Object.keys(this.validators).map(
      async (fieldName) => {
        const field = this.fields[fieldName];
        const validator = this.validators[fieldName];

        if (field && validator) {
          const value = field.type === "checkbox" ? field.checked : field.value;
          return await validator.validate(value);
        }
        return true;
      }
    );

    const results = await Promise.all(validationPromises);
    return results.every((result) => result);
  }

  getFormData() {
    return {
      firstName: this.fields.firstName.value.trim(),
      lastName: this.fields.lastName.value.trim(),
      email: this.fields.email.value.trim().toLowerCase(),
      username: this.fields.username.value.trim() || null,
      password: this.fields.password.value,
      agreeTerms: this.fields.agreeTerms.checked,
      subscribeNewsletter: this.fields.subscribeNewsletter.checked,
    };
  }

  async submitRegistration(formData) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(formData),
    });

    return await response.json();
  }

  async handleSuccessfulRegistration(response) {
    // Сохраняем токен если предоставлен
    if (response.token) {
      Auth.saveToken(response.token);
      if (response.user) {
        Auth.saveUser(response.user);
      }
    }

    // Показываем модальное окно успеха
    this.showSuccessModal();

    // Отправляем аналитику
    this.trackRegistrationSuccess();

    // Перенаправляем через 3 секунды
    setTimeout(() => {
      const redirectUrl =
        new URLSearchParams(window.location.search).get("redirect") ||
        "../index.html";
      window.location.href = redirectUrl;
    }, 3000);
  }

  handleRegistrationError(response) {
    if (response.errors && typeof response.errors === "object") {
      // Показываем ошибки полей
      Object.keys(response.errors).forEach((fieldName) => {
        const validator = this.validators[fieldName];
        if (validator) {
          validator.setValidationState(false, response.errors[fieldName]);
        }
      });
    } else {
      // Общая ошибка
      Notifications.error(response.message || "Ошибка при регистрации");
    }

    this.trackRegistrationError(response);
  }

  handleNetworkError(error) {
    console.error("Network error during registration:", error);
    Notifications.error("Ошибка подключения к серверу. Попробуйте позже.");
    this.trackRegistrationError({
      type: "network_error",
      message: error.message,
    });
  }

  setSubmitState(isSubmitting) {
    const btnText = this.submitBtn.querySelector(".btn-text");
    const btnLoader = this.submitBtn.querySelector(".btn-loader");

    if (isSubmitting) {
      this.submitBtn.disabled = true;
      btnText.style.display = "none";
      btnLoader.style.display = "inline-flex";

      // Отключаем все поля
      Object.values(this.fields).forEach((field) => {
        field.disabled = true;
      });
    } else {
      this.submitBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoader.style.display = "none";

      // Включаем все поля
      Object.values(this.fields).forEach((field) => {
        field.disabled = false;
      });
    }
  }

  showSuccessModal() {
    const modal = document.getElementById("success-modal");
    const continueBtn = document.getElementById("success-continue");

    modal.style.display = "flex";

    // Обработчик кнопки "Продолжить"
    continueBtn.onclick = () => {
      const redirectUrl =
        new URLSearchParams(window.location.search).get("redirect") ||
        "../index.html";
      window.location.href = redirectUrl;
    };

    // Закрытие по клику на overlay
    modal.querySelector(".modal-overlay").onclick = () => {
      modal.style.display = "none";
    };
  }

  trackRegistrationSuccess() {
    // Google Analytics
    if (typeof gtag !== "undefined") {
      gtag("event", "sign_up", {
        method: "email",
      });
    }

    // Внутренняя аналитика
    this.sendAnalyticsEvent("registration_completed", {
      method: "email",
      newsletter_subscribed: this.fields.subscribeNewsletter.checked,
    });
  }

  trackRegistrationError(error) {
    this.sendAnalyticsEvent("registration_failed", {
      error_type: error.type || "unknown",
      error_message: error.message || "Unknown error",
    });
  }

  sendAnalyticsEvent(eventName, data) {
    // Отправка событий в аналитику
    fetch("/api/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: eventName,
        data: data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch((err) => {
      console.log("Analytics error:", err);
    });
  }
}

// Инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", function () {
  // Проверяем, что все необходимые скрипты загружены
  if (
    typeof FieldValidator === "undefined" ||
    typeof EmailValidator === "undefined" ||
    typeof Notifications === "undefined"
  ) {
    console.error("Required scripts not loaded");
    return;
  }

  // Создаем экземпляр менеджера регистрации
  window.registrationManager = new RegistrationManager();

  console.log("📝 Registration manager initialized");
});
```

## 🧪 Практические задания

### Задание 1: Улучшение UX

- Добавьте анимации для полей формы
- Реализуйте пошаговую регистрацию
- Добавьте автозаполнение адреса по индексу

### Задание 2: Валидация

- Создайте кастомные валидаторы
- Добавьте проверку на одноразовые email
- Реализуйте валидацию номера телефона

### Задание 3: Доступность

- Добавьте ARIA атрибуты
- Реализуйте навигацию с клавиатуры
- Создайте версию для скринридеров

### Задание 4: Тестирование

- Напишите unit тесты для валидаторов
- Создайте e2e тесты регистрации
- Добавьте визуальные регрессионные тесты

---

**Следующий урок:** [Урок 17: Создание страницы входа](17_LOGIN_PAGE.md) 🔐

**Практика:** Создайте свою собственную страницу регистрации, используя данное руководство!
