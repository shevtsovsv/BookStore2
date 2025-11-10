#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Деплой BookStore на VDS сервер${NC}"
echo -e "${BLUE}================================${NC}"

# Проверка, что скрипт запущен от правильного пользователя
if [ "$USER" != "bookstore" ]; then
    echo -e "${RED}❌ Скрипт должен запускаться от пользователя 'bookstore'${NC}"
    echo -e "${YELLOW}Выполните: sudo su - bookstore${NC}"
    exit 1
fi

# Переход в директорию проекта
PROJECT_DIR="/home/bookstore/apps/BookStore2"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Директория проекта не найдена: $PROJECT_DIR${NC}"
    exit 1
fi

cd $PROJECT_DIR

# Остановка приложения
echo -e "${YELLOW}⏹️  Остановка PM2 процесса...${NC}"
pm2 stop bookstore 2>/dev/null || echo "Процесс не был запущен"

# Обновление кода
echo -e "${YELLOW}📥 Обновление кода из Git...${NC}"
git fetch origin
git pull origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при обновлении кода${NC}"
    exit 1
fi

# Установка зависимостей
echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
npm ci --only=production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при установке зависимостей${NC}"
    exit 1
fi

# Проверка .env файла
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Файл .env не найден. Копирование из .env.production...${NC}"
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo -e "${YELLOW}📝 Отредактируйте .env файл перед продолжением!${NC}"
        echo -e "${YELLOW}nano .env${NC}"
        read -p "Нажмите Enter после редактирования .env..."
    else
        echo -e "${RED}❌ Файл .env.production также не найден!${NC}"
        exit 1
    fi
fi

# Применение миграций
echo -e "${YELLOW}🗄️  Применение миграций БД...${NC}"
NODE_ENV=production npx sequelize-cli db:migrate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при применении миграций${NC}"
    echo -e "${YELLOW}Возможно, база данных не настроена. Проверьте:${NC}"
    echo -e "${YELLOW}1. PostgreSQL запущен: sudo systemctl status postgresql${NC}"
    echo -e "${YELLOW}2. База данных создана${NC}"
    echo -e "${YELLOW}3. Настройки в .env корректны${NC}"
    exit 1
fi

# Перезапуск приложения
echo -e "${YELLOW}🔄 Запуск приложения через PM2...${NC}"
pm2 start ecosystem.config.js --env production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при запуске PM2${NC}"
    echo -e "${YELLOW}Проверьте логи: pm2 logs bookstore${NC}"
    exit 1
fi

# Проверка статуса
echo -e "${YELLOW}📊 Проверка статуса...${NC}"
sleep 3
pm2 status

# Проверка работы приложения
echo -e "${YELLOW}🔍 Проверка работы приложения...${NC}"
sleep 2

# Попытка подключения к приложению
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Приложение отвечает на запросы${NC}"
else
    echo -e "${RED}❌ Приложение не отвечает${NC}"
    echo -e "${YELLOW}Проверьте логи: pm2 logs bookstore${NC}"
    exit 1
fi

# Сохранение PM2 процессов для автозапуска
pm2 save

echo ""
echo -e "${GREEN}🎉 Деплой успешно завершен!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🌐 Локальный доступ: http://localhost:3000${NC}"
echo -e "${GREEN}🌐 Внешний доступ: https://yourdomain.com${NC}"
echo ""
echo -e "${YELLOW}Полезные команды:${NC}"
echo -e "${YELLOW}  pm2 status           - статус процессов${NC}"
echo -e "${YELLOW}  pm2 logs bookstore   - логи приложения${NC}"
echo -e "${YELLOW}  pm2 restart bookstore - перезапуск${NC}"
echo -e "${YELLOW}  pm2 stop bookstore   - остановка${NC}"
echo ""