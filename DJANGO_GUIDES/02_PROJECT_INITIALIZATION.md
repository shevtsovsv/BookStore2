# 🚀 Инициализация Django проекта BookStore

## 📋 Содержание
1. [Создание проекта](#создание-проекта)
2. [Структура проекта](#структура-проекта)
3. [Настройка settings.py](#настройка-settingspy)
4. [Создание приложений](#создание-приложений)
5. [Первый запуск](#первый-запуск)

## 🎯 Создание проекта

### Подготовка

```bash
# 1. Создайте папку для проекта (вне текущего Node.js проекта!)
mkdir bookstore_django
cd bookstore_django

# 2. Создайте виртуальное окружение
python -m venv venv

# 3. Активируйте его
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Обновите pip
pip install --upgrade pip

# 5. Установите Django
pip install django
```

**Сравнение с Node.js:**
```bash
# Node.js
mkdir bookstore
cd bookstore
npm init -y
npm install express

# Django
mkdir bookstore_django
cd bookstore_django
python -m venv venv
source venv/bin/activate
pip install django
```

### Создание Django проекта

```bash
# Создайте проект
django-admin startproject bookstore_project .

# Обратите внимание на точку в конце!
# Она создаст проект в текущей папке, а не в подпапке
```

**Что создалось:**
```
bookstore_django/
├── venv/                    # Виртуальное окружение
├── manage.py               # Утилита управления проектом
└── bookstore_project/      # Главный модуль проекта
    ├── __init__.py        # Делает папку Python пакетом
    ├── asgi.py            # ASGI конфигурация (async)
    ├── wsgi.py            # WSGI конфигурация (sync)
    ├── settings.py        # Настройки проекта
    └── urls.py            # Главные URL маршруты
```

**Сравнение с Node.js:**
```
Node.js создание:          Django создание:
├── package.json           ├── manage.py
├── server.js              ├── bookstore_project/
└── node_modules/          │   ├── settings.py
                           │   ├── urls.py
                           │   └── wsgi.py
                           └── venv/
```

### Понимание manage.py

`manage.py` - это центральная утилита управления Django проектом.

```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookstore_project.settings')
    # ... остальной код
```

**Основные команды:**
```bash
# Запуск сервера (аналог: node server.js)
python manage.py runserver

# Создание миграций (аналог: sequelize-cli migration:generate)
python manage.py makemigrations

# Применение миграций (аналог: sequelize-cli db:migrate)
python manage.py migrate

# Создание суперпользователя (админа)
python manage.py createsuperuser

# Открыть Python shell с загруженным Django
python manage.py shell

# Создание нового приложения
python manage.py startapp books
```

## 📁 Структура проекта Django

### Детальное объяснение файлов

#### `manage.py`
**Что это:** Командная утилита для управления проектом

**Аналог в Node.js:** 
- `npm run` команды в `package.json`
- `sequelize-cli` для миграций

**Использование:**
```bash
python manage.py <command> [options]
```

#### `bookstore_project/settings.py`
**Что это:** Конфигурация всего проекта

**Аналог в Node.js:**
```javascript
// Node.js
require('dotenv').config();
const config = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST,
    // ...
  }
};

// Django - всё в settings.py
```

**Ключевые настройки:**
```python
# settings.py

# Секретный ключ (как JWT_SECRET)
SECRET_KEY = 'django-insecure-...'

# Режим отладки
DEBUG = True

# Разрешенные хосты
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Установленные приложения
INSTALLED_APPS = [
    'django.contrib.admin',     # Админ-панель
    'django.contrib.auth',      # Аутентификация
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# База данных
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'bookstore_django',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Язык и временная зона
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
```

#### `bookstore_project/urls.py`
**Что это:** Главный маршрутизатор URL

**Аналог в Node.js:**
```javascript
// Node.js - server.js
const express = require('express');
const app = express();

app.use('/api/books', booksRoutes);
app.use('/api/auth', authRoutes);

// Django - urls.py
from django.urls import path, include

urlpatterns = [
    path('api/books/', include('books.urls')),
    path('api/auth/', include('users.urls')),
]
```

#### `bookstore_project/wsgi.py`
**Что это:** Web Server Gateway Interface - точка входа для production сервера

**Аналог в Node.js:**
```javascript
// Node.js
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Django - wsgi.py используется с Gunicorn/uWSGI
// gunicorn bookstore_project.wsgi:application
```

## ⚙️ Настройка settings.py

### 1. Создайте .env файл

```bash
# Создайте .env в корне проекта
touch .env
```

```env
# .env
SECRET_KEY=django-insecure-your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=bookstore_django
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 2. Установите python-dotenv

```bash
pip install python-dotenv
```

### 3. Обновите settings.py

```python
# bookstore_project/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps (добавим позже)
    # 'rest_framework',
    # 'corsheaders',
    
    # Our apps (создадим далее)
    # 'books',
    # 'users',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'bookstore_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bookstore_project.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'bookstore_django'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files (uploaded by users)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

**Сравнение с Node.js:**

| Node.js | Django |
|---------|--------|
| `require('dotenv').config()` | `load_dotenv()` |
| `process.env.PORT` | `os.getenv('PORT')` |
| `config/config.json` | `settings.py` |
| express middleware | `MIDDLEWARE` список |
| `app.use(express.static())` | `STATIC_URL`, `STATICFILES_DIRS` |

## 📱 Создание приложений

В Django проект разделяется на **приложения** (apps).

**Философия Django:**
- Один проект может содержать несколько приложений
- Каждое приложение - независимый модуль
- Приложение можно переиспользовать в других проектах

**Сравнение с Node.js:**
```
Node.js структура:         Django структура:
src/                       books/        (приложение)
├── controllers/           ├── models.py
├── models/               ├── views.py
├── routes/               ├── urls.py
└── middleware/           └── admin.py
                          users/        (приложение)
                          ├── models.py
                          └── ...
```

### Создание приложения "books"

```bash
# Создайте приложение
python manage.py startapp books
```

**Что создалось:**
```
books/
├── __init__.py           # Делает папку Python пакетом
├── admin.py             # Регистрация моделей в админ-панели
├── apps.py              # Конфигурация приложения
├── models.py            # Модели базы данных
├── tests.py             # Тесты
├── views.py             # Представления (контроллеры)
└── migrations/          # Миграции БД
    └── __init__.py
```

### Создание других приложений

```bash
# Приложение для пользователей
python manage.py startapp users

# Приложение для корзины
python manage.py startapp cart
```

### Регистрация приложений

Добавьте созданные приложения в `settings.py`:

```python
# bookstore_project/settings.py

INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Our apps
    'books.apps.BooksConfig',      # Приложение книг
    'users.apps.UsersConfig',      # Приложение пользователей
    'cart.apps.CartConfig',        # Приложение корзины
]
```

**Почему `.apps.BooksConfig`?**

В `books/apps.py`:
```python
from django.apps import AppConfig

class BooksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'books'
    verbose_name = 'Книги'  # Отображается в админке
```

Можно просто писать `'books'`, но лучше использовать `BooksConfig` для явности.

## 🎨 Создание структуры папок

```bash
# Создайте дополнительные папки
mkdir -p static/{css,js,images}
mkdir templates
mkdir media
```

**Итоговая структура:**
```
bookstore_django/
├── venv/
├── manage.py
├── .env
├── .gitignore
├── requirements.txt
├── README.md
│
├── bookstore_project/      # Главный проект
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── books/                  # Приложение книг
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── views.py
│   ├── urls.py          # Создадим вручную
│   └── serializers.py   # Создадим вручную
│
├── users/                  # Приложение пользователей
│   └── ...
│
├── cart/                   # Приложение корзины
│   └── ...
│
├── static/                 # Статические файлы проекта
│   ├── css/
│   ├── js/
│   └── images/
│
├── media/                  # Загруженные файлы
│   └── book_covers/
│
└── templates/              # HTML шаблоны
    ├── base.html
    └── ...
```

## 🔥 Первый запуск

### 1. Создайте .gitignore

```gitignore
# Python
*.py[cod]
*$py.class
*.so
.Python
__pycache__/
*.py[cod]
*$py.class

# Virtual Environment
venv/
env/
ENV/

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/media
/staticfiles

# Environment variables
.env
.env.local

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.sql
*.sqlite
*.sqlite3
```

### 2. Создайте requirements.txt

```bash
pip freeze > requirements.txt
```

Или создайте вручную:
```txt
Django==5.0.1
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

### 3. Примените базовые миграции

```bash
# Django поставляется с встроенными моделями (User, Session и т.д.)
# Нужно создать таблицы для них
python manage.py migrate
```

**Вывод:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying admin.0003_logentry_add_action_flag_choices... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  ...
```

**Сравнение с Node.js:**
```bash
# Node.js
npx sequelize-cli db:migrate

# Django
python manage.py migrate
```

### 4. Создайте суперпользователя

```bash
python manage.py createsuperuser
```

**Введите данные:**
```
Username: admin
Email: admin@bookstore.com
Password: ********
Password (again): ********
Superuser created successfully.
```

**Это уникальная особенность Django!**  
В Node.js/Express вам нужно создавать админку с нуля. В Django она встроена!

### 5. Запустите сервер

```bash
python manage.py runserver
```

**Вывод:**
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
November 10, 2025 - 14:53:00
Django version 5.0.1, using settings 'bookstore_project.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Сравнение с Node.js:**
```bash
# Node.js
npm start
# или
node server.js

# Django
python manage.py runserver

# Запуск на другом порту
python manage.py runserver 8080
python manage.py runserver 0.0.0.0:8000  # Доступ из сети
```

### 6. Проверьте работу

Откройте в браузере:

1. **Главная страница:** http://127.0.0.1:8000/
   - Должны увидеть ракету Django "The install worked successfully!"

2. **Админ-панель:** http://127.0.0.1:8000/admin/
   - Войдите с созданными credentials
   - Должны увидеть интерфейс администратора!

**Скриншот админки (представьте):**
```
╔═══════════════════════════════════════╗
║   Django administration               ║
║                                       ║
║   AUTHENTICATION AND AUTHORIZATION    ║
║   ├── Groups                          ║
║   └── Users                           ║
║                                       ║
║   Recent actions                      ║
║   None available                      ║
╚═══════════════════════════════════════╝
```

## 📝 Создание README.md для Django проекта

```markdown
# 📚 BookStore Django - Backend API

Версия проекта BookStore на Python/Django с теми же возможностями, что и Node.js версия.

## 🚀 Быстрый старт

### Требования
- Python 3.11+
- PostgreSQL 14+
- pip

### Установка

\`\`\`bash
# Клонируйте репозиторий
git clone <repository-url>
cd bookstore_django

# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл
cp .env.example .env
# Отредактируйте .env с вашими настройками

# Примените миграции
python manage.py migrate

# Создайте суперпользователя
python manage.py createsuperuser

# Запустите сервер
python manage.py runserver
\`\`\`

Откройте http://127.0.0.1:8000/admin/

## 📁 Структура проекта

- `bookstore_project/` - Главный модуль проекта
- `books/` - Приложение для книг
- `users/` - Приложение для пользователей
- `cart/` - Приложение для корзины

## 🛠 Доступные команды

\`\`\`bash
python manage.py runserver          # Запуск сервера
python manage.py makemigrations     # Создание миграций
python manage.py migrate            # Применение миграций
python manage.py createsuperuser    # Создание админа
python manage.py shell              # Python shell с Django
python manage.py test               # Запуск тестов
\`\`\`
```

## ✅ Чек-лист

Перед переходом к следующему разделу убедитесь:

- [ ] Django проект создан
- [ ] Виртуальное окружение активно
- [ ] settings.py настроен с .env
- [ ] PostgreSQL база данных создана
- [ ] Базовые миграции применены
- [ ] Суперпользователь создан
- [ ] Сервер запускается без ошибок
- [ ] Админ-панель доступна
- [ ] Приложения books, users, cart созданы
- [ ] .gitignore создан
- [ ] requirements.txt создан

## 🎯 Следующий шаг

Переходите к **[03_DATABASE_MODELS.md](03_DATABASE_MODELS.md)** для создания моделей базы данных!

## 💡 Полезные команды Django

```bash
# Разработка
python manage.py runserver                    # Запуск сервера
python manage.py runserver 0.0.0.0:8000      # Доступ из сети
python manage.py shell                        # Python shell
python manage.py shell_plus                   # Enhanced shell (требует django-extensions)

# База данных
python manage.py makemigrations               # Создать миграции
python manage.py migrate                      # Применить миграции
python manage.py showmigrations              # Показать статус миграций
python manage.py sqlmigrate books 0001       # Показать SQL миграции
python manage.py dbshell                     # Открыть psql

# Пользователи
python manage.py createsuperuser             # Создать админа
python manage.py changepassword username     # Изменить пароль

# Статические файлы
python manage.py collectstatic               # Собрать статику

# Приложения
python manage.py startapp myapp              # Создать приложение

# Проверки
python manage.py check                       # Проверить проект
python manage.py check --deploy              # Проверки для production

# Тестирование
python manage.py test                        # Запустить все тесты
python manage.py test books                  # Тесты одного приложения
python manage.py test books.tests.TestBook  # Конкретный тест
```

---

**Автор:** Руководство по инициализации Django проекта  
**Дата:** Ноябрь 2025  
**Версия:** 1.0
