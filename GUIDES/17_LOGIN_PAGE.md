# Урок 17: Создание страницы входа (Login Page)

# Актуальные особенности интерфейса входа

В текущей реализации:

- Все поля формы используют динамические классы `.valid` и `.invalid` для визуальной обратной связи.
- Сообщения об ошибках появляются только при наличии ошибки, скрываются автоматически.
- Все ссылки на регистрацию и вход абсолютные (`/html/register.html`, `/html/login.html`), навигация управляется через JS.
- Валидация и обработка ошибок реализованы через функции `FormUtils.showFieldError` и `FormUtils.clearFormErrors`.
- Меню в header динамически обновляется в зависимости от состояния авторизации.

## Обзор урока

В этом уроке мы создадим полноценную страницу входа в систему с современным дизайном, валидацией и интерактивным интерфейсом. Страница входа - это критически важный элемент любого веб-приложения, который должен быть одновременно простым в использовании и безопасным.

### Цели урока

- Создать семантически правильную HTML-структуру формы входа
- Реализовать современный CSS-дизайн с использованием CSS-переменных
- Добавить клиентскую валидацию с JavaScript
- Обеспечить доступность и удобство использования
- Интегрировать с API авторизации

### Требования к странице входа

- Минималистичный и интуитивно понятный дизайн
- Поля для email/логина и пароля
- Опция "Запомнить меня"
- Ссылка на восстановление пароля
- Ссылка на регистрацию
- Валидация в реальном времени
- Уведомления об ошибках
- Индикатор загрузки
- Адаптивный дизайн

## Часть 1: HTML-структура страницы входа

### 1.1 Базовая структура документа

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Вход в личный кабинет BookStore" />
    <title>Вход в систему - BookStore</title>

    <!-- Основные стили -->
    <link rel="stylesheet" href="../style/style.css" />
    <link rel="stylesheet" href="../style/auth-forms.css" />

    <!-- Предзагрузка критических ресурсов -->
    <link rel="preload" href="../style/auth-forms.css" as="style" />

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="../img/favicon.ico" />
  </head>
  <body class="auth-page">
    <!-- Контент страницы -->
  </body>
</html>
```

### 1.2 Навигация и заголовок

```html
<header class="main-header">
  <div class="header-content">
    <a
      href="../index.html"
      class="logo-link"
      aria-label="Вернуться на главную страницу"
    >
      <img
        src="../img/logo.png"
        alt="Логотип BookStore"
        class="logo"
        width="140"
        height="70"
      />
    </a>

    <nav class="main-nav" role="navigation" aria-label="Основная навигация">
      <ul class="nav-menu">
        <li><a href="../index.html">Главная</a></li>
        <li><a href="book.html">Каталог</a></li>
        <li><a href="contacts.html">Контакты</a></li>
        <li><a href="register.html">Регистрация</a></li>
        <li>
          <a href="login.html" class="active" aria-current="page">Вход</a>
        </li>
      </ul>
    </nav>
  </div>
</header>
```

### 1.3 Основная форма входа

```html
<main class="auth-main" role="main">
  <div class="auth-container">
    <!-- Заголовок страницы -->
    <div class="auth-header">
      <h1 class="auth-title">Добро пожаловать!</h1>
      <p class="auth-subtitle">Войдите в свой аккаунт для продолжения</p>
    </div>

    <!-- Система уведомлений -->
    <div
      id="notification"
      class="notification"
      role="alert"
      aria-live="polite"
      style="display: none;"
    >
      <div class="notification-content">
        <span class="notification-icon"></span>
        <span class="notification-message"></span>
        <button class="notification-close" aria-label="Закрыть уведомление">
          &times;
        </button>
      </div>
    </div>

    <!-- Форма входа -->
    <form id="loginForm" class="auth-form" novalidate>
      <fieldset class="form-fieldset">
        <legend class="visually-hidden">Данные для входа</legend>

        <!-- Поле Email/Логин -->
        <div class="form-group">
          <label for="loginField" class="form-label">
            Email или логин
            <span class="required-asterisk" aria-label="обязательное поле"
              >*</span
            >
          </label>
          <div class="input-wrapper">
            <input
              type="text"
              id="loginField"
              name="loginField"
              class="form-input"
              required
              autocomplete="username"
              placeholder="Введите email или логин"
              aria-describedby="loginField-help loginField-error"
            />
            <span class="input-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
          </div>
          <small id="loginField-help" class="form-help">
            Используйте email или логин для входа
          </small>
          <span id="loginField-error" class="error-message" role="alert"></span>
        </div>

        <!-- Поле Пароль -->
        <div class="form-group">
          <label for="password" class="form-label">
            Пароль
            <span class="required-asterisk" aria-label="обязательное поле"
              >*</span
            >
          </label>
          <div class="input-wrapper">
            <input
              type="password"
              id="password"
              name="password"
              class="form-input"
              required
              autocomplete="current-password"
              placeholder="Введите пароль"
              aria-describedby="password-help password-error"
            />
            <button
              type="button"
              class="password-toggle"
              aria-label="Показать пароль"
              tabindex="-1"
            >
              <svg
                class="icon-show"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                class="icon-hide"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                style="display: none;"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
          <small id="password-help" class="form-help">
            Введите пароль от вашего аккаунта
          </small>
          <span id="password-error" class="error-message" role="alert"></span>
        </div>

        <!-- Дополнительные опции -->
        <div class="form-options">
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              class="form-checkbox"
            />
            <label for="rememberMe" class="checkbox-label">
              Запомнить меня
            </label>
          </div>

          <a href="forgot-password.html" class="forgot-password-link">
            Забыли пароль?
          </a>
        </div>

        <!-- Кнопка отправки -->
        <button type="submit" class="auth-button" id="loginButton">
          <span class="button-text">Войти</span>
          <span class="button-loader" style="display: none;">
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle class="spinner-circle" cx="12" cy="12" r="10" fill="none"
              stroke="width="2"/>
            </svg>
            Вход...
          </span>
        </button>
      </fieldset>
    </form>

    <!-- Альтернативные способы входа -->
    <div class="auth-alternatives">
      <div class="divider">
        <span class="divider-text">или</span>
      </div>

      <div class="social-login">
        <button type="button" class="social-button google-login" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Войти через Google
        </button>

        <button type="button" class="social-button github-login" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
            />
          </svg>
          Войти через GitHub
        </button>
      </div>

      <p class="auth-note">
        Социальные входы будут доступны в следующих версиях
      </p>
    </div>

    <!-- Ссылка на регистрацию -->
    <div class="auth-footer">
      <p class="auth-switch">
        Нет аккаунта?
        <a href="register.html" class="auth-link">Зарегистрироваться</a>
      </p>
    </div>
  </div>
</main>
```

## Часть 2: CSS-стили для страницы входа

### 2.1 Основные стили формы входа

```css
/* auth-forms.css - Стили для форм авторизации */

/* CSS-переменные для форм авторизации */
:root {
  /* Цвета для форм */
  --auth-bg-color: #ffffff;
  --auth-border-color: #e2e8f0;
  --auth-shadow-color: rgba(0, 0, 0, 0.05);
  --auth-focus-color: var(--primary-color);
  --auth-error-color: #ef4444;
  --auth-success-color: #10b981;

  /* Размеры и отступы */
  --auth-form-width: 480px;
  --auth-input-height: 48px;
  --auth-border-radius: 8px;
  --auth-spacing: 20px;

  /* Анимации */
  --auth-transition: all 0.3s ease;
  --auth-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Базовая страница авторизации */
.auth-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
  display: flex;
  flex-direction: column;
}

/* Главная область формы */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--auth-spacing);
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

/* Контейнер формы */
.auth-container {
  width: 100%;
  max-width: var(--auth-form-width);
  background: var(--auth-bg-color);
  border-radius: var(--auth-border-radius);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: slideInUp 0.6s var(--auth-bounce);
}

/* Анимация появления */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Заголовок формы */
.auth-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
  color: white;
}

.auth-title {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.auth-subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 400;
}

/* Основная форма */
.auth-form {
  padding: 2rem;
}

.form-fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

/* Группы полей */
.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

/* Лейблы */
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.required-asterisk {
  color: var(--auth-error-color);
  margin-left: 2px;
}

/* Обертка для инпутов */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Инпуты */
.form-input {
  width: 100%;
  height: var(--auth-input-height);
  padding: 0 2.75rem 0 1rem;
  border: 2px solid var(--auth-border-color);
  border-radius: var(--auth-border-radius);
  font-size: 1rem;
  line-height: 1.5;
  transition: var(--auth-transition);
  background-color: white;
  color: var(--text-color);
}

.form-input::placeholder {
  color: var(--text-light);
  opacity: 1;
}

.form-input:focus {
  outline: none;
  border-color: var(--auth-focus-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.form-input:invalid:not(:placeholder-shown) {
  border-color: var(--auth-error-color);
}

.form-input:valid:not(:placeholder-shown) {
  border-color: var(--auth-success-color);
}

/* Иконки в инпутах */
.input-icon {
  position: absolute;
  right: 1rem;
  color: var(--text-light);
  pointer-events: none;
  transition: var(--auth-transition);
}

.form-input:focus + .input-icon {
  color: var(--auth-focus-color);
}

/* Кнопка показа пароля */
.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-light);
  transition: var(--auth-transition);
  z-index: 1;
}

.password-toggle:hover {
  color: var(--auth-focus-color);
  background-color: rgba(59, 130, 246, 0.1);
}

.password-toggle:focus {
  outline: 2px solid var(--auth-focus-color);
  outline-offset: 2px;
}

/* Подсказки и ошибки */
.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-light);
  line-height: 1.25rem;
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--auth-error-color);
  font-weight: 500;
  opacity: 0;
  transform: translateY(-10px);
  transition: var(--auth-transition);
}

.error-message.show {
  opacity: 1;
  transform: translateY(0);
}

/* Дополнительные опции */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Чекбокс "Запомнить меня" */
.checkbox-group {
  display: flex;
  align-items: center;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--text-color);
  cursor: pointer;
  user-select: none;
}

/* Ссылка "Забыли пароль?" */
.forgot-password-link {
  font-size: 0.875rem;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: var(--auth-transition);
}

.forgot-password-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Кнопка отправки */
.auth-button {
  width: 100%;
  height: var(--auth-input-height);
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
  color: white;
  border: none;
  border-radius: var(--auth-border-radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--auth-transition);
  position: relative;
  overflow: hidden;
  margin: 1.5rem 0;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.auth-button:active {
  transform: translateY(0);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-text {
  transition: var(--auth-transition);
}

.button-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Спиннер загрузки */
.spinner {
  animation: spin 1s linear infinite;
}

.spinner-circle {
  stroke: currentColor;
  stroke-linecap: round;
  stroke-dasharray: 31.416;
  stroke-dashoffset: 31.416;
  animation: draw 2s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes draw {
  0% {
    stroke-dasharray: 0 31.416;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 15.708 15.708;
    stroke-dashoffset: -7.854;
  }
  100% {
    stroke-dasharray: 0 31.416;
    stroke-dashoffset: -31.416;
  }
}
```

### 2.2 Стили для альтернативных способов входа

```css
/* Альтернативные способы входа */
.auth-alternatives {
  padding: 0 2rem 1rem;
}

/* Разделитель */
.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--auth-border-color);
}

.divider-text {
  background: var(--auth-bg-color);
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--text-light);
  position: relative;
  z-index: 1;
}

/* Социальные кнопки */
.social-login {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  height: var(--auth-input-height);
  border: 2px solid var(--auth-border-color);
  border-radius: var(--auth-border-radius);
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--auth-transition);
  position: relative;
}

.social-button:hover:not(:disabled) {
  border-color: var(--text-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.social-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.google-login {
  color: #1f2937;
}

.github-login {
  color: #1f2937;
}

/* Примечание */
.auth-note {
  font-size: 0.75rem;
  color: var(--text-light);
  text-align: center;
  margin: 0;
  font-style: italic;
}

/* Футер формы */
.auth-footer {
  padding: 1rem 2rem 2rem;
  text-align: center;
  border-top: 1px solid var(--auth-border-color);
  background-color: #f8fafc;
}

.auth-switch {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color);
}

.auth-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: var(--auth-transition);
}

.auth-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}
```

### 2.3 Адаптивные стили

```css
/* Адаптивность */
@media (max-width: 768px) {
  .auth-main {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 2rem;
  }

  .auth-container {
    max-width: 100%;
  }

  .auth-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .auth-title {
    font-size: 1.5rem;
  }

  .auth-form {
    padding: 1.5rem;
  }

  .auth-footer {
    padding: 1rem 1.5rem 1.5rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .social-login {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .auth-main {
    padding: 0.5rem;
    padding-top: 1rem;
  }

  .auth-container {
    border-radius: 0;
    min-height: calc(100vh - 1rem);
  }

  .form-input {
    height: 44px;
    font-size: 16px; /* Предотвращает зум на iOS */
  }

  .auth-button {
    height: 44px;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  :root {
    --auth-bg-color: #1f2937;
    --auth-border-color: #374151;
    --auth-shadow-color: rgba(0, 0, 0, 0.3);
  }

  .auth-page {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  }

  .form-input {
    background-color: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }

  .form-input::placeholder {
    color: #9ca3af;
  }

  .social-button {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }

  .auth-footer {
    background-color: #374151;
    border-color: #4b5563;
  }
}

/* Печать */
@media print {
  .auth-page {
    background: white;
  }

  .auth-main {
    background: none;
  }

  .auth-container {
    box-shadow: none;
    border: 1px solid #ccc;
  }

  .social-login,
  .auth-alternatives {
    display: none;
  }
}

/* Уменьшенная анимация для пользователей с ограниченными возможностями */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .auth-container {
    animation: none;
  }
}

/* Высокий контраст */
@media (prefers-contrast: high) {
  .form-input {
    border-width: 3px;
  }

  .auth-button {
    border: 3px solid transparent;
  }

  .error-message {
    font-weight: 700;
  }
}
```

## Часть 3: JavaScript функциональность

### 3.1 Базовый класс для валидации

```javascript
// auth-utils.js - Утилиты для авторизации

/**
 * Класс для работы с формами авторизации
 */
class AuthValidator {
  constructor() {
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      username: /^[a-zA-Z0-9_]{3,20}$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    };

    this.messages = {
      required: "Это поле обязательно для заполнения",
      email: "Введите корректный email адрес",
      username: "Логин должен содержать 3-20 символов (буквы, цифры, _)",
      password:
        "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, и минимум 2 цифры",
      loginField: "Введите корректный email или логин",
    };
  }

  /**
   * Валидация email адреса
   */
  validateEmail(email) {
    if (!email.trim()) {
      return { isValid: false, message: this.messages.required };
    }

    if (!this.patterns.email.test(email)) {
      return { isValid: false, message: this.messages.email };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Валидация логина
   */
  validateUsername(username) {
    if (!username.trim()) {
      return { isValid: false, message: this.messages.required };
    }

    if (!this.patterns.username.test(username)) {
      return { isValid: false, message: this.messages.username };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Валидация поля логин/email
   */
  validateLoginField(value) {
    if (!value.trim()) {
      return { isValid: false, message: this.messages.required };
    }

    // Проверяем, является ли значение email
    if (value.includes("@")) {
      return this.validateEmail(value);
    } else {
      // Иначе проверяем как логин
      return this.validateUsername(value);
    }
  }

  /**
   * Валидация пароля
   */
  validatePassword(password) {
    if (!password) {
      return { isValid: false, message: this.messages.required };
    }

    if (!this.patterns.password.test(password)) {
      return { isValid: false, message: this.messages.password };
    }

    return { isValid: true, message: "" };
  }

  /**
   * Показать ошибку для поля
   */
  showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement =
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
    }

    if (inputElement) {
      inputElement.classList.add("error");
      inputElement.setAttribute("aria-invalid", "true");
    }
  }

  /**
   * Скрыть ошибку для поля
   */
  hideFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement =
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`);

    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.remove("show");
    }

    if (inputElement) {
      inputElement.classList.remove("error");
      inputElement.setAttribute("aria-invalid", "false");
    }
  }

  /**
   * Валидация всей формы
   */
  validateForm(formData, requiredFields = []) {
    const errors = {};
    let isValid = true;

    requiredFields.forEach((field) => {
      const value = formData.get(field);
      let validation;

      switch (field) {
        case "loginField":
          validation = this.validateLoginField(value);
          break;
        case "password":
          validation = this.validatePassword(value);
          break;
        default:
          validation = {
            isValid: !!value,
            message: value ? "" : this.messages.required,
          };
      }

      if (!validation.isValid) {
        errors[field] = validation.message;
        isValid = false;
        this.showFieldError(field, validation.message);
      } else {
        this.hideFieldError(field);
      }
    });

    return { isValid, errors };
  }
}

/**
 * Класс для работы с уведомлениями
 */
class NotificationManager {
  constructor() {
    this.container = document.getElementById("notification");
    this.autoHideTimeout = null;
  }

  /**
   * Показать уведомление
   */
  show(message, type = "info", autoHide = true) {
    if (!this.container) return;

    // Очищаем предыдущий таймер
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }

    // Устанавливаем содержимое
    const messageElement = this.container.querySelector(
      ".notification-message"
    );
    const iconElement = this.container.querySelector(".notification-icon");

    if (messageElement) {
      messageElement.textContent = message;
    }

    // Устанавливаем иконку в зависимости от типа
    if (iconElement) {
      iconElement.innerHTML = this.getIcon(type);
    }

    // Устанавливаем класс типа
    this.container.className = `notification ${type}`;
    this.container.style.display = "block";

    // Добавляем анимацию появления
    requestAnimationFrame(() => {
      this.container.classList.add("show");
    });

    // Автоскрытие
    if (autoHide) {
      this.autoHideTimeout = setTimeout(() => {
        this.hide();
      }, 5000);
    }

    // Обработчик кнопки закрытия
    const closeButton = this.container.querySelector(".notification-close");
    if (closeButton) {
      closeButton.onclick = () => this.hide();
    }
  }

  /**
   * Скрыть уведомление
   */
  hide() {
    if (!this.container) return;

    this.container.classList.remove("show");

    setTimeout(() => {
      this.container.style.display = "none";
    }, 300);

    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }
  }

  /**
   * Получить иконку для типа уведомления
   */
  getIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
            </svg>`,
    };

    return icons[type] || icons.info;
  }

  /**
   * Показать ошибку
   */
  showError(message) {
    this.show(message, "error");
  }

  /**
   * Показать успех
   */
  showSuccess(message) {
    this.show(message, "success");
  }

  /**
   * Показать предупреждение
   */
  showWarning(message) {
    this.show(message, "warning");
  }

  /**
   * Показать информацию
   */
  showInfo(message) {
    this.show(message, "info");
  }
}

/**
 * Утилиты для работы с API
 */
class ApiClient {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Выполнить запрос к API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * POST запрос
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * GET запрос
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: "GET",
    });
  }
}

// Экспортируем классы для использования
window.AuthValidator = AuthValidator;
window.NotificationManager = NotificationManager;
window.ApiClient = ApiClient;
```

### 3.2 Скрипт для страницы входа

```javascript
// login.js - Скрипт для страницы входа

document.addEventListener("DOMContentLoaded", function () {
  // Инициализация классов
  const validator = new AuthValidator();
  const notification = new NotificationManager();
  const api = new ApiClient();

  // Получение элементов
  const loginForm = document.getElementById("loginForm");
  const loginButton = document.getElementById("loginButton");
  const passwordToggle = document.querySelector(".password-toggle");
  const passwordInput = document.getElementById("password");

  // Кнопка показа/скрытия пароля
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", function () {
      const isPasswordVisible = passwordInput.type === "text";
      const iconShow = this.querySelector(".icon-show");
      const iconHide = this.querySelector(".icon-hide");

      if (isPasswordVisible) {
        passwordInput.type = "password";
        iconShow.style.display = "block";
        iconHide.style.display = "none";
        this.setAttribute("aria-label", "Показать пароль");
      } else {
        passwordInput.type = "text";
        iconShow.style.display = "none";
        iconHide.style.display = "block";
        this.setAttribute("aria-label", "Скрыть пароль");
      }
    });
  }

  // Валидация в реальном времени
  const inputs = loginForm.querySelectorAll(".form-input");
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this.name, this.value);
    });

    input.addEventListener("input", function () {
      // Убираем ошибку при начале ввода
      if (this.classList.contains("error")) {
        validator.hideFieldError(this.name);
      }
    });
  });

  /**
   * Валидация отдельного поля
   */
  function validateField(fieldName, value) {
    let validation;

    switch (fieldName) {
      case "loginField":
        validation = validator.validateLoginField(value);
        break;
      case "password":
        validation = validator.validatePassword(value);
        break;
      default:
        return true;
    }

    if (!validation.isValid) {
      validator.showFieldError(fieldName, validation.message);
      return false;
    } else {
      validator.hideFieldError(fieldName);
      return true;
    }
  }

  /**
   * Установка состояния загрузки
   */
  function setLoadingState(isLoading) {
    const buttonText = loginButton.querySelector(".button-text");
    const buttonLoader = loginButton.querySelector(".button-loader");

    if (isLoading) {
      buttonText.style.display = "none";
      buttonLoader.style.display = "flex";
      loginButton.disabled = true;

      // Отключаем все инпуты
      inputs.forEach((input) => {
        input.disabled = true;
      });
    } else {
      buttonText.style.display = "block";
      buttonLoader.style.display = "none";
      loginButton.disabled = false;

      // Включаем все инпуты
      inputs.forEach((input) => {
        input.disabled = false;
      });
    }
  }

  /**
   * Сохранение данных входа
   */
  function saveLoginData(userData, rememberMe) {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Сохраняем токен
    if (userData.token) {
      storage.setItem("authToken", userData.token);
    }

    // Сохраняем информацию о пользователе
    if (userData.user) {
      storage.setItem(
        "currentUser",
        JSON.stringify({
          id: userData.user.id,
          email: userData.user.email,
          username: userData.user.username,
          firstName: userData.user.firstName,
          lastName: userData.user.lastName,
          role: userData.user.role || "user",
        })
      );
    }

    // Устанавливаем время истечения токена
    if (userData.expiresIn) {
      const expirationTime = Date.now() + userData.expiresIn * 1000;
      storage.setItem("tokenExpiration", expirationTime.toString());
    }
  }

  /**
   * Перенаправление после успешного входа
   */
  function redirectAfterLogin() {
    // Проверяем, есть ли параметр redirect в URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");

    if (redirectUrl) {
      // Декодируем и проверяем безопасность URL
      try {
        const decodedUrl = decodeURIComponent(redirectUrl);
        // Простая проверка, что это относительный URL
        if (decodedUrl.startsWith("/") && !decodedUrl.startsWith("//")) {
          window.location.href = decodedUrl;
          return;
        }
      } catch (e) {
        console.warn("Invalid redirect URL");
      }
    }

    // Перенаправляем на главную страницу или в личный кабинет
    window.location.href = "../index.html";
  }

  /**
   * Обработка отправки формы
   */
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Получаем данные формы
    const formData = new FormData(this);
    const loginData = {
      loginField: formData.get("loginField"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "on",
    };

    // Валидация формы
    const validationResult = validator.validateForm(formData, [
      "loginField",
      "password",
    ]);

    if (!validationResult.isValid) {
      notification.showError("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    // Устанавливаем состояние загрузки
    setLoadingState(true);

    try {
      // Отправляем запрос на сервер
      const response = await api.post("/auth/login", {
        loginField: loginData.loginField,
        password: loginData.password,
      });

      // Сохраняем данные входа
      saveLoginData(response, loginData.rememberMe);

      // Показываем успешное сообщение
      notification.showSuccess("Вход выполнен успешно! Перенаправляем...");

      // Небольшая задержка для показа сообщения
      setTimeout(() => {
        redirectAfterLogin();
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);

      // Обрабатываем различные типы ошибок
      let errorMessage = "Произошла ошибка при входе в систему";

      if (error.message.includes("Invalid credentials")) {
        errorMessage = "Неверный логин или пароль";
      } else if (error.message.includes("Account locked")) {
        errorMessage = "Аккаунт заблокирован. Обратитесь к администратору";
      } else if (error.message.includes("Email not verified")) {
        errorMessage = "Email не подтвержден. Проверьте почту";
      } else if (error.message.includes("Network")) {
        errorMessage = "Проблемы с подключением. Проверьте интернет";
      }

      notification.showError(errorMessage);
    } finally {
      // Убираем состояние загрузки
      setLoadingState(false);
    }
  });

  // Проверяем, не залогинен ли уже пользователь
  function checkExistingAuth() {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const expiration =
      localStorage.getItem("tokenExpiration") ||
      sessionStorage.getItem("tokenExpiration");

    if (token && expiration && Date.now() < parseInt(expiration)) {
      // Пользователь уже залогинен, перенаправляем
      notification.showInfo("Вы уже вошли в систему");
      setTimeout(() => {
        redirectAfterLogin();
      }, 1000);
    }
  }

  // Проверяем существующую авторизацию при загрузке страницы
  checkExistingAuth();

  // Обработка специальных клавиш
  document.addEventListener("keydown", function (e) {
    // Enter для отправки формы
    if (e.key === "Enter" && e.target.matches(".form-input")) {
      e.preventDefault();
      loginForm.dispatchEvent(new Event("submit"));
    }

    // Escape для закрытия уведомлений
    if (e.key === "Escape") {
      notification.hide();
    }
  });

  // Фокус на первом поле при загрузке
  const firstInput = loginForm.querySelector(".form-input");
  if (firstInput) {
    firstInput.focus();
  }
});
```

## Практические задания

### Задание 1: Создание базовой страницы входа

1. Создайте HTML-файл `login.html` с использованием предоставленной структуры
2. Подключите CSS-стили и убедитесь в корректном отображении
3. Проверьте адаптивность на разных устройствах

### Задание 2: Интеграция валидации

1. Подключите JavaScript-файлы
2. Протестируйте валидацию полей в реальном времени
3. Добавьте дополнительные проверки (например, длина пароля)

### Задание 3: Улучшение UX

1. Добавьте анимации при фокусе на поля
2. Реализуйте плавные переходы для уведомлений
3. Добавьте звуковые уведомления (опционально)

### Задание 4: Тестирование функциональности

1. Протестируйте все валидационные сценарии
2. Проверьте работу с клавиатуры
3. Убедитесь в доступности для скринридеров

## Рекомендации по внедрению

### Безопасность

- Всегда используйте HTTPS для передачи данных входа
- Реализуйте защиту от брутфорс-атак
- Добавьте капчу после нескольких неудачных попыток
- Используйте secure и httpOnly куки для токенов

### Производительность

- Минимизируйте размер CSS и JavaScript файлов
- Используйте lazy loading для неcritical ресурсов
- Оптимизируйте изображения и шрифты
- Кэшируйте статические ресурсы

### Доступность

- Обеспечьте корректную навигацию с клавиатуры
- Используйте семантические HTML теги
- Добавьте ARIA атрибуты где необходимо
- Протестируйте со скринридерами

### Мониторинг

- Отслеживайте успешность входов в систему
- Мониторьте время загрузки страницы
- Анализируйте пользовательские сессии
- Собирайте метрики конверсии

## Заключение

В этом уроке мы создали полнофункциональную страницу входа с современным дизайном, валидацией в реальном времени и удобным пользовательским интерфейсом. Страница включает все необходимые элементы для безопасной и удобной аутентификации пользователей.

Следующие уроки будут посвящены углубленному изучению стилизации форм, продвинутым паттернам валидации и интеграции с backend API.
