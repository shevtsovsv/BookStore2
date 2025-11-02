# Переменные окружения (.env)

## Описание

Проект использует переменные окружения для конфигурации приложения. Это позволяет:

- Отделить конфигурацию от кода
- Использовать разные настройки для development/production
- Защитить чувствительные данные (пароли, секретные ключи)

## Настройка

### 1. Создание файла .env

При первом запуске проекта:

```bash
# Скопируйте шаблон
copy .env.example .env

# Или на Linux/Mac
cp .env.example .env
```

### 2. Заполнение переменных

Откройте `.env` и укажите свои значения:

```properties
NODE_ENV=development
PORT=3000
JWT_SECRET=your-unique-secret-key-here
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=your-db-username
DB_PASSWORD=your-db-password

BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

## Переменные

### Общие настройки

| Переменная | Описание                                     | Значение по умолчанию | Обязательна |
| ---------- | -------------------------------------------- | --------------------- | ----------- |
| `NODE_ENV` | Режим работы (development, production, test) | development           | Нет         |
| `PORT`     | Порт сервера                                 | 3000                  | Нет         |

### JWT аутентификация

| Переменная       | Описание                           | Значение по умолчанию | Обязательна           |
| ---------------- | ---------------------------------- | --------------------- | --------------------- |
| `JWT_SECRET`     | Секретный ключ для подписи токенов | (захардкожен)         | **Да для production** |
| `JWT_EXPIRES_IN` | Время жизни токена                 | 7d                    | Нет                   |

⚠️ **Важно**: В production обязательно измените `JWT_SECRET` на уникальный случайный ключ!

### База данных

| Переменная     | Описание               | Значение по умолчанию | Обязательна           |
| -------------- | ---------------------- | --------------------- | --------------------- |
| `DB_HOST`      | Хост PostgreSQL        | localhost             | Нет\*                 |
| `DB_PORT`      | Порт PostgreSQL        | 5432                  | Нет\*                 |
| `DB_NAME`      | Имя базы данных        | bookstore             | Нет\*                 |
| `DB_USER`      | Имя пользователя БД    | user                  | Нет\*                 |
| `DB_PASSWORD`  | Пароль БД              | 1234                  | Нет\*                 |
| `DATABASE_URL` | Полный URL подключения | -                     | Да для production\*\* |

\*В development используются значения из `config/config.json` если env переменные не указаны  
\*\*В production используется `DATABASE_URL` вместо отдельных параметров

### Безопасность

| Переменная           | Описание                       | Значение по умолчанию | Обязательна |
| -------------------- | ------------------------------ | --------------------- | ----------- |
| `BCRYPT_SALT_ROUNDS` | Количество раундов хеширования | 12                    | Нет         |

**Рекомендации:**

- 10 - быстро, базовая безопасность
- 12 - баланс скорости и безопасности (рекомендуется)
- 14+ - максимальная безопасность, но медленнее

### CORS

| Переменная    | Описание              | Значение по умолчанию | Обязательна |
| ------------- | --------------------- | --------------------- | ----------- |
| `CORS_ORIGIN` | Разрешенные источники | \* (все)              | Нет         |

Примеры:

- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`
- Несколько источников: `https://domain1.com,https://domain2.com`

## Использование в коде

### Загрузка переменных

В `models/index.js` и `server.js`:

```javascript
require("dotenv").config();
```

### Чтение переменных

```javascript
// Получение переменной
const port = process.env.PORT || 3000;

// С преобразованием типа
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Проверка обязательной переменной
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET не установлен!");
}
```

## Примеры конфигураций

### Development (локальная разработка)

```properties
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore
DB_USER=postgres
DB_PASSWORD=postgres

BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=*
```

### Production (боевой сервер)

```properties
NODE_ENV=production
PORT=8080
JWT_SECRET=veryLongRandomSecretKey123!@#ComplexString
JWT_EXPIRES_IN=24h

DATABASE_URL=postgresql://user:password@db.example.com:5432/bookstore_prod

BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://bookstore.example.com
```

### Testing (тестирование)

```properties
NODE_ENV=test
PORT=3001
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore_test
DB_USER=postgres
DB_PASSWORD=postgres

BCRYPT_SALT_ROUNDS=4
CORS_ORIGIN=*
```

## Безопасность

### ✅ Правила безопасности

1. **Никогда не коммитьте .env в git**

   - `.env` уже добавлен в `.gitignore`
   - Коммитьте только `.env.example` с примерами

2. **Используйте надежные значения для production**

   - Длинные случайные строки для `JWT_SECRET`
   - Сложные пароли для `DB_PASSWORD`

3. **Не используйте одинаковые секреты**

   - Разные ключи для development и production
   - Уникальный `JWT_SECRET` для каждого окружения

4. **Ограничьте CORS**
   - В production указывайте конкретные домены
   - Не используйте `*` на боевом сервере

### 🔐 Генерация безопасного JWT_SECRET

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))

# Linux/Mac
openssl rand -base64 64
```

## Troubleshooting

### Проблема: "Cannot find module 'dotenv'"

```bash
npm install dotenv
```

### Проблема: Переменные не загружаются

1. Проверьте, что `.env` файл находится в корне проекта
2. Убедитесь, что `require('dotenv').config()` вызывается в начале файла
3. Перезапустите сервер после изменения `.env`

### Проблема: "JWT_SECRET is not defined"

1. Проверьте наличие переменной в `.env`
2. Убедитесь, что нет лишних пробелов: `JWT_SECRET=value` (не `JWT_SECRET = value`)
3. Перезапустите сервер

### Проблема: "Database connection failed"

1. Проверьте корректность `DB_*` переменных
2. Убедитесь, что PostgreSQL запущен
3. Проверьте, что база данных существует
4. Проверьте права доступа пользователя

## Деплой

### Heroku

```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
# DATABASE_URL устанавливается автоматически при добавлении Postgres addon
```

### VDS/VPS

1. Создайте `.env` на сервере:

   ```bash
   nano /path/to/project/.env
   ```

2. Вставьте production конфигурацию

3. Установите права доступа:
   ```bash
   chmod 600 .env
   chown youruser:yourgroup .env
   ```

### Docker

В `docker-compose.yml`:

```yaml
version: "3.8"
services:
  app:
    env_file:
      - .env
    environment:
      - NODE_ENV=production
```

Или передавайте напрямую:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - JWT_SECRET=${JWT_SECRET}
```

## Дополнительные ресурсы

- [dotenv документация](https://github.com/motdotla/dotenv)
- [12 Factor App - Config](https://12factor.net/config)
- [Node.js Best Practices - Environment Variables](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
