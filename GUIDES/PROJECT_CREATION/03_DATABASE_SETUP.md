# 🗄️ Настройка базы данных PostgreSQL

## 🎯 Цель раздела

В этом разделе мы создадим и настроим базу данных PostgreSQL, установим соединение с Sequelize ORM и протестируем подключение.

---

## 🔧 Подготовка PostgreSQL

### Шаг 1: Проверка установки PostgreSQL

```bash
# Проверка версии PostgreSQL
psql --version

# Ожидаемый результат: psql (PostgreSQL) 12.0 или выше
```

### Шаг 2: Запуск службы PostgreSQL

#### Windows:

```bash
# PostgreSQL должен запускаться автоматически
# Если нет, запустите службу через Services.msc
# Или используйте команду:
net start postgresql-x64-14
```

#### macOS:

```bash
# Запуск через Homebrew
brew services start postgresql

# Или вручную
pg_ctl -D /usr/local/var/postgres start
```

#### Ubuntu/Linux:

```bash
# Запуск службы
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверка статуса
sudo systemctl status postgresql
```

### Шаг 3: Подключение к PostgreSQL

```bash
# Подключение от имени пользователя postgres
psql -U postgres

# Если нужен пароль, система запросит его
```

---

## 🏗️ Создание базы данных

### Шаг 1: Создание основной базы данных

```sql
-- В консоли PostgreSQL (psql)

-- Создание базы данных для разработки
CREATE DATABASE bookstore;

-- Создание базы данных для тестирования
CREATE DATABASE bookstore_test;

-- Просмотр созданных баз данных
\l

-- Выход из psql
\q
```

### Шаг 2: Альтернативный способ через командную строку

```bash
# Создание баз данных через командную строку
createdb -U postgres bookstore
createdb -U postgres bookstore_test

# Проверка созданных баз
psql -U postgres -l
```

### Шаг 3: Создание пользователя (опционально)

```sql
-- Создание отдельного пользователя для приложения
CREATE USER bookstore_user WITH ENCRYPTED PASSWORD 'secure_password_123';

-- Предоставление прав на базы данных
GRANT ALL PRIVILEGES ON DATABASE bookstore TO bookstore_user;
GRANT ALL PRIVILEGES ON DATABASE bookstore_test TO bookstore_user;

-- Предоставление прав на создание таблиц
ALTER USER bookstore_user CREATEDB;
```

---

## ⚙️ Настройка Sequelize

### Шаг 1: Обновление конфигурации

Отредактируйте `config/config.json`:

```json
{
  "development": {
    "username": "postgres",
    "password": "ваш_пароль_postgres",
    "database": "bookstore",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": console.log,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  },
  "test": {
    "username": "postgres",
    "password": "ваш_пароль_postgres",
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
    "logging": false,
    "pool": {
      "max": 10,
      "min": 2,
      "acquire": 60000,
      "idle": 10000
    }
  }
}
```

### Шаг 2: Обновление models/index.js

Отредактируйте `models/index.js` для поддержки переменных окружения:

```javascript
"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Используем переменные окружения, если они доступны
  const dbConfig = {
    ...config,
    host: process.env.DB_HOST || config.host,
    port: process.env.DB_PORT || config.port,
    database: process.env.DB_NAME || config.database,
    username: process.env.DB_USER || config.username,
    password: process.env.DB_PASSWORD || config.password,
  };
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

### Шаг 3: Обновление переменных окружения

Обновите `.env` файл с правильными данными:

```properties
# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=postgres
DB_PASSWORD=ваш_реальный_пароль

# Для production
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 🧪 Тестирование подключения

### Шаг 1: Создание файла тестирования

Создайте файл `test-db-connection.js` в корне проекта:

```javascript
require("dotenv").config();
const { sequelize } = require("./models");

async function testConnection() {
  try {
    console.log("🔗 Попытка подключения к базе данных...");

    // Проверка аутентификации
    await sequelize.authenticate();
    console.log("✅ Подключение к базе данных установлено успешно");

    // Получение информации о базе данных
    const [results] = await sequelize.query("SELECT version()");
    console.log("📊 Версия PostgreSQL:", results[0].version);

    // Получение информации о подключении
    const dbName = sequelize.getDatabaseName();
    const dialect = sequelize.getDialect();
    console.log(`📂 База данных: ${dbName}`);
    console.log(`🔧 Диалект: ${dialect}`);

    // Проверка прав доступа
    const [schemas] = await sequelize.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'public'
    `);

    if (schemas.length > 0) {
      console.log("🔐 Права доступа: OK");
    }

    console.log("🎉 Все проверки пройдены успешно!");
  } catch (error) {
    console.error("❌ Ошибка подключения к базе данных:", error.message);

    // Дополнительная диагностика
    if (error.name === "ConnectionError") {
      console.log("\n🔍 Возможные причины:");
      console.log("1. PostgreSQL не запущен");
      console.log("2. Неверные данные подключения в .env");
      console.log("3. База данных не создана");
      console.log("4. Неверный пароль");
    }

    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("🔌 Соединение закрыто");
  }
}

// Запуск теста
testConnection();
```

### Шаг 2: Запуск теста подключения

```bash
# Запуск теста
node test-db-connection.js
```

**Ожидаемый результат:**

```
🔗 Попытка подключения к базе данных...
✅ Подключение к базе данных установлено успешно
📊 Версия PostgreSQL: PostgreSQL 14.9 on x86_64-pc-linux-gnu...
📂 База данных: bookstore
🔧 Диалект: postgres
🔐 Права доступа: OK
🎉 Все проверки пройдены успешно!
🔌 Соединение закрыто
```

### Шаг 3: Добавление npm скрипта

Добавьте в `package.json`:

```json
{
  "scripts": {
    "test:db": "node test-db-connection.js"
  }
}
```

---

## 🛠️ Sequelize CLI команды

### Основные команды для работы с БД:

```bash
# Создание базы данных
npm run db:create

# Проверка статуса миграций
npx sequelize-cli db:migrate:status

# Применение миграций (когда они будут созданы)
npm run db:migrate

# Откат миграций
npm run db:migrate:undo

# Заполнение БД данными (когда сидеры будут созданы)
npm run db:seed

# Полный сброс БД
npm run db:reset
```

### Создание файлов через CLI:

```bash
# Создание новой миграции
npx sequelize-cli migration:generate --name create-example-table

# Создание новой модели с миграцией
npx sequelize-cli model:generate --name Example --attributes name:string,email:string

# Создание сидера
npx sequelize-cli seed:generate --name demo-example
```

---

## 🔐 Настройка безопасности БД

### 1. Настройка pg_hba.conf (для продакшн)

Найдите файл `pg_hba.conf` и настройте доступ:

```bash
# Найти файл конфигурации
sudo find / -name pg_hba.conf 2>/dev/null

# Редактирование (пример для Ubuntu)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Добавьте строку для вашего приложения:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   bookstore       bookstore_user                          md5
host    bookstore       bookstore_user  127.0.0.1/32           md5
```

### 2. Настройка postgresql.conf

```bash
# Редактирование основного конфига
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Основные параметры для разработки:

```ini
# Подключения
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Память
shared_buffers = 256MB
effective_cache_size = 1GB

# Логирование
log_statement = 'all'          # Только для разработки!
log_duration = on              # Только для разработки!
```

### 3. Перезапуск PostgreSQL после изменений

```bash
# Ubuntu/Linux
sudo systemctl restart postgresql

# macOS
brew services restart postgresql

# Windows
net stop postgresql-x64-14
net start postgresql-x64-14
```

---

## 📊 Мониторинг и отладка

### 1. Полезные SQL запросы

Создайте файл `db-diagnostics.sql`:

```sql
-- Информация о базе данных
SELECT
    datname as "Database",
    pg_size_pretty(pg_database_size(datname)) as "Size"
FROM pg_database
WHERE datname IN ('bookstore', 'bookstore_test');

-- Активные соединения
SELECT
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE datname = 'bookstore';

-- Информация о таблицах (после создания моделей)
SELECT
    schemaname,
    tablename,
    attname,
    typname,
    attlen
FROM pg_tables t
JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
JOIN pg_type ty ON ty.oid = a.atttypid
WHERE schemaname = 'public'
AND attnum > 0
ORDER BY tablename, attnum;
```

### 2. Логирование в приложении

Обновите `server.js` для логирования БД операций:

```javascript
// В development режиме логируем SQL запросы
if (process.env.NODE_ENV === "development") {
  const { sequelize } = require("./models");

  sequelize.options.logging = (sql, timing) => {
    console.log(`🗄️  [${new Date().toISOString()}] ${sql}`);
    if (timing) {
      console.log(`⏱️  Время выполнения: ${timing}ms`);
    }
  };
}
```

---

## ✅ Контрольный список

После выполнения всех шагов убедитесь, что:

- [ ] PostgreSQL установлен и запущен
- [ ] База данных `bookstore` создана
- [ ] База данных `bookstore_test` создана
- [ ] Пользователь и пароль настроены
- [ ] config/config.json обновлен с правильными данными
- [ ] .env файл содержит корректные DB\_\* переменные
- [ ] models/index.js поддерживает переменные окружения
- [ ] Тест подключения проходит успешно
- [ ] npm run db:create выполняется без ошибок
- [ ] Sequelize CLI команды работают

---

## 🔧 Устранение неполадок

### Проблема: "psql: FATAL: role does not exist"

**Решение:**

```bash
# Создайте пользователя postgres
sudo -u postgres createuser --superuser $USER
# Или используйте существующего пользователя
```

### Проблема: "database does not exist"

**Решение:**

```bash
# Убедитесь, что база создана
createdb -U postgres bookstore
# Или через SQL
psql -U postgres -c "CREATE DATABASE bookstore;"
```

### Проблема: "password authentication failed"

**Решение:**

1. Проверьте пароль в .env файле
2. Сбросьте пароль пользователя postgres:

```sql
ALTER USER postgres PASSWORD 'новый_пароль';
```

### Проблема: "connection refused"

**Решение:**

1. Убедитесь, что PostgreSQL запущен
2. Проверьте порт (обычно 5432)
3. Проверьте файл pg_hba.conf

### Проблема: Медленные запросы

**Решение:**

```sql
-- Включить логирование медленных запросов
SET log_min_duration_statement = 100; -- 100ms
```

---

## 📈 Оптимизация производительности

### 1. Настройка пула соединений

В `config/config.json`:

```json
{
  "development": {
    "pool": {
      "max": 5, // Максимум соединений
      "min": 0, // Минимум соединений
      "acquire": 30000, // Тайм-аут получения соединения (30с)
      "idle": 10000 // Тайм-аут простоя соединения (10с)
    }
  }
}
```

### 2. Индексы базы данных

```sql
-- Примеры полезных индексов (создадим позже)
CREATE INDEX CONCURRENTLY idx_books_title ON books(title);
CREATE INDEX CONCURRENTLY idx_books_category ON books(category_id);
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

---

## 📁 Файловая структура после настройки

```
bookstore/
├── config/
│   └── config.json          # ✅ Обновлен
├── models/
│   └── index.js             # ✅ Обновлен
├── .env                     # ✅ Содержит DB настройки
├── test-db-connection.js    # ✅ Создан
├── db-diagnostics.sql       # ✅ Создан
└── package.json             # ✅ Содержит DB скрипты
```

---

## ➡️ Что дальше?

База данных успешно настроена! Переходите к следующему разделу:
**[04_DATABASE_MODELS.md](04_DATABASE_MODELS.md)** - Создание моделей данных для книжного магазина.

---

_Время выполнения: 1-2 часа_  
_Сложность: 🟡 Средне_
