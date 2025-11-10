# 07_SERIALIZERS.md — Сериализаторы данных (DRF)

> Сложность: 🟡 Средняя

## Цель
Показать, как правильно использовать `Serializer` и `ModelSerializer`, реализовать валидацию, nested сериализаторы и оптимизации для чтения/записи.

## ModelSerializer — базовый пример (BookStore модели)

```python
# bookstore/serializers.py
from rest_framework import serializers
from .models import Book, Author, Category, Publisher, User, CartItem

class AuthorSerializer(serializers.ModelSerializer):
    """Сериализатор для авторов книг"""
    books_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Author
        fields = ('id', 'name', 'biography', 'birth_date', 'death_date', 'nationality', 'books_count')
        read_only_fields = ('id',)
    
    def get_books_count(self, obj):
        return obj.books.filter(is_active=True).count()

class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий книг"""
    books_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'slug', 'books_count')
        read_only_fields = ('id',)
    
    def get_books_count(self, obj):
        return obj.books.filter(is_active=True).count()

class PublisherSerializer(serializers.ModelSerializer):
    """Сериализатор для издательств"""
    class Meta:
        model = Publisher
        fields = ('id', 'name', 'description', 'founded_year', 'country', 'website')
        read_only_fields = ('id',)

class BookSerializer(serializers.ModelSerializer):
    """Основной сериализатор для книг BookStore"""
    authors = AuthorSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    publisher = PublisherSerializer(read_only=True)
    
    # Поля для записи (только ID)
    author_ids = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(), 
        many=True, 
        write_only=True, 
        source='authors'
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        write_only=True, 
        source='category'
    )
    publisher_id = serializers.PrimaryKeyRelatedField(
        queryset=Publisher.objects.all(), 
        write_only=True, 
        source='publisher',
        required=False,
        allow_null=True
    )

    class Meta:
        model = Book
        fields = (
            'id', 'title', 'subtitle', 'description', 'isbn', 'price', 'stock_quantity',
            'published_year', 'page_count', 'language', 'format', 'weight', 'dimensions',
            'image_url', 'is_featured', 'is_active', 'popularity', 'rating', 'rating_count',
            'tags', 'created_at', 'updated_at',
            # Связанные объекты для чтения
            'authors', 'category', 'publisher',
            # ID поля для записи
            'author_ids', 'category_id', 'publisher_id'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'popularity', 'rating', 'rating_count')
```

## Writable nested — создание/обновление с автором

Если нужно позволить записывать nested-поля, используйте `PrimaryKeyRelatedField` или напишите кастомную логику:

```python
class BookCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления книг BookStore"""
    author_ids = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(), 
        many=True, 
        write_only=True
    )

    class Meta:
        model = Book
        fields = (
            'title', 'subtitle', 'description', 'isbn', 'price', 
            'stock_quantity', 'published_year', 'page_count', 
            'language', 'format', 'category', 'publisher', 'author_ids'
        )

    def create(self, validated_data):
        author_ids = validated_data.pop('author_ids', [])
        book = Book.objects.create(**validated_data)
        book.authors.set(author_ids)
        return book
    
    def update(self, instance, validated_data):
        author_ids = validated_data.pop('author_ids', None)
        
        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Обновляем авторов если переданы
        if author_ids is not None:
            instance.authors.set(author_ids)
            
        return instance
```

## Валидация

- Поле-уровневая валидация: `def validate_<field>(self, value):`.
- Объект-уровневая валидация: `def validate(self, attrs):`.

```python
class BookSerializer(serializers.ModelSerializer):
    def validate_price(self, value):
        """Валидация цены книги"""
        if value <= 0:
            raise serializers.ValidationError("Цена должна быть больше 0")
        if value > 100000:  # максимальная цена 100,000
            raise serializers.ValidationError("Цена не может превышать 100,000")
        return value
    
    def validate_isbn(self, value):
        """Валидация ISBN"""
        if value and not value.replace('-', '').isdigit():
            raise serializers.ValidationError("ISBN должен содержать только цифры и дефисы")
        return value
    
    def validate_stock_quantity(self, value):
        """Валидация количества на складе"""
        if value < 0:
            raise serializers.ValidationError("Количество на складе не может быть отрицательным")
        return value

    def validate(self, attrs):
        """Общая валидация объекта"""
        # Проверяем год публикации
        if attrs.get('published_year') and attrs['published_year'] > 2025:
            raise serializers.ValidationError({
                'published_year': 'Год публикации не может быть в будущем'
            })
        
        # Проверяем соответствие формата и веса
        if attrs.get('format') == 'ebook' and attrs.get('weight', 0) > 0:
            raise serializers.ValidationError({
                'weight': 'Электронная книга не может иметь физический вес'
            })
            
        return attrs
```

## Оптимизация производительности

- Для списков используйте `select_related`/`prefetch_related` в queryset в ViewSet.
- Для полей, требующих вычислений, используйте `SerializerMethodField` только при необходимости.

## Полезные приёмы
- `read_only_fields` для полей, которые нельзя менять
- `extra_kwargs = {'password': {'write_only': True}}` для защиты
- `to_representation` для кастомной сериализации

*Конец 07_SERIALIZERS.md*