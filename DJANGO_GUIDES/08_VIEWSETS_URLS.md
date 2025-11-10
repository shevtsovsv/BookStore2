# 08_VIEWSETS_URLS.md — ViewSet'ы и маршрутизация

> Сложность: 🟡 Средняя

## Цель

Показать варианты использования `ViewSet`, `GenericViewSet`, `APIView` и как корректно настраивать маршрутизацию через routers.

## Типы View

- `APIView` — полностью ручной контроль (подходит для уникальных эндпоинтов).
- `GenericViewSet` + mixins — когда нужно частично переопределять CRUD.
- `ModelViewSet` — быстрый способ получить полный CRUD.

## Пример: Router + ViewSet (BookStore проект)

```python
# bookstore/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    BookViewSet, CategoryViewSet, AuthorViewSet,
    PublisherViewSet, CartItemViewSet
)

# Создаем роутер для API BookStore
router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'authors', AuthorViewSet, basename='author')
router.register(r'publishers', PublisherViewSet, basename='publisher')
router.register(r'cart', CartItemViewSet, basename='cartitem')

# Основные URL паттерны
urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
]
```

## Кастомные actions

```python
# bookstore/views.py
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Avg

class BookViewSet(viewsets.ModelViewSet):
    # ... основная конфигурация ViewSet

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_featured(self, request, pk=None):
        """Сделать книгу рекомендуемой"""
        book = self.get_object()
        book.is_featured = True
        book.save()
        return Response({'status': 'Книга добавлена в рекомендуемые'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_to_cart(self, request, pk=None):
        """Добавить книгу в корзину"""
        book = self.get_object()
        quantity = request.data.get('quantity', 1)

        cart_item, created = CartItem.objects.get_or_create(
            user=request.user,
            book=book,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({
            'status': 'Книга добавлена в корзину',
            'quantity': cart_item.quantity
        })

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Получить популярные книги"""
        popular_books = self.get_queryset().filter(
            popularity__gte=50
        ).order_by('-popularity')[:10]

        serializer = self.get_serializer(popular_books, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_rating(self, request):
        """Книги с высоким рейтингом"""
        top_rated = self.get_queryset().filter(
            rating__gte=4.0,
            rating_count__gte=10
        ).order_by('-rating')[:20]

        serializer = self.get_serializer(top_rated, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по книгам"""
        queryset = self.get_queryset()
        stats = {
            'total_books': queryset.count(),
            'average_price': queryset.aggregate(Avg('price'))['price__avg'],
            'featured_count': queryset.filter(is_featured=True).count(),
            'out_of_stock': queryset.filter(stock_quantity=0).count(),
        }
        return Response(stats)
```

## Вложенные маршруты (nested routing)

Для вложенных ресурсов используйте `drf-nested-routers`:

```python
from rest_framework_nested import routers

router = routers.SimpleRouter()
router.register(r'books', BookViewSet)

books_router = routers.NestedSimpleRouter(router, r'books', lookup='book')
books_router.register(r'comments', CommentViewSet, basename='book-comments')

urlpatterns = router.urls + books_router.urls
```

## Версионирование API

- В URL: `/api/v1/books/`
- Заголовок: `Accept: application/vnd.myapp.v1+json`
- Настройки в `REST_FRAMEWORK['DEFAULT_VERSIONING_CLASS']`

## Советы

- Не перегружайте ViewSet сложной бизнес-логикой — выносите в сервисы/сущности.
- Пишите тесты для кастомных actions.

_Конец 08_VIEWSETS_URLS.md_
