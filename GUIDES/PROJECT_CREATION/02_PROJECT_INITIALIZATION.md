# 📦 Инициализация проекта и зависимости

## 🎯 Цель раздела

В этом разделе мы инициализируем npm проект, установим все необходимые зависимости и настроим основные конфигурационные файлы.

---

## 🚀 Инициализация npm проекта

### Шаг 1: Создание package.json

```bash
# Переходим в папку проекта
cd bookstore

# Инициализируем npm проект
npm init -y
```

### Шаг 2: Настройка package.json

Отредактируйте созданный `package.json`:

```json
{
  "name": "bookstore",
  "version": "1.0.0",
  "description": "Современный интернет-магазин книг",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:create": "sequelize-cli db:create",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:migrate:undo:all": "sequelize-cli db:migrate:undo:all",
    "db:seed": "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all",
    "db:reset": "npm run db:migrate:undo:all && npm run db:migrate && npm run db:seed",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "prettier": "prettier --write .",
    "build": "echo 'Build step placeholder'",
    "production": "NODE_ENV=production node server.js"
  },
  "keywords": [
    "bookstore",
    "e-commerce",
    "books",
    "nodejs",
    "express",
    "postgresql"
  ],
  "author": "Ваше имя <ваш@email.com>",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=7.0.0"
  }
}
```

---

## 📚 Установка зависимостей

### Основные зависимости (dependencies)

```bash
# Backend framework и middleware
npm install express cors helmet morgan

# База данных и ORM
npm install sequelize pg pg-hstore

# Аутентификация и безопасность
npm install jsonwebtoken bcryptjs express-validator

# Переменные окружения
npm install dotenv

# Ограничение частоты запросов
npm install express-rate-limit

# Валидация данных
npm install joi
```

### Зависимости для разработки (devDependencies)

```bash
# Инструменты разработки
npm install --save-dev nodemon sequelize-cli

# Тестирование
npm install --save-dev jest supertest

# Линтинг и форматирование
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier

# Дополнительные инструменты
npm install --save-dev husky lint-staged
```

### Проверка установки

```bash
# Просмотр установленных пакетов
npm list --depth=0

# Проверка уязвимостей
npm audit
```

---

## ⚙️ Настройка конфигурационных файлов

### 1. Переменные окружения (.env)

Создайте файл `.env`:

```bash
touch .env
```

```properties
# Режим работы приложения
NODE_ENV=development

# Порт сервера
PORT=3000

# JWT настройки
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=postgres
DB_PASSWORD=your-password-here

# Безопасность
BCRYPT_SALT_ROUNDS=12

# CORS настройки
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Шаблон переменных (.env.example)

```bash
touch .env.example
```

```properties
# Режим работы приложения (development, production, test)
NODE_ENV=development

# Порт сервера
PORT=3000

# JWT настройки
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=postgres
DB_PASSWORD=your-password-here

# Для production можно использовать полный URL
# DATABASE_URL=postgresql://user:password@host:5432/database

# Безопасность
BCRYPT_SALT_ROUNDS=12

# CORS настройки
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. ESLint конфигурация (.eslintrc.json)

```bash
touch .eslintrc.json
```

```json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": ["eslint:recommended", "prettier"],
  "plugins": ["prettier"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "prettier/prettier": "error",
    "no-console": "warn",
    "no-unused-vars": "error",
    "no-undef": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 4. Prettier конфигурация (.prettierrc)

```bash
touch .prettierrc
```

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 5. Игнорирование файлов для Prettier (.prettierignore)

```bash
touch .prettierignore
```

```
node_modules
dist
build
*.log
.env
.env.*
coverage
*.md
package-lock.json
```

---

## 🗄️ Инициализация Sequelize

### Шаг 1: Создание конфигурации

```bash
# Инициализация Sequelize
npx sequelize-cli init
```

Эта команда создаст:

- `config/config.json` - конфигурация базы данных
- `models/index.js` - файл инициализации моделей
- `migrations/` - папка для миграций
- `seeders/` - папка для сидеров

### Шаг 2: Настройка конфигурации БД

Отредактируйте `config/config.json`:

```json
{
  "development": {
    "username": "postgres",
    "password": "your-password",
    "database": "bookstore",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": false
  },
  "test": {
    "username": "postgres",
    "password": "your-password",
    "database": "bookstore_test",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": false
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    },
    "logging": false
  }
}
```

---

## 📄 Создание основных файлов

### 1. Главный файл сервера (server.js)

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware безопасности
app.use(
  helmet({
    contentSecurityPolicy: false, // Отключаем для локальной разработки
  })
);

// Логирование запросов
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // лимит запросов
  message: "Слишком много запросов с этого IP, попробуйте позже.",
});
app.use("/api/", limiter);

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
};
app.use(cors(corsOptions));

// Парсинг JSON и URL-encoded данных
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, "public")));

// Базовый роут для проверки сервера
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Сервер работает",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// TODO: Подключение API маршрутов
// app.use('/api/auth', require('./src/routes/auth'));
// app.use('/api/books', require('./src/routes/books'));
// app.use('/api/cart', require('./src/routes/cart'));

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    error: "Страница не найдена",
    path: req.path,
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Произошла ошибка сервера",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Внутренняя ошибка сервера",
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 Окружение: ${process.env.NODE_ENV}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
```

### 2. Базовая HTML страница (public/index.html)

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Книжный магазин</title>
    <link rel="stylesheet" href="style/style.css" />
  </head>
  <body>
    <header>
      <div class="container">
        <h1>📚 Книжный магазин</h1>
        <nav>
          <ul>
            <li><a href="/">Главная</a></li>
            <li><a href="/html/catalog.html">Каталог</a></li>
            <li><a href="/html/about.html">О нас</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="container">
      <section class="hero">
        <h2>Добро пожаловать в наш книжный магазин!</h2>
        <p>Здесь вы найдете лучшие книги по доступным ценам</p>
        <a href="/html/catalog.html" class="btn btn-primary"
          >Перейти к каталогу</a
        >
      </section>

      <section class="features">
        <div class="feature">
          <h3>🚀 Быстрая доставка</h3>
          <p>Доставим ваши книги в кратчайшие сроки</p>
        </div>
        <div class="feature">
          <h3>📖 Широкий выбор</h3>
          <p>Тысячи книг различных жанров и авторов</p>
        </div>
        <div class="feature">
          <h3>💰 Доступные цены</h3>
          <p>Лучшие цены на рынке книжной индустрии</p>
        </div>
      </section>
    </main>

    <footer>
      <div class="container">
        <p>&copy; 2025 Книжный магазин. Все права защищены.</p>
      </div>
    </footer>
  </body>
</html>
```

### 3. Базовые стили (public/style/style.css)

```css
/* Базовые стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Arial", sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Заголовки */
h1,
h2,
h3 {
  margin-bottom: 1rem;
}

/* Заголовок сайта */
header {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Навигация */
nav ul {
  list-style: none;
  display: flex;
  gap: 2rem;
}

nav a {
  color: white;
  text-decoration: none;
  transition: color 0.3s;
}

nav a:hover {
  color: #3498db;
}

/* Основной контент */
main {
  min-height: calc(100vh - 200px);
  padding: 2rem 0;
}

/* Секция hero */
.hero {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.hero h2 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

/* Кнопки */
.btn {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 5px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

/* Особенности */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

/* Подвал */
footer {
  background: #2c3e50;
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-top: auto;
}

/* Адаптивность */
@media (max-width: 768px) {
  header .container {
    flex-direction: column;
    gap: 1rem;
  }

  nav ul {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .hero h2 {
    font-size: 2rem;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
```

---

## 🧪 Тестирование настройки

### Шаг 1: Проверка зависимостей

```bash
# Проверить все ли пакеты установлены
npm list

# Проверить уязвимости
npm audit

# Исправить уязвимости (если есть)
npm audit fix
```

### Шаг 2: Проверка линтинга

```bash
# Проверка ESLint
npm run lint

# Автоматическое исправление
npm run lint:fix

# Форматирование кода
npm run prettier
```

### Шаг 3: Запуск сервера

```bash
# Запуск в режиме разработки
npm run dev

# Проверка health endpoint
curl http://localhost:3000/api/health
```

**Ожидаемый ответ:**

```json
{
  "status": "OK",
  "message": "Сервер работает",
  "timestamp": "2025-11-09T12:00:00.000Z",
  "environment": "development"
}
```

### Шаг 4: Проверка frontend

Откройте браузер и перейдите на `http://localhost:3000` - вы должны увидеть базовую страницу магазина.

---

## ✅ Контрольный список

После выполнения всех шагов убедитесь, что:

- [ ] package.json создан и настроен
- [ ] Все зависимости установлены
- [ ] .env файл создан и заполнен
- [ ] .env.example создан как шаблон
- [ ] ESLint и Prettier настроены
- [ ] Sequelize инициализирован
- [ ] server.js создан и работает
- [ ] Базовая HTML страница создана
- [ ] Базовые стили добавлены
- [ ] Сервер запускается без ошибок
- [ ] Health endpoint отвечает
- [ ] Frontend загружается в браузере

---

## 🔧 Устранение неполадок

### Проблема: "Cannot find module"

**Решение:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Проблема: Ошибки ESLint

**Решение:**

```bash
npm run lint:fix
npm run prettier
```

### Проблема: Сервер не запускается

**Решение:**

1. Проверьте порт в .env
2. Убедитесь что порт свободен
3. Проверьте логи на ошибки

### Проблема: "sequelize command not found"

**Решение:**

```bash
npm install -g sequelize-cli
# Или используйте npx
npx sequelize-cli --help
```

---

## 📁 Итоговая структура проекта

```
bookstore/
├── .env
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── .prettierignore
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── README.md
├── config/
│   └── config.json
├── models/
│   └── index.js
├── migrations/
├── seeders/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── public/
│   ├── index.html
│   ├── html/
│   ├── scripts/
│   ├── style/
│   │   └── style.css
│   ├── img/
│   └── data/
├── tests/
└── docs/
```

---

## ➡️ Что дальше?

Проект успешно инициализирован! Переходите к следующему разделу:
**[03_DATABASE_SETUP.md](03_DATABASE_SETUP.md)** - Настройка базы данных PostgreSQL.

---

_Время выполнения: 1-2 часа_  
_Сложность: 🟢 Легко_
