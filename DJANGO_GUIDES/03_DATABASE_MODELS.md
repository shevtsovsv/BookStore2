# 📊 Модели базы данных Django

## 📋 Содержание
1. [Введение в Django ORM](#введение-в-django-orm)
2. [Создание моделей](#создание-моделей)
3. [Сравнение с Sequelize](#сравнение-с-sequelize)
4. [Связи между моделями](#связи-между-моделями)
5. [Дополнительные возможности](#дополнительные-возможности)

## 🎯 Введение в Django ORM

### Что такое ORM?

**ORM (Object-Relational Mapping)** - технология, которая позволяет работать с базой данных через объекты Python вместо SQL запросов.

**В Node.js/Sequelize:**
```javascript
const book = await Book.findOne({ where: { id: 1 } });
```

**В Django:**
```python
book = Book.objects.get(id=1)
```

### Django ORM vs Sequelize

| Особенность | Sequelize (Node.js) | Django ORM |
|-------------|---------------------|------------|
| Определение моделей | JavaScript объекты | Python классы |
| Автогенерация миграций | Нет | Да |
| Lazy loading | По умолчанию | По умолчанию |
| Eager loading | `include:` | `select_related()`, `prefetch_related()` |
| Валидация | Sequelize Validator | Model validators |
| Запросы | Методы модели | QuerySet API |

## 📝 Создание моделей

### Модель User (пользователь)

**Node.js/Sequelize версия:**
```javascript
// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100)
    },
    last_name: {
      type: DataTypes.STRING(100)
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'manager'),
      defaultValue: 'customer'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });
  
  return User;
};
```

**Django версия:**
```python
# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    """
    Расширенная модель пользователя.
    Наследуется от AbstractUser, который уже содержит:
    - username, email, password
    - first_name, last_name
    - is_active, is_staff, is_superuser
    - date_joined, last_login
    """
    
    ROLE_CHOICES = [
        ('customer', 'Покупатель'),
        ('admin', 'Администратор'),
        ('manager', 'Менеджер'),
    ]
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Номер телефона должен быть в формате: '+999999999'. До 15 цифр."
    )
    
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        verbose_name='Телефон'
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='customer',
        verbose_name='Роль'
    )
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def get_full_name(self):
        """Возвращает полное имя пользователя"""
        return f"{self.first_name} {self.last_name}".strip() or self.username
```

**Ключевые отличия:**

1. **Наследование:** Django использует `AbstractUser`, который уже содержит базовые поля
2. **Валидация:** `validators=` прямо в определении поля
3. **Choices:** `ROLE_CHOICES` для enum-подобных полей
4. **Meta класс:** Метаданные модели (имя таблицы, сортировка по умолчанию)
5. **Методы модели:** `__str__()` для строкового представления

### Настройка кастомной модели User

**ВАЖНО!** Добавьте в `settings.py`:
```python
# bookstore_project/settings.py

# Используем кастомную модель пользователя
AUTH_USER_MODEL = 'users.User'
```

### Модель Category (категория)

**Node.js/Sequelize:**
```javascript
// models/Category.js
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true
  });
  
  Category.associate = (models) => {
    Category.belongsTo(models.Category, {
      as: 'parent',
      foreignKey: 'parent_id'
    });
    Category.hasMany(models.Category, {
      as: 'children',
      foreignKey: 'parent_id'
    });
  };
  
  return Category;
};
```

**Django:**
```python
# books/models.py
from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    """Категория книг с поддержкой иерархии"""
    
    name = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Название'
    )
    
    slug = models.SlugField(
        max_length=255,
        unique=True,
        verbose_name='URL slug'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    
    # Self-reference для иерархии
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская категория'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    
    sort_order = models.IntegerField(
        default=0,
        verbose_name='Порядок сортировки'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'sort_order']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Автоматическая генерация slug при сохранении"""
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)
    
    def get_ancestors(self):
        """Получить всех предков категории"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors
    
    def get_descendants(self):
        """Получить всех потомков категории"""
        descendants = []
        children = list(self.children.all())
        descendants.extend(children)
        for child in children:
            descendants.extend(child.get_descendants())
        return descendants
```

**Новые концепции:**

1. **SlugField:** Специальное поле для URL-friendly строк
2. **Self-reference:** `ForeignKey('self')` для иерархии
3. **related_name:** Обратная связь (parent.children)
4. **auto_now_add / auto_now:** Автоматические timestamps
5. **save() override:** Кастомная логика при сохранении
6. **Методы модели:** Бизнес-логика прямо в модели

### Модель Publisher (издательство)

**Django:**
```python
# books/models.py (продолжение)

class Publisher(models.Model):
    """Издательство"""
    
    name = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Название'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    
    website = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='Веб-сайт'
    )
    
    contact_email = models.EmailField(
        blank=True,
        verbose_name='Email'
    )
    
    founded_year = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Год основания'
    )
    
    country = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Страна'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'publishers'
        verbose_name = 'Издательство'
        verbose_name_plural = 'Издательства'
        ordering = ['name']
    
    def __str__(self):
        return self.name
```

**Специальные типы полей:**
- `URLField` - валидирует URL
- `EmailField` - валидирует email
- Автоматическая валидация при `model.full_clean()`

### Модель Author (автор)

**Django:**
```python
# books/models.py (продолжение)

class Author(models.Model):
    """Автор книги"""
    
    first_name = models.CharField(
        max_length=100,
        verbose_name='Имя'
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name='Фамилия'
    )
    
    biography = models.TextField(
        blank=True,
        verbose_name='Биография'
    )
    
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата рождения'
    )
    
    death_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата смерти'
    )
    
    nationality = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Национальность'
    )
    
    website = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='Веб-сайт'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'authors'
        verbose_name = 'Автор'
        verbose_name_plural = 'Авторы'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
        ]
    
    def __str__(self):
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name(self):
        """Полное имя автора"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_alive(self):
        """Жив ли автор"""
        return self.death_date is None
```

**Новые концепции:**
- `@property` - вычисляемые поля (не хранятся в БД)
- `DateField` - только дата без времени

### Модель Book (книга)

**Node.js/Sequelize:**
```javascript
// models/Book.js
module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    isbn: {
      type: DataTypes.STRING(20),
      unique: true
    },
    publisher_id: {
      type: DataTypes.INTEGER,
      references: { model: 'publishers', key: 'id' }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'categories', key: 'id' }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    description: DataTypes.TEXT,
    short_description: DataTypes.TEXT,
    image: DataTypes.STRING(255),
    pages: DataTypes.INTEGER,
    publication_year: DataTypes.INTEGER,
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'books',
    timestamps: true,
    underscored: true
  });
  
  Book.associate = (models) => {
    Book.belongsTo(models.Category, { foreignKey: 'category_id' });
    Book.belongsTo(models.Publisher, { foreignKey: 'publisher_id' });
    Book.belongsToMany(models.Author, {
      through: 'book_authors',
      foreignKey: 'book_id'
    });
  };
  
  return Book;
};
```

**Django:**
```python
# books/models.py (продолжение)
from django.core.validators import MinValueValidator, MaxValueValidator

class Book(models.Model):
    """Книга в каталоге"""
    
    title = models.CharField(
        max_length=255,
        verbose_name='Название'
    )
    
    isbn = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        verbose_name='ISBN'
    )
    
    # ForeignKey - связь многие-к-одному
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='books',
        verbose_name='Издательство'
    )
    
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='books',
        verbose_name='Категория'
    )
    
    # ManyToMany - связь многие-ко-многим
    # Будет создана через промежуточную модель BookAuthor
    authors = models.ManyToManyField(
        Author,
        through='BookAuthor',
        related_name='books',
        verbose_name='Авторы'
    )
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Цена'
    )
    
    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Остаток на складе'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    
    short_description = models.TextField(
        blank=True,
        verbose_name='Краткое описание'
    )
    
    image = models.ImageField(
        upload_to='book_covers/',
        blank=True,
        null=True,
        verbose_name='Обложка'
    )
    
    pages = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Количество страниц'
    )
    
    publication_year = models.IntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1000),
            MaxValueValidator(2100)
        ],
        verbose_name='Год издания'
    )
    
    popularity = models.IntegerField(
        default=0,
        verbose_name='Популярность'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'books'
        verbose_name = 'Книга'
        verbose_name_plural = 'Книги'
        ordering = ['-popularity', 'title']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['isbn']),
            models.Index(fields=['category', '-popularity']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def is_available(self):
        """Доступна ли книга для покупки"""
        return self.stock > 0
    
    @property
    def author_names(self):
        """Строка с именами всех авторов"""
        return ", ".join([str(author) for author in self.authors.all()])
    
    def increment_popularity(self, amount=1):
        """Увеличить популярность"""
        self.popularity += amount
        self.save(update_fields=['popularity'])
```

**Ключевые концепции:**

1. **on_delete:**
   - `CASCADE` - удалить связанные объекты
   - `PROTECT` - запретить удаление если есть связанные объекты
   - `SET_NULL` - установить NULL
   - `SET_DEFAULT` - установить значение по умолчанию

2. **ImageField:**
   - Требует `Pillow`: `pip install Pillow`
   - `upload_to` - путь загрузки относительно `MEDIA_ROOT`

3. **Validators:**
   - Встроенная валидация на уровне модели
   - Вызывается при `model.full_clean()`

### Модель BookAuthor (связь книг и авторов)

**Django:**
```python
# books/models.py (продолжение)

class BookAuthor(models.Model):
    """Промежуточная модель для связи книг и авторов с ролями"""
    
    ROLE_CHOICES = [
        ('main_author', 'Основной автор'),
        ('co_author', 'Соавтор'),
        ('translator', 'Переводчик'),
        ('editor', 'Редактор'),
    ]
    
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        verbose_name='Книга'
    )
    
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        verbose_name='Автор'
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='main_author',
        verbose_name='Роль'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'book_authors'
        verbose_name = 'Автор книги'
        verbose_name_plural = 'Авторы книг'
        unique_together = ['book', 'author', 'role']
        indexes = [
            models.Index(fields=['book', 'author']),
        ]
    
    def __str__(self):
        return f"{self.book.title} - {self.author.full_name} ({self.get_role_display()})"
```

**Особенности:**
- `unique_together` - уникальность комбинации полей
- `get_role_display()` - автоматический метод для choices

### Модель CartItem (элемент корзины)

**Django:**
```python
# cart/models.py
from django.db import models
from django.conf import settings
from books.models import Book

class CartItem(models.Model):
    """Элемент корзины покупок"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Используем AUTH_USER_MODEL вместо User
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='Пользователь'
    )
    
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='Книга'
    )
    
    quantity = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Количество'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cart_items'
        verbose_name = 'Элемент корзины'
        verbose_name_plural = 'Элементы корзины'
        unique_together = ['user', 'book']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} x{self.quantity}"
    
    @property
    def total_price(self):
        """Общая стоимость позиции"""
        return self.book.price * self.quantity
    
    def clean(self):
        """Валидация на уровне модели"""
        from django.core.exceptions import ValidationError
        
        if self.quantity > self.book.stock:
            raise ValidationError(
                f'Недостаточно товара на складе. Доступно: {self.book.stock}'
            )
    
    def save(self, *args, **kwargs):
        """Переопределение save с валидацией"""
        self.full_clean()  # Вызываем валидацию
        super().save(*args, **kwargs)
```

## 🔗 Связи между моделями

### One-to-Many (Один-ко-многим)

**Sequelize:**
```javascript
Publisher.hasMany(Book);
Book.belongsTo(Publisher);
```

**Django:**
```python
class Book(models.Model):
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE)

# Использование:
book.publisher          # Получить издательство книги
publisher.book_set.all()  # Получить все книги издательства
# или с related_name='books':
publisher.books.all()   # Получить все книги издательства
```

### Many-to-Many (Многие-ко-многим)

**Sequelize:**
```javascript
Book.belongsToMany(Author, { through: 'BookAuthors' });
Author.belongsToMany(Book, { through: 'BookAuthors' });
```

**Django:**
```python
class Book(models.Model):
    authors = models.ManyToManyField(Author, through='BookAuthor')

# Использование:
book.authors.all()     # Все авторы книги
author.books.all()     # Все книги автора (через related_name)
```

### Self-Reference (Иерархия)

**Django:**
```python
class Category(models.Model):
    parent = models.ForeignKey('self', null=True, related_name='children')

# Использование:
category.parent        # Родительская категория
category.children.all()  # Дочерние категории
```

## 📊 Сравнительная таблица типов полей

| Sequelize | Django | Описание |
|-----------|--------|----------|
| `DataTypes.STRING` | `CharField` | Строка ограниченной длины |
| `DataTypes.TEXT` | `TextField` | Неограниченный текст |
| `DataTypes.INTEGER` | `IntegerField` | Целое число |
| `DataTypes.DECIMAL` | `DecimalField` | Десятичное число |
| `DataTypes.BOOLEAN` | `BooleanField` | Логическое значение |
| `DataTypes.DATE` | `DateField` | Дата |
| `DataTypes.DATEONLY` | `DateField` | Только дата |
| - | `DateTimeField` | Дата и время |
| `DataTypes.ENUM` | `CharField` + `choices` | Перечисление |
| - | `EmailField` | Email с валидацией |
| - | `URLField` | URL с валидацией |
| - | `ImageField` | Изображение |
| - | `FileField` | Файл |
| - | `SlugField` | URL-friendly строка |
| `DataTypes.JSON` | `JSONField` | JSON данные |

## 🎯 Следующий шаг

Переходите к **[04_MIGRATIONS.md](04_MIGRATIONS.md)** для создания и применения миграций!

---

**Автор:** Руководство по моделям Django  
**Дата:** Ноябрь 2025  
**Версия:** 1.0
