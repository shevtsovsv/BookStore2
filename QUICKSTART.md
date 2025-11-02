# 🚀 Быстрый старт проекта BookStore

## Первоначальная настройка (один раз)

### 1. Клонирование и установка

```bash
# Клонировать репозиторий
git clone <URL>
cd bookstore

# Установить зависимости
npm install
```

### 2. Настройка переменных окружения

```bash
# Скопировать шаблон
copy .env.example .env

# Открыть и заполнить своими данными
notepad .env
```

**Обязательно измените:**

- `DB_PASSWORD` - ваш пароль PostgreSQL
- `JWT_SECRET` - уникальный секретный ключ

### 3. Создание базы данных

```bash
# Запустить PostgreSQL
# Затем создать БД
psql -U postgres
CREATE DATABASE bookstore;
\q
```

### 4. Миграции и данные

```bash
# Применить миграции (создать таблицы)
npm run db:migrate

# Заполнить тестовыми данными
npm run db:seed
```

### 5. Запуск

```bash
# Development режим с автоперезагрузкой
npm run dev

# Или production режим
npm start
```

Откройте: http://localhost:3000

---

## Ежедневная работа

### Запуск проекта

```bash
# 1. Убедитесь, что PostgreSQL запущен
# 2. Запустите сервер
npm run dev
```

### Работа с БД

```bash
# Применить новые миграции
npm run db:migrate

# Откатить последнюю миграцию
npm run db:migrate:undo

# Полный сброс БД (осторожно!)
npm run db:reset
```

### Тестирование

```bash
# Проверка подключения к БД
node test-db.js
```

---

## Структура .env файла

```properties
# Основные настройки
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=postgres
DB_PASSWORD=your-password

# Безопасность
BCRYPT_SALT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Частые проблемы

### ❌ "Cannot connect to database"

**Решение:**

1. Проверьте, что PostgreSQL запущен
2. Проверьте `DB_*` переменные в `.env`
3. Убедитесь, что БД `bookstore` существует

### ❌ "Module 'dotenv' not found"

**Решение:**

```bash
npm install
```

### ❌ Миграции не применяются

**Решение:**

```bash
# Откатить всё и применить заново
npm run db:migrate:undo:all
npm run db:migrate
npm run db:seed
```

### ❌ "Port 3000 is already in use"

**Решение:**

- Измените `PORT` в `.env` на другой (например, 3001)
- Или остановите процесс, использующий порт 3000

---

## Полезные команды

```bash
# Проверка версий
node --version
npm --version
psql --version

# Проверка .env
node -e "require('dotenv').config(); console.log(process.env)"

# Посмотреть логи БД
psql -U postgres -d bookstore
\dt              -- список таблиц
SELECT * FROM users LIMIT 5;

# Очистка и переустановка
rm -rf node_modules
npm install
```

---

## Документация

📖 **Полная документация:**

- [00_PROJECT_CREATION_GUIDE.md](GUIDES/00_PROJECT_CREATION_GUIDE.md) - Создание проекта с нуля
- [27_ENVIRONMENT_VARIABLES.md](GUIDES/27_ENVIRONMENT_VARIABLES.md) - Переменные окружения
- [README.md](README.md) - Общая информация

---

## Контрольный список

- [ ] PostgreSQL установлен и запущен
- [ ] Node.js версии 14+ установлен
- [ ] Зависимости установлены (`npm install`)
- [ ] Файл `.env` создан и заполнен
- [ ] База данных `bookstore` создана
- [ ] Миграции применены (`npm run db:migrate`)
- [ ] Тестовые данные загружены (`npm run db:seed`)
- [ ] Сервер запускается без ошибок (`npm run dev`)
- [ ] Можно открыть http://localhost:3000

---

**Готово! 🎉 Теперь можно работать с проектом.**
