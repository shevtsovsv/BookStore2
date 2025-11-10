# 🌐 Деплой на VDS сервер

> **Сложность:** 🔴 Сложная  
> **Время выполнения:** 3-4 часа  
> **Предварительные требования:** Завершение частей 01-16

## 🎯 Цели этой части

В этой части вы изучите полный процесс деплоя приложения на VDS сервер:

- Настройка Ubuntu сервера
- Установка и настройка Nginx
- Настройка SSL сертификатов
- Конфигурация PM2 для управления процессами
- Автоматизация деплоя
- Мониторинг и логирование

---

## 🖥️ Подготовка VDS сервера

### 1. Подключение к серверу

```bash
# Подключение по SSH
ssh root@your-server-ip

# Или с ключом
ssh -i ~/.ssh/your-key root@your-server-ip
```

### 2. Обновление системы

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка основных инструментов
apt install -y curl wget git htop nano ufw fail2ban
```

### 3. Создание пользователя для приложения

```bash
# Создание пользователя
adduser bookstore
usermod -aG sudo bookstore

# Переключение на пользователя
su - bookstore
```

---

## 🔧 Установка необходимого ПО

### 1. Установка Node.js

```bash
# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version

# Установка PM2 глобально
sudo npm install -g pm2
```

### 2. Установка PostgreSQL

```bash
# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Запуск и включение автозапуска
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание пользователя и БД
sudo -u postgres createuser --interactive --pwprompt bookstore_user
sudo -u postgres createdb bookstore_prod
```

### 3. Установка Nginx

```bash
# Установка Nginx
sudo apt install -y nginx

# Запуск и автозапуск
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🌐 Настройка Nginx

### 1. Создание конфигурации сайта

Создайте файл `/etc/nginx/sites-available/bookstore`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL конфигурация
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Безопасность
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Основная конфигурация
    root /home/bookstore/app/public;
    index index.html;

    # Логирование
    access_log /var/log/nginx/bookstore.access.log;
    error_log /var/log/nginx/bookstore.error.log;

    # Проксирование к Node.js
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
        proxy_read_timeout 86400;
    }

    # Статические файлы
    location /images/ {
        alias /home/bookstore/app/public/img/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /css/ {
        alias /home/bookstore/app/public/style/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location /js/ {
        alias /home/bookstore/app/public/scripts/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # HTML страницы
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Ограничение размера загрузки
    client_max_body_size 10M;

    # Запрет доступа к служебным файлам
    location ~ /\. {
        deny all;
    }

    location ~ \.(sql|md|env|log)$ {
        deny all;
    }
}
```

### 2. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/bookstore /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl reload nginx
```

---

## 🔐 Установка SSL сертификатов

### 1. Установка Certbot

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 2. Автоматическое обновление

```bash
# Добавление в crontab
sudo crontab -e

# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📁 Деплой приложения

### 1. Клонирование репозитория

```bash
# Переход в домашний каталог
cd /home/bookstore

# Клонирование проекта
git clone https://github.com/your-username/bookstore.git app
cd app

# Установка зависимостей
npm ci --production
```

### 2. Настройка переменных окружения

Создайте файл `.env`:

```bash
# Основные настройки
NODE_ENV=production
PORT=3000
HOST=localhost

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookstore_prod
DB_USER=bookstore_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_64_characters_long_for_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Безопасность
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_key

# Email (опционально)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Логирование
LOG_LEVEL=info
LOG_FILE=/home/bookstore/logs/app.log

# Uploads
UPLOAD_DIR=/home/bookstore/uploads
MAX_FILE_SIZE=5242880

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 3. Настройка прав доступа

```bash
# Создание необходимых каталогов
mkdir -p /home/bookstore/logs
mkdir -p /home/bookstore/uploads
mkdir -p /home/bookstore/backups

# Установка прав
chmod 755 /home/bookstore/app
chmod 600 /home/bookstore/app/.env
chmod 755 /home/bookstore/logs
chmod 755 /home/bookstore/uploads
```

---

## 🗄️ Настройка базы данных

### 1. Создание продакшн БД

```bash
# Подключение к PostgreSQL
sudo -u postgres psql

-- Создание пользователя
CREATE USER bookstore_user WITH PASSWORD 'your_secure_password';

-- Создание БД
CREATE DATABASE bookstore_prod OWNER bookstore_user;

-- Права доступа
GRANT ALL PRIVILEGES ON DATABASE bookstore_prod TO bookstore_user;

-- Выход
\q
```

### 2. Запуск миграций

```bash
cd /home/bookstore/app

# Запуск миграций
npm run db:migrate

# Заполнение начальными данными (опционально)
npm run db:seed
```

---

## 🚀 Настройка PM2

### 1. Создание ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: "bookstore-api",
      script: "./server.js",
      cwd: "/home/bookstore/app",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_file: "/home/bookstore/logs/pm2-combined.log",
      out_file: "/home/bookstore/logs/pm2-out.log",
      error_file: "/home/bookstore/logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      autorestart: true,
      cron_restart: "0 2 * * *", // Перезапуск каждый день в 2:00
    },
  ],
};
```

### 2. Запуск приложения

```bash
# Запуск приложения
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации
pm2 save

# Автозапуск при перезагрузке
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u bookstore --hp /home/bookstore
```

### 3. Полезные команды PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs

# Перезапуск приложения
pm2 restart bookstore-api

# Мониторинг
pm2 monit

# Остановка приложения
pm2 stop bookstore-api

# Просмотр метрик
pm2 show bookstore-api
```

---

## 🔥 Настройка Firewall

### 1. Конфигурация UFW

```bash
# Сброс правил
sudo ufw --force reset

# Политика по умолчанию
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешение SSH
sudo ufw allow ssh
sudo ufw allow 22

# Разрешение HTTP/HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Включение firewall
sudo ufw --force enable

# Проверка статуса
sudo ufw status verbose
```

### 2. Настройка Fail2Ban

Создайте файл `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
```

Запустите Fail2Ban:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 Мониторинг и логирование

### 1. Настройка логирования

```bash
# Создание конфигурации logrotate
sudo nano /etc/logrotate.d/bookstore
```

Содержимое файла:

```
/home/bookstore/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        pm2 reload bookstore-api
    endscript
}
```

### 2. Мониторинг ресурсов

```bash
# Установка htop для мониторинга
sudo apt install -y htop

# Просмотр использования диска
df -h

# Просмотр использования памяти
free -h

# Просмотр загрузки процессора
top
```

### 3. Скрипт для здоровья системы

Создайте файл `/home/bookstore/health-check.sh`:

```bash
#!/bin/bash

# Проверка здоровья системы
echo "=== Health Check $(date) ==="

# Проверка статуса приложения
echo "PM2 Status:"
pm2 status

# Проверка использования диска
echo -e "\nDisk Usage:"
df -h

# Проверка использования памяти
echo -e "\nMemory Usage:"
free -h

# Проверка статуса служб
echo -e "\nServices Status:"
systemctl is-active nginx
systemctl is-active postgresql
systemctl is-active fail2ban

# Проверка подключения к БД
echo -e "\nDatabase Connection:"
psql -h localhost -U bookstore_user -d bookstore_prod -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Database: OK"
else
    echo "Database: ERROR"
fi

echo "=== End Health Check ==="
```

Сделайте скрипт исполняемым:

```bash
chmod +x /home/bookstore/health-check.sh
```

---

## 🔄 Автоматизация деплоя

### 1. Скрипт деплоя

Создайте файл `/home/bookstore/deploy.sh`:

```bash
#!/bin/bash

# Деплой скрипт для bookstore
echo "🚀 Starting deployment..."

# Переход в каталог приложения
cd /home/bookstore/app

# Остановка приложения
echo "⏹️ Stopping application..."
pm2 stop bookstore-api

# Backup базы данных
echo "💾 Creating database backup..."
pg_dump -h localhost -U bookstore_user bookstore_prod > /home/bookstore/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Обновление кода
echo "📥 Pulling latest changes..."
git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm ci --production

# Запуск миграций
echo "🗄️ Running migrations..."
npm run db:migrate

# Запуск приложения
echo "▶️ Starting application..."
pm2 restart bookstore-api

# Проверка статуса
echo "✅ Deployment completed!"
pm2 status

# Проверка работоспособности
echo "🔍 Health check..."
sleep 5
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

echo "🎉 Deployment finished!"
```

Сделайте скрипт исполняемым:

```bash
chmod +x /home/bookstore/deploy.sh
```

### 2. GitHub Actions (опционально)

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VDS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            cd /home/bookstore
            ./deploy.sh
```

---

## 🛠️ Устранение возможных проблем

### Проблема: Приложение не запускается

```bash
# Проверка логов PM2
pm2 logs bookstore-api

# Проверка переменных окружения
pm2 show bookstore-api

# Ручной запуск для отладки
cd /home/bookstore/app
node server.js
```

### Проблема: Nginx возвращает 502

```bash
# Проверка статуса приложения
pm2 status

# Проверка портов
sudo netstat -tlnp | grep :3000

# Проверка логов Nginx
sudo tail -f /var/log/nginx/error.log
```

### Проблема: SSL сертификат не работает

```bash
# Проверка сертификата
sudo certbot certificates

# Обновление сертификата
sudo certbot renew

# Проверка конфигурации Nginx
sudo nginx -t
```

---

## 📋 Задания для самопроверки

1. **Настройте автоматический бэкап** базы данных каждый день
2. **Создайте мониторинг** дискового пространства с уведомлениями
3. **Настройте CDN** для статических файлов
4. **Реализуйте blue-green deployment** стратегию

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полностью настроенный VDS сервер  
✅ Приложение, работающее в продакшене  
✅ SSL сертификаты и безопасность  
✅ Автоматический деплой  
✅ Мониторинг и логирование

**Следующий шаг:** [18_TESTING_AND_DOCUMENTATION.md](18_TESTING_AND_DOCUMENTATION.md) - тестирование и документация для завершения проекта.

---

_Время выполнения: ~3-4 часа_  
_Сложность: 🔴 Сложная_
