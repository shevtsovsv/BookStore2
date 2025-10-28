# 🖥 Урок 3: Backend авторизация

## 🎯 Серверная часть авторизации

В этом уроке изучим, как реализована авторизация на сервере в BookStore2: контроллеры, маршруты, middleware и работа с базой данных.

## 📁 Структура Backend файлов

```
src/
├── controllers/
│   └── authController.js      # Логика регистрации и входа
├── middleware/
│   └── authMiddleware.js      # Проверка токенов
├── routes/
│   └── authRoutes.js          # Маршруты авторизации
└── utils/
    └── validation.js          # Валидация данных
```

## 🗄️ Модель пользователя

### Структура таблицы users:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,       -- Хешированный пароль
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sequelize модель:

```javascript
// models/User.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [6, 255],
        },
      },
      firstName: {
        type: DataTypes.STRING(50),
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING(50),
        field: "last_name",
      },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
    }
  );

  return User;
};
```

## 🎮 Контроллер авторизации

### Полный authController.js:

```javascript
// src/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const { validateRegistration, validateLogin } = require("../utils/validation");

class AuthController {
  // Регистрация нового пользователя
  async register(req, res) {
    try {
      // 1. Валидация входных данных
      const { error, value } = validateRegistration(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Ошибка валидации",
          errors: error.details.map((detail) => detail.message),
        });
      }

      const { username, email, password, firstName, lastName } = value;

      // 2. Проверка уникальности username и email
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });

      if (existingUser) {
        const field =
          existingUser.username === username ? "имя пользователя" : "email";
        return res.status(409).json({
          success: false,
          message: `Пользователь с таким ${field} уже существует`,
        });
      }

      // 3. Хеширование пароля
      const saltRounds = 12; // Увеличиваем для большей безопасности
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 4. Создание пользователя
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      // 5. Генерация JWT токена
      const token = this.generateToken(newUser);

      // 6. Ответ (без пароля!)
      res.status(201).json({
        success: true,
        message: "Пользователь успешно зарегистрирован",
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      });
    } catch (error) {
      console.error("Ошибка регистрации:", error);

      // Проверка на ошибки уникальности от Sequelize
      if (error.name === "SequelizeUniqueConstraintError") {
        const field =
          error.errors[0].path === "username" ? "имя пользователя" : "email";
        return res.status(409).json({
          success: false,
          message: `Пользователь с таким ${field} уже существует`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Вход в систему
  async login(req, res) {
    try {
      // 1. Валидация входных данных
      const { error, value } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Ошибка валидации",
          errors: error.details.map((detail) => detail.message),
        });
      }

      const { login, password } = value; // login может быть username или email

      // 2. Поиск пользователя по username или email
      const user = await User.findOne({
        where: {
          [Op.or]: [{ username: login }, { email: login }],
        },
      });

      // 3. Проверка существования пользователя
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Неверные учетные данные",
        });
      }

      // 4. Проверка пароля
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Неверные учетные данные",
        });
      }

      // 5. Генерация JWT токена
      const token = this.generateToken(user);

      // 6. Успешный ответ
      res.json({
        success: true,
        message: "Успешный вход в систему",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Ошибка входа:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Проверка токена
  async verifyToken(req, res) {
    try {
      // Пользователь уже доступен через middleware
      const user = await User.findByPk(req.user.userId, {
        attributes: ["id", "username", "email", "firstName", "lastName"],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Ошибка проверки токена:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Обновление профиля
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, email } = req.body;
      const userId = req.user.userId;

      // Проверка email на уникальность (если изменяется)
      if (email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [Op.ne]: userId }, // Исключаем текущего пользователя
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Пользователь с таким email уже существует",
          });
        }
      }

      // Обновление данных
      await User.update(
        { firstName, lastName, email },
        { where: { id: userId } }
      );

      // Получение обновленных данных
      const updatedUser = await User.findByPk(userId, {
        attributes: ["id", "username", "email", "firstName", "lastName"],
      });

      res.json({
        success: true,
        message: "Профиль успешно обновлен",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Изменение пароля
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Получение текущего пользователя
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      // Проверка текущего пароля
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Неверный текущий пароль",
        });
      }

      // Хеширование нового пароля
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Обновление пароля
      await User.update(
        { password: hashedNewPassword },
        { where: { id: userId } }
      );

      res.json({
        success: true,
        message: "Пароль успешно изменен",
      });
    } catch (error) {
      console.error("Ошибка изменения пароля:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Выход из системы (опционально)
  async logout(req, res) {
    // При использовании JWT, выход происходит на клиенте
    // Но можно добавить токен в blacklist
    res.json({
      success: true,
      message: "Успешный выход из системы",
    });
  }

  // Приватный метод для генерации токена
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
      issuer: "BookStore2",
      audience: "bookstore-users",
    });
  }
}

module.exports = new AuthController();
```

## 🛡️ Middleware авторизации

### authMiddleware.js:

```javascript
// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../../models");

class AuthMiddleware {
  // Основной middleware для проверки токена
  authenticateToken(req, res, next) {
    try {
      // Получение токена из заголовка
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Токен доступа отсутствует",
        });
      }

      // Проверка токена
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return this.handleTokenError(err, res);
        }

        // Добавляем информацию о пользователе в запрос
        req.user = decoded;
        next();
      });
    } catch (error) {
      console.error("Ошибка middleware авторизации:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Опциональная авторизация (не требует токен)
  optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        req.user = null;
        return next();
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          req.user = null;
        } else {
          req.user = decoded;
        }
        next();
      });
    } catch (error) {
      req.user = null;
      next();
    }
  }

  // Проверка существования пользователя в БД
  async validateUser(req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: "Пользователь не аутентифицирован",
        });
      }

      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Пользователь не найден",
        });
      }

      req.dbUser = user;
      next();
    } catch (error) {
      console.error("Ошибка валидации пользователя:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  }

  // Проверка роли (для будущего расширения)
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Требуется авторизация",
        });
      }

      const userRole = req.user.role || "user";
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Недостаточно прав доступа",
        });
      }

      next();
    };
  }

  // Обработка ошибок токена
  handleTokenError(err, res) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Токен истёк",
        code: "TOKEN_EXPIRED",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Недействительный токен",
        code: "INVALID_TOKEN",
      });
    }

    if (err.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Токен ещё не активен",
        code: "TOKEN_NOT_ACTIVE",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Ошибка проверки токена",
      code: "TOKEN_ERROR",
    });
  }
}

module.exports = new AuthMiddleware();
```

## 🛣️ Маршруты авторизации

### authRoutes.js:

```javascript
// src/routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

// Ограничение частоты запросов для критических endpoints
const authLimiter = rateLimiter.createLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток за окно
  message: {
    success: false,
    message: "Слишком много попыток. Попробуйте позже.",
  },
});

const registerLimiter = rateLimiter.createLimiter({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // максимум 3 регистрации за час
  message: {
    success: false,
    message: "Слишком много регистраций. Попробуйте позже.",
  },
});

// Публичные маршруты (без авторизации)
router.post("/register", registerLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

// Защищенные маршруты (требуют токен)
router.get(
  "/verify",
  authMiddleware.authenticateToken,
  authController.verifyToken
);

router.put(
  "/profile",
  authMiddleware.authenticateToken,
  authMiddleware.validateUser,
  authController.updateProfile
);

router.put(
  "/change-password",
  authMiddleware.authenticateToken,
  authLimiter,
  authController.changePassword
);

router.post("/logout", authMiddleware.authenticateToken, authController.logout);

// Экспорт маршрутов
module.exports = router;
```

## 🔍 Валидация данных

### validation.js:

```javascript
// src/utils/validation.js
const Joi = require("joi");

// Схема валидации для регистрации
const registrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "Имя пользователя должно содержать только буквы и цифры",
    "string.min": "Имя пользователя должно содержать минимум 3 символа",
    "string.max": "Имя пользователя должно содержать максимум 30 символов",
    "any.required": "Имя пользователя обязательно",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Некорректный формат email",
    "any.required": "Email обязателен",
  }),

  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"))
    .required()
    .messages({
      "string.min": "Пароль должен содержать минимум 6 символов",
      "string.max": "Пароль должен содержать максимум 128 символов",
      "string.pattern.base":
        "Пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру",
      "any.required": "Пароль обязателен",
    }),

  firstName: Joi.string().max(50).optional().messages({
    "string.max": "Имя должно содержать максимум 50 символов",
  }),

  lastName: Joi.string().max(50).optional().messages({
    "string.max": "Фамилия должна содержать максимум 50 символов",
  }),
});

// Схема валидации для входа
const loginSchema = Joi.object({
  login: Joi.string().required().messages({
    "any.required": "Имя пользователя или email обязательны",
  }),

  password: Joi.string().required().messages({
    "any.required": "Пароль обязателен",
  }),
});

// Функции валидации
const validateRegistration = (data) => {
  return registrationSchema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateRegistration,
  validateLogin,
  registrationSchema,
  loginSchema,
};
```

## 🔐 Настройка безопасности

### Переменные окружения (.env):

```env
# JWT секретный ключ (минимум 32 символа)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Время жизни токена
JWT_EXPIRES_IN=24h

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/bookstore

# Окружение
NODE_ENV=development

# Порт сервера
PORT=3000

# CORS настройки
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Тестирование API

### Примеры запросов:

```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Тест",
    "lastName": "Пользователь"
  }'

# Вход
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser",
    "password": "TestPass123"
  }'

# Проверка токена
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Логирование и мониторинг

### Добавление логирования:

```javascript
// src/utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/auth-error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "logs/auth-combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
```

## 🎯 Практические задания

### Задание 1: Создание endpoint для смены пароля

Реализуйте endpoint `/api/auth/change-password` с валидацией старого пароля.

### Задание 2: Добавление ролей пользователей

Расширьте систему, добавив роли (admin, user) и соответствующие проверки.

### Задание 3: Логирование попыток входа

Добавьте логирование всех попыток входа (успешных и неуспешных).

---

**Следующий урок:** [Урок 4: Frontend авторизация](04_FRONTEND_AUTH.md) 🚀

**Практика:** Протестируйте все endpoints с помощью Postman или curl!
