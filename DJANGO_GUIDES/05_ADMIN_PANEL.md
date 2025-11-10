# 👨‍💼 Админ-панель Django

## 📋 Содержание
1. [Введение в Django Admin](#введение-в-django-admin)
2. [Базовая регистрация моделей](#базовая-регистрация-моделей)
3. [Настройка отображения](#настройка-отображения)
4. [Фильтры и поиск](#фильтры-и-поиск)
5. [Кастомизация форм](#кастомизация-форм)
6. [Продвинутые возможности](#продвинутые-возможности)

## 🎯 Введение в Django Admin

### Что такое Django Admin?

**Django Admin** - это автоматически генерируемая админ-панель для управления данными.

**Уникальная особенность Django!**  
В Node.js/Express вам нужно создавать админку с нуля или использовать сторонние решения.
В Django админка идёт из коробки!

### Доступ к админ-панели

1. **Создайте суперпользователя** (если ещё не сделали):
```bash
python manage.py createsuperuser

# Введите:
# Username: admin
# Email: admin@bookstore.com
# Password: ********
```

2. **Запустите сервер**:
```bash
python manage.py runserver
```

3. **Откройте в браузере**:
```
http://127.0.0.1:8000/admin/
```

4. **Войдите** с созданными credentials

**По умолчанию вы увидите:**
```
╔════════════════════════════════════════╗
║   Django administration                ║
║                                        ║
║   AUTHENTICATION AND AUTHORIZATION     ║
║   ├── Groups                           ║
║   └── Users                            ║
║                                        ║
║   Recent actions                       ║
║   None available                       ║
╚════════════════════════════════════════╝
```

## 📝 Базовая регистрация моделей

### Простая регистрация

**Файл: `books/admin.py`**

```python
from django.contrib import admin
from .models import Category, Publisher, Author, Book, BookAuthor

# Простая регистрация
admin.site.register(Category)
admin.site.register(Publisher)
admin.site.register(Author)
admin.site.register(Book)
admin.site.register(BookAuthor)
```

**Теперь в админке появятся все модели!**

**Сравнение с Node.js:**
В Express для такого функционала нужно:
1. Создать HTML страницы для каждой модели
2. Написать routes для CRUD операций
3. Создать формы для добавления/редактирования
4. Добавить валидацию
5. Реализовать аутентификацию
6. Настроить права доступа

**В Django:** 1 строка кода - `admin.site.register(Model)`

### Регистрация с кастомизацией

```python
# books/admin.py
from django.contrib import admin
from .models import Category, Publisher, Author, Book, BookAuthor

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Админка для категорий"""
    list_display = ['name', 'slug', 'is_active', 'sort_order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    date_hierarchy = 'created_at'
    ordering = ['sort_order', 'name']

@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    """Админка для издательств"""
    list_display = ['name', 'country', 'founded_year', 'website']
    list_filter = ['country']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    """Админка для авторов"""
    list_display = ['last_name', 'first_name', 'nationality', 'birth_date', 'is_alive']
    list_filter = ['nationality']
    search_fields = ['first_name', 'last_name', 'biography']
    date_hierarchy = 'birth_date'
    ordering = ['last_name', 'first_name']
    
    def is_alive(self, obj):
        """Кастомная колонка - жив ли автор"""
        return obj.is_alive
    is_alive.boolean = True  # Отображать как иконку
    is_alive.short_description = 'Жив'

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Админка для книг"""
    list_display = [
        'title', 
        'category', 
        'publisher',
        'price', 
        'stock', 
        'is_available',
        'popularity',
        'created_at'
    ]
    list_filter = ['category', 'publisher', 'publication_year', 'created_at']
    search_fields = ['title', 'isbn', 'description']
    autocomplete_fields = ['category', 'publisher']
    filter_horizontal = ['authors']  # Удобный виджет для ManyToMany
    readonly_fields = ['created_at', 'updated_at', 'popularity']
    date_hierarchy = 'created_at'
    ordering = ['-popularity', 'title']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'isbn', 'category', 'publisher')
        }),
        ('Авторы', {
            'fields': ('authors',)
        }),
        ('Описание', {
            'fields': ('short_description', 'description', 'image')
        }),
        ('Цена и наличие', {
            'fields': ('price', 'stock', 'popularity')
        }),
        ('Дополнительно', {
            'fields': ('pages', 'publication_year'),
            'classes': ('collapse',)  # Свернуто по умолчанию
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_available(self, obj):
        """Кастомная колонка - доступность"""
        return obj.is_available
    is_available.boolean = True
    is_available.short_description = 'В наличии'

@admin.register(BookAuthor)
class BookAuthorAdmin(admin.ModelAdmin):
    """Админка для связи книг и авторов"""
    list_display = ['book', 'author', 'role']
    list_filter = ['role']
    search_fields = ['book__title', 'author__last_name']
    autocomplete_fields = ['book', 'author']
```

## 🎨 Настройка отображения

### list_display - колонки таблицы

**Что можно указывать:**
1. Поля модели
2. Методы модели с `@property`
3. Методы класса Admin
4. Связанные поля через `__`

```python
class BookAdmin(admin.ModelAdmin):
    list_display = [
        'title',                    # Обычное поле
        'category',                 # ForeignKey
        'author_names',             # @property из модели
        'is_available',             # Метод admin класса
        'category__parent__name',   # Связанное поле через __
    ]
    
    def is_available(self, obj):
        return obj.stock > 0
    is_available.boolean = True
    is_available.short_description = 'Доступна'
```

### list_filter - фильтры в сайдбаре

```python
class BookAdmin(admin.ModelAdmin):
    list_filter = [
        'category',              # По категории
        'publisher',             # По издательству
        'publication_year',      # По году
        'created_at',           # По дате (автоматические диапазоны)
        ('price', admin.EmptyFieldListFilter),  # Есть/нет значение
    ]
```

### search_fields - поиск

```python
class BookAdmin(admin.ModelAdmin):
    search_fields = [
        'title',                  # В названии
        'isbn',                   # В ISBN
        'description',            # В описании
        'authors__last_name',     # В фамилии автора
        'category__name',         # В названии категории
    ]
```

### ordering - сортировка по умолчанию

```python
class BookAdmin(admin.ModelAdmin):
    ordering = ['-created_at', 'title']  # По дате (убывание), потом по названию
```

### date_hierarchy - навигация по датам

```python
class BookAdmin(admin.ModelAdmin):
    date_hierarchy = 'created_at'  # Создаст дропдауны: год -> месяц -> день
```

## 🔍 Фильтры и поиск

### Кастомные фильтры

```python
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

class PriceRangeFilter(admin.SimpleListFilter):
    """Фильтр по ценовым диапазонам"""
    title = _('ценовой диапазон')
    parameter_name = 'price_range'

    def lookups(self, request, model_admin):
        return (
            ('0-500', _('До 500 руб')),
            ('500-1000', _('500-1000 руб')),
            ('1000-2000', _('1000-2000 руб')),
            ('2000+', _('Более 2000 руб')),
        )

    def queryset(self, request, queryset):
        if self.value() == '0-500':
            return queryset.filter(price__lt=500)
        if self.value() == '500-1000':
            return queryset.filter(price__gte=500, price__lt=1000)
        if self.value() == '1000-2000':
            return queryset.filter(price__gte=1000, price__lt=2000)
        if self.value() == '2000+':
            return queryset.filter(price__gte=2000)

class BookAdmin(admin.ModelAdmin):
    list_filter = [
        PriceRangeFilter,  # Наш кастомный фильтр
        'category',
        'publication_year',
    ]
```

## 📋 Кастомизация форм

### Fieldsets - группировка полей

```python
class BookAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'isbn', 'category', 'publisher'),
            'description': 'Заполните основные данные о книге'
        }),
        ('Авторы', {
            'fields': ('authors',)
        }),
        ('Описание', {
            'fields': ('short_description', 'description', 'image')
        }),
        ('Цена и наличие', {
            'fields': ('price', 'stock'),
            'classes': ('wide',)  # Широкая секция
        }),
        ('Дополнительно', {
            'fields': ('pages', 'publication_year'),
            'classes': ('collapse',)  # Свернуто по умолчанию
        }),
    )
```

### Inline - редактирование связанных объектов

```python
class BookAuthorInline(admin.TabularInline):
    """Авторы прямо на странице книги"""
    model = BookAuthor
    extra = 1  # Одна пустая форма для добавления
    autocomplete_fields = ['author']

class BookAdmin(admin.ModelAdmin):
    inlines = [BookAuthorInline]
    
    # Теперь при редактировании книги можно добавлять авторов
    # без перехода на отдельную страницу
```

**Типы Inline:**
- `TabularInline` - табличный вид
- `StackedInline` - вертикальный вид (для форм с многими полями)

### Autocomplete fields - автодополнение

```python
class PublisherAdmin(admin.ModelAdmin):
    search_fields = ['name']  # ОБЯЗАТЕЛЬНО для autocomplete

class BookAdmin(admin.ModelAdmin):
    autocomplete_fields = ['publisher', 'category']
    # Вместо dropdown будет поле с поиском
```

## 🎭 Продвинутые возможности

### Actions - массовые действия

```python
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'stock']
    actions = ['make_unavailable', 'increase_stock']
    
    def make_unavailable(self, request, queryset):
        """Сделать книги недоступными"""
        updated = queryset.update(stock=0)
        self.message_user(request, f'{updated} книг сделано недоступными.')
    make_unavailable.short_description = 'Сделать недоступными'
    
    def increase_stock(self, request, queryset):
        """Увеличить остаток на 10"""
        from django.db.models import F
        queryset.update(stock=F('stock') + 10)
        self.message_user(request, f'Остаток увеличен на 10 для {queryset.count()} книг.')
    increase_stock.short_description = 'Увеличить остаток на 10'
```

### Кастомные методы отображения

```python
from django.utils.html import format_html
from django.urls import reverse

class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'colored_stock', 'view_authors']
    
    def colored_stock(self, obj):
        """Цветной индикатор остатка"""
        if obj.stock == 0:
            color = 'red'
        elif obj.stock < 10:
            color = 'orange'
        else:
            color = 'green'
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            obj.stock
        )
    colored_stock.short_description = 'Остаток'
    colored_stock.admin_order_field = 'stock'  # Можно сортировать
    
    def view_authors(self, obj):
        """Ссылки на авторов"""
        links = []
        for author in obj.authors.all():
            url = reverse('admin:books_author_change', args=[author.pk])
            links.append(format_html('<a href="{}">{}</a>', url, author))
        return format_html(' | '.join(links))
    view_authors.short_description = 'Авторы'
```

### Права доступа

```python
class BookAdmin(admin.ModelAdmin):
    def has_delete_permission(self, request, obj=None):
        """Запретить удаление книг"""
        return False
    
    def has_add_permission(self, request):
        """Только суперпользователи могут добавлять"""
        return request.user.is_superuser
    
    def get_queryset(self, request):
        """Показывать только книги своего издательства"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Предполагаем, что у пользователя есть publisher
        return qs.filter(publisher=request.user.publisher)
```

### Кастомизация сайта админки

```python
# Вкрайнем файле (например, bookstore_project/admin.py)
from django.contrib import admin

admin.site.site_header = 'BookStore Админ-панель'
admin.site.site_title = 'BookStore Admin'
admin.site.index_title = 'Управление магазином книг'
```

## 📊 Пример полной настройки

```python
# books/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from .models import Category, Publisher, Author, Book, BookAuthor

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Полная настройка админки для книг"""
    
    # Отображение списка
    list_display = [
        'title',
        'category',
        'publisher',
        'colored_price',
        'colored_stock',
        'popularity',
        'created_at'
    ]
    list_display_links = ['title']  # Кликабельные колонки
    list_editable = ['popularity']  # Редактируемые прямо в списке
    
    # Фильтры и поиск
    list_filter = [
        'category',
        'publisher',
        'publication_year',
        ('created_at', admin.DateFieldListFilter),
    ]
    search_fields = ['title', 'isbn', 'description', 'authors__last_name']
    date_hierarchy = 'created_at'
    
    # Форма редактирования
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'isbn', 'category', 'publisher')
        }),
        ('Цена и наличие', {
            'fields': ('price', 'stock', 'popularity')
        }),
        ('Описание', {
            'fields': ('short_description', 'description', 'image')
        }),
        ('Дополнительно', {
            'fields': ('pages', 'publication_year'),
            'classes': ('collapse',)
        }),
    )
    
    # Inline модели
    inlines = [BookAuthorInline]
    
    # Автодополнение
    autocomplete_fields = ['category', 'publisher']
    
    # Readonly поля
    readonly_fields = ['created_at', 'updated_at', 'author_count']
    
    # Сортировка
    ordering = ['-popularity', 'title']
    
    # Кастомные методы отображения
    def colored_price(self, obj):
        if obj.price < 500:
            color = 'green'
        elif obj.price < 1000:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} ₽</span>',
            color, obj.price
        )
    colored_price.short_description = 'Цена'
    colored_price.admin_order_field = 'price'
    
    def colored_stock(self, obj):
        if obj.stock == 0:
            color = 'red'
            text = 'Нет в наличии'
        elif obj.stock < 10:
            color = 'orange'
            text = f'{obj.stock} шт'
        else:
            color = 'green'
            text = f'{obj.stock} шт'
        return format_html('<span style="color: {};">{}</span>', color, text)
    colored_stock.short_description = 'Остаток'
    colored_stock.admin_order_field = 'stock'
    
    def author_count(self, obj):
        return obj.authors.count()
    author_count.short_description = 'Количество авторов'
    
    # Actions
    actions = ['make_popular', 'reset_popularity']
    
    def make_popular(self, request, queryset):
        queryset.update(popularity=100)
        self.message_user(request, 'Популярность обновлена')
    make_popular.short_description = 'Сделать популярными'
    
    def reset_popularity(self, request, queryset):
        queryset.update(popularity=0)
    reset_popularity.short_description = 'Сбросить популярность'
```

## 🎯 Следующий шаг

Переходите к **[06_DRF_SETUP.md](06_DRF_SETUP.md)** для настройки Django REST Framework!

## 💡 Полезные ссылки

- [Django Admin Documentation](https://docs.djangoproject.com/en/5.0/ref/contrib/admin/)
- [ModelAdmin options](https://docs.djangoproject.com/en/5.0/ref/contrib/admin/#modeladmin-options)
- [Admin actions](https://docs.djangoproject.com/en/5.0/ref/contrib/admin/actions/)

---

**Автор:** Руководство по Django Admin  
**Дата:** Ноябрь 2025  
**Версия:** 1.0
