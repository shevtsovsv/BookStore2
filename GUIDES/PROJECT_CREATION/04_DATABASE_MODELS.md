# 📊 Создание моделей данных с Sequelize

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 2-3 часа  
> **Предварительные требования:** Завершение части 03

## 🎯 Цели этой части

В этой части вы создадите все необходимые модели данных для книжного интернет-магазина с использованием Sequelize ORM. Мы рассмотрим:

- Создание моделей User, Book, Category, Author, Publisher
- Определение связей между моделями (ассоциации)
- Настройка валидации данных
- Создание индексов для оптимизации
- Тестирование моделей

---

## 📋 Структура моделей

### Основные сущности:

- **User** - пользователи системы
- **Category** - категории книг
- **Author** - авторы книг
- **Publisher** - издательства
- **Book** - книги
- **BookAuthor** - связь многие-ко-многим между книгами и авторами
- **CartItem** - элементы корзины покупок

---

## 🏗️ Создание моделей

### 1. Модель User (Пользователь)

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
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Имя не может быть пустым",
          },
          len: {
            args: [2, 50],
            msg: "Имя должно быть от 2 до 50 символов",
          },
        },
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Фамилия не может быть пустой",
          },
          len: {
            args: [2, 50],
            msg: "Фамилия должна быть от 2 до 50 символов",
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: "Пользователь с таким email уже существует",
        },
        validate: {
          isEmail: {
            msg: "Неверный формат email",
          },
          notEmpty: {
            msg: "Email не может быть пустым",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Пароль не может быть пустым",
          },
          len: {
            args: [6, 255],
            msg: "Пароль должен быть минимум 6 символов",
          },
        },
      },
      role: {
        type: DataTypes.ENUM("admin", "user"),
        defaultValue: "user",
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^[\+]?[1-9][\d]{0,15}$/,
            msg: "Неверный формат телефона",
          },
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
        {
          fields: ["role"],
        },
        {
          fields: ["isActive"],
        },
      ],
      hooks: {
        beforeCreate: async (user) => {
          // Хук будет реализован в следующих частях для хеширования пароля
        },
        beforeUpdate: async (user) => {
          // Хук для обновления пароля
        },
      },
    }
  );

  // Методы модели
  User.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password; // Исключаем пароль из JSON
    return values;
  };

  return User;
};
```

### 2. Модель Category (Категория)

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
        unique: {
          msg: "Категория с таким названием уже существует",
        },
        validate: {
          notEmpty: {
            msg: "Название категории не может быть пустым",
          },
          len: {
            args: [2, 100],
            msg: "Название должно быть от 2 до 100 символов",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: {
          msg: "Slug уже используется",
        },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug может содержать только строчные буквы, цифры и дефисы",
          },
        },
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      metaTitle: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      metaDescription: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "categories",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
        {
          unique: true,
          fields: ["slug"],
        },
        {
          fields: ["parentId"],
        },
        {
          fields: ["isActive"],
        },
        {
          fields: ["sortOrder"],
        },
      ],
    }
  );

  // Ассоциации будут определены в index.js
  Category.associate = (models) => {
    // Самосвязь для подкategorий
    Category.belongsTo(models.Category, {
      as: "parent",
      foreignKey: "parentId",
    });

    Category.hasMany(models.Category, {
      as: "children",
      foreignKey: "parentId",
    });

    // Связь с книгами
    Category.hasMany(models.Book, {
      foreignKey: "categoryId",
      as: "books",
    });
  };

  return Category;
};
```

### 3. Модель Author (Автор)

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
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Имя автора не может быть пустым",
          },
          len: {
            args: [2, 50],
            msg: "Имя должно быть от 2 до 50 символов",
          },
        },
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Фамилия автора не может быть пустой",
          },
          len: {
            args: [2, 50],
            msg: "Фамилия должна быть от 2 до 50 символов",
          },
        },
      },
      middleName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      biography: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: {
            msg: "Неверный формат даты рождения",
          },
          isBefore: {
            args: new Date().toISOString(),
            msg: "Дата рождения не может быть в будущем",
          },
        },
      },
      deathDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: {
            msg: "Неверный формат даты смерти",
          },
          isAfterBirth(value) {
            if (value && this.birthDate && value <= this.birthDate) {
              throw new Error("Дата смерти должна быть после даты рождения");
            }
          },
        },
      },
      nationality: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Неверный формат URL сайта",
          },
        },
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Неверный формат URL изображения",
          },
        },
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: {
          msg: "Slug уже используется",
        },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug может содержать только строчные буквы, цифры и дефисы",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "authors",
      timestamps: true,
      indexes: [
        {
          fields: ["firstName", "lastName"],
        },
        {
          unique: true,
          fields: ["slug"],
        },
        {
          fields: ["isActive"],
        },
        {
          fields: ["nationality"],
        },
      ],
    }
  );

  // Методы модели
  Author.prototype.getFullName = function () {
    const parts = [this.firstName];
    if (this.middleName) parts.push(this.middleName);
    parts.push(this.lastName);
    return parts.join(" ");
  };

  Author.prototype.getAge = function () {
    if (!this.birthDate) return null;

    const today = new Date();
    const endDate = this.deathDate ? new Date(this.deathDate) : today;
    const birth = new Date(this.birthDate);

    let age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Ассоциации
  Author.associate = (models) => {
    Author.belongsToMany(models.Book, {
      through: models.BookAuthor,
      foreignKey: "authorId",
      as: "books",
    });
  };

  return Author;
};
```

### 4. Модель Publisher (Издательство)

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
        unique: {
          msg: "Издательство с таким названием уже существует",
        },
        validate: {
          notEmpty: {
            msg: "Название издательства не может быть пустым",
          },
          len: {
            args: [2, 100],
            msg: "Название должно быть от 2 до 100 символов",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^[\+]?[1-9][\d]{0,15}$/,
            msg: "Неверный формат телефона",
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: {
            msg: "Неверный формат email",
          },
        },
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Неверный формат URL сайта",
          },
        },
      },
      foundedYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: 1400,
            msg: "Год основания не может быть раньше 1400",
          },
          max: {
            args: new Date().getFullYear(),
            msg: "Год основания не может быть в будущем",
          },
        },
      },
      country: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Неверный формат URL логотипа",
          },
        },
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: {
          msg: "Slug уже используется",
        },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug может содержать только строчные буквы, цифры и дефисы",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "publishers",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
        {
          unique: true,
          fields: ["slug"],
        },
        {
          fields: ["country"],
        },
        {
          fields: ["isActive"],
        },
      ],
    }
  );

  // Ассоциации
  Publisher.associate = (models) => {
    Publisher.hasMany(models.Book, {
      foreignKey: "publisherId",
      as: "books",
    });
  };

  return Publisher;
};
```

### 5. Модель Book (Книга)

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
        validate: {
          notEmpty: {
            msg: "Название книги не может быть пустым",
          },
          len: {
            args: [1, 255],
            msg: "Название должно быть от 1 до 255 символов",
          },
        },
      },
      subtitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isbn: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: {
          msg: "Книга с таким ISBN уже существует",
        },
        validate: {
          is: {
            args: /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
            msg: "Неверный формат ISBN",
          },
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: {
            args: 0,
            msg: "Цена не может быть отрицательной",
          },
          isDecimal: {
            msg: "Цена должна быть числом",
          },
        },
      },
      discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: {
            args: 0,
            msg: "Цена со скидкой не может быть отрицательной",
          },
          isDecimal: {
            msg: "Цена со скидкой должна быть числом",
          },
          isLowerThanPrice(value) {
            if (value && value >= this.price) {
              throw new Error(
                "Цена со скидкой должна быть меньше обычной цены"
              );
            }
          },
        },
      },
      pageCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: 1,
            msg: "Количество страниц должно быть больше 0",
          },
        },
      },
      publishedYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: 1400,
            msg: "Год издания не может быть раньше 1400",
          },
          max: {
            args: new Date().getFullYear() + 1,
            msg: "Год издания не может быть более чем на год в будущем",
          },
        },
      },
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "ru",
        validate: {
          isIn: {
            args: [["ru", "en", "fr", "de", "es", "it", "pl", "ua"]],
            msg: "Неподдерживаемый язык",
          },
        },
      },
      format: {
        type: DataTypes.ENUM("hardcover", "paperback", "ebook", "audiobook"),
        allowNull: false,
        defaultValue: "paperback",
      },
      weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
          min: {
            args: 0,
            msg: "Вес не может быть отрицательным",
          },
        },
        comment: "Вес в граммах",
      },
      dimensions: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          is: {
            args: /^\d+(\.\d+)?\s*[x×]\s*\d+(\.\d+)?\s*[x×]\s*\d+(\.\d+)?$/i,
            msg: 'Размеры должны быть в формате "длина x ширина x высота"',
          },
        },
        comment: 'Размеры в формате "длина x ширина x высота" в см',
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: 0,
            msg: "Количество на складе не может быть отрицательным",
          },
        },
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Неверный формат URL изображения",
          },
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
      publisherId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "publishers",
          key: "id",
        },
      },
      slug: {
        type: DataTypes.STRING(300),
        allowNull: false,
        unique: {
          msg: "Slug уже используется",
        },
        validate: {
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug может содержать только строчные буквы, цифры и дефисы",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 5,
        },
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      metaTitle: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      metaDescription: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "books",
      timestamps: true,
      indexes: [
        {
          fields: ["title"],
        },
        {
          unique: true,
          fields: ["isbn"],
        },
        {
          unique: true,
          fields: ["slug"],
        },
        {
          fields: ["categoryId"],
        },
        {
          fields: ["publisherId"],
        },
        {
          fields: ["price"],
        },
        {
          fields: ["publishedYear"],
        },
        {
          fields: ["language"],
        },
        {
          fields: ["format"],
        },
        {
          fields: ["isActive"],
        },
        {
          fields: ["isFeatured"],
        },
        {
          fields: ["rating"],
        },
      ],
    }
  );

  // Методы модели
  Book.prototype.getCurrentPrice = function () {
    return this.discountPrice || this.price;
  };

  Book.prototype.getDiscountPercent = function () {
    if (!this.discountPrice) return 0;
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  };

  Book.prototype.isInStock = function () {
    return this.stockQuantity > 0;
  };

  Book.prototype.incrementViewCount = function () {
    return this.increment("viewCount");
  };

  // Ассоциации
  Book.associate = (models) => {
    Book.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });

    Book.belongsTo(models.Publisher, {
      foreignKey: "publisherId",
      as: "publisher",
    });

    Book.belongsToMany(models.Author, {
      through: models.BookAuthor,
      foreignKey: "bookId",
      as: "authors",
    });

    Book.hasMany(models.CartItem, {
      foreignKey: "bookId",
      as: "cartItems",
    });
  };

  return Book;
};
```

### 6. Модель BookAuthor (Связь книг и авторов)

Создайте файл `models/BookAuthor.js`:

```javascript
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BookAuthor = sequelize.define(
    "BookAuthor",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "books",
          key: "id",
        },
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "authors",
          key: "id",
        },
      },
      role: {
        type: DataTypes.ENUM(
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
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Порядок отображения авторов для книги",
      },
    },
    {
      tableName: "book_authors",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["bookId", "authorId"],
        },
        {
          fields: ["bookId"],
        },
        {
          fields: ["authorId"],
        },
        {
          fields: ["role"],
        },
      ],
    }
  );

  // Ассоциации
  BookAuthor.associate = (models) => {
    BookAuthor.belongsTo(models.Book, {
      foreignKey: "bookId",
      as: "book",
    });

    BookAuthor.belongsTo(models.Author, {
      foreignKey: "authorId",
      as: "author",
    });
  };

  return BookAuthor;
};
```

### 7. Модель CartItem (Элемент корзины)

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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      bookId: {
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
        validate: {
          min: {
            args: 1,
            msg: "Количество должно быть больше 0",
          },
          max: {
            args: 99,
            msg: "Максимальное количество 99",
          },
        },
      },
      priceAtAdd: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: {
            args: 0,
            msg: "Цена не может быть отрицательной",
          },
        },
        comment: "Цена товара на момент добавления в корзину",
      },
    },
    {
      tableName: "cart_items",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId", "bookId"],
        },
        {
          fields: ["userId"],
        },
        {
          fields: ["bookId"],
        },
      ],
    }
  );

  // Методы модели
  CartItem.prototype.getTotalPrice = function () {
    return this.quantity * this.priceAtAdd;
  };

  // Ассоциации
  CartItem.associate = (models) => {
    CartItem.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    CartItem.belongsTo(models.Book, {
      foreignKey: "bookId",
      as: "book",
    });
  };

  return CartItem;
};
```

---

## 🔗 Обновление index.js

Обновите файл `models/index.js` для правильной инициализации всех моделей:

```javascript
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/config.json")[
  process.env.NODE_ENV || "development"
];

const basename = path.basename(__filename);
const db = {};

// Создание подключения к базе данных
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Загрузка всех моделей
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Установка ассоциаций
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Экспорт
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

---

## 🧪 Тестирование моделей

Создайте файл `test-models.js` в корне проекта для тестирования моделей:

```javascript
const {
  sequelize,
  User,
  Category,
  Author,
  Publisher,
  Book,
  BookAuthor,
  CartItem,
} = require("./models");

async function testModels() {
  try {
    console.log("🔍 Тестирование подключения к базе данных...");
    await sequelize.authenticate();
    console.log("✅ Подключение к базе данных успешно!");

    console.log("\n🏗️ Синхронизация моделей...");
    await sequelize.sync({ force: true });
    console.log("✅ Модели синхронизированы!");

    console.log("\n👤 Тестирование модели User...");
    const user = await User.create({
      firstName: "Иван",
      lastName: "Петров",
      email: "ivan@example.com",
      password: "123456",
      phone: "+79123456789",
    });
    console.log("✅ Пользователь создан:", user.getFullName());

    console.log("\n📚 Тестирование модели Category...");
    const category = await Category.create({
      name: "Художественная литература",
      description: "Романы, повести, рассказы",
      slug: "fiction",
    });
    console.log("✅ Категория создана:", category.name);

    console.log("\n✍️ Тестирование модели Author...");
    const author = await Author.create({
      firstName: "Лев",
      lastName: "Толстой",
      middleName: "Николаевич",
      birthDate: "1828-09-09",
      nationality: "Русский",
      slug: "lev-tolstoy",
    });
    console.log("✅ Автор создан:", author.getFullName());

    console.log("\n🏢 Тестирование модели Publisher...");
    const publisher = await Publisher.create({
      name: "АСТ",
      description: "Крупнейшее издательство России",
      foundedYear: 1990,
      country: "Россия",
      slug: "ast",
    });
    console.log("✅ Издательство создано:", publisher.name);

    console.log("\n📖 Тестирование модели Book...");
    const book = await Book.create({
      title: "Война и мир",
      description: "Великий роман о войне 1812 года",
      isbn: "978-5-17-123456-7",
      price: 599.0,
      pageCount: 1300,
      publishedYear: 1869,
      language: "ru",
      format: "hardcover",
      stockQuantity: 10,
      categoryId: category.id,
      publisherId: publisher.id,
      slug: "voyna-i-mir",
    });
    console.log("✅ Книга создана:", book.title);
    console.log("💰 Текущая цена:", book.getCurrentPrice());

    console.log("\n🔗 Тестирование связи BookAuthor...");
    await BookAuthor.create({
      bookId: book.id,
      authorId: author.id,
      role: "author",
    });
    console.log("✅ Связь книга-автор создана");

    console.log("\n🛒 Тестирование модели CartItem...");
    const cartItem = await CartItem.create({
      userId: user.id,
      bookId: book.id,
      quantity: 2,
      priceAtAdd: book.price,
    });
    console.log("✅ Элемент корзины создан");
    console.log("💰 Общая стоимость:", cartItem.getTotalPrice());

    console.log("\n🔍 Тестирование связей...");
    const bookWithRelations = await Book.findByPk(book.id, {
      include: [
        { model: Category, as: "category" },
        { model: Publisher, as: "publisher" },
        { model: Author, as: "authors" },
      ],
    });

    console.log("📖 Книга:", bookWithRelations.title);
    console.log("📚 Категория:", bookWithRelations.category.name);
    console.log("🏢 Издательство:", bookWithRelations.publisher.name);
    console.log(
      "✍️ Авторы:",
      bookWithRelations.authors.map((a) => a.getFullName())
    );

    console.log("\n✅ Все тесты пройдены успешно!");
  } catch (error) {
    console.error("❌ Ошибка при тестировании моделей:", error);
  } finally {
    await sequelize.close();
  }
}

// Запуск только если файл выполняется напрямую
if (require.main === module) {
  testModels();
}

module.exports = testModels;
```

---

## 🏃‍♂️ Запуск тестирования

Выполните тестирование моделей:

```bash
node test-models.js
```

Ожидаемый результат:

```
🔍 Тестирование подключения к базе данных...
✅ Подключение к базе данных успешно!

🏗️ Синхронизация моделей...
✅ Модели синхронизированы!

👤 Тестирование модели User...
✅ Пользователь создан: Иван Петров

📚 Тестирование модели Category...
✅ Категория создана: Художественная литература

✍️ Тестирование модели Author...
✅ Автор создан: Лев Николаевич Толстой

🏢 Тестирование модели Publisher...
✅ Издательство создано: АСТ

📖 Тестирование модели Book...
✅ Книга создана: Война и мир
💰 Текущая цена: 599.00

🔗 Тестирование связи BookAuthor...
✅ Связь книга-автор создана

🛒 Тестирование модели CartItem...
✅ Элемент корзины создан
💰 Общая стоимость: 1198.00

🔍 Тестирование связей...
📖 Книга: Война и мир
📚 Категория: Художественная литература
🏢 Издательство: АСТ
✍️ Авторы: Лев Николаевич Толстой

✅ Все тесты пройдены успешно!
```

---

## 🛠️ Устранение возможных проблем

### Проблема: Ошибки валидации

**Решение:**

```bash
# Проверьте правильность данных в тестах
# Убедитесь, что все обязательные поля заполнены
# Проверьте форматы email, URL, телефонов
```

### Проблема: Ошибки ассоциаций

**Решение:**

```bash
# Убедитесь, что все модели экспортируются в index.js
# Проверьте правильность имен моделей в ассоциациях
# Убедитесь, что внешние ключи указаны правильно
```

### Проблема: Ошибки синхронизации

**Решение:**

```bash
# Убедитесь, что база данных существует
# Проверьте права доступа пользователя
# При необходимости пересоздайте таблицы
```

---

## 📋 Задания для самопроверки

1. **Создайте дополнительную валидацию** для поля `email` в модели User
2. **Добавьте новый тип формата книги** 'pocket' в модель Book
3. **Создайте метод для подсчета общей стоимости** всех товаров пользователя в корзине
4. **Добавьте индекс** для поиска книг по названию и автору одновременно

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полная структура моделей данных  
✅ Правильно настроенные связи между таблицами  
✅ Валидация данных на уровне модели  
✅ Индексы для оптимизации запросов  
✅ Методы для работы с данными

**Следующий шаг:** [05_MIGRATIONS_AND_SEEDERS.md](05_MIGRATIONS_AND_SEEDERS.md) - создание миграций и заполнение базы тестовыми данными.

---

_Время выполнения: ~2-3 часа_  
_Сложность: 🟡 Средняя_
