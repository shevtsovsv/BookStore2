# 🔄 Миграции и сидеры базы данных

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 2-3 часа  
> **Предварительные требования:** Завершение части 04

## 🎯 Цели этой части

В этой части вы изучите работу с миграциями и сидерами в Sequelize для:

- Создания и управления схемой базы данных
- Версионирования изменений структуры БД
- Заполнения базы тестовыми данными
- Отката изменений (rollback)
- Управления зависимостями между миграциями

---

## 📋 Что такое миграции?

**Миграции** - это скрипты для управления изменениями схемы базы данных:

- ✅ Создание и удаление таблиц
- ✅ Добавление и удаление колонок
- ✅ Изменение типов данных
- ✅ Создание индексов и ограничений
- ✅ Версионирование схемы БД

**Сидеры** - это скрипты для заполнения базы данными:

- ✅ Тестовые данные для разработки
- ✅ Начальные данные (администратор, категории)
- ✅ Демонстрационные данные

---

## 🏗️ Настройка Sequelize CLI

### 1. Установка Sequelize CLI

```bash
npm install -g sequelize-cli
# или локально
npm install --save-dev sequelize-cli
```

### 2. Конфигурация .sequelizerc

Создайте файл `.sequelizerc` в корне проекта:

```javascript
const path = require("path");

module.exports = {
  config: path.resolve("config", "config.json"),
  "models-path": path.resolve("models"),
  "seeders-path": path.resolve("seeders"),
  "migrations-path": path.resolve("migrations"),
};
```

### 3. Обновление config/config.json

Убедитесь, что конфигурация корректна:

```json
{
  "development": {
    "username": "bookstore_user",
    "password": "your_password_here",
    "database": "bookstore_dev",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": console.log,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  },
  "test": {
    "username": "bookstore_user",
    "password": "your_password_here",
    "database": "bookstore_test",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": false
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    },
    "logging": false
  }
}
```

---

## 📊 Создание миграций

### 1. Миграция Users

```bash
npx sequelize-cli migration:generate --name create-users
```

Отредактируйте файл `migrations/XXXXXX-create-users.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM("admin", "user"),
        allowNull: false,
        defaultValue: "user",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Добавляем индексы
    await queryInterface.addIndex("users", ["email"], {
      unique: true,
      name: "users_email_unique",
    });

    await queryInterface.addIndex("users", ["role"], {
      name: "users_role_index",
    });

    await queryInterface.addIndex("users", ["isActive"], {
      name: "users_is_active_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
```

### 2. Миграция Categories

```bash
npx sequelize-cli migration:generate --name create-categories
```

Файл `migrations/XXXXXX-create-categories.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      metaTitle: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      metaDescription: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Индексы
    await queryInterface.addIndex("categories", ["name"], {
      unique: true,
      name: "categories_name_unique",
    });

    await queryInterface.addIndex("categories", ["slug"], {
      unique: true,
      name: "categories_slug_unique",
    });

    await queryInterface.addIndex("categories", ["parentId"], {
      name: "categories_parent_id_index",
    });

    await queryInterface.addIndex("categories", ["isActive"], {
      name: "categories_is_active_index",
    });

    await queryInterface.addIndex("categories", ["sortOrder"], {
      name: "categories_sort_order_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("categories");
  },
};
```

### 3. Миграция Authors

```bash
npx sequelize-cli migration:generate --name create-authors
```

Файл `migrations/XXXXXX-create-authors.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("authors", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      middleName: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      biography: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      birthDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      deathDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Индексы
    await queryInterface.addIndex("authors", ["firstName", "lastName"], {
      name: "authors_full_name_index",
    });

    await queryInterface.addIndex("authors", ["slug"], {
      unique: true,
      name: "authors_slug_unique",
    });

    await queryInterface.addIndex("authors", ["isActive"], {
      name: "authors_is_active_index",
    });

    await queryInterface.addIndex("authors", ["nationality"], {
      name: "authors_nationality_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("authors");
  },
};
```

### 4. Миграция Publishers

```bash
npx sequelize-cli migration:generate --name create-publishers
```

Файл `migrations/XXXXXX-create-publishers.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("publishers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      foundedYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      logoUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Индексы
    await queryInterface.addIndex("publishers", ["name"], {
      unique: true,
      name: "publishers_name_unique",
    });

    await queryInterface.addIndex("publishers", ["slug"], {
      unique: true,
      name: "publishers_slug_unique",
    });

    await queryInterface.addIndex("publishers", ["country"], {
      name: "publishers_country_index",
    });

    await queryInterface.addIndex("publishers", ["isActive"], {
      name: "publishers_is_active_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("publishers");
  },
};
```

### 5. Миграция Books

```bash
npx sequelize-cli migration:generate --name create-books
```

Файл `migrations/XXXXXX-create-books.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("books", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      subtitle: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isbn: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      discountPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      pageCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      publishedYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      language: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "ru",
      },
      format: {
        type: Sequelize.ENUM("hardcover", "paperback", "ebook", "audiobook"),
        allowNull: false,
        defaultValue: "paperback",
      },
      weight: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
      },
      dimensions: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      stockQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      publisherId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "publishers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      slug: {
        type: Sequelize.STRING(300),
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      },
      reviewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      metaTitle: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      metaDescription: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Индексы
    await queryInterface.addIndex("books", ["title"], {
      name: "books_title_index",
    });

    await queryInterface.addIndex("books", ["isbn"], {
      unique: true,
      name: "books_isbn_unique",
    });

    await queryInterface.addIndex("books", ["slug"], {
      unique: true,
      name: "books_slug_unique",
    });

    await queryInterface.addIndex("books", ["categoryId"], {
      name: "books_category_id_index",
    });

    await queryInterface.addIndex("books", ["publisherId"], {
      name: "books_publisher_id_index",
    });

    await queryInterface.addIndex("books", ["price"], {
      name: "books_price_index",
    });

    await queryInterface.addIndex("books", ["publishedYear"], {
      name: "books_published_year_index",
    });

    await queryInterface.addIndex("books", ["language"], {
      name: "books_language_index",
    });

    await queryInterface.addIndex("books", ["format"], {
      name: "books_format_index",
    });

    await queryInterface.addIndex("books", ["isActive"], {
      name: "books_is_active_index",
    });

    await queryInterface.addIndex("books", ["isFeatured"], {
      name: "books_is_featured_index",
    });

    await queryInterface.addIndex("books", ["rating"], {
      name: "books_rating_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("books");
  },
};
```

### 6. Миграция BookAuthors

```bash
npx sequelize-cli migration:generate --name create-book-authors
```

Файл `migrations/XXXXXX-create-book-authors.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("book_authors", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "books",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "authors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM(
          "author",
          "co-author",
          "editor",
          "translator",
          "illustrator"
        ),
        defaultValue: "author",
        allowNull: false,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Индексы
    await queryInterface.addIndex("book_authors", ["bookId", "authorId"], {
      unique: true,
      name: "book_authors_unique",
    });

    await queryInterface.addIndex("book_authors", ["bookId"], {
      name: "book_authors_book_id_index",
    });

    await queryInterface.addIndex("book_authors", ["authorId"], {
      name: "book_authors_author_id_index",
    });

    await queryInterface.addIndex("book_authors", ["role"], {
      name: "book_authors_role_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("book_authors");
  },
};
```

### 7. Миграция CartItems

```bash
npx sequelize-cli migration:generate --name create-cart-items
```

Файл `migrations/XXXXXX-create-cart-items.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cart_items", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      bookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "books",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      priceAtAdd: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Индексы
    await queryInterface.addIndex("cart_items", ["userId", "bookId"], {
      unique: true,
      name: "cart_items_unique",
    });

    await queryInterface.addIndex("cart_items", ["userId"], {
      name: "cart_items_user_id_index",
    });

    await queryInterface.addIndex("cart_items", ["bookId"], {
      name: "cart_items_book_id_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cart_items");
  },
};
```

---

## 🌱 Создание сидеров

### 1. Сидер для категорий

```bash
npx sequelize-cli seed:generate --name demo-categories
```

Файл `seeders/XXXXXX-demo-categories.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      {
        id: 1,
        name: "Художественная литература",
        description: "Романы, повести, рассказы, поэзия",
        slug: "fiction",
        parentId: null,
        sortOrder: 1,
        isActive: true,
        metaTitle: "Художественная литература - купить книги",
        metaDescription:
          "Большой выбор художественной литературы в нашем книжном магазине",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Классика",
        description: "Классические произведения мировой литературы",
        slug: "classics",
        parentId: 1,
        sortOrder: 1,
        isActive: true,
        metaTitle: "Классическая литература",
        metaDescription:
          "Классические произведения русской и зарубежной литературы",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Современная проза",
        description: "Современные романы и повести",
        slug: "modern-prose",
        parentId: 1,
        sortOrder: 2,
        isActive: true,
        metaTitle: "Современная проза",
        metaDescription: "Новинки современной прозы от лучших авторов",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: "Научно-популярная литература",
        description: "Книги о науке, технологиях, истории",
        slug: "popular-science",
        parentId: null,
        sortOrder: 2,
        isActive: true,
        metaTitle: "Научно-популярная литература",
        metaDescription: "Книги о науке, технологиях и открытиях",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        name: "Бизнес и экономика",
        description: "Книги о бизнесе, экономике, менеджменте",
        slug: "business",
        parentId: null,
        sortOrder: 3,
        isActive: true,
        metaTitle: "Бизнес литература",
        metaDescription: "Книги для развития бизнеса и карьеры",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("categories", categories, {});

    // Обновляем последовательность
    await queryInterface.sequelize.query(
      "SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("categories", null, {});
  },
};
```

### 2. Сидер для авторов

```bash
npx sequelize-cli seed:generate --name demo-authors
```

Файл `seeders/XXXXXX-demo-authors.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const authors = [
      {
        id: 1,
        firstName: "Лев",
        lastName: "Толстой",
        middleName: "Николаевич",
        biography: "Великий русский писатель, мыслитель, просветитель.",
        birthDate: "1828-09-09",
        deathDate: "1910-11-20",
        nationality: "Русский",
        website: null,
        imageUrl: "/images/authors/tolstoy.jpg",
        slug: "lev-tolstoy",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        firstName: "Федор",
        lastName: "Достоевский",
        middleName: "Михайлович",
        biography: "Великий русский писатель, мыслитель, философ и публицист.",
        birthDate: "1821-11-11",
        deathDate: "1881-02-09",
        nationality: "Русский",
        website: null,
        imageUrl: "/images/authors/dostoevsky.jpg",
        slug: "fedor-dostoevsky",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        firstName: "Александр",
        lastName: "Пушкин",
        middleName: "Сергеевич",
        biography:
          "Русский поэт, драматург и прозаик, заложивший основы русского реалистического направления.",
        birthDate: "1799-06-06",
        deathDate: "1837-02-10",
        nationality: "Русский",
        website: null,
        imageUrl: "/images/authors/pushkin.jpg",
        slug: "alexander-pushkin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        firstName: "Джордж",
        lastName: "Оруэлл",
        middleName: null,
        biography:
          'Британский писатель и публицист, автор романов "1984" и "Скотный двор".',
        birthDate: "1903-06-25",
        deathDate: "1950-01-21",
        nationality: "Британский",
        website: null,
        imageUrl: "/images/authors/orwell.jpg",
        slug: "george-orwell",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        firstName: "Рэй",
        lastName: "Далио",
        middleName: null,
        biography: "Американский инвестор, писатель, филантроп.",
        birthDate: "1949-08-08",
        deathDate: null,
        nationality: "Американский",
        website: "https://www.principles.com",
        imageUrl: "/images/authors/dalio.jpg",
        slug: "ray-dalio",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("authors", authors, {});

    // Обновляем последовательность
    await queryInterface.sequelize.query(
      "SELECT setval('authors_id_seq', (SELECT MAX(id) FROM authors));"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("authors", null, {});
  },
};
```

### 3. Сидер для издательств

```bash
npx sequelize-cli seed:generate --name demo-publishers
```

Файл `seeders/XXXXXX-demo-publishers.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const publishers = [
      {
        id: 1,
        name: "АСТ",
        description: "Крупнейшее российское издательство",
        address: "Москва, ул. Звездный бульвар, 21",
        phone: "+7 (495) 615-01-01",
        email: "info@ast.ru",
        website: "https://ast.ru",
        foundedYear: 1990,
        country: "Россия",
        logoUrl: "/images/publishers/ast.png",
        slug: "ast",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "ЭКСМО",
        description:
          "Ведущее российское издательство художественной и деловой литературы",
        address: "Москва, ул. Клары Цеткин, 18/5",
        phone: "+7 (495) 411-68-86",
        email: "info@eksmo.ru",
        website: "https://eksmo.ru",
        foundedYear: 1991,
        country: "Россия",
        logoUrl: "/images/publishers/eksmo.png",
        slug: "eksmo",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Азбука-Аттикус",
        description:
          "Издательская группа, специализирующаяся на художественной литературе",
        address: "Санкт-Петербург, Измайловский пр., 29",
        phone: "+7 (812) 327-04-55",
        email: "info@azbooka.ru",
        website: "https://azbooka.ru",
        foundedYear: 1995,
        country: "Россия",
        logoUrl: "/images/publishers/azbuka.png",
        slug: "azbuka-attikus",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: "Penguin Random House",
        description: "Крупнейшее англоязычное издательство в мире",
        address: "1745 Broadway, New York, NY 10019",
        phone: "+1 (212) 751-2600",
        email: "info@penguinrandomhouse.com",
        website: "https://www.penguinrandomhouse.com",
        foundedYear: 2013,
        country: "США",
        logoUrl: "/images/publishers/penguin.png",
        slug: "penguin-random-house",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("publishers", publishers, {});

    // Обновляем последовательность
    await queryInterface.sequelize.query(
      "SELECT setval('publishers_id_seq', (SELECT MAX(id) FROM publishers));"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("publishers", null, {});
  },
};
```

### 4. Сидер для пользователей

```bash
npx sequelize-cli seed:generate --name demo-users
```

Файл `seeders/XXXXXX-demo-users.js`:

```javascript
"use strict";

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        id: 1,
        firstName: "Администратор",
        lastName: "Системы",
        email: "admin@bookstore.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        isActive: true,
        phone: "+7 (900) 000-00-00",
        address: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        firstName: "Иван",
        lastName: "Петров",
        email: "ivan@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "user",
        isActive: true,
        phone: "+7 (900) 123-45-67",
        address: "Москва, ул. Примерная, д. 1",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        firstName: "Мария",
        lastName: "Сидорова",
        email: "maria@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "user",
        isActive: true,
        phone: "+7 (900) 987-65-43",
        address: "Санкт-Петербург, пр. Невский, д. 20",
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("users", users, {});

    // Обновляем последовательность
    await queryInterface.sequelize.query(
      "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
```

### 5. Сидер для книг

```bash
npx sequelize-cli seed:generate --name demo-books
```

Файл `seeders/XXXXXX-demo-books.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const books = [
      {
        id: 1,
        title: "Война и мир",
        subtitle: null,
        description:
          "Великий роман о русском обществе в эпоху войн против Наполеона.",
        isbn: "978-5-17-123456-7",
        price: 599.0,
        discountPrice: 449.0,
        pageCount: 1300,
        publishedYear: 1869,
        language: "ru",
        format: "hardcover",
        weight: 1200.0,
        dimensions: "24.0 x 17.0 x 6.5",
        stockQuantity: 15,
        imageUrl: "/images/books/war-and-peace.jpg",
        categoryId: 2, // Классика
        publisherId: 1, // АСТ
        slug: "voyna-i-mir",
        isActive: true,
        isFeatured: true,
        viewCount: 125,
        rating: 4.85,
        reviewCount: 34,
        metaTitle: "Война и мир - Лев Толстой | Купить книгу",
        metaDescription:
          'Купить книгу "Война и мир" Льва Толстого. Лучшая цена, быстрая доставка.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        title: "Преступление и наказание",
        subtitle: null,
        description: "Психологический роман о студенте Родионе Раскольникове.",
        isbn: "978-5-17-123457-4",
        price: 459.0,
        discountPrice: null,
        pageCount: 671,
        publishedYear: 1866,
        language: "ru",
        format: "paperback",
        weight: 450.0,
        dimensions: "20.0 x 13.0 x 3.5",
        stockQuantity: 8,
        imageUrl: "/images/books/crime-and-punishment.jpg",
        categoryId: 2, // Классика
        publisherId: 2, // ЭКСМО
        slug: "prestuplenie-i-nakazanie",
        isActive: true,
        isFeatured: true,
        viewCount: 89,
        rating: 4.72,
        reviewCount: 28,
        metaTitle: "Преступление и наказание - Достоевский | Купить",
        metaDescription:
          "Классический роман Федора Достоевского. В наличии, доставка по России.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        title: "1984",
        subtitle: null,
        description: "Антиутопический роман о тоталитарном обществе будущего.",
        isbn: "978-5-17-123458-1",
        price: 379.0,
        discountPrice: 299.0,
        pageCount: 328,
        publishedYear: 1949,
        language: "ru",
        format: "paperback",
        weight: 300.0,
        dimensions: "20.0 x 13.0 x 2.0",
        stockQuantity: 22,
        imageUrl: "/images/books/1984.jpg",
        categoryId: 3, // Современная проза
        publisherId: 3, // Азбука-Аттикус
        slug: "1984",
        isActive: true,
        isFeatured: false,
        viewCount: 156,
        rating: 4.65,
        reviewCount: 47,
        metaTitle: "1984 - Джордж Оруэлл | Антиутопия | Купить книгу",
        metaDescription:
          'Знаменитая антиутопия Джорджа Оруэлла "1984". Актуальный роман о свободе.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        title: "Принципы",
        subtitle: "Жизнь и работа",
        description:
          "Уникальные принципы достижения успеха от основателя Bridgewater Associates.",
        isbn: "978-5-17-123459-8",
        price: 899.0,
        discountPrice: 679.0,
        pageCount: 592,
        publishedYear: 2017,
        language: "ru",
        format: "hardcover",
        weight: 850.0,
        dimensions: "24.0 x 17.0 x 4.0",
        stockQuantity: 12,
        imageUrl: "/images/books/principles.jpg",
        categoryId: 5, // Бизнес и экономика
        publisherId: 1, // АСТ
        slug: "printsipy-zhizn-i-rabota",
        isActive: true,
        isFeatured: true,
        viewCount: 73,
        rating: 4.58,
        reviewCount: 19,
        metaTitle: "Принципы: Жизнь и работа - Рэй Далио | Бизнес книга",
        metaDescription:
          "Бестселлер Рэя Далио о принципах успешной жизни и работы.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("books", books, {});

    // Обновляем последовательность
    await queryInterface.sequelize.query(
      "SELECT setval('books_id_seq', (SELECT MAX(id) FROM books));"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("books", null, {});
  },
};
```

### 6. Сидер для связей книг и авторов

```bash
npx sequelize-cli seed:generate --name demo-book-authors
```

Файл `seeders/XXXXXX-demo-book-authors.js`:

```javascript
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bookAuthors = [
      {
        id: 1,
        bookId: 1, // Война и мир
        authorId: 1, // Лев Толстой
        role: "author",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        bookId: 2, // Преступление и наказание
        authorId: 2, // Федор Достоевский
        role: "author",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        bookId: 3, // 1984
        authorId: 4, // Джордж Оруэлл
        role: "author",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        bookId: 4, // Принципы
        authorId: 5, // Рэй Далио
        role: "author",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("book_authors", bookAuthors, {});

    // Обновляем последовательность
    await queryInterface.sequelize.query(
      "SELECT setval('book_authors_id_seq', (SELECT MAX(id) FROM book_authors));"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("book_authors", null, {});
  },
};
```

---

## 🚀 Запуск миграций и сидеров

### 1. Запуск всех миграций

```bash
# Запуск всех миграций
npx sequelize-cli db:migrate

# Проверка статуса миграций
npx sequelize-cli db:migrate:status
```

### 2. Запуск всех сидеров

```bash
# Запуск всех сидеров
npx sequelize-cli db:seed:all

# Запуск конкретного сидера
npx sequelize-cli db:seed --seed XXXXXX-demo-categories.js
```

### 3. Отмена миграций (rollback)

```bash
# Отмена последней миграции
npx sequelize-cli db:migrate:undo

# Отмена всех миграций
npx sequelize-cli db:migrate:undo:all

# Отмена до конкретной миграции
npx sequelize-cli db:migrate:undo:all --to XXXXXX-create-users.js
```

### 4. Отмена сидеров

```bash
# Отмена всех сидеров
npx sequelize-cli db:seed:undo:all

# Отмена конкретного сидера
npx sequelize-cli db:seed:undo --seed XXXXXX-demo-categories.js
```

---

## 🧪 Скрипт для тестирования

Создайте файл `test-migrations.js` в корне проекта:

```javascript
const { execSync } = require("child_process");
const { sequelize } = require("./models");

async function testMigrations() {
  try {
    console.log("🔍 Тестирование миграций и сидеров...");

    // Проверяем подключение к БД
    await sequelize.authenticate();
    console.log("✅ Подключение к базе данных успешно!");

    console.log("\n🏗️ Запуск миграций...");
    execSync("npx sequelize-cli db:migrate", { stdio: "inherit" });

    console.log("\n🌱 Запуск сидеров...");
    execSync("npx sequelize-cli db:seed:all", { stdio: "inherit" });

    console.log("\n📊 Проверка данных...");

    const [results] = await sequelize.query(`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'categories' as table_name, COUNT(*) as count FROM categories
      UNION ALL
      SELECT 'authors' as table_name, COUNT(*) as count FROM authors
      UNION ALL
      SELECT 'publishers' as table_name, COUNT(*) as count FROM publishers
      UNION ALL
      SELECT 'books' as table_name, COUNT(*) as count FROM books
      UNION ALL
      SELECT 'book_authors' as table_name, COUNT(*) as count FROM book_authors
    `);

    console.log("\n📈 Статистика таблиц:");
    results.forEach((row) => {
      console.log(`  ${row.table_name}: ${row.count} записей`);
    });

    console.log("\n✅ Тестирование завершено успешно!");
  } catch (error) {
    console.error("❌ Ошибка при тестировании:", error.message);
  } finally {
    await sequelize.close();
  }
}

// Запуск только если файл выполняется напрямую
if (require.main === module) {
  testMigrations();
}

module.exports = testMigrations;
```

---

## 📋 Полезные команды

### NPM скрипты для package.json

Добавьте в `package.json`:

```json
{
  "scripts": {
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all",
    "db:reset": "npm run db:migrate:undo:all && npm run db:migrate && npm run db:seed",
    "db:fresh": "npm run db:drop && npm run db:create && npm run db:migrate && npm run db:seed",
    "db:create": "sequelize-cli db:create",
    "db:drop": "sequelize-cli db:drop"
  }
}
```

### Использование NPM скриптов

```bash
# Запуск миграций
npm run db:migrate

# Заполнение данными
npm run db:seed

# Полный сброс БД
npm run db:reset

# Создание с нуля
npm run db:fresh
```

---

## 🛠️ Устранение возможных проблем

### Проблема: Ошибки зависимостей между миграциями

**Решение:**

```bash
# Проверьте порядок создания таблиц
# Сначала должны быть созданы родительские таблицы
# Затем таблицы с внешними ключами
```

### Проблема: Ошибки при выполнении сидеров

**Решение:**

```bash
# Убедитесь, что все миграции выполнены
npm run db:migrate

# Проверьте данные в сидерах на корректность
# Убедитесь, что ID существуют для внешних ключей
```

### Проблема: Нарушение последовательности

**Решение:**

```sql
-- Для PostgreSQL - сброс последовательностей
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
-- и так далее для всех таблиц
```

---

## 📋 Задания для самопроверки

1. **Создайте миграцию** для добавления поля `discount_start_date` в таблицу `books`
2. **Создайте сидер** с дополнительными авторами и книгами
3. **Напишите скрипт** для бэкапа и восстановления данных
4. **Создайте миграцию** для создания индекса на комбинацию полей

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полная система управления схемой БД через миграции  
✅ Автоматизированное заполнение данными через сидеры  
✅ Возможность отката изменений (rollback)  
✅ Версионирование структуры базы данных  
✅ Готовая база данных с тестовыми данными

**Следующий шаг:** [06_EXPRESS_SERVER_SETUP.md](06_EXPRESS_SERVER_SETUP.md) - настройка Express.js сервера с middleware и безопасностью.

---

_Время выполнения: ~2-3 часа_  
_Сложность: 🟡 Средняя_
