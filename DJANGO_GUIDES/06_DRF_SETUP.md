# 06_DRF_SETUP.md — Настройка Django REST Framework

> Сложность: 🟡 Средняя

## Цель

Кратко показать, как подключить и настроить Django REST Framework (DRF) в проекте книжного магазина: установка, настройки, базовые представления и сериализация.

## Установка

Используйте виртуальное окружение и установите зависимости:

```bash
pip install djangorestframework djangorestframework-simplejwt django-filter
```

Добавьте в `INSTALLED_APPS` в `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'shop',  # ваше приложение с моделями
]
```

## Базовая конфигурация DRF

В `settings.py` добавьте базовые настройки:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}
```

## Создание простого APIView и ViewSet

Пример простого ViewSet для модели `Book` (на основе реальной структуры проекта):

```python
# bookstore/views.py
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Book, Category, Author, Publisher
from .serializers import BookSerializer

class BookViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления книгами BookStore.
    Поддерживает CRUD операции, фильтрацию и поиск.
    """
    queryset = Book.objects.filter(is_active=True).select_related(
        'category', 'publisher'
    ).prefetch_related('authors')

    serializer_class = BookSerializer

    # Фильтрация
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'publisher', 'language']

    # Поиск
    search_fields = ['title', 'subtitle', 'description', 'isbn']

    # Сортировка
    ordering_fields = ['price', 'created_at', 'title', 'published_year']
    ordering = ['-created_at']
```

## Регистрация маршрутов (пример)

```python
# bookstore/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import BookViewSet, CategoryViewSet, AuthorViewSet, PublisherViewSet

# Создаем роутер для автоматических CRUD маршрутов
router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'authors', AuthorViewSet, basename='author')
router.register(r'publishers', PublisherViewSet, basename='publisher')

# URL patterns для API BookStore
urlpatterns = [
    path('api/', include(router.urls)),
    # Дополнительные эндпоинты
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
]
```

## Дополнительно

- Логику аутентификации и авторизации см. в `09_AUTHENTICATION.md`.
- Для сложных сериализаций используйте `SerializerMethodField` и nested serializers.

---

## Контрольный список

- [ ] DRF установлен
- [ ] REST_FRAMEWORK настроен
- [ ] Простейшие ViewSet'ы зарегистрированы
- [ ] Фильтрация и пагинация работают

_Конец 06_DRF_SETUP.md_
