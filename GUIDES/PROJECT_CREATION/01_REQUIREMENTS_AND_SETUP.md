# 📋 Системные требования и настройка окружения

## 🎯 Цель раздела

В этом разделе мы подготовим рабочее окружение для разработки интернет-магазина книг, установим все необходимые инструменты и создадим базовую структуру проекта.

---

## 💻 Системные требования

### Минимальные требования:

- **ОС:** Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM:** 4 GB (рекомендуется 8 GB)
- **Место на диске:** 2 GB свободного места
- **Интернет:** Стабильное подключение для загрузки зависимостей

### Рекомендуемые требования:

- **ОС:** Windows 11, macOS 12+, Ubuntu 20.04+
- **RAM:** 8 GB или больше
- **Место на диске:** 5 GB свободного места
- **SSD:** Для быстрой работы с файлами

---

## 🛠 Установка необходимого ПО

### 1. Node.js и npm

**Node.js** - это среда выполнения JavaScript на сервере.

#### Windows:

```bash
# Скачайте установщик с официального сайта
# https://nodejs.org/
# Выберите LTS версию (рекомендуется)

# Проверка установки
node --version
npm --version
```

#### macOS:

```bash
# Используя Homebrew
brew install node

# Или скачайте с официального сайта
# https://nodejs.org/

# Проверка установки
node --version
npm --version
```

#### Ubuntu/Debian:

```bash
# Обновите пакеты
sudo apt update

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка установки
node --version
npm --version
```

**Требуемые версии:**

- Node.js: 16.0.0 или выше
- npm: 7.0.0 или выше

### 2. PostgreSQL

**PostgreSQL** - это мощная реляционная база данных.

#### Windows:

```bash
# Скачайте установщик с официального сайта
# https://www.postgresql.org/download/windows/
# Следуйте инструкциям мастера установки

# Запомните пароль для пользователя postgres!
```

#### macOS:

```bash
# Используя Homebrew
brew install postgresql

# Запуск службы
brew services start postgresql

# Создание пользователя
createuser -s postgres
```

#### Ubuntu/Debian:

```bash
# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib

# Переключение на пользователя postgres
sudo -u postgres psql

# В консоли PostgreSQL:
ALTER USER postgres PASSWORD 'ваш_пароль';
\q
```

**Проверка установки:**

```bash
psql --version
# Должно показать версию 12.0 или выше
```

### 3. Git

**Git** - система контроля версий.

#### Windows:

```bash
# Скачайте Git с официального сайта
# https://git-scm.com/download/win
# Установите с настройками по умолчанию
```

#### macOS:

```bash
# Git обычно уже установлен
# Если нет, используйте Homebrew:
brew install git
```

#### Ubuntu/Debian:

```bash
sudo apt install git
```

**Настройка Git:**

```bash
git config --global user.name "Ваше Имя"
git config --global user.email "ваш@email.com"
```

### 4. Текстовый редактор

**Рекомендуется Visual Studio Code** с полезными расширениями.

#### Установка VS Code:

1. Скачайте с [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. Установите с настройками по умолчанию

#### Полезные расширения VS Code:

```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-npm-scripts"
  ]
}
```

---

## 📁 Создание структуры проекта

### Шаг 1: Создание корневой папки

```bash
# Создайте папку для проекта
mkdir bookstore
cd bookstore

# Инициализируйте Git репозиторий
git init
```

### Шаг 2: Создание базовой структуры

```bash
# Создание основных директорий
mkdir config
mkdir models
mkdir migrations
mkdir seeders
mkdir src
mkdir public
mkdir tests
mkdir docs

# Создание поддиректорий в src
mkdir src/controllers
mkdir src/middleware
mkdir src/routes
mkdir src/utils

# Создание поддиректорий в public
mkdir public/html
mkdir public/scripts
mkdir public/style
mkdir public/img
mkdir public/data
```

### Шаг 3: Создание начальных файлов

#### .gitignore

```bash
# Создайте файл .gitignore
touch .gitignore
```

```gitignore
# Зависимости
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Переменные окружения
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Логи
logs
*.log

# Временные файлы
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE файлы
.vscode/
.idea/
*.swp
*.swo
*~

# Файлы базы данных
*.sqlite
*.sqlite3
*.db

# Папки загрузок
uploads/
temp/

# Кэш
.cache/
.parcel-cache/

# Сборки
dist/
build/

# Системные файлы Windows
desktop.ini
$RECYCLE.BIN/

# Резервные копии
*.backup
*.bak
*.tmp
```

#### README.md

````markdown
# 📚 Книжный интернет-магазин

Современный веб-магазин книг с полной системой аутентификации, корзиной покупок и адаптивным дизайном.

## 🚀 Технологии

- **Backend:** Node.js, Express.js, Sequelize
- **Database:** PostgreSQL
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Auth:** JWT tokens

## 🛠 Установка

```bash
# Клонирование репозитория
git clone <ваш-репозиторий>
cd bookstore

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env

# Создание базы данных
npm run db:create
npm run db:migrate
npm run db:seed

# Запуск проекта
npm run dev
```
````

## 📖 Документация

- [Полное руководство по созданию](GUIDES/PROJECT_CREATION/00_INDEX.md)
- [API документация](docs/api.md)
- [Руководство по деплою](GUIDES/28_VDS_DEPLOYMENT_GUIDE.md)

## 🤝 Участие в разработке

1. Fork проекта
2. Создайте ветку для новой функции
3. Зафиксируйте изменения
4. Отправьте Pull Request

## 📄 Лицензия

Этот проект создан в образовательных целях.

````

---

## ✅ Проверка готовности окружения

### Контрольный список:

- [ ] Node.js установлен (версия 16+)
- [ ] npm работает
- [ ] PostgreSQL установлен и запущен
- [ ] Git настроен
- [ ] VS Code установлен с расширениями
- [ ] Создана структура папок проекта
- [ ] Создан .gitignore файл
- [ ] Создан README.md файл

### Команды для проверки:

```bash
# Проверка версий
node --version          # v16.0.0+
npm --version           # 7.0.0+
psql --version          # 12.0+
git --version           # 2.30.0+

# Проверка подключения к PostgreSQL
psql -U postgres -c "SELECT version();"

# Проверка структуры проекта
ls -la
````

### Ожидаемый результат:

```
bookstore/
├── .git/
├── .gitignore
├── README.md
├── config/
├── models/
├── migrations/
├── seeders/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── public/
│   ├── html/
│   ├── scripts/
│   ├── style/
│   ├── img/
│   └── data/
├── tests/
└── docs/
```

---

## 🔧 Устранение неполадок

### Проблема: "node: command not found"

**Решение:**

1. Переустановите Node.js с официального сайта
2. Перезапустите терминал
3. Проверьте PATH переменную

### Проблема: "psql: command not found"

**Решение:**

1. Убедитесь, что PostgreSQL установлен
2. Добавьте PostgreSQL в PATH
3. Перезапустите терминал

### Проблема: "permission denied" на macOS/Linux

**Решение:**

```bash
# Используйте sudo для команд установки
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Проблема: Медленная работа npm

**Решение:**

```bash
# Смена registry на более быстрый
npm config set registry https://registry.npmjs.org/
npm cache clean --force
```

---

## 📚 Дополнительные материалы

### Полезные ссылки:

- [Node.js официальная документация](https://nodejs.org/docs/)
- [PostgreSQL руководство](https://www.postgresql.org/docs/)
- [Git справочник](https://git-scm.com/docs)
- [VS Code документация](https://code.visualstudio.com/docs)

### Рекомендуемые курсы:

- Основы JavaScript ES6+
- Введение в Node.js
- Работа с базами данных
- Git и GitHub

---

## ➡️ Что дальше?

После завершения настройки окружения переходите к следующему разделу:
**[02_PROJECT_INITIALIZATION.md](02_PROJECT_INITIALIZATION.md)** - Инициализация проекта и установка зависимостей.

---

_Время выполнения: 1-2 часа_  
_Сложность: 🟢 Легко_
