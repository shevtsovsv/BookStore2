# 🔐 Безопасность и лучшие практики

> **Сложность:** 🔴 Сложная  
> **Время выполнения:** 3-4 часа  
> **Предварительные требования:** Завершение части 13

## 🎯 Цели этой части

В этой части вы реализуете комплексные меры безопасности:

- Защиту от основных веб-атак
- Валидацию и санитизацию данных
- Безопасное управление сессиями
- Логирование и мониторинг
- Защиту файлов и конфигураций

---

## 🛡️ Middleware безопасности

### 1. Расширенная защита с Helmet

Обновите файл `src/middleware/security.js`:

```javascript
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

// Конфигурация CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешенные домены
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:8080",
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
    ].filter(Boolean);

    // Разрешить запросы без origin (мобильные приложения, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Доступ запрещен CORS политикой"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-CSRF-Token",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Конфигурация Helmet
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://www.google.com",
        "https://www.gstatic.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.bookstore.com", "wss:"],
      frameSrc: ["'self'", "https://www.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
};

// Основной лимит запросов
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // лимит запросов
  message: {
    error: "Слишком много запросов с этого IP, попробуйте позже.",
    retryAfter: "15 минут",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Пропуск для статических файлов
  skip: (req) => {
    return (
      req.url.startsWith("/img/") ||
      req.url.startsWith("/style/") ||
      req.url.startsWith("/scripts/")
    );
  },
});

// Строгий лимит для аутентификации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // максимум 5 попыток входа за 15 минут
  message: {
    error: "Слишком много попыток входа. Попробуйте позже.",
    retryAfter: "15 минут",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // не считать успешные запросы
});

// Лимит для API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 60, // 60 запросов в минуту
  message: {
    error: "Превышен лимит API запросов",
    retryAfter: "1 минута",
  },
});

// Замедление подозрительных запросов
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // замедлять после 50 запросов
  delayMs: 500, // задержка 500мс
  maxDelayMs: 20000, // максимальная задержка 20сек
});

// Middleware для проверки User-Agent
const userAgentCheck = (req, res, next) => {
  const userAgent = req.get("User-Agent");

  // Блокировка подозрительных User-Agent
  const suspiciousAgents = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /curl.*bot/i,
    /python-requests/i,
  ];

  if (
    !userAgent ||
    suspiciousAgents.some((pattern) => pattern.test(userAgent))
  ) {
    return res.status(403).json({
      error: "Доступ запрещен",
    });
  }

  next();
};

// Защита от атак по времени
const timingAttackProtection = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Минимальная задержка для критических эндпоинтов
    if (req.path.includes("/auth/") && duration < 100) {
      setTimeout(() => {}, 100 - duration);
    }
  });

  next();
};

// IP Whitelist для admin панели
const adminIPWhitelist = (req, res, next) => {
  if (!req.path.startsWith("/admin/")) {
    return next();
  }

  const allowedIPs = (process.env.ADMIN_ALLOWED_IPS || "").split(",");
  const clientIP = req.ip || req.connection.remoteAddress;

  if (process.env.NODE_ENV === "development" || allowedIPs.includes(clientIP)) {
    return next();
  }

  return res.status(403).json({
    error: "Доступ к админ панели запрещен с вашего IP",
  });
};

// Детекция аномальных запросов
const anomalyDetection = (req, res, next) => {
  const anomalies = [];

  // Проверка размера запроса
  if (req.get("content-length") > 10 * 1024 * 1024) {
    // 10MB
    anomalies.push("large_request");
  }

  // Проверка на SQL инъекции в URL
  const sqlPatterns =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i;
  if (sqlPatterns.test(req.url)) {
    anomalies.push("sql_injection_attempt");
  }

  // Проверка на XSS в параметрах
  const xssPatterns = /<script|javascript:|vbscript:|onload=|onerror=/i;
  if (xssPatterns.test(req.url)) {
    anomalies.push("xss_attempt");
  }

  // Проверка на path traversal
  if (req.url.includes("../") || req.url.includes("..\\")) {
    anomalies.push("path_traversal");
  }

  if (anomalies.length > 0) {
    console.warn(`Аномальный запрос обнаружен:`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      anomalies,
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({
      error: "Недопустимый запрос",
    });
  }

  next();
};

// Основная функция настройки безопасности
const setupSecurity = (app) => {
  // Доверенные прокси (для получения реального IP)
  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

  // Скрытие технических заголовков
  app.disable("x-powered-by");

  // CORS
  app.use(cors(corsOptions));

  // Helmet для базовой защиты
  app.use(helmet(helmetOptions));

  // Общие лимиты
  app.use(generalLimiter);
  app.use(speedLimiter);

  // Санитизация данных
  app.use(mongoSanitize()); // Защита от NoSQL инъекций
  app.use(xss()); // Защита от XSS
  app.use(hpp()); // Защита от HTTP Parameter Pollution

  // Кастомные проверки безопасности
  app.use(userAgentCheck);
  app.use(anomalyDetection);
  app.use(timingAttackProtection);
  app.use(adminIPWhitelist);

  // Специфичные лимиты для API
  app.use("/api/", apiLimiter);
  app.use("/api/auth/", authLimiter);

  // Заголовки безопасности
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    // Удаление технических заголовков
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    next();
  });
};

module.exports = {
  setupSecurity,
  generalLimiter,
  authLimiter,
  apiLimiter,
  corsOptions,
};
```

### 2. Валидация и санитизация данных

Создайте файл `src/middleware/dataValidation.js`:

```javascript
const Joi = require("joi");
const DOMPurify = require("isomorphic-dompurify");
const validator = require("validator");

// Кастомные валидаторы Joi
const customJoi = Joi.extend((joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.slug": "{{#label}} должен быть валидным slug",
    "string.strongPassword":
      "{{#label}} должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры",
    "string.phone": "{{#label}} должен быть валидным номером телефона",
    "string.cleanHtml": "{{#label}} содержит недопустимые HTML теги",
  },
  rules: {
    slug: {
      validate(value, helpers) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(value)) {
          return helpers.error("string.slug");
        }
        return value;
      },
    },
    strongPassword: {
      validate(value, helpers) {
        const strongPasswordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(value)) {
          return helpers.error("string.strongPassword");
        }
        return value;
      },
    },
    phone: {
      validate(value, helpers) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          return helpers.error("string.phone");
        }
        return value;
      },
    },
    cleanHtml: {
      validate(value, helpers) {
        const cleaned = DOMPurify.sanitize(value, {
          ALLOWED_TAGS: ["p", "br", "strong", "em", "u"],
          ALLOWED_ATTR: [],
        });

        if (cleaned !== value) {
          return helpers.error("string.cleanHtml");
        }
        return cleaned;
      },
    },
  },
}));

// Базовые схемы валидации
const baseSchemas = {
  id: customJoi.number().integer().positive(),
  email: customJoi.string().email().max(255),
  password: customJoi.string().strongPassword(),
  name: customJoi
    .string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Zа-яА-Я\s-']+$/),
  slug: customJoi.string().slug(),
  url: customJoi.string().uri(),
  phone: customJoi.string().phone(),
  text: customJoi.string().max(1000),
  html: customJoi.string().cleanHtml().max(5000),
  price: customJoi.number().precision(2).positive(),
  isbn: customJoi.string().pattern(/^(?:\d{9}[\dX]|\d{13})$/),
  year: customJoi.number().integer().min(1000).max(new Date().getFullYear()),
  language: customJoi.string().valid("ru", "en", "fr", "de", "es"),
  sort: customJoi
    .string()
    .valid(
      "title-ASC",
      "title-DESC",
      "price-ASC",
      "price-DESC",
      "createdAt-ASC",
      "createdAt-DESC",
      "rating-DESC"
    ),
  pagination: {
    page: customJoi.number().integer().min(1).default(1),
    limit: customJoi.number().integer().min(1).max(100).default(12),
  },
};

// Расширенные схемы для сущностей
const entitySchemas = {
  // Пользователь
  user: {
    register: customJoi.object({
      firstName: baseSchemas.name.required(),
      lastName: baseSchemas.name.required(),
      email: baseSchemas.email.required(),
      password: baseSchemas.password.required(),
      phone: baseSchemas.phone.optional(),
      acceptTerms: customJoi.boolean().valid(true).required(),
      newsletterSubscribe: customJoi.boolean().default(false),
    }),

    login: customJoi.object({
      email: baseSchemas.email.required(),
      password: customJoi.string().required(),
      rememberMe: customJoi.boolean().default(false),
    }),

    profile: customJoi.object({
      firstName: baseSchemas.name,
      lastName: baseSchemas.name,
      phone: baseSchemas.phone,
      dateOfBirth: customJoi.date().max("now").optional(),
      bio: baseSchemas.text.optional(),
    }),

    changePassword: customJoi.object({
      currentPassword: customJoi.string().required(),
      newPassword: baseSchemas.password.required(),
      confirmPassword: customJoi
        .string()
        .valid(customJoi.ref("newPassword"))
        .required(),
    }),
  },

  // Книга
  book: {
    create: customJoi.object({
      title: customJoi.string().min(1).max(255).required(),
      subtitle: customJoi.string().max(255).optional(),
      description: baseSchemas.html.optional(),
      isbn: baseSchemas.isbn.optional(),
      publishedYear: baseSchemas.year.optional(),
      pages: customJoi.number().integer().positive().optional(),
      language: baseSchemas.language.default("ru"),
      price: baseSchemas.price.required(),
      categoryId: baseSchemas.id.required(),
      publisherId: baseSchemas.id.optional(),
      authorIds: customJoi.array().items(baseSchemas.id).min(1).required(),
      tags: customJoi
        .array()
        .items(customJoi.string().max(50))
        .max(10)
        .optional(),
      isFeatured: customJoi.boolean().default(false),
      isActive: customJoi.boolean().default(true),
    }),

    search: customJoi.object({
      search: customJoi.string().max(255).optional(),
      categoryId: baseSchemas.id.optional(),
      authorId: baseSchemas.id.optional(),
      publisherId: baseSchemas.id.optional(),
      minPrice: customJoi.number().positive().optional(),
      maxPrice: customJoi.number().positive().optional(),
      language: baseSchemas.language.optional(),
      featured: customJoi.boolean().optional(),
      sortBy: baseSchemas.sort.optional(),
      ...baseSchemas.pagination,
    }),
  },

  // Корзина
  cart: {
    addItem: customJoi.object({
      bookId: baseSchemas.id.required(),
      quantity: customJoi.number().integer().min(1).max(10).default(1),
    }),
  },

  // Заказ
  order: {
    create: customJoi.object({
      shippingAddress: customJoi
        .object({
          fullName: baseSchemas.name.required(),
          address: customJoi.string().min(10).max(200).required(),
          city: customJoi.string().min(2).max(100).required(),
          postalCode: customJoi
            .string()
            .pattern(/^\d{6}$/)
            .required(),
          phone: baseSchemas.phone.required(),
          email: baseSchemas.email.optional(),
        })
        .required(),
      paymentMethod: customJoi
        .string()
        .valid("cash", "card", "online")
        .default("cash"),
      notes: customJoi.string().max(500).optional(),
    }),
  },
};

// Функция санитизации данных
const sanitizeData = (data, options = {}) => {
  const {
    allowedTags = ["p", "br", "strong", "em"],
    maxLength = 1000,
    removeNullBytes = true,
  } = options;

  if (typeof data === "string") {
    let sanitized = data;

    // Удаление null bytes
    if (removeNullBytes) {
      sanitized = sanitized.replace(/\0/g, "");
    }

    // Обрезка длины
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // HTML санитизация
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: [],
    });

    // Экранирование SQL метасимволов
    sanitized = sanitized.replace(/['"\\;]/g, "\\$&");

    return sanitized.trim();
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, options));
  }

  if (data && typeof data === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value, options);
    }
    return sanitized;
  }

  return data;
};

// Middleware валидации
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data =
      source === "query"
        ? req.query
        : source === "params"
        ? req.params
        : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        message: "Ошибка валидации данных",
        errors: errorDetails,
      });
    }

    // Санитизация валидированных данных
    const sanitized = sanitizeData(value);

    // Замена исходных данных санитизированными
    if (source === "query") {
      req.query = sanitized;
    } else if (source === "params") {
      req.params = sanitized;
    } else {
      req.body = sanitized;
    }

    next();
  };
};

// Middleware для проверки CSRF токена
const csrfProtection = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: "Недействительный CSRF токен",
    });
  }

  next();
};

// Генерация CSRF токена
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require("crypto").randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// Проверка целостности данных
const integrityCheck = (req, res, next) => {
  // Проверка на консистентность данных
  if (req.body && typeof req.body === "object") {
    // Проверка на дублирование полей
    const keys = Object.keys(req.body);
    const uniqueKeys = [...new Set(keys)];

    if (keys.length !== uniqueKeys.length) {
      return res.status(400).json({
        success: false,
        message: "Обнаружены дублирующиеся поля",
      });
    }

    // Проверка на подозрительные поля
    const suspiciousFields = ["__proto__", "constructor", "prototype"];
    if (keys.some((key) => suspiciousFields.includes(key))) {
      return res.status(400).json({
        success: false,
        message: "Недопустимые поля в запросе",
      });
    }
  }

  next();
};

module.exports = {
  validate,
  sanitizeData,
  csrfProtection,
  generateCSRFToken,
  integrityCheck,
  schemas: entitySchemas,
  baseSchemas,
};
```

---

## 🔐 Система логирования безопасности

### 1. Security Logger

Создайте файл `src/utils/securityLogger.js`:

```javascript
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Создание директории для логов
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Конфигурация логгера безопасности
const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "security" },
  transports: [
    // Логи ошибок безопасности
    new winston.transports.File({
      filename: path.join(logsDir, "security-error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Все события безопасности
    new winston.transports.File({
      filename: path.join(logsDir, "security.log"),
      maxsize: 5242880,
      maxFiles: 10,
    }),

    // Критические события в отдельный файл
    new winston.transports.File({
      filename: path.join(logsDir, "security-critical.log"),
      level: "warn",
      maxsize: 5242880,
      maxFiles: 20,
    }),
  ],
});

// В режиме разработки также выводить в консоль
if (process.env.NODE_ENV !== "production") {
  securityLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Типы событий безопасности
const SecurityEventTypes = {
  // Аутентификация
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGIN_ATTEMPT_BLOCKED: "login_attempt_blocked",
  LOGOUT: "logout",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET_REQUEST: "password_reset_request",
  PASSWORD_RESET_SUCCESS: "password_reset_success",

  // Авторизация
  ACCESS_DENIED: "access_denied",
  PRIVILEGE_ESCALATION_ATTEMPT: "privilege_escalation_attempt",
  UNAUTHORIZED_API_ACCESS: "unauthorized_api_access",

  // Атаки
  SQL_INJECTION_ATTEMPT: "sql_injection_attempt",
  XSS_ATTEMPT: "xss_attempt",
  CSRF_ATTACK: "csrf_attack",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  SUSPICIOUS_REQUEST: "suspicious_request",

  // Данные
  DATA_BREACH_ATTEMPT: "data_breach_attempt",
  SENSITIVE_DATA_ACCESS: "sensitive_data_access",
  DATA_MODIFICATION: "data_modification",

  // Система
  CONFIG_CHANGE: "config_change",
  ADMIN_ACTION: "admin_action",
  SYSTEM_ERROR: "system_error",
};

// Функции логирования событий безопасности
const logSecurityEvent = (eventType, details = {}) => {
  const logData = {
    eventType,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Определение уровня логирования
  let level = "info";
  const criticalEvents = [
    SecurityEventTypes.LOGIN_ATTEMPT_BLOCKED,
    SecurityEventTypes.PRIVILEGE_ESCALATION_ATTEMPT,
    SecurityEventTypes.SQL_INJECTION_ATTEMPT,
    SecurityEventTypes.XSS_ATTEMPT,
    SecurityEventTypes.DATA_BREACH_ATTEMPT,
  ];

  if (criticalEvents.includes(eventType)) {
    level = "warn";
  }

  securityLogger.log(level, `Security Event: ${eventType}`, logData);
};

// Специализированные функции логирования
const securityEvents = {
  loginSuccess: (userId, ip, userAgent) => {
    logSecurityEvent(SecurityEventTypes.LOGIN_SUCCESS, {
      userId,
      ip,
      userAgent,
      severity: "low",
    });
  },

  loginFailure: (email, ip, userAgent, reason) => {
    logSecurityEvent(SecurityEventTypes.LOGIN_FAILURE, {
      email,
      ip,
      userAgent,
      reason,
      severity: "medium",
    });
  },

  suspiciousRequest: (ip, userAgent, url, reason, anomalies = []) => {
    logSecurityEvent(SecurityEventTypes.SUSPICIOUS_REQUEST, {
      ip,
      userAgent,
      url,
      reason,
      anomalies,
      severity: "high",
    });
  },

  rateLimitExceeded: (ip, endpoint, attempts) => {
    logSecurityEvent(SecurityEventTypes.RATE_LIMIT_EXCEEDED, {
      ip,
      endpoint,
      attempts,
      severity: "medium",
    });
  },

  accessDenied: (userId, resource, ip, reason) => {
    logSecurityEvent(SecurityEventTypes.ACCESS_DENIED, {
      userId,
      resource,
      ip,
      reason,
      severity: "medium",
    });
  },

  adminAction: (userId, action, target, ip) => {
    logSecurityEvent(SecurityEventTypes.ADMIN_ACTION, {
      userId,
      action,
      target,
      ip,
      severity: "high",
    });
  },

  dataModification: (userId, table, recordId, changes, ip) => {
    logSecurityEvent(SecurityEventTypes.DATA_MODIFICATION, {
      userId,
      table,
      recordId,
      changes,
      ip,
      severity: "medium",
    });
  },
};

// Middleware для автоматического логирования запросов
const securityLoggingMiddleware = (req, res, next) => {
  // Логирование подозрительных запросов
  const suspiciousPatterns = [
    /\b(union|select|insert|update|delete|drop|create|alter|exec)\b/i,
    /<script|javascript:|vbscript:|onload=|onerror=/i,
    /\.\.\/|\.\.\\|\0/,
    /\b(cmd|powershell|bash|sh)\b/i,
  ];

  const url = req.originalUrl || req.url;
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});

  // Проверка на подозрительные паттерны
  const combinedData = `${url} ${body} ${query}`;
  const detectedPatterns = suspiciousPatterns
    .map((pattern, index) => (pattern.test(combinedData) ? index : null))
    .filter((index) => index !== null);

  if (detectedPatterns.length > 0) {
    securityEvents.suspiciousRequest(
      req.ip,
      req.get("User-Agent"),
      url,
      "Suspicious patterns detected",
      detectedPatterns.map((i) => `pattern_${i}`)
    );
  }

  // Логирование успешных ответов для чувствительных эндпоинтов
  const originalSend = res.send;
  res.send = function (data) {
    const sensitiveEndpoints = ["/api/auth/", "/api/admin/", "/api/users/"];

    if (sensitiveEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
      securityLogger.info("Sensitive endpoint access", {
        userId: req.user?.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Анализ логов безопасности для обнаружения аномалий
const analyzeSecurityLogs = async () => {
  try {
    const logFile = path.join(logsDir, "security.log");

    if (!fs.existsSync(logFile)) {
      return { status: "no_logs" };
    }

    const logs = fs
      .readFileSync(logFile, "utf8")
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((log) => log);

    // Анализ последних 24 часов
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(
      (log) => new Date(log.timestamp) > yesterday
    );

    // Подсчет событий по типам
    const eventCounts = recentLogs.reduce((acc, log) => {
      acc[log.eventType] = (acc[log.eventType] || 0) + 1;
      return acc;
    }, {});

    // Анализ IP адресов
    const ipCounts = recentLogs.reduce((acc, log) => {
      if (log.ip) {
        acc[log.ip] = (acc[log.ip] || 0) + 1;
      }
      return acc;
    }, {});

    // Определение аномалий
    const anomalies = [];

    // Слишком много неудачных попыток входа
    if (eventCounts[SecurityEventTypes.LOGIN_FAILURE] > 100) {
      anomalies.push({
        type: "excessive_login_failures",
        count: eventCounts[SecurityEventTypes.LOGIN_FAILURE],
        severity: "high",
      });
    }

    // Подозрительная активность с одного IP
    Object.entries(ipCounts).forEach(([ip, count]) => {
      if (count > 1000) {
        anomalies.push({
          type: "suspicious_ip_activity",
          ip,
          count,
          severity: "high",
        });
      }
    });

    return {
      status: "analyzed",
      period: "24h",
      totalEvents: recentLogs.length,
      eventCounts,
      topIPs: Object.entries(ipCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      anomalies,
    };
  } catch (error) {
    securityLogger.error("Error analyzing security logs", {
      error: error.message,
    });
    return { status: "error", error: error.message };
  }
};

module.exports = {
  securityLogger,
  SecurityEventTypes,
  securityEvents,
  securityLoggingMiddleware,
  analyzeSecurityLogs,
};
```

---

## 🛡️ Защита файлов и конфигураций

### 1. Защита конфиденциальных файлов

Создайте файл `.env.example`:

```bash
# =================================
# ПРИМЕР КОНФИГУРАЦИИ ОКРУЖЕНИЯ
# =================================

# Основные настройки
NODE_ENV=development
PORT=3000
HOST=localhost

# База данных
DATABASE_URL=postgresql://username:password@localhost:5432/bookstore
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=your_username
DB_PASS=your_password

# JWT токены
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Шифрование
ENCRYPTION_KEY=32-character-encryption-key-here
BCRYPT_ROUNDS=12

# Email настройки
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@bookstore.com

# URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# Файловое хранилище
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Внешние API
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
PAYMENT_API_KEY=your-payment-api-key

# Безопасность
ADMIN_ALLOWED_IPS=127.0.0.1,::1
SESSION_SECRET=your-session-secret-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Логирование
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=5242880
LOG_MAX_FILES=5

# Redis (для кэша и сессий)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Мониторинг
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

### 2. Настройка nginx для продакшена

Создайте файл `nginx.conf.example`:

```nginx
# Конфигурация Nginx для BookStore

# Основной сервер
server {
    listen 80;
    server_name bookstore.com www.bookstore.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bookstore.com www.bookstore.com;

    # SSL сертификаты
    ssl_certificate /etc/ssl/certs/bookstore.crt;
    ssl_certificate_key /etc/ssl/private/bookstore.key;

    # SSL настройки безопасности
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Заголовки безопасности
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';" always;

    # Скрытие версии сервера
    server_tokens off;

    # Основные настройки
    root /var/www/bookstore/public;
    index index.html;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # Кэширование статических файлов
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
    }

    # Запрет доступа к чувствительным файлам
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /\.git {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ package\.json {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.env {
        deny all;
        access_log off;
        log_not_found off;
    }

    # API проксирование
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Таймауты
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Ограничение частоты запросов
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статические файлы
    location / {
        try_files $uri $uri/ /index.html;

        # Дополнительные заголовки безопасности для HTML
        location ~ \.html$ {
            add_header X-Frame-Options DENY always;
            add_header X-Content-Type-Options nosniff always;
            expires -1;
        }
    }

    # Логирование
    access_log /var/log/nginx/bookstore_access.log;
    error_log /var/log/nginx/bookstore_error.log;
}

# Дополнительные настройки безопасности
http {
    # Ограничение частоты запросов
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

    # Скрытие версии Nginx
    server_tokens off;

    # Защита от медленных атак
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;

    # Размеры буферов
    client_body_buffer_size 1K;
    client_header_buffer_size 1k;
    client_max_body_size 10M;
    large_client_header_buffers 2 1k;
}
```

---

## 📋 Задания для самопроверки

1. **Настройте мониторинг безопасности** с уведомлениями
2. **Реализуйте двухфакторную аутентификацию** (2FA)
3. **Добавьте шифрование чувствительных данных** в базе
4. **Создайте систему резервного копирования** с шифрованием

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Комплексная защита от веб-атак  
✅ Система логирования безопасности  
✅ Валидация и санитизация данных  
✅ Защищенная конфигурация сервера

**Следующий шаг:** [15_PERFORMANCE_OPTIMIZATION.md](15_PERFORMANCE_OPTIMIZATION.md) - оптимизация производительности.

---

_Время выполнения: ~3-4 часа_  
_Сложность: 🔴 Сложная_
