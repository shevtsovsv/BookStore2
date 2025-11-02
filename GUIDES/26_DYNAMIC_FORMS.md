# Урок 26. Динамические формы и валидация данных

## Обзор

В нашем проекте реализованы динамические формы с валидацией на клиентской и серверной стороне. Формы обеспечивают:

- Валидацию в реальном времени
- Визуальную обратную связь (классы `.valid` и `.invalid`)
- Обработку ошибок с сервера
- Безопасную отправку данных через API

---

## 1. Архитектура динамических форм

### Структура файлов

```
public/
├── html/
│   ├── register.html          # Форма регистрации
│   └── login.html             # Форма входа
├── scripts/
│   ├── register.js            # Логика регистрации
│   ├── login.js               # Логика входа
│   └── auth-utils.js          # Утилиты авторизации
└── style/
    └── style.css              # Стили форм
```

### Слои системы форм

1. **HTML (разметка)** - структура формы с полями и атрибутами валидации
2. **CSS (стили)** - визуальное оформление, состояния полей (valid/invalid)
3. **JavaScript (логика)** - валидация, обработка событий, отправка данных
4. **API (сервер)** - валидация на сервере, сохранение данных

---

## 2. Форма регистрации

### HTML-разметка (register.html)

```html
<form id="registerForm" class="form-box">
  <!-- Имя -->
  <div class="form-group">
    <label for="firstName">Имя <span class="necessarily">*</span></label>
    <input
      type="text"
      id="firstName"
      name="firstName"
      required
      placeholder="Введите ваше имя"
    />
    <span
      class="error-message"
      id="firstName-error"
      style="display: none"
    ></span>
  </div>

  <!-- Фамилия -->
  <div class="form-group">
    <label for="lastName">Фамилия <span class="necessarily">*</span></label>
    <input
      type="text"
      id="lastName"
      name="lastName"
      required
      placeholder="Введите вашу фамилию"
    />
    <span
      class="error-message"
      id="lastName-error"
      style="display: none"
    ></span>
  </div>

  <!-- Email -->
  <div class="form-group">
    <label for="email">Email <span class="necessarily">*</span></label>
    <input
      type="email"
      id="email"
      name="email"
      required
      placeholder="example@email.com"
    />
    <span class="error-message" id="email-error" style="display: none"></span>
  </div>

  <!-- Пароль с кнопкой "глазик" -->
  <div class="form-group">
    <label for="password">Пароль <span class="necessarily">*</span></label>
    <div class="password-input-wrapper">
      <input
        type="password"
        id="password"
        name="password"
        required
        placeholder="Минимум 8 символов"
      />
      <button type="button" id="toggle-password" class="password-eye-btn">
        <svg><!-- SVG иконка глаза --></svg>
      </button>
    </div>
    <div class="password-requirements">
      <small>Пароль должен содержать:</small>
      <ul>
        <li>Минимум 8 символов</li>
        <li>Минимум 1 заглавную букву (A-Z)</li>
        <li>Строчные английские буквы (a-z)</li>
        <li>Минимум 2 цифры (0-9)</li>
      </ul>
    </div>
    <span
      class="error-message"
      id="password-error"
      style="display: none"
    ></span>
  </div>

  <!-- Подтверждение пароля -->
  <div class="form-group">
    <label for="confirmPassword"
      >Подтверждение пароля <span class="necessarily">*</span></label
    >
    <input
      type="password"
      id="confirmPassword"
      name="confirmPassword"
      required
      placeholder="Повторите пароль"
    />
    <span
      class="error-message"
      id="confirmPassword-error"
      style="display: none"
    ></span>
  </div>

  <button type="submit" class="form-btn" id="registerBtn">
    <span class="btn-text">Зарегистрироваться</span>
    <span class="btn-loader" style="display: none">Регистрация...</span>
  </button>
</form>
```

### JavaScript-логика валидации (register.js)

```javascript
// Валидация email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Валидация пароля
function validatePassword(password) {
  // Минимум 8 символов
  if (password.length < 8) return false;

  // Минимум 1 заглавная буква
  if (!/[A-Z]/.test(password)) return false;

  // Есть строчные буквы
  if (!/[a-z]/.test(password)) return false;

  // Минимум 2 цифры
  const digitCount = (password.match(/\d/g) || []).length;
  if (digitCount < 2) return false;

  // Только разрешённые символы
  if (!/^[A-Za-z\d@$!%*?&]+$/.test(password)) return false;

  return true;
}

// Показать ошибку поля
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.remove("valid");
    field.classList.add("invalid");
  }

  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = "block";
  }
}

// Очистить ошибку поля
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorSpan = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.remove("invalid");
    field.classList.add("valid");
  }

  if (errorSpan) {
    errorSpan.style.display = "none";
    errorSpan.textContent = "";
  }
}

// Обработка отправки формы
document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Очистить все ошибки
    clearAllErrors();

    // Получить данные формы
    const formData = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    // Валидация на клиенте
    let hasErrors = false;

    if (!formData.firstName) {
      showFieldError("firstName", "Введите имя");
      hasErrors = true;
    }

    if (!formData.lastName) {
      showFieldError("lastName", "Введите фамилию");
      hasErrors = true;
    }

    if (!validateEmail(formData.email)) {
      showFieldError("email", "Введите корректный email");
      hasErrors = true;
    }

    if (!validatePassword(formData.password)) {
      showFieldError("password", "Пароль не соответствует требованиям");
      hasErrors = true;
    }

    if (formData.password !== formData.confirmPassword) {
      showFieldError("confirmPassword", "Пароли не совпадают");
      hasErrors = true;
    }

    if (hasErrors) return;

    // Отправка на сервер
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess("Регистрация успешна! Перенаправление...");
        setTimeout(() => {
          window.location.href = "/html/login.html";
        }, 1500);
      } else {
        // Показать ошибки с сервера
        if (result.errors) {
          result.errors.forEach((err) => {
            showFieldError(err.field, err.message);
          });
        } else {
          showError(result.message || "Ошибка регистрации");
        }
      }
    } catch (error) {
      showError("Ошибка связи с сервером");
    }
  });
```

### CSS-стили для валидации

```css
/* Базовые стили полей */
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.2s;
}

/* Поле в фокусе */
.form-group input:focus {
  outline: none;
  border-color: #2563eb;
}

/* Валидное поле */
.form-group input.valid {
  border-color: #059669;
  background-color: #f0fdf4;
}

/* Невалидное поле */
.form-group input.invalid {
  border-color: #dc2626;
  background-color: #fef2f2;
}

/* Сообщение об ошибке */
.error-message {
  display: none;
  color: #dc2626;
  font-size: 0.875em;
  margin-top: 4px;
}

/* Обязательное поле */
.necessarily {
  color: #dc2626;
  font-weight: bold;
}

/* Требования к паролю */
.password-requirements {
  font-size: 0.85em;
  color: #6b7280;
  margin-top: 8px;
}

.password-requirements ul {
  margin: 4px 0;
  padding-left: 20px;
}

.password-requirements li {
  margin: 2px 0;
}
```

---

## 3. Форма входа

### HTML-разметка (login.html)

```html
<form id="loginForm" class="form-box">
  <!-- Email -->
  <div class="form-group">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      required
      placeholder="example@email.com"
    />
    <span class="error-message" id="email-error" style="display: none"></span>
  </div>

  <!-- Пароль -->
  <div class="form-group">
    <label for="password">Пароль</label>
    <input
      type="password"
      id="password"
      name="password"
      required
      placeholder="Введите ваш пароль"
    />
    <span
      class="error-message"
      id="password-error"
      style="display: none"
    ></span>
  </div>

  <button type="submit" class="form-btn" id="loginBtn">
    <span class="btn-text">Войти</span>
    <span class="btn-loader" style="display: none">Вход...</span>
  </button>
</form>
```

### JavaScript-логика (login.js)

```javascript
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Простая валидация
  if (!email || !password) {
    showError("Заполните все поля");
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      // Сохранить токен
      AuthToken.set(result.token);

      showSuccess("Вход выполнен успешно!");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1000);
    } else {
      showError(result.message || "Неверный email или пароль");
    }
  } catch (error) {
    showError("Ошибка связи с сервером");
  }
});
```

---

## 4. Особенности реализации

### Валидация в реальном времени

```javascript
// Валидация при вводе
document.getElementById("email").addEventListener("blur", function () {
  const email = this.value.trim();
  if (email && !validateEmail(email)) {
    showFieldError("email", "Введите корректный email");
  } else if (email) {
    clearFieldError("email");
  }
});

// Валидация пароля при вводе
document.getElementById("password").addEventListener("input", function () {
  const password = this.value;
  if (password && validatePassword(password)) {
    clearFieldError("password");
  }
});
```

### Показ/скрытие пароля (функция "глазик")

```javascript
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggle-password");
let passwordVisible = false;

toggleBtn.addEventListener("click", function () {
  passwordVisible = !passwordVisible;
  passwordInput.type = passwordVisible ? "text" : "password";

  // Обновить иконку
  eyeIcon.innerHTML = passwordVisible
    ? "<!-- SVG перечёркнутого глаза -->"
    : "<!-- SVG обычного глаза -->";
});
```

### Блокировка повторной отправки

```javascript
let isSubmitting = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;

  // Показать индикатор загрузки
  btnText.style.display = "none";
  btnLoader.style.display = "inline";

  try {
    // Отправка данных
    await submitForm();
  } finally {
    isSubmitting = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
});
```

---

## 5. Серверная валидация

### Express Validator (middleware)

```javascript
const { body, validationResult } = require("express-validator");

const validateRegister = [
  body("firstName").trim().notEmpty().withMessage("Имя обязательно"),

  body("email").isEmail().withMessage("Некорректный email").normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Пароль должен быть минимум 8 символов")
    .matches(/[A-Z]/)
    .withMessage("Пароль должен содержать заглавную букву")
    .matches(/[a-z]/)
    .withMessage("Пароль должен содержать строчную букву")
    .matches(/\d.*\d/)
    .withMessage("Пароль должен содержать минимум 2 цифры"),
];

// В контроллере
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    success: false,
    errors: errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    })),
  });
}
```

---

## 6. Демонстрация валидности данных

### Состояния формы

**1. Пустая форма (начальное состояние):**

- Все поля без классов
- Ошибки скрыты
- Кнопка активна

**2. Валидные данные:**

- Поля с классом `.valid`
- Зелёная рамка
- Зелёный фон
- Ошибки скрыты

**3. Невалидные данные:**

- Поля с классом `.invalid`
- Красная рамка
- Красный фон
- Ошибки видны под полями

**4. Процесс отправки:**

- Кнопка заблокирована
- Показан индикатор загрузки
- Текст кнопки изменён

**5. Успешная отправка:**

- Зелёное уведомление
- Автоматическое перенаправление

**6. Ошибка отправки:**

- Красное уведомление
- Подсветка полей с ошибками
- Детальные сообщения об ошибках

---

## 7. Примеры ошибок валидации

### Клиентская валидация

```
Email: "test@com" → "Введите корректный email"
Пароль: "1234" → "Пароль не соответствует требованиям"
Пароль: "password" → "Пароль должен содержать цифры"
Подтверждение: "pass123" (при пароле "pass124") → "Пароли не совпадают"
```

### Серверная валидация

```
Email: "existing@email.com" → "Пользователь с таким email уже существует"
Username: "admin" → "Имя пользователя уже занято"
```

---

## 8. Итоги

### Преимущества реализованной системы форм:

✅ **Валидация на двух уровнях** (клиент + сервер)
✅ **Визуальная обратная связь** в реальном времени
✅ **Безопасность** - защита от повторной отправки
✅ **UX** - понятные сообщения об ошибках
✅ **Доступность** - семантическая разметка, атрибуты aria
✅ **Расширяемость** - легко добавить новые поля

### Используемые технологии:

- HTML5 (семантическая разметка, атрибуты валидации)
- CSS3 (переходы, классы состояний)
- Vanilla JavaScript (обработка событий, fetch API)
- Express Validator (серверная валидация)
- JWT (безопасная авторизация)

---

## Скриншоты

**Для полной документации требуется добавить скриншоты:**

1. Форма регистрации (пустая)
2. Форма регистрации (заполненная, валидные данные)
3. Форма регистрации (ошибки валидации)
4. Форма входа (пустая)
5. Форма входа (заполненная)
6. Уведомление об успешной регистрации
7. Уведомление об ошибке

**Примечание:** Скриншоты следует разместить в папке `GUIDES/screenshots/` и добавить ссылки в этот документ.
