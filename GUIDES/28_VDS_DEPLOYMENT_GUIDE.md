# 🚀 Руководство по деплою на VDS сервер

## Оглавление

1. [Подготовка проекта](#подготовка-проекта)
2. [Настройка переменных окружения](#настройка-переменных-окружения)
3. [Подготовка базы данных](#подготовка-базы-данных)
4. [Настройка сервера](#настройка-сервера)
5. [Деплой приложения](#деплой-приложения)
6. [Настройка SSL и домена](#настройка-ssl-и-домена)
7. [Мониторинг и логи](#мониторинг-и-логи)

---

## Подготовка проекта

### 1. Production конфигурация

#### package.json скрипты

Добавьте production скрипты:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required for Node.js'",
    "production": "NODE_ENV=production node server.js",
    "pm2:start": "pm2 start ecosystem.config.js --env production",
    "pm2:stop": "pm2 stop bookstore",
    "pm2:restart": "pm2 restart bookstore",
    "pm2:logs": "pm2 logs bookstore",
    "pm2:status": "pm2 status",
    "db:migrate:prod": "NODE_ENV=production npx sequelize-cli db:migrate",
    "db:seed:prod": "NODE_ENV=production npx sequelize-cli db:seed:all"
  }
}
```

#### Production зависимости

Установите PM2 для управления процессами:

```bash
npm install -g pm2
npm install --save-dev cross-env
```

### 2. Настройка безопасности

#### Helmet настройки

Обновите `server.js` для production:

```javascript
const helmet = require("helmet");

// Production security
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
}
```

#### Rate limiting

```javascript
const rateLimit = require("express-rate-limit");

if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с IP
    message: "Слишком много запросов с этого IP",
  });
  app.use("/api/", limiter);
}
```

---

## Настройка переменных окружения

### Production .env файл

Создайте `.env.production`:

```properties
# Основные настройки
NODE_ENV=production
PORT=3000

# JWT (ОБЯЗАТЕЛЬНО изменить!)
JWT_SECRET=your-very-long-random-production-secret-key-here-min-32-chars
JWT_EXPIRES_IN=24h

# База данных PostgreSQL (VDS)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore_prod
DB_USER=bookstore_user
DB_PASSWORD=very-secure-password-here

# Полный URL для production
DATABASE_URL=postgresql://bookstore_user:very-secure-password-here@localhost:5432/bookstore_prod

# Безопасность
BCRYPT_SALT_ROUNDS=14

# CORS (ваш домен)
CORS_ORIGIN=https://yourdomain.com

# Опционально: SSL настройки
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key

# Логирование
LOG_LEVEL=error
LOG_FILE=/var/log/bookstore/app.log
```

### Генерация JWT_SECRET

```bash
# Команда для генерации безопасного ключа
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Или OpenSSL
openssl rand -hex 64
```

---

## Подготовка базы данных

### 1. Настройка PostgreSQL на сервере

```bash
# Установка PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Запуск и автозапуск
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание пользователя и базы
sudo -u postgres psql

# В psql:
CREATE USER bookstore_user WITH PASSWORD 'very-secure-password-here';
CREATE DATABASE bookstore_prod OWNER bookstore_user;
GRANT ALL PRIVILEGES ON DATABASE bookstore_prod TO bookstore_user;
\q
```

### 2. Миграции и данные

```bash
# После деплоя выполнить на сервере:
NODE_ENV=production npx sequelize-cli db:migrate
NODE_ENV=production npx sequelize-cli db:seed:all
```

---

## Настройка сервера

### 1. Подготовка VDS

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install curl git nginx certbot python3-certbot-nginx

# Установка Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версий
node --version
npm --version
```

### 2. Создание пользователя для приложения

```bash
# Создание пользователя
sudo adduser bookstore
sudo usermod -aG sudo bookstore

# Переключение на пользователя
sudo su - bookstore
```

### 3. Настройка директорий

```bash
# Создание структуры папок
mkdir -p /home/bookstore/apps
mkdir -p /var/log/bookstore
sudo chown bookstore:bookstore /var/log/bookstore
```

---

## Деплой приложения

### 1. Загрузка кода

```bash
# Клонирование репозитория
cd /home/bookstore/apps
git clone https://github.com/ваш-username/BookStore2.git
cd BookStore2

# Установка зависимостей
npm ci --only=production

# Создание production .env
cp .env.example .env
nano .env  # Заполнить production значениями
```

### 2. PM2 конфигурация

Создайте `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "bookstore",
      script: "server.js",
      instances: "max", // Использовать все CPU ядра
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/bookstore/error.log",
      out_file: "/var/log/bookstore/access.log",
      log_file: "/var/log/bookstore/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      restart_delay: 4000,
    },
  ],
};
```

### 3. Запуск приложения

```bash
# Применение миграций
npm run db:migrate:prod

# Запуск с PM2
npm run pm2:start

# Проверка статуса
pm2 status

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

---

## Настройка Nginx

### 1. Конфигурация Nginx

Создайте `/etc/nginx/sites-available/bookstore`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Логи
    access_log /var/log/nginx/bookstore_access.log;
    error_log /var/log/nginx/bookstore_error.log;

    # Основное приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Статические файлы (опционально, для ускорения)
    location /img/ {
        alias /home/bookstore/apps/BookStore2/public/img/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /style/ {
        alias /home/bookstore/apps/BookStore2/public/style/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /scripts/ {
        alias /home/bookstore/apps/BookStore2/public/scripts/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 2. Активация конфигурации

```bash
# Активация сайта
sudo ln -s /etc/nginx/sites-available/bookstore /etc/nginx/sites-enabled/

# Тест конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

---

## Настройка SSL и домена

### 1. Получение SSL сертификата

```bash
# Certbot для Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Автообновление сертификата
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Обновленная Nginx конфигурация с SSL

После certbot ваш конфиг будет обновлен автоматически, но можно добавить:

```nginx
# HTTP -> HTTPS редирект
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL конфигурация (добавляется certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Безопасность SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Остальная конфигурация...
}
```

---

## Мониторинг и логи

### 1. Настройка логирования

#### Winston для приложения

Установите и настройте Winston:

```bash
npm install winston winston-daily-rotate-file
```

Создайте `src/utils/logger.js`:

```javascript
const winston = require("winston");
require("winston-daily-rotate-file");

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "/var/log/bookstore/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
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

### 2. Мониторинг PM2

```bash
# Установка PM2 мониторинга
pm2 install pm2-logrotate

# Настройка ротации логов
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Мониторинг в реальном времени
pm2 monit
```

### 3. Системные мониторинг

#### Настройка UFW Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

#### Мониторинг ресурсов

```bash
# Установка htop
sudo apt install htop

# Проверка использования
htop
df -h  # Дисковое пространство
free -h  # Память
```

---

## Скрипты автоматизации

### 1. Скрипт деплоя

Создайте `deploy.sh`:

```bash
#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Начинаем деплой BookStore...${NC}"

# Переход в директорию проекта
cd /home/bookstore/apps/BookStore2

# Остановка приложения
echo -e "${YELLOW}Остановка PM2...${NC}"
pm2 stop bookstore

# Обновление кода
echo -e "${YELLOW}Обновление кода...${NC}"
git pull origin master

# Установка зависимостей
echo -e "${YELLOW}Установка зависимостей...${NC}"
npm ci --only=production

# Применение миграций
echo -e "${YELLOW}Применение миграций БД...${NC}"
NODE_ENV=production npx sequelize-cli db:migrate

# Перезапуск приложения
echo -e "${YELLOW}Запуск PM2...${NC}"
pm2 restart bookstore

# Проверка статуса
echo -e "${YELLOW}Проверка статуса...${NC}"
pm2 status

echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo -e "${GREEN}🌐 Сайт доступен: https://yourdomain.com${NC}"
```

### 2. Скрипт бэкапа БД

Создайте `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/bookstore/backups"
DB_NAME="bookstore_prod"
DB_USER="bookstore_user"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Создание бэкапа БД..."
pg_dump -U $DB_USER -h localhost $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Бэкап создан: $BACKUP_DIR/backup_$DATE.sql"
```

---

## Чек-лист деплоя

### Подготовка проекта

- [ ] Обновлен package.json с production скриптами
- [ ] Создан ecosystem.config.js для PM2
- [ ] Настроены переменные окружения для production
- [ ] Сгенерирован безопасный JWT_SECRET
- [ ] Добавлены скрипты деплоя и бэкапа

### Настройка сервера

- [ ] Установлен Node.js 18+
- [ ] Установлен PM2
- [ ] Установлен и настроен PostgreSQL
- [ ] Установлен и настроен Nginx
- [ ] Настроен firewall (UFW)

### База данных

- [ ] Создан пользователь БД
- [ ] Создана production база данных
- [ ] Применены миграции
- [ ] Загружены начальные данные

### Безопасность

- [ ] Настроен SSL сертификат
- [ ] Обновлены CORS настройки
- [ ] Настроено rate limiting
- [ ] Конфигурирован Helmet

### Мониторинг

- [ ] Настроено логирование
- [ ] Настроен мониторинг PM2
- [ ] Настроена ротация логов
- [ ] Настроены автоматические бэкапы

---

## Полезные команды

### PM2

```bash
pm2 status               # Статус процессов
pm2 logs bookstore       # Логи приложения
pm2 restart bookstore    # Перезапуск
pm2 stop bookstore       # Остановка
pm2 delete bookstore     # Удаление процесса
pm2 monit               # Мониторинг в реальном времени
```

### PostgreSQL

```bash
# Подключение к БД
psql -U bookstore_user -d bookstore_prod

# Бэкап
pg_dump -U bookstore_user bookstore_prod > backup.sql

# Восстановление
psql -U bookstore_user bookstore_prod < backup.sql
```

### Nginx

```bash
sudo nginx -t                    # Тест конфигурации
sudo systemctl reload nginx      # Перезагрузка
sudo systemctl status nginx      # Статус
```

### Логи

```bash
# Логи приложения
tail -f /var/log/bookstore/combined.log

# Логи Nginx
tail -f /var/log/nginx/bookstore_access.log
tail -f /var/log/nginx/bookstore_error.log

# Системные логи
journalctl -u nginx -f
```

---

## Troubleshooting

### Частые проблемы

**1. Приложение не запускается**

```bash
# Проверить логи
pm2 logs bookstore
# Проверить переменные окружения
pm2 show bookstore
```

**2. База данных недоступна**

```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql
# Проверить подключение
psql -U bookstore_user -d bookstore_prod -c "SELECT 1;"
```

**3. Nginx 502 Bad Gateway**

```bash
# Проверить, что приложение запущено
pm2 status
# Проверить логи Nginx
tail -f /var/log/nginx/error.log
```

**4. SSL проблемы**

```bash
# Проверить сертификат
sudo certbot certificates
# Тест обновления
sudo certbot renew --dry-run
```

---

**Готово! 🎉 Ваше приложение готово к деплою на VDS сервер.**

Следуйте инструкциям пошагово, и ваш книжный магазин будет доступен в интернете!
