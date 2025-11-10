# 🎨 CSS стилизация и дизайн

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 4-5 часов  
> **Предварительные требования:** Завершение части 10

## 🎯 Цели этой части

В этой части вы создадите современные CSS стили для:

- Адаптивной сетки и компонентов
- Темной и светлой темы
- Анимаций и переходов
- Мобильной адаптации
- Компонентной архитектуры стилей

---

## 📁 Структура CSS файлов

### 1. Основной файл стилей

Создайте файл `public/style/main.css`:

```css
/* ===================================
   ОСНОВНЫЕ СТИЛИ И ПЕРЕМЕННЫЕ
   =================================== */

:root {
  /* Цветовая палитра */
  --primary-color: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #06b6d4;

  /* Нейтральные цвета */
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --black: #000000;

  /* Фоновые цвета */
  --bg-primary: var(--white);
  --bg-secondary: var(--gray-50);
  --bg-tertiary: var(--gray-100);
  --bg-dark: var(--gray-900);

  /* Текстовые цвета */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-muted: var(--gray-500);
  --text-inverse: var(--white);

  /* Границы */
  --border-color: var(--gray-200);
  --border-color-hover: var(--gray-300);
  --border-radius: 8px;
  --border-radius-sm: 4px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* Тени */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 /
          0.1);

  /* Типографика */
  --font-family-base: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  --font-family-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono",
    Consolas, monospace;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* Размеры и отступы */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  --spacing-24: 6rem;

  /* Размеры контейнеров */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;

  /* Переходы */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;

  /* Z-индексы */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* Темная тема */
[data-theme="dark"] {
  --bg-primary: var(--gray-900);
  --bg-secondary: var(--gray-800);
  --bg-tertiary: var(--gray-700);
  --bg-dark: var(--gray-50);

  --text-primary: var(--gray-100);
  --text-secondary: var(--gray-300);
  --text-muted: var(--gray-400);
  --text-inverse: var(--gray-900);

  --border-color: var(--gray-700);
  --border-color-hover: var(--gray-600);
}

/* ===================================
   БАЗОВЫЕ СТИЛИ
   =================================== */

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

/* Сброс стилей */
h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
}

h1 {
  font-size: var(--font-size-4xl);
}
h2 {
  font-size: var(--font-size-3xl);
}
h3 {
  font-size: var(--font-size-2xl);
}
h4 {
  font-size: var(--font-size-xl);
}
h5 {
  font-size: var(--font-size-lg);
}
h6 {
  font-size: var(--font-size-base);
}

p {
  margin: 0 0 var(--spacing-4) 0;
  color: var(--text-secondary);
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

ul,
ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

button {
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
}

input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
  border: none;
  outline: none;
}

/* ===================================
   УТИЛИТАРНЫЕ КЛАССЫ
   =================================== */

/* Отображение */
.hidden {
  display: none !important;
}
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.grid {
  display: grid;
}

/* Flex утилиты */
.flex-col {
  flex-direction: column;
}
.flex-row {
  flex-direction: row;
}
.flex-wrap {
  flex-wrap: wrap;
}
.flex-nowrap {
  flex-wrap: nowrap;
}

.items-start {
  align-items: flex-start;
}
.items-center {
  align-items: center;
}
.items-end {
  align-items: flex-end;
}
.items-stretch {
  align-items: stretch;
}

.justify-start {
  justify-content: flex-start;
}
.justify-center {
  justify-content: center;
}
.justify-end {
  justify-content: flex-end;
}
.justify-between {
  justify-content: space-between;
}
.justify-around {
  justify-content: space-around;
}

.flex-1 {
  flex: 1;
}
.flex-auto {
  flex: auto;
}
.flex-none {
  flex: none;
}

/* Отступы */
.m-0 {
  margin: 0;
}
.m-1 {
  margin: var(--spacing-1);
}
.m-2 {
  margin: var(--spacing-2);
}
.m-3 {
  margin: var(--spacing-3);
}
.m-4 {
  margin: var(--spacing-4);
}
.m-6 {
  margin: var(--spacing-6);
}
.m-8 {
  margin: var(--spacing-8);
}

.mt-0 {
  margin-top: 0;
}
.mt-1 {
  margin-top: var(--spacing-1);
}
.mt-2 {
  margin-top: var(--spacing-2);
}
.mt-3 {
  margin-top: var(--spacing-3);
}
.mt-4 {
  margin-top: var(--spacing-4);
}
.mt-6 {
  margin-top: var(--spacing-6);
}
.mt-8 {
  margin-top: var(--spacing-8);
}

.mb-0 {
  margin-bottom: 0;
}
.mb-1 {
  margin-bottom: var(--spacing-1);
}
.mb-2 {
  margin-bottom: var(--spacing-2);
}
.mb-3 {
  margin-bottom: var(--spacing-3);
}
.mb-4 {
  margin-bottom: var(--spacing-4);
}
.mb-6 {
  margin-bottom: var(--spacing-6);
}
.mb-8 {
  margin-bottom: var(--spacing-8);
}

.ml-0 {
  margin-left: 0;
}
.ml-1 {
  margin-left: var(--spacing-1);
}
.ml-2 {
  margin-left: var(--spacing-2);
}
.ml-3 {
  margin-left: var(--spacing-3);
}
.ml-4 {
  margin-left: var(--spacing-4);
}

.mr-0 {
  margin-right: 0;
}
.mr-1 {
  margin-right: var(--spacing-1);
}
.mr-2 {
  margin-right: var(--spacing-2);
}
.mr-3 {
  margin-right: var(--spacing-3);
}
.mr-4 {
  margin-right: var(--spacing-4);
}

.p-0 {
  padding: 0;
}
.p-1 {
  padding: var(--spacing-1);
}
.p-2 {
  padding: var(--spacing-2);
}
.p-3 {
  padding: var(--spacing-3);
}
.p-4 {
  padding: var(--spacing-4);
}
.p-6 {
  padding: var(--spacing-6);
}
.p-8 {
  padding: var(--spacing-8);
}

.px-0 {
  padding-left: 0;
  padding-right: 0;
}
.px-1 {
  padding-left: var(--spacing-1);
  padding-right: var(--spacing-1);
}
.px-2 {
  padding-left: var(--spacing-2);
  padding-right: var(--spacing-2);
}
.px-3 {
  padding-left: var(--spacing-3);
  padding-right: var(--spacing-3);
}
.px-4 {
  padding-left: var(--spacing-4);
  padding-right: var(--spacing-4);
}
.px-6 {
  padding-left: var(--spacing-6);
  padding-right: var(--spacing-6);
}
.px-8 {
  padding-left: var(--spacing-8);
  padding-right: var(--spacing-8);
}

.py-0 {
  padding-top: 0;
  padding-bottom: 0;
}
.py-1 {
  padding-top: var(--spacing-1);
  padding-bottom: var(--spacing-1);
}
.py-2 {
  padding-top: var(--spacing-2);
  padding-bottom: var(--spacing-2);
}
.py-3 {
  padding-top: var(--spacing-3);
  padding-bottom: var(--spacing-3);
}
.py-4 {
  padding-top: var(--spacing-4);
  padding-bottom: var(--spacing-4);
}
.py-6 {
  padding-top: var(--spacing-6);
  padding-bottom: var(--spacing-6);
}
.py-8 {
  padding-top: var(--spacing-8);
  padding-bottom: var(--spacing-8);
}

/* Текст */
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.text-justify {
  text-align: justify;
}

.text-xs {
  font-size: var(--font-size-xs);
}
.text-sm {
  font-size: var(--font-size-sm);
}
.text-base {
  font-size: var(--font-size-base);
}
.text-lg {
  font-size: var(--font-size-lg);
}
.text-xl {
  font-size: var(--font-size-xl);
}
.text-2xl {
  font-size: var(--font-size-2xl);
}
.text-3xl {
  font-size: var(--font-size-3xl);
}

.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.text-primary {
  color: var(--text-primary);
}
.text-secondary {
  color: var(--text-secondary);
}
.text-muted {
  color: var(--text-muted);
}
.text-white {
  color: var(--white);
}
.text-blue {
  color: var(--primary-color);
}
.text-green {
  color: var(--success-color);
}
.text-yellow {
  color: var(--warning-color);
}
.text-red {
  color: var(--danger-color);
}

/* Фон */
.bg-white {
  background-color: var(--white);
}
.bg-gray-50 {
  background-color: var(--gray-50);
}
.bg-gray-100 {
  background-color: var(--gray-100);
}
.bg-gray-200 {
  background-color: var(--gray-200);
}
.bg-primary {
  background-color: var(--primary-color);
}
.bg-success {
  background-color: var(--success-color);
}
.bg-warning {
  background-color: var(--warning-color);
}
.bg-danger {
  background-color: var(--danger-color);
}

/* Границы */
.border {
  border: 1px solid var(--border-color);
}
.border-t {
  border-top: 1px solid var(--border-color);
}
.border-b {
  border-bottom: 1px solid var(--border-color);
}
.border-l {
  border-left: 1px solid var(--border-color);
}
.border-r {
  border-right: 1px solid var(--border-color);
}

.rounded {
  border-radius: var(--border-radius);
}
.rounded-sm {
  border-radius: var(--border-radius-sm);
}
.rounded-lg {
  border-radius: var(--border-radius-lg);
}
.rounded-xl {
  border-radius: var(--border-radius-xl);
}
.rounded-full {
  border-radius: 9999px;
}

/* Тени */
.shadow-sm {
  box-shadow: var(--shadow-sm);
}
.shadow {
  box-shadow: var(--shadow);
}
.shadow-md {
  box-shadow: var(--shadow-md);
}
.shadow-lg {
  box-shadow: var(--shadow-lg);
}
.shadow-xl {
  box-shadow: var(--shadow-xl);
}

/* Позиционирование */
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.fixed {
  position: fixed;
}
.sticky {
  position: sticky;
}

.top-0 {
  top: 0;
}
.right-0 {
  right: 0;
}
.bottom-0 {
  bottom: 0;
}
.left-0 {
  left: 0;
}

.z-10 {
  z-index: 10;
}
.z-20 {
  z-index: 20;
}
.z-30 {
  z-index: 30;
}
.z-40 {
  z-index: 40;
}
.z-50 {
  z-index: 50;
}

/* Переполнение */
.overflow-hidden {
  overflow: hidden;
}
.overflow-auto {
  overflow: auto;
}
.overflow-scroll {
  overflow: scroll;
}

/* Видимость */
.opacity-0 {
  opacity: 0;
}
.opacity-25 {
  opacity: 0.25;
}
.opacity-50 {
  opacity: 0.5;
}
.opacity-75 {
  opacity: 0.75;
}
.opacity-100 {
  opacity: 1;
}

/* Ширина и высота */
.w-full {
  width: 100%;
}
.h-full {
  height: 100%;
}
.min-h-screen {
  min-height: 100vh;
}

/* ===================================
   КОНТЕЙНЕР И СЕТКА
   =================================== */

.container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

@media (min-width: 640px) {
  .container {
    padding: 0 var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 var(--spacing-8);
  }
}

/* Сетка */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.grid-cols-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.gap-1 {
  gap: var(--spacing-1);
}
.gap-2 {
  gap: var(--spacing-2);
}
.gap-3 {
  gap: var(--spacing-3);
}
.gap-4 {
  gap: var(--spacing-4);
}
.gap-6 {
  gap: var(--spacing-6);
}
.gap-8 {
  gap: var(--spacing-8);
}

/* ===================================
   АНИМАЦИИ И ПЕРЕХОДЫ
   =================================== */

.transition {
  transition: all var(--transition-normal);
}

.transition-colors {
  transition: color var(--transition-fast), background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.transition-transform {
  transition: transform var(--transition-normal);
}

.transition-opacity {
  transition: opacity var(--transition-normal);
}

.duration-150 {
  transition-duration: 150ms;
}
.duration-200 {
  transition-duration: 200ms;
}
.duration-300 {
  transition-duration: 300ms;
}
.duration-500 {
  transition-duration: 500ms;
}

.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}
.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Трансформации */
.scale-95 {
  transform: scale(0.95);
}
.scale-100 {
  transform: scale(1);
}
.scale-105 {
  transform: scale(1.05);
}
.scale-110 {
  transform: scale(1.1);
}

.rotate-45 {
  transform: rotate(45deg);
}
.rotate-90 {
  transform: rotate(90deg);
}
.rotate-180 {
  transform: rotate(180deg);
}

.translate-x-full {
  transform: translateX(100%);
}
.translate-y-full {
  transform: translateY(100%);
}
.-translate-x-full {
  transform: translateX(-100%);
}
.-translate-y-full {
  transform: translateY(-100%);
}

/* Keyframes анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}

/* Классы анимаций */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}
.animate-fade-in-down {
  animation: fadeInDown 0.4s ease-out;
}
.animate-slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}
.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.animate-bounce {
  animation: bounce 1s infinite;
}

/* ===================================
   СОСТОЯНИЯ HOVER И FOCUS
   =================================== */

.hover\:scale-105:hover {
  transform: scale(1.05);
}
.hover\:scale-110:hover {
  transform: scale(1.1);
}
.hover\:shadow-lg:hover {
  box-shadow: var(--shadow-lg);
}
.hover\:shadow-xl:hover {
  box-shadow: var(--shadow-xl);
}

.hover\:bg-primary:hover {
  background-color: var(--primary-color);
}
.hover\:bg-primary-dark:hover {
  background-color: var(--primary-dark);
}
.hover\:text-primary:hover {
  color: var(--primary-color);
}
.hover\:text-white:hover {
  color: var(--white);
}

.focus\:outline-none:focus {
  outline: none;
}
.focus\:ring-2:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-color);
}
.focus\:ring-offset-2:focus {
  box-shadow: 0 0 0 2px var(--white), 0 0 0 4px var(--primary-color);
}

/* ===================================
   АДАПТИВНОСТЬ
   =================================== */

/* Скрытие на разных размерах экрана */
.sm\:hidden {
  display: none;
}
.md\:hidden {
  display: none;
}
.lg\:hidden {
  display: none;
}
.xl\:hidden {
  display: none;
}

@media (min-width: 640px) {
  .sm\:block {
    display: block;
  }
  .sm\:hidden {
    display: none;
  }
  .sm\:flex {
    display: flex;
  }
  .sm\:grid {
    display: grid;
  }
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sm\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .md\:block {
    display: block;
  }
  .md\:hidden {
    display: none;
  }
  .md\:flex {
    display: flex;
  }
  .md\:grid {
    display: grid;
  }
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:block {
    display: block;
  }
  .lg\:hidden {
    display: none;
  }
  .lg\:flex {
    display: flex;
  }
  .lg\:grid {
    display: grid;
  }
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .lg\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .lg\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .xl\:block {
    display: block;
  }
  .xl\:hidden {
    display: none;
  }
  .xl\:flex {
    display: flex;
  }
  .xl\:grid {
    display: grid;
  }
  .xl\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .xl\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .xl\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

/* ===================================
   ПРОКРУТКА
   =================================== */

.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* ===================================
   ВЫДЕЛЕНИЕ ТЕКСТА
   =================================== */

::selection {
  background-color: var(--primary-color);
  color: var(--white);
}

::-moz-selection {
  background-color: var(--primary-color);
  color: var(--white);
}

/* ===================================
   ДОСТУПНОСТЬ
   =================================== */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Уменьшение движения для пользователей с вестибулярными нарушениями */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Высокий контраст */
@media (prefers-contrast: high) {
  :root {
    --border-color: var(--black);
    --text-secondary: var(--black);
  }
}

/* ===================================
   ПРИНТ СТИЛИ
   =================================== */

@media print {
  *,
  *::before,
  *::after {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  a,
  a:visited {
    text-decoration: underline;
  }

  a[href]::after {
    content: " (" attr(href) ")";
  }

  abbr[title]::after {
    content: " (" attr(title) ")";
  }

  pre {
    white-space: pre-wrap !important;
  }

  pre,
  blockquote {
    border: 1px solid #999;
    page-break-inside: avoid;
  }

  thead {
    display: table-header-group;
  }

  tr,
  img {
    page-break-inside: avoid;
  }

  p,
  h2,
  h3 {
    orphans: 3;
    widows: 3;
  }

  h2,
  h3 {
    page-break-after: avoid;
  }
}
```

---

## 📋 Задания для самопроверки

1. **Создайте дополнительные цветовые темы** (например, сепия, высокий контраст)
2. **Добавьте кастомные CSS свойства** для анимаций
3. **Реализуйте систему модульных стилей** с BEM методологией
4. **Оптимизируйте CSS** для критического пути рендеринга

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Современная CSS архитектура  
✅ Адаптивный дизайн  
✅ Темная и светлая темы  
✅ Плавные анимации и переходы

**Следующий шаг:** [12_JAVASCRIPT_FUNCTIONALITY.md](12_JAVASCRIPT_FUNCTIONALITY.md) - создание интерактивного JavaScript функционала.

---

_Время выполнения: ~4-5 часов_  
_Сложность: 🟡 Средняя_
