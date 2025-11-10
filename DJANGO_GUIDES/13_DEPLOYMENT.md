# 13_DEPLOYMENT.md — Деплой Django + DRF на production

> Сложность: 🔴 Сложная

## Цель

Показать стандартный путь деплоя BookStore Django/DRF: Gunicorn, Nginx, контейнеризация, миграции и сбор статики.

## Рекомендованная архитектура для BookStore

- Gunicorn (workers) + Nginx как reverse proxy
- PostgreSQL для основной БД, Redis (cache, celery broker)
- Docker + docker-compose для локального/стейджинга
- CI/CD (GitHub Actions, GitLab CI)

## Настройка production settings

```python
# bookstore/settings/production.py
import os
from .base import *

DEBUG = False
ALLOWED_HOSTS = ['bookstore-api.example.com', 'api.bookstore.com']

# PostgreSQL для BookStore
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'bookstore_prod'),
        'USER': os.environ.get('DB_USER', 'bookstore_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Безопасность
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000

# CORS для фронтенда BookStore
CORS_ALLOWED_ORIGINS = [
    "https://bookstore.example.com",
    "https://www.bookstore.example.com",
]
```

## Пример systemd unit для BookStore Gunicorn

`/etc/systemd/system/bookstore.service`:

```ini
[Unit]
Description=BookStore Gunicorn daemon
After=network.target

[Service]
User=bookstore
Group=www-data
WorkingDirectory=/srv/bookstore
Environment="DJANGO_SETTINGS_MODULE=bookstore.settings.production"
ExecStart=/srv/bookstore/venv/bin/gunicorn --workers 3 --bind unix:/run/bookstore.sock bookstore.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Nginx конфигурация для BookStore API

```nginx
# /etc/nginx/sites-available/bookstore
server {
    listen 80;
    server_name api.bookstore.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bookstore.example.com;

    ssl_certificate /etc/letsencrypt/live/api.bookstore.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bookstore.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://unix:/run/bookstore.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /srv/bookstore/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /srv/bookstore/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

## Docker setup для BookStore

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Код приложения
COPY . .

# Пользователь для безопасности
RUN useradd --create-home --shell /bin/bash bookstore
RUN chown -R bookstore:bookstore /app
USER bookstore

ENV DJANGO_SETTINGS_MODULE=bookstore.settings.production
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "bookstore.wsgi:application"]
```

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SETTINGS_MODULE=bookstore.settings.production
      - DB_HOST=db
      - REDIS_URL=redis://redis:6379/1
    depends_on:
      - db
      - redis
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: bookstore_prod
      POSTGRES_USER: bookstore_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/srv/bookstore/staticfiles
      - media_volume:/srv/bookstore/media
    depends_on:
      - web

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

## Миграции и сбор статики

При деплое выполняйте:

```bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

## Zero-downtime deploy

- Используйте rolling updates в Kubernetes или Blue/Green для минимального дауна.
- Для Gunicorn: pre-fork / graceful reload (SIGUSR2)

## Мониторинг и логирование

- Prometheus + Grafana для метрик
- Sentry для ошибок
- Centralized logging (ELK / Loki)

## Безопасность

- Настройте `SECURE_SSL_REDIRECT`, HSTS, Content Security Policy
- Храните секреты в окружении (Vault, Secrets Manager)

_Конец 13_DEPLOYMENT.md_
