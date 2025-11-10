# 🔐 Система аутентификации

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 3-4 часа  
> **Предварительные требования:** Завершение части 06

## 🎯 Цели этой части

В этой части вы создадите полную систему аутентификации с:

- JWT токенами для авторизации
- Хешированием паролей с bcrypt
- Регистрацией и входом пользователей
- Сбросом пароля
- Защищенными маршрутами
- Refresh токенами

---

## 🔑 Настройка JWT аутентификации

### 1. Установка зависимостей

```bash
npm install bcryptjs jsonwebtoken crypto nodemailer
```

### 2. Утилиты для работы с токенами

Создайте файл `src/utils/token.js`:

```javascript
const jwt = require("jsonwebtoken");

// Генерация JWT токена
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

// Генерация refresh токена
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }
  );
};

// Верификация токена
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Верификация refresh токена
const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};

// Создание токенов для пользователя
const createTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken({ id: user.id });

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  createTokens,
};
```

### 3. Утилиты для работы с паролями

Создайте файл `src/utils/password.js`:

```javascript
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Хеширование пароля
const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
};

// Сравнение паролей
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Генерация случайного токена для сброса пароля
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Хеширование токена сброса
const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  hashPassword,
  comparePassword,
  generateResetToken,
  hashResetToken,
};
```

---

## 👤 Контроллеры аутентификации

### 1. Создание контроллера auth

Создайте файл `src/controllers/authController.js`:

```javascript
const { User } = require("../../models");
const { createTokens, verifyRefreshToken } = require("../utils/token");
const {
  hashPassword,
  comparePassword,
  generateResetToken,
  hashResetToken,
} = require("../utils/password");
const { sendEmail } = require("../utils/email");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Регистрация пользователя
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, address } = req.body;

  // Проверка существования пользователя
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Пользователь с таким email уже существует",
    });
  }

  // Хеширование пароля
  const hashedPassword = await hashPassword(password);

  // Создание пользователя
  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phone,
    address,
  });

  // Генерация токенов
  const tokens = createTokens(user);

  // Отправка welcome email (опционально)
  if (process.env.EMAIL_ENABLED === "true") {
    await sendEmail({
      email: user.email,
      subject: "Добро пожаловать в Книжный магазин!",
      message: `Здравствуйте, ${user.firstName}! Спасибо за регистрацию в нашем магазине.`,
    });
  }

  res.status(201).json({
    success: true,
    message: "Пользователь успешно зарегистрирован",
    data: {
      user: user.toJSON(),
      ...tokens,
    },
  });
});

/**
 * @desc    Вход пользователя
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Поиск пользователя
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Неверный email или пароль",
    });
  }

  // Проверка активности аккаунта
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Аккаунт заблокирован. Обратитесь к администратору",
    });
  }

  // Проверка пароля
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: "Неверный email или пароль",
    });
  }

  // Обновление времени последнего входа
  await user.update({ lastLoginAt: new Date() });

  // Генерация токенов
  const tokens = createTokens(user);

  res.status(200).json({
    success: true,
    message: "Успешная авторизация",
    data: {
      user: user.toJSON(),
      ...tokens,
    },
  });
});

/**
 * @desc    Обновление токена
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token не предоставлен",
    });
  }

  try {
    // Верификация refresh токена
    const decoded = verifyRefreshToken(refreshToken);

    // Поиск пользователя
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Пользователь не найден или заблокирован",
      });
    }

    // Генерация новых токенов
    const tokens = createTokens(user);

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Недействительный refresh token",
    });
  }
});

/**
 * @desc    Получение информации о текущем пользователе
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  res.status(200).json({
    success: true,
    data: { user: user.toJSON() },
  });
});

/**
 * @desc    Обновление профиля пользователя
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, address } = req.body;

  const user = await User.findByPk(req.user.id);

  const updatedUser = await user.update({
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    phone: phone || user.phone,
    address: address || user.address,
  });

  res.status(200).json({
    success: true,
    message: "Профиль успешно обновлен",
    data: { user: updatedUser.toJSON() },
  });
});

/**
 * @desc    Изменение пароля
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);

  // Проверка текущего пароля
  const isValidPassword = await comparePassword(currentPassword, user.password);
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      message: "Неверный текущий пароль",
    });
  }

  // Хеширование нового пароля
  const hashedPassword = await hashPassword(newPassword);

  // Обновление пароля
  await user.update({ password: hashedPassword });

  res.status(200).json({
    success: true,
    message: "Пароль успешно изменен",
  });
});

/**
 * @desc    Запрос на сброс пароля
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Пользователь с таким email не найден",
    });
  }

  // Генерация токена сброса
  const resetToken = generateResetToken();
  const hashedResetToken = hashResetToken(resetToken);

  // Сохранение токена в БД (добавьте поля в модель User)
  await user.update({
    passwordResetToken: hashedResetToken,
    passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 минут
  });

  // Отправка email с токеном
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/reset-password?token=${resetToken}`;

  const message = `
    Получен запрос на сброс пароля. 
    Перейдите по ссылке для сброса пароля:
    
    ${resetUrl}
    
    Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
    Ссылка действительна 10 минут.
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Сброс пароля",
      message,
    });

    res.status(200).json({
      success: true,
      message: "Инструкции по сбросу пароля отправлены на email",
    });
  } catch (error) {
    await user.update({
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return res.status(500).json({
      success: false,
      message: "Ошибка при отправке email",
    });
  }
});

/**
 * @desc    Сброс пароля
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Хеширование полученного токена
  const hashedToken = hashResetToken(token);

  // Поиск пользователя по токену
  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Недействительный или истекший токен сброса",
    });
  }

  // Обновление пароля
  const hashedPassword = await hashPassword(password);

  await user.update({
    password: hashedPassword,
    passwordResetToken: null,
    passwordResetExpires: null,
  });

  res.status(200).json({
    success: true,
    message: "Пароль успешно изменен",
  });
});

/**
 * @desc    Выход пользователя
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // В реальном приложении здесь можно добавить токен в blacklist

  res.status(200).json({
    success: true,
    message: "Успешный выход из системы",
  });
});

module.exports = {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
```

---

## 📧 Утилиты для email

### 1. Email сервис

Создайте файл `src/utils/email.js`:

```javascript
const nodemailer = require("nodemailer");

// Создание transporter для отправки email
const createTransporter = () => {
  if (process.env.NODE_ENV === "development") {
    // Для разработки используем Ethereal Email
    return nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Для продакшена используйте реальный SMTP
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
};

// Отправка email
const sendEmail = async (options) => {
  const transporter = createTransporter();

  const message = {
    from: `${process.env.FROM_NAME || "Книжный магазин"} <${
      process.env.FROM_EMAIL
    }>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message.replace(/\n/g, "<br>"),
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV === "development") {
    console.log("📧 Email отправлен:", nodemailer.getTestMessageUrl(info));
  }

  return info;
};

// Шаблоны email
const emailTemplates = {
  welcome: (name) => ({
    subject: "Добро пожаловать в Книжный магазин!",
    html: `
      <h2>Добро пожаловать, ${name}!</h2>
      <p>Спасибо за регистрацию в нашем интернет-магазине книг.</p>
      <p>Теперь вы можете:</p>
      <ul>
        <li>Просматривать каталог книг</li>
        <li>Добавлять товары в корзину</li>
        <li>Оформлять заказы</li>
        <li>Получать персональные рекомендации</li>
      </ul>
      <p>Приятных покупок!</p>
    `,
  }),

  resetPassword: (resetUrl, name) => ({
    subject: "Сброс пароля",
    html: `
      <h2>Сброс пароля</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Получен запрос на сброс пароля для вашего аккаунта.</p>
      <p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Сбросить пароль
        </a>
      </p>
      <p>Ссылка действительна 10 минут.</p>
      <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
    `,
  }),

  orderConfirmation: (orderNumber, items, total) => ({
    subject: `Подтверждение заказа #${orderNumber}`,
    html: `
      <h2>Заказ подтвержден!</h2>
      <p>Спасибо за ваш заказ #${orderNumber}.</p>
      <h3>Состав заказа:</h3>
      <ul>
        ${items
          .map(
            (item) =>
              `<li>${item.title} - ${item.quantity} шт. - ${item.price} руб.</li>`
          )
          .join("")}
      </ul>
      <p><strong>Общая сумма: ${total} руб.</strong></p>
      <p>Мы свяжемся с вами для уточнения деталей доставки.</p>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
```

---

## 🛣️ Маршруты аутентификации

### 1. Создание маршрутов

Создайте файл `src/routes/auth.js`:

```javascript
const express = require("express");
const {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Публичные маршруты
router.post("/register", validate(schemas.userRegistration), register);
router.post("/login", validate(schemas.userLogin), login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Защищенные маршруты
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.post("/logout", protect, logout);

module.exports = router;
```

---

## 🗄️ Обновление модели User

### 1. Добавление полей для сброса пароля

Создайте миграцию для добавления полей:

```bash
npx sequelize-cli migration:generate --name add-password-reset-fields
```

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "passwordResetToken", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "passwordResetExpires", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("users", ["passwordResetToken"], {
      name: "users_password_reset_token_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "passwordResetToken");
    await queryInterface.removeColumn("users", "passwordResetExpires");
  },
};
```

### 2. Обновление модели User

Обновите `models/User.js`:

```javascript
// Добавьте новые поля в модель
passwordResetToken: {
  type: DataTypes.STRING,
  allowNull: true
},
passwordResetExpires: {
  type: DataTypes.DATE,
  allowNull: true
}

// Добавьте хук для хеширования пароля
const { hashPassword } = require('../src/utils/password');

// В секции hooks:
beforeCreate: async (user) => {
  if (user.password) {
    user.password = await hashPassword(user.password);
  }
},
beforeUpdate: async (user) => {
  if (user.changed('password')) {
    user.password = await hashPassword(user.password);
  }
}
```

---

## 🧪 Тестирование аутентификации

### 1. Тестовый файл

Создайте файл `test-auth.js`:

```javascript
const request = require("supertest");
const app = require("./server");
const { User } = require("./models");

async function testAuth() {
  try {
    console.log("🔐 Тестирование аутентификации...");

    const testUser = {
      firstName: "Тест",
      lastName: "Пользователь",
      email: `test${Date.now()}@example.com`,
      password: "TestPassword123",
    };

    // Тест регистрации
    console.log("📝 Тест регистрации...");
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    console.log("✅ Регистрация успешна");
    const { accessToken } = registerResponse.body.data;

    // Тест получения профиля
    console.log("👤 Тест получения профиля...");
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    console.log("✅ Профиль получен");

    // Тест входа
    console.log("🔑 Тест входа...");
    await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    console.log("✅ Вход успешен");

    // Тест неверных данных
    console.log("❌ Тест неверных данных...");
    await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "wrongpassword",
      })
      .expect(401);

    console.log("✅ Неверные данные обработаны корректно");

    // Очистка тестовых данных
    await User.destroy({ where: { email: testUser.email } });

    console.log("🎉 Все тесты аутентификации прошли успешно!");
  } catch (error) {
    console.error("❌ Ошибка при тестировании:", error.message);
  }
}

if (require.main === module) {
  testAuth().then(() => process.exit(0));
}

module.exports = testAuth;
```

---

## 📱 Фронтенд интеграция

### 1. JavaScript для работы с API

Создайте файл `public/scripts/auth.js`:

```javascript
class AuthService {
  constructor() {
    this.baseURL = "/api/auth";
    this.token = localStorage.getItem("accessToken");
    this.user = JSON.parse(localStorage.getItem("user") || "null");
  }

  // Сохранение токенов
  saveTokens(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    this.token = data.accessToken;
    this.user = data.user;
  }

  // Очистка данных
  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    this.token = null;
    this.user = null;
  }

  // Проверка авторизации
  isAuthenticated() {
    return !!this.token;
  }

  // Регистрация
  async register(userData) {
    const response = await fetch(`${this.baseURL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (data.success) {
      this.saveTokens(data.data);
    }

    return data;
  }

  // Вход
  async login(credentials) {
    const response = await fetch(`${this.baseURL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (data.success) {
      this.saveTokens(data.data);
    }

    return data;
  }

  // Выход
  async logout() {
    try {
      await fetch(`${this.baseURL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }

    this.clearTokens();
  }

  // Получение профиля
  async getProfile() {
    const response = await fetch(`${this.baseURL}/me`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return await response.json();
  }

  // Обновление профиля
  async updateProfile(userData) {
    const response = await fetch(`${this.baseURL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (data.success) {
      this.user = data.data.user;
      localStorage.setItem("user", JSON.stringify(this.user));
    }

    return data;
  }

  // HTTP клиент с автоматическим добавлением токена
  async apiCall(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Обработка истекшего токена
    if (response.status === 401) {
      await this.refreshToken();
      // Повторный запрос с новым токеном
      headers.Authorization = `Bearer ${this.token}`;
      return fetch(url, { ...options, headers });
    }

    return response;
  }

  // Обновление токена
  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      this.clearTokens();
      throw new Error("Refresh token не найден");
    }

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        this.saveTokens(data.data);
      } else {
        this.clearTokens();
      }

      return data;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
}

// Глобальный экземпляр
const authService = new AuthService();

// Автоматическое обновление UI при изменении состояния авторизации
window.addEventListener("storage", (e) => {
  if (e.key === "accessToken") {
    updateAuthUI();
  }
});

// Обновление интерфейса авторизации
function updateAuthUI() {
  const isAuth = authService.isAuthenticated();
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("userInfo");

  if (isAuth) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
    if (userInfo && authService.user) {
      userInfo.textContent = `${authService.user.firstName} ${authService.user.lastName}`;
    }
  } else {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userInfo) userInfo.textContent = "";
  }
}

// Инициализация UI при загрузке страницы
document.addEventListener("DOMContentLoaded", updateAuthUI);
```

---

## 📋 Задания для самопроверки

1. **Добавьте двухфакторную аутентификацию** (2FA) с SMS или email
2. **Реализуйте социальный вход** через Google или Facebook
3. **Создайте систему ролей** с более детальными разрешениями
4. **Добавьте rate limiting** для попыток входа

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полная система аутентификации с JWT  
✅ Безопасное хеширование паролей  
✅ Регистрация и вход пользователей  
✅ Сброс пароля через email  
✅ Защищенные маршруты  
✅ Frontend интеграция

**Следующий шаг:** [08_API_ENDPOINTS.md](08_API_ENDPOINTS.md) - создание CRUD API для книг, категорий и авторов.

---

_Время выполнения: ~3-4 часа_  
_Сложность: 🟡 Средняя_
