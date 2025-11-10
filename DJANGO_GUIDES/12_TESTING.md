# 12_TESTING.md — Тестирование DRF API

> Сложность: 🟡 Средняя

## Цель

Покрыть руководство по тестированию Django REST Framework для BookStore проекта: unit-тесты, интеграционные тесты, использование pytest и фабрик.

## Инструменты

- pytest + pytest-django
- model_bakery / factory_boy для фабрик
- rest_framework.test.APITestCase

Установка:

```bash
pip install pytest pytest-django factory_boy model_bakery
```

## Базовая настройка тестов для BookStore

```python
# bookstore/tests/test_setup.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import Book, Category, Author, Publisher
from decimal import Decimal

class BookStoreTestCase(APITestCase):
    """Базовый класс для тестов BookStore"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@bookstore.com',
            password='testpass123'
        )

        self.category = Category.objects.create(
            name='Программирование',
            description='Книги по программированию'
        )

        self.author = Author.objects.create(
            first_name='Роберт',
            last_name='Мартин'
        )

        self.publisher = Publisher.objects.create(
            name='Питер',
            website='https://piter.com'
        )

        self.book = Book.objects.create(
            title='Чистый код',
            isbn='978-5-496-00487-8',
            price=Decimal('1500.00'),
            stock_quantity=10,
            category=self.category,
            publisher=self.publisher,
        )
        self.book.authors.add(self.author)

    def authenticate(self):
        """JWT аутентификация"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
```

## Тесты API Books для BookStore

```python
# bookstore/tests/test_books.py
import pytest
from rest_framework import status
from .test_setup import BookStoreTestCase

class BookAPITest(BookStoreTestCase):

    def test_get_books_list(self):
        """Тест получения списка книг"""
        response = self.client.get('/api/v1/books/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Чистый код')

    def test_filter_books_by_category(self):
        """Тест фильтрации по категории"""
        response = self.client.get(f'/api/v1/books/?category={self.category.id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_books(self):
        """Тест поиска книг"""
        response = self.client.get('/api/v1/books/?search=чистый')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_book_unauthorized(self):
        """Тест создания книги без авторизации"""
        data = {
            'title': 'Новая книга',
            'price': '1000.00',
            'category': self.category.id
        }
        response = self.client.post('/api/v1/books/', data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_book_as_admin(self):
        """Тест создания книги администратором"""
        self.user.is_staff = True
        self.user.save()
        self.authenticate()

        data = {
            'title': 'Новая книга',
            'isbn': '978-5-496-12345-6',
            'price': '1200.00',
            'stock_quantity': 5,
            'category': self.category.id,
            'publisher': self.publisher.id,
            'authors': [self.author.id]
        }
        response = self.client.post('/api/v1/books/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Новая книга')

# Pytest версия
@pytest.mark.django_db
def test_get_books_with_pytest():
    from model_bakery import baker
    from rest_framework.test import APIClient

    # Создаем тестовые данные
    baker.make('bookstore.Book', _quantity=5)
    client = APIClient()

    response = client.get('/api/v1/books/')
    assert response.status_code == 200
    assert len(response.json()['results']) == 5
```

## Тестирование корзины и заказов

```python
# bookstore/tests/test_cart.py
from .test_setup import BookStoreTestCase
from ..models import CartItem, Order

class CartAPITest(BookStoreTestCase):

    def test_add_to_cart(self):
        """Тест добавления книги в корзину"""
        self.authenticate()

        data = {
            'book': self.book.id,
            'quantity': 2
        }
        response = self.client.post('/api/v1/cart/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 1)

    def test_cart_summary(self):
        """Тест получения сводки корзины"""
        self.authenticate()

        # Добавляем товар в корзину
        CartItem.objects.create(
            user=self.user,
            book=self.book,
            quantity=2
        )

        response = self.client.get('/api/v1/cart/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['items_count'], 1)
        self.assertEqual(float(response.data['total_amount']), 3000.0)

    def test_create_order_from_cart(self):
        """Тест создания заказа из корзины"""
        self.authenticate()

        # Добавляем товар в корзину
        CartItem.objects.create(
            user=self.user,
            book=self.book,
            quantity=1
        )

        data = {
            'first_name': 'Иван',
            'last_name': 'Петров',
            'email': 'ivan@example.com',
            'phone': '+7-999-123-45-67',
            'delivery_address': 'Москва, ул. Тестовая, 1'
        }

        response = self.client.post('/api/v1/orders/create_from_cart/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.filter(user=self.user).count(), 1)
        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 0)  # Корзина очищена
```

## Тестирование аутентификации в BookStore

```python
# bookstore/tests/test_auth.py
class AuthenticationTest(BookStoreTestCase):

    def test_user_login(self):
        """Тест входа пользователя"""
        data = {
            'email': 'test@bookstore.com',
            'password': 'testpass123'
        }
        response = self.client.post('/api/auth/login/', data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_protected_endpoint_without_token(self):
        """Тест доступа к защищенному эндпоинту без токена"""
        response = self.client.get('/api/v1/cart/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_token(self):
        """Тест доступа к защищенному эндпоинту с токеном"""
        self.authenticate()
        response = self.client.get('/api/v1/cart/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

def get_auth_client_for_user(user):
    """Утилита для создания аутентифицированного клиента"""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client
```
