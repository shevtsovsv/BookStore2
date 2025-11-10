# 🌐 Настройка Express.js сервера

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 2-3 часа  
> **Предварительные требования:** Завершение части 05

## 🎯 Цели этой части

В этой части вы создадите полнофункциональный Express.js сервер с:

- Настройкой middleware для безопасности
- CORS и rate limiting
- Обработкой ошибок
- Логированием запросов
- Валидацией данных
- Структурированной архитектурой

---

## 🏗️ Базовая структура сервера

### 1. Обновление server.js

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const path = require("path");
require("dotenv").config();

// Импорт маршрутов
const authRoutes = require("./src/routes/auth");
const bookRoutes = require("./src/routes/books");
const categoryRoutes = require("./src/routes/categories");
const authorRoutes = require("./src/routes/authors");
const publisherRoutes = require("./src/routes/publishers");
const cartRoutes = require("./src/routes/cart");

// Импорт middleware
const { errorHandler } = require("./src/middleware/errorHandler");
const { notFound } = require("./src/middleware/notFound");

const app = express();
const PORT = process.env.PORT || 3000;

// Базовая настройка безопасности
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS конфигурация
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://yourdomain.com",
    ];

    // Разрешить запросы без origin (мобильные приложения, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Не разрешено CORS политикой"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // максимум 100 запросов на IP
  message: {
    success: false,
    message: "Слишком много запросов с вашего IP, попробуйте позже",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Сжатие ответов
app.use(compression());

// Логирование
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Парсинг тела запроса
app.use(
  express.json({
    limit: "10mb",
    type: "application/json",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// Статические файлы
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API маршруты
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/publishers", publisherRoutes);
app.use("/api/cart", cartRoutes);

// Обслуживание HTML страниц
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Обработка SPA маршрутов
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Обработка несуществующих API маршрутов
app.use("/api/*", notFound);

// Глобальная обработка ошибок
app.use(errorHandler);

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📝 API документация: http://localhost:${PORT}/api-docs`);
  console.log(`🌍 Окружение: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Получен SIGTERM, завершение работы сервера...");
  server.close(() => {
    console.log("✅ Сервер остановлен");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Получен SIGINT, завершение работы сервера...");
  server.close(() => {
    console.log("✅ Сервер остановлен");
    process.exit(0);
  });
});

module.exports = app;
```

---

## 🛡️ Middleware для безопасности

### 1. Обработка ошибок

Создайте файл `src/middleware/errorHandler.js`:

```javascript
const { ValidationError } = require("sequelize");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Логирование ошибки
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Ошибка:", err);
  }

  // Ошибки валидации Sequelize
  if (err instanceof ValidationError) {
    const message = err.errors.map((e) => e.message).join(", ");
    error = {
      statusCode: 400,
      message: message,
    };
  }

  // Ошибка дублирования (PostgreSQL)
  if (err.code === "23505") {
    const message = "Дублирование уникального поля";
    error = {
      statusCode: 409,
      message: message,
    };
  }

  // Ошибка внешнего ключа
  if (err.code === "23503") {
    const message = "Ссылка на несуществующий объект";
    error = {
      statusCode: 400,
      message: message,
    };
  }

  // JWT ошибки
  if (err.name === "JsonWebTokenError") {
    const message = "Недействительный токен";
    error = {
      statusCode: 401,
      message: message,
    };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Токен истек";
    error = {
      statusCode: 401,
      message: message,
    };
  }

  // Отправка ответа
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Внутренняя ошибка сервера",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
```

### 2. Обработка 404

Создайте файл `src/middleware/notFound.js`:

```javascript
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Маршрут ${req.originalUrl} не найден`,
  });
};

module.exports = { notFound };
```

### 3. Аутентификация JWT

Создайте файл `src/middleware/auth.js`:

```javascript
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const { asyncHandler } = require("./errorHandler");

// Проверка токена
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Получение токена из заголовка
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Проверка наличия токена
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Токен доступа не предоставлен",
    });
  }

  try {
    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Получение пользователя
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Аккаунт пользователя заблокирован",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Недействительный токен",
    });
  }
});

// Проверка ролей
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Доступ запрещен",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Недостаточно прав для выполнения действия",
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
```

---

## 📝 Валидация данных

### 1. Установка библиотек валидации

```bash
npm install joi express-validator
```

### 2. Middleware валидации

Создайте файл `src/middleware/validation.js`:

```javascript
const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      return res.status(400).json({
        success: false,
        message: "Ошибка валидации",
        errors: error.details.map((detail) => detail.message),
      });
    }

    next();
  };
};

// Схемы валидации
const schemas = {
  // Регистрация пользователя
  userRegistration: Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
      "string.min": "Имя должно быть минимум 2 символа",
      "string.max": "Имя не должно превышать 50 символов",
      "any.required": "Имя обязательно для заполнения",
    }),

    lastName: Joi.string().min(2).max(50).required().messages({
      "string.min": "Фамилия должна быть минимум 2 символа",
      "string.max": "Фамилия не должна превышать 50 символов",
      "any.required": "Фамилия обязательна для заполнения",
    }),

    email: Joi.string().email().required().messages({
      "string.email": "Неверный формат email",
      "any.required": "Email обязателен для заполнения",
    }),

    password: Joi.string()
      .min(6)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"))
      .required()
      .messages({
        "string.min": "Пароль должен быть минимум 6 символов",
        "string.pattern.base":
          "Пароль должен содержать заглавную букву, строчную букву и цифру",
        "any.required": "Пароль обязателен для заполнения",
      }),

    phone: Joi.string()
      .pattern(new RegExp("^\\+?[1-9]\\d{1,14}$"))
      .optional()
      .messages({
        "string.pattern.base": "Неверный формат телефона",
      }),

    address: Joi.string().max(500).optional(),
  }),

  // Вход пользователя
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Неверный формат email",
      "any.required": "Email обязателен для заполнения",
    }),

    password: Joi.string().required().messages({
      "any.required": "Пароль обязателен для заполнения",
    }),
  }),

  // Создание книги
  bookCreation: Joi.object({
    title: Joi.string().min(1).max(255).required().messages({
      "string.min": "Название книги не может быть пустым",
      "string.max": "Название не должно превышать 255 символов",
      "any.required": "Название книги обязательно",
    }),

    subtitle: Joi.string().max(255).optional(),

    description: Joi.string().optional(),

    isbn: Joi.string()
      .pattern(
        new RegExp(
          "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$"
        )
      )
      .optional()
      .messages({
        "string.pattern.base": "Неверный формат ISBN",
      }),

    price: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Цена должна быть положительным числом",
      "any.required": "Цена обязательна",
    }),

    discountPrice: Joi.number().positive().precision(2).optional(),

    pageCount: Joi.number().integer().positive().optional(),

    publishedYear: Joi.number()
      .integer()
      .min(1400)
      .max(new Date().getFullYear() + 1)
      .optional(),

    language: Joi.string()
      .valid("ru", "en", "fr", "de", "es", "it", "pl", "ua")
      .default("ru"),

    format: Joi.string()
      .valid("hardcover", "paperback", "ebook", "audiobook")
      .default("paperback"),

    stockQuantity: Joi.number().integer().min(0).required().messages({
      "number.min": "Количество не может быть отрицательным",
      "any.required": "Количество на складе обязательно",
    }),

    categoryId: Joi.number().integer().positive().required().messages({
      "any.required": "Категория книги обязательна",
    }),

    publisherId: Joi.number().integer().positive().optional(),

    authorIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .required()
      .messages({
        "array.min": "У книги должен быть хотя бы один автор",
        "any.required": "Авторы книги обязательны",
      }),
  }),
};

module.exports = { validate, schemas };
```

---

## 📚 Создание базовых маршрутов

### 1. Маршруты категорий

Создайте файл `src/routes/categories.js`:

```javascript
const express = require("express");
const { Category } = require("../../models");
const { protect, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @desc    Получить все категории
 * @route   GET /api/categories
 * @access  Public
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, parent = null, active = true } = req.query;

    const offset = (page - 1) * limit;

    const where = {};
    if (parent !== null) {
      where.parentId = parent === "null" ? null : parseInt(parent);
    }
    if (active !== "all") {
      where.isActive = active === "true";
    }

    const { count, rows } = await Category.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["sortOrder", "ASC"],
        ["name", "ASC"],
      ],
      include: [
        {
          model: Category,
          as: "children",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        categories: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  })
);

/**
 * @desc    Получить категорию по ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: "parent",
        },
        {
          model: Category,
          as: "children",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория не найдена",
      });
    }

    res.status(200).json({
      success: true,
      data: { category },
    });
  })
);

/**
 * @desc    Создать новую категорию
 * @route   POST /api/categories
 * @access  Private/Admin
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: { category },
    });
  })
);

/**
 * @desc    Обновить категорию
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
router.put(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    let category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория не найдена",
      });
    }

    category = await category.update(req.body);

    res.status(200).json({
      success: true,
      data: { category },
    });
  })
);

/**
 * @desc    Удалить категорию
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория не найдена",
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      data: { message: "Категория удалена" },
    });
  })
);

module.exports = router;
```

### 2. Базовые маршруты авторов

Создайте файл `src/routes/authors.js`:

```javascript
const express = require("express");
const { Author, Book } = require("../../models");
const { protect, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @desc    Получить всех авторов
 * @route   GET /api/authors
 * @access  Public
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "", nationality = "" } = req.query;

    const offset = (page - 1) * limit;

    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (nationality) {
      where.nationality = nationality;
    }

    const { count, rows } = await Author.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["lastName", "ASC"],
        ["firstName", "ASC"],
      ],
      include: [
        {
          model: Book,
          as: "books",
          attributes: ["id", "title"],
          through: { attributes: [] },
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        authors: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  })
);

/**
 * @desc    Получить автора по ID
 * @route   GET /api/authors/:id
 * @access  Public
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const author = await Author.findByPk(req.params.id, {
      include: [
        {
          model: Book,
          as: "books",
          where: { isActive: true },
          required: false,
          through: { attributes: ["role"] },
        },
      ],
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Автор не найден",
      });
    }

    res.status(200).json({
      success: true,
      data: { author },
    });
  })
);

/**
 * @desc    Создать нового автора
 * @route   POST /api/authors
 * @access  Private/Admin
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const author = await Author.create(req.body);

    res.status(201).json({
      success: true,
      data: { author },
    });
  })
);

module.exports = router;
```

---

## 🧪 Тестирование сервера

Создайте файл `test-server.js`:

```javascript
const request = require("supertest");
const app = require("./server");

async function testServer() {
  try {
    console.log("🧪 Тестирование сервера...");

    // Тест health check
    const healthResponse = await request(app).get("/api/health").expect(200);

    console.log("✅ Health check:", healthResponse.body.message);

    // Тест получения категорий
    const categoriesResponse = await request(app)
      .get("/api/categories")
      .expect(200);

    console.log(
      "✅ Категории получены:",
      categoriesResponse.body.data.categories.length
    );

    // Тест 404 для несуществующего маршрута
    const notFoundResponse = await request(app)
      .get("/api/nonexistent")
      .expect(404);

    console.log("✅ 404 обрабатывается корректно");

    console.log("🎉 Все тесты сервера прошли успешно!");
  } catch (error) {
    console.error("❌ Ошибка при тестировании:", error.message);
  }
}

if (require.main === module) {
  testServer().then(() => process.exit(0));
}

module.exports = testServer;
```

---

## 📋 Задания для самопроверки

1. **Добавьте middleware** для логирования времени ответа
2. **Создайте rate limiting** для конкретных маршрутов
3. **Реализуйте caching** для статических данных
4. **Добавьте websocket** поддержку для real-time уведомлений

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Безопасный Express.js сервер  
✅ Middleware для аутентификации и авторизации  
✅ Валидация данных  
✅ Обработка ошибок  
✅ Базовые API маршруты

**Следующий шаг:** [07_AUTHENTICATION_SYSTEM.md](07_AUTHENTICATION_SYSTEM.md) - создание полной системы аутентификации с JWT токенами.

---

_Время выполнения: ~2-3 часа_  
_Сложность: 🟡 Средняя_
