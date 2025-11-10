# 🔄 Миграции Django

## 📋 Содержание
1. [Что такое миграции](#что-такое-миграции)
2. [Создание миграций](#создание-миграций)
3. [Применение миграций](#применение-миграций)
4. [Работа с данными](#работа-с-данными)
5. [Сравнение с Sequelize](#сравнение-с-sequelize)

## 🎯 Что такое миграции

**Миграции** - это способ версионирования схемы базы данных. Это Python файлы, которые описывают изменения в структуре БД.

### Сравнение подходов

**Node.js/Sequelize:**
- Миграции создаются вручную
- Нужно писать `up()` и `down()` методы
- Sequelize не отслеживает изменения в моделях

**Django:**
- Миграции генерируются автоматически из моделей
- Django отслеживает изменения и создает нужные миграции
- Можно редактировать сгенерированные миграции

## 📝 Создание миграций

### Базовый процесс

```bash
# 1. Создайте или измените модели в models.py
# 2. Создайте миграции
python manage.py makemigrations

# 3. Просмотрите SQL (опционально)
python manage.py sqlmigrate books 0001

# 4. Примените миграции
python manage.py migrate
```

### Первые миграции для нашего проекта

**Шаг 1: Создайте миграции**

```bash
python manage.py makemigrations
```

**Вывод:**
```
Migrations for 'users':
  users/migrations/0001_initial.py
    - Create model User
Migrations for 'books':
  books/migrations/0001_initial.py
    - Create model Author
    - Create model Category
    - Create model Publisher
    - Create model Book
    - Create model BookAuthor
Migrations for 'cart':
  cart/migrations/0001_initial.py
    - Create model CartItem
```

**Сравнение с Sequelize:**
```bash
# Sequelize
npx sequelize-cli migration:generate --name create-users
# Создается пустой файл, который нужно заполнить вручную

# Django
python manage.py makemigrations
# Создается готовый файл на основе моделей
```

### Структура файла миграции

**Django миграция (автогенерированная):**
```python
# books/migrations/0001_initial.py
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Author',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=100, verbose_name='Имя')),
                ('last_name', models.CharField(max_length=100, verbose_name='Фамилия')),
                ('biography', models.TextField(blank=True, verbose_name='Биография')),
                ('birth_date', models.DateField(blank=True, null=True, verbose_name='Дата рождения')),
                ('death_date', models.DateField(blank=True, null=True, verbose_name='Дата смерти')),
                ('nationality', models.CharField(blank=True, max_length=100, verbose_name='Национальность')),
                ('website', models.URLField(blank=True, max_length=500, verbose_name='Веб-сайт')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Автор',
                'verbose_name_plural': 'Авторы',
                'db_table': 'authors',
                'ordering': ['last_name', 'first_name'],
            },
        ),
        
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True, verbose_name='Название')),
                ('slug', models.SlugField(max_length=255, unique=True, verbose_name='URL slug')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активна')),
                ('sort_order', models.IntegerField(default=0, verbose_name='Порядок сортировки')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='books.category', verbose_name='Родительская категория')),
            ],
            options={
                'verbose_name': 'Категория',
                'verbose_name_plural': 'Категории',
                'db_table': 'categories',
                'ordering': ['sort_order', 'name'],
            },
        ),
        
        # ... остальные модели
    ]
```

**Sequelize миграция (ручная):**
```javascript
// migrations/20251110-create-authors.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('authors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      // ... все остальные поля нужно писать вручную
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
    
    // Индексы нужно добавлять отдельно
    await queryInterface.addIndex('authors', ['last_name', 'first_name']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('authors');
  }
};
```

## 🚀 Применение миграций

### Применить все миграции

```bash
python manage.py migrate
```

**Вывод:**
```
Operations to perform:
  Apply all migrations: admin, auth, books, cart, contenttypes, sessions, users
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0001_initial... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  ...
  Applying users.0001_initial... OK
  Applying books.0001_initial... OK
  Applying cart.0001_initial... OK
```

### Применить миграции конкретного приложения

```bash
# Только миграции приложения books
python manage.py migrate books

# Откатить до конкретной миграции
python manage.py migrate books 0001
```

### Просмотр SQL миграции

```bash
# Посмотреть SQL, который будет выполнен
python manage.py sqlmigrate books 0001
```

**Вывод:**
```sql
BEGIN;
--
-- Create model Author
--
CREATE TABLE "authors" (
    "id" bigint NOT NULL PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    "first_name" varchar(100) NOT NULL,
    "last_name" varchar(100) NOT NULL,
    "biography" text NOT NULL,
    "birth_date" date NULL,
    "death_date" date NULL,
    "nationality" varchar(100) NOT NULL,
    "website" varchar(500) NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);
--
-- Create model Category
--
CREATE TABLE "categories" (
    "id" bigint NOT NULL PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    ...
);
COMMIT;
```

### Проверка статуса миграций

```bash
# Показать все миграции и их статус
python manage.py showmigrations
```

**Вывод:**
```
admin
 [X] 0001_initial
 [X] 0002_logentry_remove_auto_add
 [X] 0003_logentry_add_action_flag_choices
auth
 [X] 0001_initial
 [X] 0002_alter_permission_name_max_length
 ...
books
 [X] 0001_initial
cart
 [X] 0001_initial
users
 [X] 0001_initial
```

## 📊 Работа с данными

### Создание миграции с данными

**Сценарий:** Добавить начальные категории в БД

```bash
# Создайте пустую миграцию
python manage.py makemigrations --empty books --name add_initial_categories
```

**Редактируйте созданный файл:**
```python
# books/migrations/0002_add_initial_categories.py
from django.db import migrations

def create_initial_categories(apps, schema_editor):
    """Создание начальных категорий"""
    Category = apps.get_model('books', 'Category')
    
    categories = [
        {
            'name': 'Фантастика',
            'slug': 'fantastika',
            'description': 'Научная фантастика и фэнтези',
            'sort_order': 1
        },
        {
            'name': 'Детектив',
            'slug': 'detektiv',
            'description': 'Детективы и триллеры',
            'sort_order': 2
        },
        {
            'name': 'Романтика',
            'slug': 'romantika',
            'description': 'Романтические романы',
            'sort_order': 3
        },
        {
            'name': 'Биография',
            'slug': 'biografiya',
            'description': 'Биографии и мемуары',
            'sort_order': 4
        },
    ]
    
    for cat_data in categories:
        Category.objects.create(**cat_data)

def remove_initial_categories(apps, schema_editor):
    """Удаление начальных категорий (для отката)"""
    Category = apps.get_model('books', 'Category')
    Category.objects.filter(
        slug__in=['fantastika', 'detektiv', 'romantika', 'biografiya']
    ).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('books', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_categories, remove_initial_categories),
    ]
```

**Применить:**
```bash
python manage.py migrate books
```

**Сравнение с Sequelize:**
```javascript
// seeders/20251110-demo-categories.js
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Фантастика',
        slug: 'fantastika',
        description: 'Научная фантастика и фэнтези',
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      // ...
    ]);
  },
  
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', {
      slug: ['fantastika', 'detektiv', 'romantika', 'biografiya']
    });
  }
};
```

### Fixtures - альтернативный способ

Django также поддерживает fixtures - JSON/YAML файлы с данными.

**Создайте `books/fixtures/initial_data.json`:**
```json
[
  {
    "model": "books.category",
    "pk": 1,
    "fields": {
      "name": "Фантастика",
      "slug": "fantastika",
      "description": "Научная фантастика и фэнтези",
      "is_active": true,
      "sort_order": 1
    }
  },
  {
    "model": "books.category",
    "pk": 2,
    "fields": {
      "name": "Детектив",
      "slug": "detektiv",
      "description": "Детективы и триллеры",
      "is_active": true,
      "sort_order": 2
    }
  }
]
```

**Загрузить данные:**
```bash
python manage.py loaddata initial_data
```

**Создать fixture из БД:**
```bash
# Экспортировать все категории
python manage.py dumpdata books.Category --indent 2 > categories.json

# Экспортировать всё приложение books
python manage.py dumpdata books --indent 2 > books_data.json
```

## 🔧 Продвинутые операции

### Изменение существующих полей

**Сценарий:** Добавить новое поле в модель Book

```python
# books/models.py
class Book(models.Model):
    # ... существующие поля
    
    # Новое поле
    discount_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Скидка %'
    )
```

```bash
# Создать миграцию
python manage.py makemigrations
```

**Django спросит:**
```
You are trying to add a non-nullable field 'discount_percentage' to book without a default
Please select a fix:
 1) Provide a one-off default now
 2) Quit, and let me add a default in models.py
Select an option:
```

Выберите `1` и введите `0` как дефолтное значение.

### Переименование поля

```python
# books/models.py
class Book(models.Model):
    # Было: short_description
    # Стало: summary
    summary = models.TextField(blank=True, verbose_name='Краткое описание')
```

```bash
python manage.py makemigrations
```

**Django спросит:**
```
Did you rename book.short_description to book.summary (a TextField)? [y/N]
```

Ответьте `y` - Django создаст миграцию с `RenameField` вместо удаления старого и создания нового поля (что привело бы к потере данных).

### Откат миграций

```bash
# Откатить последнюю миграцию
python manage.py migrate books 0001

# Откатить все миграции приложения
python manage.py migrate books zero

# Откатить все миграции всех приложений
python manage.py migrate --fake-initial
```

**⚠️ Осторожно с откатом в production!**

## 📋 Чек-лист миграций

### Создание миграций
- [ ] Модели созданы/изменены
- [ ] `python manage.py makemigrations` выполнен
- [ ] Миграции созданы без ошибок
- [ ] `python manage.py migrate` выполнен успешно
- [ ] Данные не потеряны

### Перед commit
- [ ] Миграции протестированы
- [ ] Добавлены фикстуры или data migrations если нужно
- [ ] Проверена возможность отката
- [ ] Миграции добавлены в git

### Production деплой
- [ ] Сделан backup БД
- [ ] Миграции проверены в staging
- [ ] Запущены в maintenance mode (если нужно)
- [ ] Проверено что всё работает

## 🆚 Сравнение с Sequelize

| Действие | Sequelize | Django |
|----------|-----------|--------|
| Создать миграцию | `sequelize-cli migration:generate` | `python manage.py makemigrations` |
| Применить миграции | `sequelize-cli db:migrate` | `python manage.py migrate` |
| Откатить миграцию | `sequelize-cli db:migrate:undo` | `python manage.py migrate app_name 0001` |
| Статус миграций | - | `python manage.py showmigrations` |
| SQL миграции | - | `python manage.py sqlmigrate app 0001` |
| Заполнить данными | `sequelize-cli db:seed:all` | `python manage.py loaddata fixture.json` |
| Экспорт данных | - | `python manage.py dumpdata` |

## 🎯 Следующий шаг

Переходите к **[05_ADMIN_PANEL.md](05_ADMIN_PANEL.md)** для настройки админ-панели Django!

## 💡 Полезные команды

```bash
# Создание миграций
python manage.py makemigrations                    # Все приложения
python manage.py makemigrations books             # Конкретное приложение
python manage.py makemigrations --empty books     # Пустая миграция
python manage.py makemigrations --name add_field  # С именем

# Применение миграций
python manage.py migrate                          # Все приложения
python manage.py migrate books                    # Конкретное приложение
python manage.py migrate books 0001              # До конкретной миграции
python manage.py migrate books zero              # Откатить все

# Информация
python manage.py showmigrations                   # Статус всех миграций
python manage.py showmigrations books            # Статус приложения
python manage.py sqlmigrate books 0001           # SQL миграции

# Проверки
python manage.py makemigrations --dry-run        # Без создания файлов
python manage.py makemigrations --check          # Проверить есть ли несозданные миграции

# Работа с данными
python manage.py loaddata fixture.json           # Загрузить данные
python manage.py dumpdata books > data.json      # Экспортировать данные
python manage.py dumpdata --indent 2             # С форматированием
```

---

**Автор:** Руководство по миграциям Django  
**Дата:** Ноябрь 2025  
**Версия:** 1.0
