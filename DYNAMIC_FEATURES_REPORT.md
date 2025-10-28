# 📋 Отчет: Реализация динамических эффектов и интерактивных форм

## 🎯 Требования лабораторной работы

**1. Динамические эффекты и переходы по элементам при помощи скриптов**  
**2. Не менее двух интерактивных форм (авторизация, покупка товара и т.д.)**

---

## ✅ 1. ДИНАМИЧЕСКИЕ ЭФФЕКТЫ И ПЕРЕХОДЫ

### 🎬 Реализованные анимации и эффекты:

#### 1.1 Анимации загрузки карточек книг

**Файл:** `public/scripts/catalog.js`

```javascript
// Анимация появления карточек с задержкой
bookCard.style.animationDelay = `${index * 0.1}s`;
```

- **Эффект:** Поочередное появление карточек книг с интервалом 0.1 сек
- **Местоположение:** Страница каталога книг
- **Технология:** CSS animations + JavaScript timing

#### 1.2 Динамическое модальное окно с анимацией

**Файл:** `public/scripts/book-details.js`

```javascript
// Анимация появления модального окна
function showPublisherModal() {
  publisherModal.style.display = "flex";
  // Trigger animation
  setTimeout(() => {
    publisherModal.classList.add("show");
  }, 10);
}
```

- **Эффект:** Плавное появление и исчезновение модального окна с информацией об издательстве
- **Интерактивность:** Закрытие по клику вне окна или на крестик
- **Технология:** CSS transitions + DOM manipulation

#### 1.3 Динамическое обновление навигации

**Файл:** `public/scripts/auth-utils.js`

```javascript
// Автоматическое изменение навигации при авторизации
updateNavigation() {
    const isAuth = this.isAuthenticated();
    // Динамическое изменение текста и функций ссылок
    if (isAuth) {
        registerLink.textContent = user.firstName;
        loginLink.textContent = "Выход";
    }
}
```

- **Эффект:** Автоматическое изменение меню при входе/выходе пользователя
- **Интерактивность:** Появление выпадающего меню пользователя
- **Событие:** Триггерится при успешной авторизации

#### 1.4 Интерактивные переходы по элементам

**Файл:** `public/scripts/catalog.js`

```javascript
// Клик по карточке книги
<div class="book-card" onclick="window.location.href='book-detail.html?id=${book.id}'">

// Пагинация с динамическими переходами
onclick="goToPage(${i})"
```

- **Эффект:** Плавные переходы между страницами каталога
- **Интерактивность:** Клик по карточкам, кнопкам пагинации
- **Технология:** Event handling + URL manipulation

#### 1.5 Состояния загрузки с анимацией

**Файл:** `public/scripts/auth-utils.js`

```javascript
// Анимированные состояния кнопок
setButtonLoading(buttonId, loading = true) {
    if (loading) {
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'flex';
    }
}
```

- **Эффект:** Индикаторы загрузки с анимацией
- **Местоположение:** Формы авторизации, регистрации, корзины
- **Технология:** CSS keyframes + DOM manipulation

---

## ✅ 2. ИНТЕРАКТИВНЫЕ ФОРМЫ

### 📝 Форма 1: Система авторизации (2 формы)

#### 2.1 Форма регистрации

**Файл:** `public/html/register.html` + `public/scripts/register.js`

**HTML структура:**

```html
<form id="registerForm" class="form-box">
  <div class="form-row">
    <div class="form-group">
      <label for="firstName">Имя</label>
      <input type="text" id="firstName" name="firstName" required />
    </div>
    <div class="form-group">
      <label for="lastName">Фамилия</label>
      <input type="text" id="lastName" name="lastName" required />
    </div>
  </div>
  <!-- Email, Username, Password, Confirm Password -->
</form>
```

**JavaScript функциональность:**

```javascript
// Валидация в реальном времени
emailField.addEventListener("blur", validateEmailField);
passwordField.addEventListener("input", validatePasswordField);
confirmPasswordField.addEventListener("input", validateConfirmPasswordField);

// API интеграция
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(userData),
});
```

**Интерактивные возможности:**

- ✅ **Валидация в реальном времени** - проверка полей при вводе
- ✅ **Визуальная обратная связь** - подсветка ошибок, состояния загрузки
- ✅ **API интеграция** - отправка данных на сервер
- ✅ **Автоматические переходы** - перенаправление после регистрации
- ✅ **Уведомления** - сообщения об успехе/ошибках

#### 2.2 Форма входа в систему

**Файл:** `public/html/login.html` + `public/scripts/login.js`

**HTML структура:**

```html
<form id="loginForm" class="form-box">
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required />
  </div>
  <div class="form-group">
    <label for="password">Пароль</label>
    <input type="password" id="password" name="password" required />
  </div>
  <div class="form-group checkbox-group">
    <input type="checkbox" id="remember" name="remember" />
    <label for="remember">Запомнить меня</label>
  </div>
</form>
```

**Интерактивные возможности:**

- ✅ **Сохранение сессии** - опция "запомнить меня"
- ✅ **Восстановление URL** - возврат на исходную страницу
- ✅ **JWT токены** - безопасная авторизация
- ✅ **Динамическое обновление UI** - изменение навигации

### 🛒 Форма 2: Система корзины покупок

#### 2.3 Добавление товара в корзину

**Файл:** `public/scripts/book-details.js`

**HTML элементы:**

```html
<button id="add-to-cart-btn" class="btn btn-primary">Добавить в корзину</button>
```

**JavaScript функциональность:**

```javascript
// Добавление в корзину с проверкой авторизации
async function addToCart() {
  if (!Auth.isAuthenticated()) {
    showError("Для добавления в корзину необходимо войти в систему");
    return;
  }

  const response = await fetch("/api/cart", {
    method: "POST",
    headers: Auth.getAuthHeaders(),
    body: JSON.stringify({ bookId: bookId, quantity: 1 }),
  });
}
```

**Интерактивные возможности:**

- ✅ **Проверка авторизации** - требуется вход для покупки
- ✅ **Динамическое состояние кнопки** - активна/неактивна в зависимости от наличия цены
- ✅ **API интеграция** - отправка данных о товаре
- ✅ **Обратная связь** - уведомления об успехе/ошибках

#### 2.4 Управление корзиной

**Файл:** `public/scripts/cart.js`

**Динамические элементы:**

```javascript
// Кнопки изменения количества
<button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
<span>${item.quantity}</span>
<button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>

// Кнопка удаления
<button class="remove-btn" onclick="removeFromCart(${item.id})">Удалить</button>
```

**Интерактивные возможности:**

- ✅ **Изменение количества** - увеличение/уменьшение товаров
- ✅ **Удаление товаров** - с подтверждением
- ✅ **Автоматический пересчет** - обновление итоговой суммы
- ✅ **Сохранение состояния** - корзина привязана к пользователю

### 🔍 Форма 3: Поиск и фильтрация (дополнительная)

#### 2.5 Форма поиска книг

**Файл:** `public/scripts/catalog.js`

**HTML структура:**

```html
<input type="search" id="searchInput" placeholder="Поиск книг..." />
<select id="categoryFilter">
  <option value="">Все категории</option>
</select>
```

**Интерактивные возможности:**

- ✅ **Поиск в реальном времени** - фильтрация при вводе
- ✅ **Фильтрация по категориям** - выпадающий список
- ✅ **Пагинация результатов** - динамическое обновление страниц
- ✅ **AJAX загрузка** - без перезагрузки страницы

---

## 🛠 ТЕХНИЧЕСКИЕ ОСОБЕННОСТИ

### JavaScript архитектура:

- **Модульная структура** - разделение по файлам
- **Event-driven programming** - обработка событий
- **Async/Await** - асинхронные операции
- **API интеграция** - REST endpoints
- **DOM manipulation** - динамическое изменение контента

### CSS эффекты:

- **Transitions** - плавные переходы
- **Animations** - keyframe анимации
- **Hover effects** - интерактивность при наведении
- **Loading states** - индикаторы загрузки

### UX/UI возможности:

- **Responsive design** - адаптивность
- **Form validation** - валидация в реальном времени
- **Error handling** - обработка ошибок
- **Progressive enhancement** - улучшение функциональности

---

## 📊 СВОДНАЯ ТАБЛИЦА РЕАЛИЗОВАННЫХ ФОРМ

| №   | Тип формы           | Файлы                          | Интерактивные возможности       | Статус    |
| --- | ------------------- | ------------------------------ | ------------------------------- | --------- |
| 1   | **Регистрация**     | `register.html`, `register.js` | Валидация, API, уведомления     | ✅ Готово |
| 2   | **Авторизация**     | `login.html`, `login.js`       | Сессии, JWT, переходы           | ✅ Готово |
| 3   | **Корзина товаров** | `book-details.js`, `cart.js`   | Добавление, изменение, удаление | ✅ Готово |
| 4   | **Поиск/фильтры**   | `catalog.js`                   | Реальное время, AJAX            | ✅ Готово |

---

## 🎯 СООТВЕТСТВИЕ ТРЕБОВАНИЯМ

### ✅ Требование 1: Динамические эффекты

- **Анимации загрузки** карточек товаров
- **Модальные окна** с плавными переходами
- **Динамическая навигация** при авторизации
- **Состояния загрузки** кнопок и форм
- **Интерактивные переходы** между страницами

### ✅ Требование 2: Минимум 2 интерактивные формы

- **Форма регистрации** - полная валидация и API интеграция
- **Форма авторизации** - с сессиями и JWT токенами
- **Система корзины** - добавление, изменение, удаление товаров
- **Форма поиска** - фильтрация в реальном времени (бонус)

### 📈 Дополнительные преимущества:

- **API интеграция** - полноценная работа с backend
- **Безопасность** - JWT токены, валидация на сервере
- **UX/UI** - современный интерфейс с обратной связью
- **Производительность** - оптимизированные запросы и кэширование

**Вывод:** Все требования лабораторной работы выполнены с превышением минимальных стандартов. Реализована полноценная система с современными веб-технологиями.
