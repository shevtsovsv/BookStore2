# 10_FILTERING_PAGINATION.md — Фильтрация и пагинация в DRF

> Сложность: 🟡 Средняя

## Цель
Показать конфигурацию фильтрации (django-filter), поиска и пагинации для удобного BookStore API.

## Установка

```bash
pip install django-filter
```

Добавьте `django_filters` в `INSTALLED_APPS` и `DEFAULT_FILTER_BACKENDS` в `REST_FRAMEWORK`.

## Простая фильтрация через `filterset_fields`

```python
# bookstore/views.py
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filterset_fields = ['category', 'publisher', 'language', 'format', 'is_featured']
    search_fields = ['title', 'subtitle', 'description', 'isbn']
    ordering_fields = ['price', 'title', 'published_year', 'rating', 'created_at']
    ordering = ['-created_at']
```

## Сложные фильтры через `FilterSet` для BookStore

```python
# bookstore/filters.py
import django_filters
from .models import Book, Category, Author

class BookFilter(django_filters.FilterSet):
    """Комплексная фильтрация книг в BookStore"""
    
    # Фильтрация по диапазону цен
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    
    # Фильтрация по годам издания
    published_after = django_filters.NumberFilter(field_name='published_year', lookup_expr='gte')
    published_before = django_filters.NumberFilter(field_name='published_year', lookup_expr='lte')
    
    # Поиск по автору
    author = django_filters.CharFilter(field_name='authors__first_name', lookup_expr='icontains')
    author_last = django_filters.CharFilter(field_name='authors__last_name', lookup_expr='icontains')
    
    # Фильтрация по наличию на складе
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    
    # Фильтрация по рейтингу
    min_rating = django_filters.NumberFilter(field_name='rating', lookup_expr='gte')
    
    # Специальные фильтры
    featured = django_filters.BooleanFilter(field_name='is_featured')
    new_releases = django_filters.BooleanFilter(method='filter_new_releases')

    class Meta:
        model = Book
        fields = ['min_price', 'max_price', 'author', 'category', 'publisher', 'language']
    
    def filter_in_stock(self, queryset, name, value):
        """Фильтр для книг в наличии"""
        if value:
            return queryset.filter(stock_quantity__gt=0)
        return queryset.filter(stock_quantity=0)
    
    def filter_new_releases(self, queryset, name, value):
        """Фильтр для новинок (книги за последний год)"""
        if value:
            from datetime import date
            current_year = date.today().year
            return queryset.filter(published_year=current_year)
        return queryset

# bookstore/views.py
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    filterset_class = BookFilter
    search_fields = ['title', 'subtitle', 'description', 'isbn']
    ordering_fields = ['price', 'title', 'published_year', 'rating']
```

## Поиск и сортировка в BookStore

```python
# bookstore/views.py
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related('category', 'publisher').prefetch_related('authors')
    serializer_class = BookSerializer
    filterset_class = BookFilter
    
    # Поля для полнотекстового поиска
    search_fields = ['title', 'subtitle', 'description', 'isbn', 'authors__first_name', 'authors__last_name']
    
    # Поля для сортировки
    ordering_fields = ['price', 'title', 'published_year', 'rating', 'created_at', 'popularity']
    ordering = ['-created_at']  # По умолчанию сортировка по дате создания

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    search_fields = ['first_name', 'last_name', 'biography']
    ordering_fields = ['last_name', 'first_name', 'birth_date']
    ordering = ['last_name', 'first_name']
```

## Пагинация для BookStore

DRF поддерживает разные классы пагинации. Пример настроенной пагинации:

```python
# bookstore/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class BookStorePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.page_size,
            'results': data
        })

# bookstore/views.py
class BookViewSet(viewsets.ModelViewSet):
    # ... другие настройки
    pagination_class = BookStorePagination

# Примеры использования:
# GET /api/v1/books/?page=2&page_size=10
# GET /api/v1/books/?search=python&min_price=500&max_price=2000
# GET /api/v1/books/?category=1&ordering=-rating&in_stock=true
```

Используйте в `REST_FRAMEWORK` или в конкретном ViewSet через `pagination_class`.

## Дополнительные советы

- Для heavy queries используйте кэширование (redis) и prefetch/select_related.
- Для API поиска рассматривайте интеграцию с Elasticsearch/Meilisearch.

*Конец 10_FILTERING_PAGINATION.md*