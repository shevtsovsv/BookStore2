# Урок 18: Продвинутая стилизация форм авторизации

# Актуальные особенности стилизации и UX

В текущей реализации:

- Все поля формы используют динамические классы `.valid` и `.invalid` для визуальной обратной связи.
- Сообщения об ошибках появляются только при наличии ошибки, скрываются автоматически.
- Блок требований к паролю отображает актуальные правила, синхронизированные с JS-валидацией.
- Все ссылки на регистрацию и вход абсолютные (`/html/register.html`, `/html/login.html`), навигация управляется через JS.
- Валидация и обработка ошибок реализованы через функции `FormUtils.showFieldError` и `FormUtils.clearFormErrors`.
- Меню в header динамически обновляется в зависимости от состояния авторизации.

## Обзор урока

В этом уроке мы углубимся в создание современных, визуально привлекательных и функциональных стилей для форм авторизации. Изучим продвинутые CSS-техники, анимации, микровзаимодействия и создание единообразной дизайн-системы для всех форм аутентификации.

### Цели урока

- Создать продвинутую дизайн-систему для форм авторизации
- Изучить современные CSS-техники и анимации
- Реализовать микровзаимодействия для улучшения UX
- Обеспечить консистентность дизайна во всех формах
- Создать адаптивный и доступный интерфейс

### Компоненты дизайн-системы

- Цветовая палитра и градиенты
- Типографика и иконографика
- Система отступов и размеров
- Анимации и переходы
- Состояния элементов
- Темная и светлая темы

## Часть 1: Расширенная дизайн-система

### 1.1 CSS Custom Properties (переменные)

```css
/* design-system.css - Основа дизайн-системы */

:root {
  /* === ЦВЕТОВАЯ ПАЛИТРА === */

  /* Основные цвета */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Вторичные цвета */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-200: #e2e8f0;
  --secondary-300: #cbd5e1;
  --secondary-400: #94a3b8;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  --secondary-800: #1e293b;
  --secondary-900: #0f172a;

  /* Статусные цвета */
  --success-50: #f0fdf4;
  --success-100: #dcfce7;
  --success-500: #22c55e;
  --success-600: #16a34a;
  --success-700: #15803d;

  --error-50: #fef2f2;
  --error-100: #fee2e2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;

  --warning-50: #fffbeb;
  --warning-100: #fef3c7;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;

  --info-50: #eff6ff;
  --info-100: #dbeafe;
  --info-500: #3b82f6;
  --info-600: #2563eb;
  --info-700: #1d4ed8;

  /* === ГРАДИЕНТЫ === */
  --gradient-primary: linear-gradient(
    135deg,
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  --gradient-secondary: linear-gradient(
    135deg,
    var(--secondary-100) 0%,
    var(--secondary-200) 100%
  );
  --gradient-success: linear-gradient(
    135deg,
    var(--success-500) 0%,
    var(--success-600) 100%
  );
  --gradient-error: linear-gradient(
    135deg,
    var(--error-500) 0%,
    var(--error-600) 100%
  );
  --gradient-glass: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  --gradient-auth: linear-gradient(
    135deg,
    var(--primary-600) 0%,
    var(--primary-700) 50%,
    var(--secondary-800) 100%
  );

  /* === ТЕНИ === */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.3);
  --shadow-auth: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 50px rgba(59, 130, 246, 0.1);

  /* === ТИПОГРАФИКА === */
  --font-sans: "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial,
    sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace;

  /* Размеры шрифтов */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */

  /* Высота строк */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Весы шрифтов */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* === РАЗМЕРЫ И ОТСТУПЫ === */
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */

  /* Радиусы скругления */
  --radius-none: 0;
  --radius-sm: 0.125rem; /* 2px */
  --radius-base: 0.25rem; /* 4px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem; /* 8px */
  --radius-xl: 0.75rem; /* 12px */
  --radius-2xl: 1rem; /* 16px */
  --radius-full: 9999px;

  /* === АНИМАЦИИ === */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;

  /* Функции анимации */
  --ease-linear: cubic-bezier(0, 0, 1, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* === РАЗМЕРЫ ФОРМ === */
  --form-width-sm: 320px;
  --form-width-md: 400px;
  --form-width-lg: 480px;
  --form-width-xl: 560px;

  --input-height-sm: 36px;
  --input-height-md: 44px;
  --input-height-lg: 48px;
  --input-height-xl: 56px;

  /* === Z-INDEX === */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;
}

/* Темная тема */
[data-theme="dark"] {
  --primary-50: #1e293b;
  --primary-100: #334155;
  --primary-500: #60a5fa;
  --primary-600: #3b82f6;
  --primary-700: #2563eb;

  --secondary-50: #0f172a;
  --secondary-100: #1e293b;
  --secondary-200: #334155;
  --secondary-300: #475569;
  --secondary-800: #f1f5f9;
  --secondary-900: #f8fafc;

  --gradient-auth: linear-gradient(
    135deg,
    var(--secondary-800) 0%,
    var(--secondary-900) 50%,
    var(--primary-600) 100%
  );
  --shadow-auth: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2),
    0 0 50px rgba(59, 130, 246, 0.2);
}

/* Высококонтрастная тема */
[data-theme="high-contrast"] {
  --primary-500: #0000ff;
  --primary-600: #0000cc;
  --primary-700: #000099;

  --error-500: #ff0000;
  --error-600: #cc0000;

  --success-500: #008000;
  --success-600: #006600;

  --secondary-200: #000000;
  --secondary-300: #333333;
  --secondary-700: #ffffff;
  --secondary-800: #ffffff;
  --secondary-900: #ffffff;
}
```

### 1.2 Продвинутые стили для форм

```css
/* advanced-auth-forms.css - Продвинутые стили для форм авторизации */

/* === БАЗОВЫЕ СТИЛИ === */

/* Импорт шрифтов */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

/* Сброс и базовые стили */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--secondary-800);
  background-color: var(--secondary-50);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeSpeed;
}

/* === СТРУКТУРА СТРАНИЦЫ === */

.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gradient-auth);
  position: relative;
  overflow-x: hidden;
}

/* Декоративные элементы фона */
.auth-page::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
      circle at 20% 50%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ), radial-gradient(
      circle at 80% 20%,
      rgba(147, 197, 253, 0.1) 0%,
      transparent 50%
    ), radial-gradient(circle at 40% 80%, rgba(219, 234, 254, 0.1) 0%, transparent
        50%);
  animation: backgroundFloat var(--duration-1000) ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes backgroundFloat {
  0% {
    transform: translate(-2%, -2%) rotate(0deg);
  }
  100% {
    transform: translate(2%, 2%) rotate(1deg);
  }
}

/* Заголовок страницы */
.main-header {
  position: relative;
  z-index: var(--z-sticky);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
}

.logo-link {
  transition: transform var(--duration-300) var(--ease-out);
}

.logo-link:hover {
  transform: scale(1.05);
}

.logo {
  display: block;
  max-width: 100%;
  height: auto;
  filter: brightness(1.1) contrast(1.1);
}

/* Навигация */
.main-nav {
  margin-left: auto;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: var(--space-8);
  align-items: center;
}

.nav-menu a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  transition: all var(--duration-200) var(--ease-out);
  position: relative;
}

.nav-menu a:hover,
.nav-menu a.active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.nav-menu a.active::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: white;
  border-radius: var(--radius-full);
}

/* === ОСНОВНАЯ ФОРМА === */

.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  position: relative;
}

.auth-container {
  width: 100%;
  max-width: var(--form-width-lg);
  position: relative;
  animation: slideInUp var(--duration-700) var(--ease-bounce);
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(60px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Стеклянный эффект для контейнера */
.auth-form-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-auth);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  position: relative;
}

.auth-form-wrapper::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
}

/* === ЗАГОЛОВОК ФОРМЫ === */

.auth-header {
  text-align: center;
  padding: var(--space-10) var(--space-8) var(--space-6);
  background: var(--gradient-primary);
  color: white;
  position: relative;
  overflow: hidden;
}

.auth-header::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%
  );
  animation: headerShimmer var(--duration-1000) ease-in-out infinite alternate;
}

@keyframes headerShimmer {
  0% {
    transform: translate(-5%, -5%) scale(1);
  }
  100% {
    transform: translate(5%, 5%) scale(1.05);
  }
}

.auth-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-2);
  letter-spacing: -0.025em;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.auth-subtitle {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  opacity: 0.95;
  position: relative;
  z-index: 1;
}

/* === ОСНОВНАЯ ФОРМА === */

.auth-form {
  padding: var(--space-8);
}

.form-fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

/* === ГРУППЫ ПОЛЕЙ === */

.form-group {
  margin-bottom: var(--space-6);
  position: relative;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

/* Анимация появления группы */
.form-group {
  animation: fadeInUp var(--duration-500) var(--ease-out) both;
}

.form-group:nth-child(2) {
  animation-delay: 100ms;
}
.form-group:nth-child(3) {
  animation-delay: 200ms;
}
.form-group:nth-child(4) {
  animation-delay: 300ms;
}
.form-group:nth-child(5) {
  animation-delay: 400ms;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === ЛЕЙБЛЫ === */

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--secondary-700);
  position: relative;
  user-select: none;
}

.required-asterisk {
  color: var(--error-500);
  margin-left: var(--space-1);
  font-weight: var(--font-bold);
}

/* === ПОЛЯ ВВОДА === */

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  height: var(--input-height-lg);
  padding: 0 var(--space-12) 0 var(--space-4);
  border: 2px solid var(--secondary-200);
  border-radius: var(--radius-xl);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--secondary-800);
  background: white;
  transition: all var(--duration-300) var(--ease-out);
  position: relative;
  z-index: 1;
}

.form-input::placeholder {
  color: var(--secondary-400);
  font-weight: var(--font-normal);
  transition: opacity var(--duration-200) var(--ease-out);
}

/* Состояния инпута */
.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), var(--shadow-lg);
  transform: translateY(-2px);
}

.form-input:focus::placeholder {
  opacity: 0.7;
}

.form-input:valid:not(:placeholder-shown) {
  border-color: var(--success-500);
  background: var(--success-50);
}

.form-input:invalid:not(:placeholder-shown),
.form-input.error {
  border-color: var(--error-500);
  background: var(--error-50);
  animation: shake var(--duration-500) var(--ease-bounce);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-8px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(8px);
  }
}

/* Floating label эффект */
.form-group.floating-label {
  position: relative;
}

.form-group.floating-label .form-label {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  background: white;
  padding: 0 var(--space-2);
  transition: all var(--duration-300) var(--ease-out);
  pointer-events: none;
  z-index: 2;
}

.form-group.floating-label .form-input:focus + .form-label,
.form-group.floating-label .form-input:not(:placeholder-shown) + .form-label {
  top: 0;
  font-size: var(--text-xs);
  color: var(--primary-600);
  transform: translateY(-50%);
}

/* === ИКОНКИ === */

.input-icon {
  position: absolute;
  right: var(--space-4);
  color: var(--secondary-400);
  transition: all var(--duration-300) var(--ease-out);
  pointer-events: none;
  z-index: 2;
}

.form-input:focus ~ .input-icon {
  color: var(--primary-500);
  transform: scale(1.1);
}

.form-input:valid:not(:placeholder-shown) ~ .input-icon {
  color: var(--success-500);
}

.form-input:invalid:not(:placeholder-shown) ~ .input-icon,
.form-input.error ~ .input-icon {
  color: var(--error-500);
}

/* === КНОПКА ПОКАЗА ПАРОЛЯ === */

.password-toggle {
  position: absolute;
  right: var(--space-4);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--secondary-400);
  transition: all var(--duration-200) var(--ease-out);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: var(--primary-500);
  background: rgba(59, 130, 246, 0.1);
  transform: scale(1.1);
}

.password-toggle:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.password-toggle:active {
  transform: scale(0.95);
}

/* === СООБЩЕНИЯ И ПОДСКАЗКИ === */

.form-help {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--secondary-500);
  line-height: var(--leading-relaxed);
}

.error-message {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--error-600);
  font-weight: var(--font-medium);
  opacity: 0;
  transform: translateY(-10px);
  transition: all var(--duration-300) var(--ease-out);
  min-height: 1.2em;
}

.error-message.show {
  opacity: 1;
  transform: translateY(0);
}

.error-message::before {
  content: "⚠ ";
  margin-right: var(--space-1);
}

/* Успешное сообщение */
.success-message {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--success-600);
  font-weight: var(--font-medium);
  opacity: 0;
  transform: translateY(-10px);
  transition: all var(--duration-300) var(--ease-out);
}

.success-message.show {
  opacity: 1;
  transform: translateY(0);
}

.success-message::before {
  content: "✓ ";
  margin-right: var(--space-1);
}

/* === ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ === */

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: var(--space-6) 0;
  flex-wrap: wrap;
  gap: var(--space-4);
}

/* Пользовательский чекбокс */
.checkbox-group {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: all var(--duration-200) var(--ease-out);
}

.checkbox-group:hover {
  transform: translateX(2px);
}

.form-checkbox {
  position: relative;
  width: 20px;
  height: 20px;
  margin-right: var(--space-3);
  appearance: none;
  border: 2px solid var(--secondary-300);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-out);
  background: white;
}

.form-checkbox:checked {
  background: var(--primary-500);
  border-color: var(--primary-500);
  transform: scale(1.05);
}

.form-checkbox:checked::before {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.form-checkbox:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.checkbox-label {
  font-size: var(--text-sm);
  color: var(--secondary-700);
  font-weight: var(--font-medium);
  cursor: pointer;
}

/* Ссылка "Забыли пароль?" */
.forgot-password-link {
  font-size: var(--text-sm);
  color: var(--primary-600);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: all var(--duration-200) var(--ease-out);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  position: relative;
}

.forgot-password-link:hover {
  color: var(--primary-700);
  background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px);
}

.forgot-password-link:active {
  transform: translateY(0);
}

/* === КНОПКИ === */

.auth-button {
  width: 100%;
  height: var(--input-height-xl);
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-xl);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--duration-300) var(--ease-out);
  position: relative;
  overflow: hidden;
  margin: var(--space-6) 0;
  box-shadow: var(--shadow-md);
}

.auth-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  transition: left var(--duration-700) var(--ease-out);
}

.auth-button:hover::before {
  left: 100%;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.auth-button:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--shadow-sm);
}

.button-text {
  transition: opacity var(--duration-200) var(--ease-out);
  position: relative;
  z-index: 1;
}

.button-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  position: relative;
  z-index: 1;
}

/* === СПИННЕР ЗАГРУЗКИ === */

.spinner {
  animation: spin var(--duration-1000) linear infinite;
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

### 1.3 Стили для уведомлений

```css
/* notifications.css - Продвинутые стили для уведомлений */

/* === СИСТЕМА УВЕДОМЛЕНИЙ === */

.notification {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  max-width: 400px;
  min-width: 300px;
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  transform: translateX(100%);
  transition: all var(--duration-500) var(--ease-bounce);
  z-index: var(--z-toast);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification.show {
  transform: translateX(0);
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.notification-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.notification-message {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-relaxed);
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-base);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  line-height: 1;
  transition: all var(--duration-200) var(--ease-out);
  margin-left: var(--space-2);
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

/* Типы уведомлений */
.notification.success {
  background: var(--gradient-success);
  color: white;
}

.notification.error {
  background: var(--gradient-error);
  color: white;
}

.notification.warning {
  background: linear-gradient(
    135deg,
    var(--warning-500) 0%,
    var(--warning-600) 100%
  );
  color: white;
}

.notification.info {
  background: var(--gradient-primary);
  color: white;
}

/* Анимация появления с bounce */
.notification.show {
  animation: slideInBounce var(--duration-700) var(--ease-bounce);
}

@keyframes slideInBounce {
  0% {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateX(-10px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* Прогресс-бар для автоскрытия */
.notification::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  width: 100%;
  transform-origin: left;
  animation: progressBar 5s linear;
}

@keyframes progressBar {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

/* Стекинг уведомлений */
.notification:nth-child(2) {
  top: calc(var(--space-6) + 80px);
  transform: translateX(100%) scale(0.95);
}

.notification:nth-child(3) {
  top: calc(var(--space-6) + 160px);
  transform: translateX(100%) scale(0.9);
}

.notification.show:nth-child(2) {
  transform: translateX(0) scale(0.95);
}

.notification.show:nth-child(3) {
  transform: translateX(0) scale(0.9);
}
```

## Часть 2: Микровзаимодействия и анимации

### 2.1 Продвинутые анимации для форм

```css
/* micro-interactions.css - Микровзаимодействия */

/* === HOVER-ЭФФЕКТЫ === */

/* Анимация при наведении на форму */
.auth-form-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-2xl), 0 0 60px rgba(59, 130, 246, 0.15);
  transition: all var(--duration-500) var(--ease-out);
}

/* Эффект пульсации для кнопки */
.auth-button {
  position: relative;
}

.auth-button::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0);
  transition: transform var(--duration-300) var(--ease-out);
}

.auth-button:active::after {
  transform: scale(1);
  transition: transform 0s;
}

/* Ripple эффект */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width var(--duration-300) var(--ease-out), height var(
        --duration-300
      ) var(--ease-out);
}

.ripple:active::before {
  width: 300px;
  height: 300px;
}

/* === АНИМАЦИИ ФОКУСА === */

/* Светящаяся рамка при фокусе */
@keyframes glow {
  0% {
    box-shadow: 0 0 5px var(--primary-500);
  }
  50% {
    box-shadow: 0 0 20px var(--primary-500), 0 0 30px var(--primary-300);
  }
  100% {
    box-shadow: 0 0 5px var(--primary-500);
  }
}

.form-input:focus {
  animation: glow 2s ease-in-out infinite;
}

/* Анимация печатания */
@keyframes typing {
  0% {
    border-right: 2px solid transparent;
  }
  50% {
    border-right: 2px solid var(--primary-500);
  }
  100% {
    border-right: 2px solid transparent;
  }
}

.form-input:focus {
  animation: typing 1s ease-in-out infinite;
}

/* === СОСТОЯНИЯ ВАЛИДАЦИИ === */

/* Успешная валидация */
@keyframes successPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.form-input:valid:not(:placeholder-shown) {
  animation: successPulse 1s ease-out;
}

/* Ошибка валидации */
@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}

.form-input.error {
  animation: errorShake var(--duration-500) var(--ease-out);
}

/* === LOADING АНИМАЦИИ === */

/* Скелетон-загрузка */
@keyframes skeleton {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--secondary-200) 25%,
    var(--secondary-100) 50%,
    var(--secondary-200) 75%
  );
  background-size: 200px 100%;
  animation: skeleton 1.5s infinite linear;
}

/* Пульсирующая загрузка */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* === ПЕРЕХОДЫ МЕЖДУ СОСТОЯНИЯМИ === */

/* Плавное появление элементов */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn var(--duration-500) var(--ease-out) forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Масштабирование при появлении */
.scale-in {
  opacity: 0;
  transform: scale(0.9);
  animation: scaleIn var(--duration-300) var(--ease-bounce) forwards;
}

@keyframes scaleIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Слайд справа */
.slide-in-right {
  opacity: 0;
  transform: translateX(100px);
  animation: slideInRight var(--duration-500) var(--ease-out) forwards;
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* === HOVER СОСТОЯНИЯ === */

/* Эффект поднятия для карточек */
.lift-on-hover {
  transition: all var(--duration-300) var(--ease-out);
}

.lift-on-hover:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-2xl);
}

/* Эффект свечения */
.glow-on-hover {
  transition: all var(--duration-300) var(--ease-out);
}

.glow-on-hover:hover {
  box-shadow: var(--shadow-xl), 0 0 30px rgba(59, 130, 246, 0.3);
}

/* === СПЕЦИАЛЬНЫЕ ЭФФЕКТЫ === */

/* Эффект печатной машинки для заголовков */
.typewriter {
  overflow: hidden;
  border-right: 2px solid var(--primary-500);
  white-space: nowrap;
  animation: typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: var(--primary-500);
  }
}

/* Параллакс эффект для фона */
.parallax-bg {
  transform: translateZ(0);
  animation: parallax 20s ease-in-out infinite;
}

@keyframes parallax {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}
```

### 2.2 Адаптивные стили и медиа-запросы

```css
/* responsive.css - Адаптивные стили */

/* === МОБИЛЬНЫЕ УСТРОЙСТВА === */

@media (max-width: 480px) {
  .auth-main {
    padding: var(--space-4);
    align-items: stretch;
  }

  .auth-container {
    max-width: 100%;
    margin: 0;
  }

  .auth-form-wrapper {
    border-radius: var(--radius-xl);
    margin: var(--space-2) 0;
  }

  .auth-header {
    padding: var(--space-6) var(--space-4) var(--space-4);
  }

  .auth-title {
    font-size: var(--text-2xl);
  }

  .auth-subtitle {
    font-size: var(--text-sm);
  }

  .auth-form {
    padding: var(--space-6) var(--space-4);
  }

  .form-input {
    height: var(--input-height-md);
    font-size: 16px; /* Предотвращает зум на iOS */
    padding: 0 var(--space-10) 0 var(--space-3);
  }

  .auth-button {
    height: var(--input-height-md);
    font-size: var(--text-base);
  }

  .form-options {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .checkbox-group {
    justify-content: center;
  }

  .forgot-password-link {
    text-align: center;
  }

  /* Стекинг уведомлений на мобильных */
  .notification {
    left: var(--space-4);
    right: var(--space-4);
    max-width: none;
    min-width: auto;
    top: var(--space-4);
  }

  .notification:nth-child(2) {
    top: calc(var(--space-4) + 70px);
  }

  .notification:nth-child(3) {
    top: calc(var(--space-4) + 140px);
  }
}

/* === ПЛАНШЕТЫ === */

@media (min-width: 481px) and (max-width: 768px) {
  .auth-main {
    padding: var(--space-6);
  }

  .auth-container {
    max-width: var(--form-width-md);
  }

  .auth-header {
    padding: var(--space-8) var(--space-6) var(--space-5);
  }

  .auth-form {
    padding: var(--space-6);
  }

  .nav-menu {
    gap: var(--space-4);
  }

  .nav-menu a {
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-3);
  }
}

/* === НОУТБУКИ === */

@media (min-width: 769px) and (max-width: 1024px) {
  .auth-container {
    max-width: var(--form-width-lg);
  }

  .header-content {
    padding: var(--space-4) var(--space-8);
  }
}

/* === БОЛЬШИЕ ЭКРАНЫ === */

@media (min-width: 1025px) {
  .auth-container {
    max-width: var(--form-width-xl);
  }

  .auth-form {
    padding: var(--space-10);
  }

  .auth-header {
    padding: var(--space-12) var(--space-10) var(--space-8);
  }

  .auth-title {
    font-size: var(--text-4xl);
  }

  .form-input {
    height: var(--input-height-xl);
    padding: 0 var(--space-16) 0 var(--space-5);
  }

  .auth-button {
    height: var(--input-height-xl);
    font-size: var(--text-xl);
  }
}

/* === ЛАНДШАФТНАЯ ОРИЕНТАЦИЯ === */

@media (orientation: landscape) and (max-height: 600px) {
  .auth-page {
    min-height: 100vh;
  }

  .auth-main {
    padding: var(--space-4) var(--space-8);
  }

  .auth-header {
    padding: var(--space-4) var(--space-6) var(--space-3);
  }

  .auth-title {
    font-size: var(--text-xl);
  }

  .auth-subtitle {
    font-size: var(--text-sm);
    margin-bottom: 0;
  }

  .auth-form {
    padding: var(--space-4) var(--space-6);
  }

  .form-group {
    margin-bottom: var(--space-4);
  }
}

/* === ВЫСОКИЕ ЭКРАНЫ === */

@media (min-height: 900px) {
  .auth-main {
    padding: var(--space-16) var(--space-8);
  }

  .auth-container {
    animation-delay: 0.2s;
  }
}

/* === ПЕЧАТЬ === */

@media print {
  .auth-page {
    background: white !important;
  }

  .auth-main {
    background: none !important;
  }

  .auth-form-wrapper {
    box-shadow: none !important;
    border: 2px solid #000 !important;
    background: white !important;
  }

  .auth-header {
    background: white !important;
    color: #000 !important;
    border-bottom: 2px solid #000;
  }

  .social-login,
  .auth-alternatives {
    display: none !important;
  }

  .notification {
    display: none !important;
  }

  .auth-button {
    background: white !important;
    color: #000 !important;
    border: 2px solid #000 !important;
  }
}

/* === PREFERENCES-BASED АДАПТАЦИЯ === */

/* Уменьшенная анимация */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .auth-container {
    animation: none !important;
  }

  .form-group {
    animation: none !important;
  }

  .auth-page::before {
    animation: none !important;
  }
}

/* Высокий контраст */
@media (prefers-contrast: high) {
  :root {
    --primary-500: #0000ff;
    --error-500: #ff0000;
    --success-500: #008000;
    --secondary-200: #000000;
    --secondary-800: #ffffff;
  }

  .form-input {
    border-width: 3px !important;
  }

  .auth-button {
    border: 3px solid transparent !important;
  }

  .error-message,
  .success-message {
    font-weight: var(--font-bold) !important;
  }
}

/* Темная тема */
@media (prefers-color-scheme: dark) {
  .auth-form-wrapper {
    background: rgba(30, 41, 59, 0.95) !important;
    border-color: rgba(71, 85, 105, 0.3) !important;
  }

  .form-input {
    background: var(--secondary-700) !important;
    color: var(--secondary-100) !important;
    border-color: var(--secondary-600) !important;
  }

  .form-input::placeholder {
    color: var(--secondary-400) !important;
  }

  .form-label {
    color: var(--secondary-200) !important;
  }

  .auth-footer {
    background: var(--secondary-700) !important;
    border-color: var(--secondary-600) !important;
  }

  .social-button {
    background: var(--secondary-700) !important;
    color: var(--secondary-100) !important;
    border-color: var(--secondary-600) !important;
  }
}
```

## Практические задания

### Задание 1: Создание тематической системы

1. Реализуйте переключатель темы (светлая/темная/высокий контраст)
2. Создайте цветовые схемы для различных брендов
3. Добавьте поддержку RTL языков

### Задание 2: Продвинутые анимации

1. Создайте анимацию последовательного появления полей формы
2. Добавьте микровзаимодействия при успешной отправке формы
3. Реализуйте parallax эффект для фона

### Задание 3: Адаптивность и доступность

1. Протестируйте формы на различных устройствах
2. Убедитесь в корректной работе со скринридерами
3. Добавьте поддержку навигации с клавиатуры

### Задание 4: Производительность

1. Оптимизируйте CSS для критического пути рендеринга
2. Реализуйте lazy loading для некритических стилей
3. Минимизируйте reflow и repaint операции

## Заключение

В этом уроке мы создали продвинутую дизайн-систему для форм авторизации, включающую современные CSS-техники, анимации и микровзаимодействия. Система обеспечивает консистентность дизайна, отличную производительность и высокую доступность.

В следующем уроке мы рассмотрим продвинутые паттерны валидации пользовательского ввода и улучшение пользовательского опыта.
