# 📚 Django BookStore - Краткое руководство

## 🎯 Быстрый старт для создания Django версии BookStore

Это **краткое руководство** для тех, кто знаком с Node.js версией и хочет быстро создать аналог на Django.

## 📖 Полные руководства

Для детального изучения смотрите полные гайды:

1. **[00_OVERVIEW_COMPARISON.md](00_OVERVIEW_COMPARISON.md)** - Сравнение Django и Node.js
2. **[01_ENVIRONMENT_SETUP.md](01_ENVIRONMENT_SETUP.md)** - Установка окружения
3. **[02_PROJECT_INITIALIZATION.md](02_PROJECT_INITIALIZATION.md)** - Создание проекта
4. **[03_DATABASE_MODELS.md](03_DATABASE_MODELS.md)** - Модели БД
5. **[04_MIGRATIONS.md](04_MIGRATIONS.md)** - Миграции
6. **[05_ADMIN_PANEL.md](05_ADMIN_PANEL.md)** - Админ-панель

## ⚡ Быстрая установка (10 минут)

### 1. Подготовка окружения

```bash
# Создайте папку проекта
mkdir bookstore_django
cd bookstore_django

# Создайте виртуальное окружение
python -m venv venv

# Активируйте его
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Установите Django и зависимости
pip install django psycopg2-binary python-dotenv djangorestframework djangorestframework-simplejwt django-cors-headers django-filter Pillow
```

### 2. Создание проекта

```bash
# Создайте Django проект
django-admin startproject bookstore_project .

# Создайте приложения
python manage.py startapp books
python manage.py startapp users
python manage.py startapp cart
```

### 3. Настройка базы данных

**Создайте `.env` файл:**
```env
SECRET_KEY=django-insecure-your-secret-key-change-this
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=bookstore_django
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

**Создайте БД в PostgreSQL:**
```sql
CREATE DATABASE bookstore_django;
```

**Обновите `settings.py`:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Our apps
    'books.apps.BooksConfig',
    'users.apps.UsersConfig',
    'cart.apps.CartConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Добавьте для CORS
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'

AUTH_USER_MODEL = 'users.User'  # Кастомная модель пользователя

# CORS настройки
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# DRF настройки
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# JWT настройки
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
}
```

### 4. Создание моделей (краткая версия)

**`users/models.py`:**
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Покупатель'),
        ('admin', 'Администратор'),
        ('manager', 'Менеджер'),
    ]
    
    phone = models.CharField(max_length=17, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    
    class Meta:
        db_table = 'users'
```

**`books/models.py`:**
```python
from django.db import models
from django.core.validators import MinValueValidator

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        ordering = ['sort_order', 'name']
    
    def __str__(self):
        return self.name

class Publisher(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    website = models.URLField(max_length=500, blank=True)
    contact_email = models.EmailField(blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    country = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'publishers'
    
    def __str__(self):
        return self.name

class Author(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    biography = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    death_date = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    website = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'authors'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.last_name} {self.first_name}"

class Book(models.Model):
    title = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20, unique=True, blank=True, null=True)
    publisher = models.ForeignKey(Publisher, on_delete=models.SET_NULL, null=True, blank=True, related_name='books')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='books')
    authors = models.ManyToManyField(Author, through='BookAuthor', related_name='books')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    description = models.TextField(blank=True)
    short_description = models.TextField(blank=True)
    image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    pages = models.IntegerField(null=True, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    popularity = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'books'
        ordering = ['-popularity', 'title']
    
    def __str__(self):
        return self.title

class BookAuthor(models.Model):
    ROLE_CHOICES = [
        ('main_author', 'Основной автор'),
        ('co_author', 'Соавтор'),
        ('translator', 'Переводчик'),
        ('editor', 'Редактор'),
    ]
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='main_author')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'book_authors'
        unique_together = ['book', 'author', 'role']
```

**`cart/models.py`:**
```python
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from books.models import Book

class CartItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart_items')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cart_items'
        unique_together = ['user', 'book']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} x{self.quantity}"
```

### 5. Создание и применение миграций

```bash
# Создайте миграции
python manage.py makemigrations

# Примените миграции
python manage.py migrate

# Создайте суперпользователя
python manage.py createsuperuser
```

### 6. Настройка админ-панели

**`books/admin.py`:**
```python
from django.contrib import admin
from .models import Category, Publisher, Author, Book, BookAuthor

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'sort_order']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ['name', 'country', 'founded_year']

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'nationality']

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'price', 'stock', 'popularity']
    list_filter = ['category', 'publisher']
    search_fields = ['title', 'isbn']

@admin.register(BookAuthor)
class BookAuthorAdmin(admin.ModelAdmin):
    list_display = ['book', 'author', 'role']
```

**`cart/admin.py`:**
```python
from django.contrib import admin
from .models import CartItem

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'book', 'quantity', 'created_at']
```

**`users/admin.py`:**
```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_superuser']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительно', {'fields': ('phone', 'role')}),
    )
```

### 7. Запуск

```bash
# Запустите сервер
python manage.py runserver

# Откройте админ-панель
# http://127.0.0.1:8000/admin/
```

## 🎉 Готово!

У вас есть базовый Django проект с:
- ✅ Моделями БД (User, Book, Category, Publisher, Author, Cart)
- ✅ Миграциями
- ✅ Админ-панелью
- ✅ Настроенной аутентификацией

## 📊 Сравнение: что уже сделано

| Функция | Node.js | Django | Статус |
|---------|---------|--------|--------|
| Модели БД | ✅ Sequelize | ✅ Django ORM | ✅ Готово |
| Миграции | ✅ Вручную | ✅ Авто-генерация | ✅ Готово |
| Админ-панель | ❌ Нужно создавать | ✅ Встроенная | ✅ Готово |
| API | ✅ Express routes | ⏳ DRF (следующий шаг) | ⏳ |
| JWT Auth | ✅ jsonwebtoken | ⏳ Simple JWT (следующий шаг) | ⏳ |
| CORS | ✅ cors | ✅ django-cors-headers | ✅ Готово |

## 🚀 Следующие шаги

Для создания API продолжайте с руководствами:
- **[06_DRF_SETUP.md](06_DRF_SETUP.md)** - Django REST Framework
- **[07_SERIALIZERS.md](07_SERIALIZERS.md)** - Сериализаторы
- **[08_VIEWSETS_URLS.md](08_VIEWSETS_URLS.md)** - ViewSets и URL маршрутизация
- **[09_AUTHENTICATION.md](09_AUTHENTICATION.md)** - JWT аутентификация

## 💡 Полезные команды

```bash
# Создание миграций
python manage.py makemigrations

# Применение миграций
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск сервера
python manage.py runserver

# Python shell с Django
python manage.py shell

# Проверка проекта
python manage.py check

# Сбор статики
python manage.py collectstatic
```

## 📚 Дополнительные ресурсы

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Real Python Django Tutorials](https://realpython.com/tutorials/django/)

---

**Автор:** Краткое руководство Django BookStore  
**Дата:** Ноябрь 2025  
**Версия:** 1.0
