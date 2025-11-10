# 🚀 Подготовка к продакшену

> **Сложность:** 🔴 Сложная  
> **Время выполнения:** 5-6 часов  
> **Предварительные требования:** Завершение части 15

## 🎯 Цели этой части

В этой части вы подготовите приложение к развертыванию в продакшене:

- Настройка окружения продакшена
- CI/CD пайплайны
- Docker контейнеризация
- Система резервного копирования
- Мониторинг и логирование

---

## 🐳 Docker контейнеризация

### 1. Dockerfile для приложения

Создайте файл `Dockerfile`:

```dockerfile
# Multi-stage build для оптимизации размера образа
FROM node:18-alpine AS base

# Установка зависимостей системы
RUN apk add --no-cache \
    dumb-init \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Создание пользователя для приложения
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bookstore -u 1001

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
COPY yarn.lock* ./

# Установка зависимостей
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Стадия разработки
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Изменение владельца файлов
RUN chown -R bookstore:nodejs /app
USER bookstore

EXPOSE 3000
CMD ["dumb-init", "node", "server.js"]

# Продакшен стадия
FROM base AS production

# Установка только production зависимостей
COPY --from=deps --chown=bookstore:nodejs /app/node_modules ./node_modules

# Копирование исходного кода
COPY --chown=bookstore:nodejs . .

# Создание директорий для данных
RUN mkdir -p /app/uploads /app/logs && \
    chown -R bookstore:nodejs /app/uploads /app/logs

# Переключение на пользователя приложения
USER bookstore

# Настройка переменных окружения
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Использование dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### 2. Docker Compose для полного окружения

Создайте файл `docker-compose.yml`:

```yaml
version: "3.8"

services:
  # Основное приложение
  app:
    build:
      context: .
      target: production
      dockerfile: Dockerfile
    container_name: bookstore-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/bookstore
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - bookstore-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # База данных PostgreSQL
  db:
    image: postgres:15-alpine
    container_name: bookstore-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=bookstore
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - bookstore-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis для кэширования
  redis:
    image: redis:7-alpine
    container_name: bookstore-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - bookstore-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: bookstore-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
      - ./public:/var/www/html:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - bookstore-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Мониторинг с Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: bookstore-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/etc/prometheus/console_libraries"
      - "--web.console.templates=/etc/prometheus/consoles"
      - "--web.enable-lifecycle"
    networks:
      - bookstore-network

  # Grafana для визуализации
  grafana:
    image: grafana/grafana:latest
    container_name: bookstore-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - bookstore-network

  # Backup сервис
  backup:
    build:
      context: .
      dockerfile: Dockerfile.backup
    container_name: bookstore-backup
    restart: unless-stopped
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_DB=bookstore
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - BACKUP_SCHEDULE=0 2 * * * # Каждый день в 2:00
      - S3_BUCKET=${BACKUP_S3_BUCKET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    volumes:
      - ./backups:/backups
      - ./uploads:/app/uploads:ro
    depends_on:
      - db
    networks:
      - bookstore-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  nginx_logs:
    driver: local

networks:
  bookstore-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 3. Dockerfile для backup сервиса

Создайте файл `Dockerfile.backup`:

```dockerfile
FROM alpine:latest

# Установка необходимых инструментов
RUN apk add --no-cache \
    postgresql-client \
    aws-cli \
    bash \
    dcron \
    gzip \
    curl \
    && rm -rf /var/cache/apk/*

# Создание директорий
RUN mkdir -p /backups /scripts

# Копирование скриптов резервного копирования
COPY backup-scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Настройка cron
COPY backup-scripts/crontab /var/spool/cron/crontabs/root
RUN chmod 0600 /var/spool/cron/crontabs/root

# Создание пользователя для backup
RUN adduser -D -s /bin/bash backup
RUN chown -R backup:backup /backups /scripts

WORKDIR /scripts

# Запуск cron демона
CMD ["crond", "-f", "-d", "8"]
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy BookStore Application

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "18"
  REGISTRY: ghcr.io
  IMAGE_NAME: bookstore

jobs:
  # Тестирование
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: bookstore_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run security audit
        run: npm audit --production

      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/bookstore_test
          NODE_ENV: test

      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/bookstore_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
          JWT_SECRET: test_jwt_secret

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # Сборка и публикация Docker образа
  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          target: production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Развертывание в staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Deploy to staging
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/bookstore-staging
            docker-compose pull
            docker-compose up -d
            docker system prune -f

  # Развертывание в production
  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/bookstore

            # Создание резервной копии перед развертыванием
            ./scripts/backup.sh

            # Обновление образов
            docker-compose pull

            # Миграции базы данных
            docker-compose run --rm app npm run db:migrate

            # Обновление приложения с zero-downtime
            docker-compose up -d --no-deps app

            # Проверка здоровья приложения
            sleep 30
            curl -f http://localhost:3000/api/health || exit 1

            # Очистка старых образов
            docker system prune -f

  # Уведомления
  notify:
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: always()

    steps:
      - name: Notify deployment result
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: "#deployments"
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Скрипты для развертывания

Создайте файл `scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

# Переменные окружения
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🚀 Deploying BookStore to ${ENVIRONMENT} environment..."

# Проверка существования файла конфигурации
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Configuration file $COMPOSE_FILE not found!"
    exit 1
fi

# Создание резервной копии
echo "📦 Creating backup..."
./scripts/backup.sh

# Остановка сервисов для обновления
echo "⏸️ Stopping services..."
docker-compose -f "$COMPOSE_FILE" stop app

# Обновление образов
echo "📥 Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull

# Миграции базы данных
echo "🗄️ Running database migrations..."
docker-compose -f "$COMPOSE_FILE" run --rm app npm run db:migrate

# Запуск обновленных сервисов
echo "▶️ Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Проверка здоровья приложения
echo "🔍 Health check..."
sleep 30

HEALTH_CHECK_URL="http://localhost:3000/api/health"
for i in {1..10}; do
    if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi

    if [ $i -eq 10 ]; then
        echo "❌ Health check failed after 10 attempts!"
        echo "🔄 Rolling back..."
        ./scripts/rollback.sh
        exit 1
    fi

    echo "⏳ Waiting for application to start... ($i/10)"
    sleep 10
done

# Очистка старых образов и контейнеров
echo "🧹 Cleaning up..."
docker system prune -f

echo "🎉 Deployment completed successfully!"

# Уведомление о успешном развертывании
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ BookStore successfully deployed to ${ENVIRONMENT}\"}" \
        "$SLACK_WEBHOOK"
fi
```

Создайте файл `scripts/rollback.sh`:

```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🔄 Rolling back BookStore deployment..."

# Получение предыдущей версии из тегов
PREVIOUS_VERSION=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep bookstore | sed -n '2p' | cut -d: -f2)

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ No previous version found for rollback!"
    exit 1
fi

echo "⏮️ Rolling back to version: $PREVIOUS_VERSION"

# Обновление docker-compose для использования предыдущей версии
sed -i "s/image: bookstore:.*/image: bookstore:$PREVIOUS_VERSION/" "$COMPOSE_FILE"

# Перезапуск с предыдущей версией
docker-compose -f "$COMPOSE_FILE" up -d app

# Проверка здоровья
sleep 30
if curl -f "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "✅ Rollback completed successfully!"
else
    echo "❌ Rollback failed! Manual intervention required."
    exit 1
fi
```

---

## 💾 Система резервного копирования

### 1. Скрипты резервного копирования

Создайте директорию `backup-scripts/` и файл `backup-scripts/backup.sh`:

```bash
#!/bin/bash

set -e

# Конфигурация
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Создание директории для резервных копий
mkdir -p "$BACKUP_DIR/database" "$BACKUP_DIR/files" "$BACKUP_DIR/logs"

echo "📦 Starting backup process at $(date)"

# Резервное копирование базы данных
echo "🗄️ Backing up database..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_DIR/database/bookstore_${DATE}.sql.gz"

# Проверка успешности создания резервной копии
if [ $? -eq 0 ]; then
    echo "✅ Database backup completed"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Резервное копирование файлов приложения
echo "📁 Backing up application files..."
tar -czf "$BACKUP_DIR/files/uploads_${DATE}.tar.gz" -C /app uploads/
tar -czf "$BACKUP_DIR/files/logs_${DATE}.tar.gz" -C /app logs/

# Создание манифеста резервной копии
cat > "$BACKUP_DIR/manifest_${DATE}.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": {
        "file": "database/bookstore_${DATE}.sql.gz",
        "size": "$(stat -c%s "$BACKUP_DIR/database/bookstore_${DATE}.sql.gz")"
    },
    "files": {
        "uploads": {
            "file": "files/uploads_${DATE}.tar.gz",
            "size": "$(stat -c%s "$BACKUP_DIR/files/uploads_${DATE}.tar.gz")"
        },
        "logs": {
            "file": "files/logs_${DATE}.tar.gz",
            "size": "$(stat -c%s "$BACKUP_DIR/files/logs_${DATE}.tar.gz")"
        }
    },
    "environment": "$NODE_ENV",
    "version": "$(date +%Y.%m.%d)"
}
EOF

# Загрузка в S3 (если настроено)
if [ -n "$S3_BUCKET" ]; then
    echo "☁️ Uploading to S3..."

    aws s3 cp "$BACKUP_DIR/database/bookstore_${DATE}.sql.gz" \
        "s3://$S3_BUCKET/backups/database/" --storage-class STANDARD_IA

    aws s3 cp "$BACKUP_DIR/files/uploads_${DATE}.tar.gz" \
        "s3://$S3_BUCKET/backups/files/"

    aws s3 cp "$BACKUP_DIR/files/logs_${DATE}.tar.gz" \
        "s3://$S3_BUCKET/backups/files/"

    aws s3 cp "$BACKUP_DIR/manifest_${DATE}.json" \
        "s3://$S3_BUCKET/backups/manifests/"

    echo "✅ S3 upload completed"
fi

# Очистка старых резервных копий
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

# Уведомление о завершении
echo "✅ Backup process completed at $(date)"

# Отправка уведомления (если настроено)
if [ -n "$SLACK_WEBHOOK" ]; then
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"📦 Backup completed successfully. Size: $BACKUP_SIZE\"}" \
        "$SLACK_WEBHOOK"
fi
```

### 2. Скрипт восстановления

Создайте файл `backup-scripts/restore.sh`:

```bash
#!/bin/bash

set -e

BACKUP_DATE=$1
BACKUP_DIR="/backups"

if [ -z "$BACKUP_DATE" ]; then
    echo "❌ Usage: $0 <backup_date> (format: YYYYMMDD_HHMMSS)"
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/manifest_*.json | sed 's/.*manifest_\(.*\)\.json/\1/'
    exit 1
fi

MANIFEST_FILE="$BACKUP_DIR/manifest_${BACKUP_DATE}.json"

if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ Backup manifest not found: $MANIFEST_FILE"
    exit 1
fi

echo "🔄 Starting restore process from backup: $BACKUP_DATE"

# Чтение манифеста
DB_FILE=$(jq -r '.database.file' "$MANIFEST_FILE")
UPLOADS_FILE=$(jq -r '.files.uploads.file' "$MANIFEST_FILE")
LOGS_FILE=$(jq -r '.files.logs.file' "$MANIFEST_FILE")

# Проверка существования файлов резервных копий
for file in "$DB_FILE" "$UPLOADS_FILE" "$LOGS_FILE"; do
    if [ ! -f "$BACKUP_DIR/$file" ]; then
        echo "❌ Backup file not found: $BACKUP_DIR/$file"
        exit 1
    fi
done

# Подтверждение восстановления
read -p "⚠️ This will overwrite current data. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Остановка приложения
echo "⏸️ Stopping application..."
docker-compose stop app

# Восстановление базы данных
echo "🗄️ Restoring database..."
zcat "$BACKUP_DIR/$DB_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB"

# Восстановление файлов
echo "📁 Restoring files..."
rm -rf /app/uploads/* /app/logs/*
tar -xzf "$BACKUP_DIR/$UPLOADS_FILE" -C /app/
tar -xzf "$BACKUP_DIR/$LOGS_FILE" -C /app/

# Запуск приложения
echo "▶️ Starting application..."
docker-compose up -d app

# Проверка здоровья
echo "🔍 Health check..."
sleep 30
if curl -f "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "✅ Restore completed successfully!"
else
    echo "❌ Application health check failed after restore!"
    exit 1
fi
```

---

## 📊 Мониторинг и логирование

### 1. Конфигурация Prometheus

Создайте файл `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: "bookstore-app"
    static_configs:
      - targets: ["app:3000"]
    metrics_path: "/api/metrics"
    scrape_interval: 30s

  - job_name: "postgres"
    static_configs:
      - targets: ["db:5432"]

  - job_name: "redis"
    static_configs:
      - targets: ["redis:6379"]

  - job_name: "nginx"
    static_configs:
      - targets: ["nginx:80"]

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]
```

### 2. Система алертов

Создайте файл `monitoring/alert_rules.yml`:

```yaml
groups:
  - name: bookstore_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database is not responding"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Disk space is below 10%"
```

### 3. Централизованное логирование

Создайте файл `src/utils/logger.js`:

```javascript
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// Создание директории для логов
const logsDir = path.join(__dirname, "../../logs");

// Форматирование логов
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += "\n" + JSON.stringify(meta, null, 2);
    }

    return log;
  })
);

// Конфигурация ротации файлов
const rotateOptions = {
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  auditFile: path.join(logsDir, "audit.json"),
  zippedArchive: true,
};

// Создание логгера
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "bookstore",
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
  transports: [
    // Общие логи
    new DailyRotateFile({
      ...rotateOptions,
      filename: path.join(logsDir, "application-%DATE%.log"),
      level: "info",
    }),

    // Логи ошибок
    new DailyRotateFile({
      ...rotateOptions,
      filename: path.join(logsDir, "error-%DATE%.log"),
      level: "error",
    }),

    // Логи доступа
    new DailyRotateFile({
      ...rotateOptions,
      filename: path.join(logsDir, "access-%DATE%.log"),
      level: "http",
    }),
  ],

  // Обработка исключений
  exceptionHandlers: [
    new DailyRotateFile({
      ...rotateOptions,
      filename: path.join(logsDir, "exceptions-%DATE%.log"),
    }),
  ],

  // Обработка отклонений промисов
  rejectionHandlers: [
    new DailyRotateFile({
      ...rotateOptions,
      filename: path.join(logsDir, "rejections-%DATE%.log"),
    }),
  ],
});

// В режиме разработки также выводить в консоль
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Функции для структурированного логирования
const loggerHelpers = {
  // HTTP запросы
  logRequest: (req, res, responseTime) => {
    logger.http("HTTP Request", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: req.user?.id,
    });
  },

  // Бизнес-события
  logBusinessEvent: (event, data) => {
    logger.info(`Business Event: ${event}`, data);
  },

  // Ошибки с контекстом
  logError: (error, context = {}) => {
    logger.error("Application Error", {
      message: error.message,
      stack: error.stack,
      context,
    });
  },

  // Производительность
  logPerformance: (operation, duration, metadata = {}) => {
    logger.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  },

  // Безопасность
  logSecurity: (event, details) => {
    logger.warn(`Security Event: ${event}`, details);
  },
};

module.exports = {
  logger,
  ...loggerHelpers,
};
```

---

## 📋 Задания для самопроверки

1. **Настройте Docker Compose** для полного окружения
2. **Создайте CI/CD пайплайн** с автоматическим тестированием
3. **Реализуйте систему резервного копирования** с восстановлением
4. **Настройте мониторинг** с алертами

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полностью контейнеризованное приложение  
✅ Автоматический CI/CD пайплайн  
✅ Система резервного копирования  
✅ Мониторинг и алерты

**Следующий шаг:** [17_VDS_DEPLOYMENT.md](17_VDS_DEPLOYMENT.md) - развертывание на VDS сервере.

---

_Время выполнения: ~5-6 часов_  
_Сложность: 🔴 Сложная_
