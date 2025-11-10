# 09_AUTHENTICATION.md — JWT аутентификация (Simple JWT)

> Сложность: 🟡 Средняя

## Цель
Опишем настройку JWT аутентификации для DRF с использованием `djangorestframework-simplejwt` в BookStore проекте.

## Установка

```bash
pip install djangorestframework-simplejwt
```

Добавьте в `settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

## Маршруты для получения токенов

```python
# bookstore/urls.py
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

# Примеры использования в BookStore:

# 1. Вход пользователя
POST /api/auth/login/
{
    "email": "user@bookstore.com",
    "password": "password123"
}

# Ответ:
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@bookstore.com",
        "first_name": "Иван",
        "last_name": "Петров"
    }
}

# 2. Добавление книги в корзину (требует авторизации)
POST /api/v1/cart/
Headers: Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
{
    "book": 1,
    "quantity": 2
}

# 3. Обновление токена
POST /api/auth/token/refresh/
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Blacklist (для отзыва refresh tokens)

Установите пакет blacklist и добавьте в `INSTALLED_APPS`:

```bash
pip install djangorestframework-simplejwt[blacklist]
```

В `settings.py`:

```python
INSTALLED_APPS += ['rest_framework_simplejwt.token_blacklist']
```

Выполните миграции для таблицы blacklisted tokens.

## Защита эндпоинтов в BookStore

- `IsAuthenticated` для всех защищённых представлений.
- Для публичных чтений: `IsAuthenticatedOrReadOnly`.

Пример использования:

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions

class CartItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

class BookViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        """Только админы могут создавать/изменять книги"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        return [permission() for permission in permission_classes]
```

## 2FA и дополнительные меры

- Добавьте email/SMS подтверждение для действий с оплатой.
- Минимизируйте срок жизни access token и используйте refresh + blacklist.

*Конец 09_AUTHENTICATION.md*