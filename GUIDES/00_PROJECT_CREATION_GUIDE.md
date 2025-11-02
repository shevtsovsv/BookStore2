# Пошаговое руководство по созданию проекта "Книжный интернет-магазин"

## Оглавление

1. [Введение и требования](#введение-и-требования)
2. [Инициализация проекта](#инициализация-проекта)
3. [Настройка базы данных](#настройка-базы-данных)
4. [Создание моделей данных](#создание-моделей-данных)
5. [Создание миграций](#создание-миграций)
6. [Заполнение базы данных](#заполнение-базы-данных)
7. [Создание серверной части](#создание-серверной-части)
8. [Создание клиентской части](#создание-клиентской-части)
9. [Тестирование и запуск](#тестирование-и-запуск)

---

## Введение и требования

### Описание проекта

Книжный интернет-магазин - это полнофункциональное веб-приложение для продажи книг онлайн. Проект включает каталог книг, систему авторизации, корзину покупок и оформление заказов.

### Технологический стек

- **Backend**: Node.js, Express.js
- **ORM**: Sequelize
- **База данных**: PostgreSQL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Аутентификация**: JWT (JSON Web Tokens)

### Системные требования

- Node.js версии 14 или выше
- PostgreSQL версии 12 или выше
- Текстовый редактор (VS Code рекомендуется)
- Git для контроля версий
- Браузер с поддержкой ES6+

---

## Инициализация проекта

### Шаг 1: Создание структуры каталогов

```bash
# Создание корневой директории проекта
mkdir bookstore
cd bookstore

# Создание основных директорий
mkdir config
mkdir models
mkdir migrations
mkdir seeders
mkdir public
mkdir src

# Создание поддиректорий в src
mkdir src/controllers
mkdir src/middleware
mkdir src/routes
mkdir src/utils

# Создание поддиректорий в public
mkdir public/html
mkdir public/scripts
mkdir public/style
mkdir public/img
mkdir public/data
```

### Шаг 2: Инициализация npm проекта

```bash
npm init -y
```

Отредактируйте созданный `package.json`:

```json
{
  "name": "bookstore",
  "version": "1.0.0",
  "description": "Книжный интернет-магазин",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "seed": "sequelize-cli db:seed:all",
    "seed:undo": "sequelize-cli db:seed:undo:all"
  },
  "keywords": ["bookstore", "e-commerce", "books"],
  "author": "Ваше имя",
  "license": "ISC"
}
```

### Шаг 3: Установка зависимостей

```bash
# Основные зависимости
npm install express sequelize pg pg-hstore bcryptjs jsonwebtoken cors express-validator

# Зависимости для разработки
npm install --save-dev sequelize-cli nodemon
```

**Описание пакетов:**

- `express` - веб-фреймворк для Node.js
- `sequelize` - ORM для работы с базой данных
- `pg` и `pg-hstore` - драйверы PostgreSQL
- `bcryptjs` - хеширование паролей
- `jsonwebtoken` - создание и проверка JWT токенов
- `cors` - настройка CORS политик
- `express-validator` - валидация данных на сервере
- `sequelize-cli` - CLI инструмент для миграций
- `nodemon` - автоматическая перезагрузка сервера при разработке

---

## Настройка базы данных

### Шаг 1: Инициализация Sequelize

```bash
npx sequelize-cli init
```

Эта команда создаст файл `config/config.json`.

### Шаг 2: Настройка подключения к БД

Создайте файл `config/config.json`:

```json
{
  "development": {
    "username": "postgres",
    "password": "ваш_пароль",
    "database": "bookstore_db",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": false
  },
  "production": {
    "username": "postgres",
    "password": "ваш_пароль",
    "database": "bookstore_production",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": false
  }
}
```

### Шаг 3: Создание базы данных

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE bookstore_db;

# Выход
\q
```

Или используйте Sequelize CLI:

```bash
npx sequelize-cli db:create
```

---

## Создание моделей данных

### Шаг 1: Модель User (Пользователь)

Создайте файл `models/User.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  return User;
};
```

### Шаг 2: Модель Category (Категория)

Создайте файл `models/Category.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "categories",
      timestamps: true,
    }
  );

  return Category;
};
```

### Шаг 3: Модель Author (Автор)

Создайте файл `models/Author.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Author = sequelize.define(
    "Author",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      biography: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      tableName: "authors",
      timestamps: true,
    }
  );

  return Author;
};
```

### Шаг 4: Модель Publisher (Издательство)

Создайте файл `models/Publisher.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Publisher = sequelize.define(
    "Publisher",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      founded_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contact_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "publishers",
      timestamps: true,
    }
  );

  return Publisher;
};
```

### Шаг 5: Модель Book (Книга)

Создайте файл `models/Book.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Book = sequelize.define(
    "Book",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      popularity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      publication_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isbn: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: true,
      },
      pages: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      language: {
        type: DataTypes.STRING(50),
        defaultValue: "Русский",
      },
      cover_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
      publisher_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "publishers",
          key: "id",
        },
      },
    },
    {
      tableName: "books",
      timestamps: true,
    }
  );

  return Book;
};
```

### Шаг 6: Модель BookAuthor (Связь Книги-Авторы)

Создайте файл `models/BookAuthor.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BookAuthor = sequelize.define(
    "BookAuthor",
    {
      book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "books",
          key: "id",
        },
      },
      author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "authors",
          key: "id",
        },
      },
    },
    {
      tableName: "book_authors",
      timestamps: false,
    }
  );

  return BookAuthor;
};
```

### Шаг 7: Модель CartItem (Элемент корзины)

Создайте файл `models/CartItem.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "books",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "cart_items",
      timestamps: true,
    }
  );

  return CartItem;
};
```

### Шаг 8: Файл инициализации моделей

Создайте файл `models/index.js`:

```javascript
const { Sequelize } = require("sequelize");
const config = require("../config/config.json");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  }
);

const db = {};

// Импорт моделей
db.User = require("./User")(sequelize);
db.Category = require("./Category")(sequelize);
db.Author = require("./Author")(sequelize);
db.Publisher = require("./Publisher")(sequelize);
db.Book = require("./Book")(sequelize);
db.BookAuthor = require("./BookAuthor")(sequelize);
db.CartItem = require("./CartItem")(sequelize);

// Определение связей
db.Book.belongsTo(db.Category, { foreignKey: "category_id", as: "category" });
db.Category.hasMany(db.Book, { foreignKey: "category_id", as: "books" });

db.Book.belongsTo(db.Publisher, {
  foreignKey: "publisher_id",
  as: "publisher",
});
db.Publisher.hasMany(db.Book, { foreignKey: "publisher_id", as: "books" });

db.Book.belongsToMany(db.Author, {
  through: db.BookAuthor,
  foreignKey: "book_id",
  otherKey: "author_id",
  as: "authors",
});

db.Author.belongsToMany(db.Book, {
  through: db.BookAuthor,
  foreignKey: "author_id",
  otherKey: "book_id",
  as: "books",
});

db.CartItem.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.User.hasMany(db.CartItem, { foreignKey: "user_id", as: "cartItems" });

db.CartItem.belongsTo(db.Book, { foreignKey: "book_id", as: "book" });
db.Book.hasMany(db.CartItem, { foreignKey: "book_id", as: "cartItems" });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

---

## Создание миграций

### Шаг 1: Миграция для таблицы Users

```bash
npx sequelize-cli migration:generate --name create-users
```

Отредактируйте созданный файл в папке `migrations/`:

```javascript
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
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
        type: Sequelize.ENUM("user", "admin"),
        defaultValue: "user",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
```

### Шаг 2: Создание остальных миграций

Аналогично создайте миграции для:

- Categories (`create-categories`)
- Authors (`create-authors`)
- Publishers (`create-publishers`)
- Books (`create-books`)
- BookAuthors (`create-book-authors`)
- CartItems (`create-cart-items`)

### Шаг 3: Выполнение миграций

```bash
npm run migrate
```

Эта команда создаст все таблицы в базе данных.

---

## Заполнение базы данных

### Шаг 1: Создание сидера для категорий

```bash
npx sequelize-cli seed:generate --name demo-categories
```

Отредактируйте файл `seeders/XXXXXX-demo-categories.js`:

```javascript
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "categories",
      [
        {
          name: "Художественная литература",
          description: "Романы, повести, рассказы",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Научная литература",
          description: "Научные труды и исследования",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Детская литература",
          description: "Книги для детей всех возрастов",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Образование",
          description: "Учебники и учебные пособия",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Бизнес",
          description: "Книги о бизнесе и экономике",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("categories", null, {});
  },
};
```

### Шаг 2: Создание сидеров для других таблиц

Создайте аналогичные сидеры для:

- Publishers (`demo-publishers`)
- Authors (`demo-authors`)
- Books (`demo-books`)
- BookAuthors (`demo-book-authors`)
- Users (`demo-users`)

### Шаг 3: Выполнение сидеров

```bash
npm run seed
```

---

## Создание серверной части

### Шаг 1: Middleware для аутентификации

Создайте файл `src/middleware/auth.js`:

```javascript
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Токен не предоставлен" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Доступ запрещен" });
  }
  next();
};

module.exports = { authenticateToken, isAdmin, JWT_SECRET };
```

### Шаг 2: Контроллер аутентификации

Создайте файл `src/controllers/authController.js`:

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const { JWT_SECRET } = require("../middleware/auth");
const { validationResult } = require("express-validator");

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Пользователь с таким email уже существует",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Вход выполнен успешно",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Ошибка входа" });
  }
};

module.exports = { register, login };
```

### Шаг 3: Контроллер для книг

Создайте файл `src/controllers/booksController.js`:

```javascript
const { Book, Category, Author, Publisher } = require("../../models");

const getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Author, as: "authors", attributes: ["id", "name"] },
        { model: Publisher, as: "publisher", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Ошибка получения книг" });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id, {
      include: [
        { model: Category, as: "category" },
        { model: Author, as: "authors" },
        {
          model: Publisher,
          as: "publisher",
          attributes: [
            "id",
            "name",
            "country",
            "website",
            "description",
            "founded_year",
            "contact_email",
            "logo",
          ],
        },
      ],
    });

    if (!book) {
      return res.status(404).json({ error: "Книга не найдена" });
    }

    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ error: "Ошибка получения книги" });
  }
};

module.exports = { getAllBooks, getBookById };
```

### Шаг 4: Контроллер корзины

Создайте файл `src/controllers/cartController.js`:

```javascript
const { CartItem, Book } = require("../../models");

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "price", "image_url", "stock"],
        },
      ],
    });

    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Ошибка получения корзины" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, quantity = 1 } = req.body;

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ error: "Книга не найдена" });
    }

    if (book.stock < quantity) {
      return res.status(400).json({ error: "Недостаточно товара на складе" });
    }

    const existingItem = await CartItem.findOne({
      where: { user_id: userId, book_id: bookId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
      res.json({ message: "Количество обновлено", cartItem: existingItem });
    } else {
      const cartItem = await CartItem.create({
        user_id: userId,
        book_id: bookId,
        quantity,
      });
      res.status(201).json({ message: "Книга добавлена в корзину", cartItem });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Ошибка добавления в корзину" });
  }
};

module.exports = { getCart, addToCart };
```

### Шаг 5: Контроллер оформления заказа

Создайте файл `src/controllers/checkoutController.js`:

```javascript
const { CartItem, Book } = require("../../models");
const { sequelize } = require("../../models");

const checkout = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [{ model: Book, as: "book" }],
      transaction,
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: "Корзина пуста" });
    }

    for (const item of cartItems) {
      const book = await Book.findByPk(item.book_id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (book.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Недостаточно товара "${book.title}" на складе`,
        });
      }

      book.stock -= item.quantity;
      book.popularity = (book.popularity || 0) + item.quantity;
      await book.save({ transaction });
    }

    await CartItem.destroy({
      where: { user_id: userId },
      transaction,
    });

    await transaction.commit();

    res.json({ message: "Заказ успешно оформлен" });
  } catch (error) {
    await transaction.rollback();
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Ошибка оформления заказа" });
  }
};

module.exports = { checkout };
```

### Шаг 6: Маршруты

Создайте файл `src/routes/auth.js`:

```javascript
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { register, login } = require("../controllers/authController");

const registerValidation = [
  body("username").trim().isLength({ min: 3 }).withMessage("Минимум 3 символа"),
  body("email").isEmail().withMessage("Некорректный email"),
  body("password").isLength({ min: 8 }).withMessage("Минимум 8 символов"),
];

router.post("/register", registerValidation, register);
router.post("/login", login);

module.exports = router;
```

Создайте файл `src/routes/books.js`:

```javascript
const express = require("express");
const router = express.Router();
const { getAllBooks, getBookById } = require("../controllers/booksController");

router.get("/", getAllBooks);
router.get("/:id", getBookById);

module.exports = router;
```

Создайте файл `src/routes/cart.js`:

```javascript
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getCart, addToCart } = require("../controllers/cartController");
const { checkout } = require("../controllers/checkoutController");

router.get("/", authenticateToken, getCart);
router.post("/", authenticateToken, addToCart);
router.post("/checkout", authenticateToken, checkout);

module.exports = router;
```

### Шаг 7: Главный файл сервера

Создайте файл `server.js` в корне проекта:

```javascript
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models");

const authRoutes = require("./src/routes/auth");
const booksRoutes = require("./src/routes/books");
const cartRoutes = require("./src/routes/cart");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/cart", cartRoutes);

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Database connection and server start
db.sequelize
  .authenticate()
  .then(() => {
    console.log("✅ База данных подключена");
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📖 http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Ошибка подключения к БД:", err);
  });
```

---

## Создание клиентской части

### Шаг 1: Главная страница

Создайте файл `public/index.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Книжный магазин</title>
    <link rel="stylesheet" href="style/style.css" />
  </head>
  <body>
    <header>
      <nav>
        <div class="logo">📚 BookStore</div>
        <ul class="menu">
          <li><a href="index.html">Главная</a></li>
          <li><a href="html/book.html">Каталог</a></li>
          <li><a href="html/about.html">О нас</a></li>
          <li id="auth-menu"></li>
        </ul>
      </nav>
    </header>

    <main class="container">
      <section class="hero">
        <h1>Добро пожаловать в BookStore!</h1>
        <p>Лучшие книги для вас</p>
      </section>

      <section class="statistics">
        <h2>Статистика магазина</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <h3 id="total-books">0</h3>
            <p>Книг в каталоге</p>
          </div>
          <div class="stat-card">
            <h3 id="total-sales">0</h3>
            <p>Продано книг</p>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <p>© 2025 BookStore. Все права защищены.</p>
    </footer>

    <script src="scripts/auth-utils.js"></script>
    <script src="scripts/main.js"></script>
  </body>
</html>
```

### Шаг 2: Утилиты аутентификации

Создайте файл `public/scripts/auth-utils.js`:

```javascript
class AuthToken {
  static set(token) {
    localStorage.setItem("token", token);
  }

  static get() {
    return localStorage.getItem("token");
  }

  static remove() {
    localStorage.removeItem("token");
  }

  static decode() {
    const token = this.get();
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }
}

class Auth {
  static isAuthenticated() {
    return !!AuthToken.get();
  }

  static getUserInfo() {
    return AuthToken.decode();
  }

  static logout() {
    AuthToken.remove();
    window.location.href = "/index.html";
  }

  static updateMenuForAuthState() {
    const authMenu = document.getElementById("auth-menu");
    if (!authMenu) return;

    if (this.isAuthenticated()) {
      const user = this.getUserInfo();
      authMenu.innerHTML = `
        <span>Привет, ${user.email}</span>
        <a href="#" onclick="Auth.logout()">Выход</a>
      `;
      this.updateCartIcon();
    } else {
      authMenu.innerHTML = `
        <a href="html/login.html">Вход</a>
        <a href="html/register.html">Регистрация</a>
      `;
    }
  }

  static updateCartIcon() {
    if (!this.isAuthenticated()) return;

    const nav = document.querySelector("nav ul.menu");
    if (!nav || nav.querySelector(".cart-icon")) return;

    const cartLi = document.createElement("li");
    cartLi.innerHTML = `
      <a href="html/cart.html" class="cart-icon">
        🛒 Корзина <span id="cart-count" class="cart-count">0</span>
      </a>
    `;
    nav.insertBefore(cartLi, document.getElementById("auth-menu"));

    this.updateCartCount();
  }

  static async updateCartCount() {
    if (!this.isAuthenticated()) return;

    try {
      const response = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${AuthToken.get()}` },
      });

      if (response.ok) {
        const cart = await response.json();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.getElementById("cart-count");
        if (badge) badge.textContent = count;
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Auth.updateMenuForAuthState();
});
```

### Шаг 3: Страница каталога

Создайте файл `public/html/book.html` с каталогом книг и файл `public/scripts/catalog.js` для загрузки и отображения книг через API.

### Шаг 4: Страницы регистрации и входа

Создайте файлы:

- `public/html/register.html`
- `public/html/login.html`
- `public/scripts/register.js`
- `public/scripts/login.js`

С формами для регистрации и входа, валидацией и отправкой данных на сервер.

---

## Тестирование и запуск

### Шаг 1: Проверка базы данных

```bash
# Убедитесь, что все миграции выполнены
npm run migrate

# Заполните базу тестовыми данными
npm run seed
```

### Шаг 2: Запуск сервера

```bash
# Режим разработки с автоперезагрузкой
npm run dev

# Или обычный запуск
npm start
```

### Шаг 3: Проверка функциональности

1. Откройте браузер по адресу `http://localhost:3000`
2. Зарегистрируйте нового пользователя
3. Войдите в систему
4. Проверьте каталог книг
5. Добавьте книги в корзину
6. Оформите заказ

### Шаг 4: Тестирование API

Используйте Postman или curl для тестирования endpoints:

```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test1234"}'

# Получение книг
curl http://localhost:3000/api/books

# Добавление в корзину (требуется токен)
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookId":1,"quantity":1}'
```

---

## Заключение

Вы создали полнофункциональный книжный интернет-магазин со следующими возможностями:

✅ **Backend**: RESTful API с Express.js  
✅ **База данных**: PostgreSQL с Sequelize ORM  
✅ **Аутентификация**: JWT токены  
✅ **Функционал**: Регистрация, вход, каталог, корзина, оформление заказов  
✅ **Безопасность**: Хеширование паролей, защищенные роуты  
✅ **Транзакции**: ACID-совместимое оформление заказов

### Следующие шаги

1. Добавить функционал управления заказами
2. Реализовать панель администратора
3. Добавить фильтрацию и поиск книг
4. Внедрить систему отзывов
5. Настроить деплой на VDS/VPS
6. Добавить обработку изображений
7. Реализовать систему оплаты

**Успехов в разработке! 🚀**
