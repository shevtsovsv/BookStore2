# 🔗 API эндпоинты

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 4-5 часов  
> **Предварительные требования:** Завершение части 07

## 🎯 Цели этой части

В этой части вы создадите полный набор API эндпоинтов для:

- CRUD операций с книгами
- Управления категориями и авторами
- Поиска и фильтрации
- Пагинации результатов
- Загрузки изображений

---

## 📚 API для книг

### 1. Контроллер книг

Создайте файл `src/controllers/booksController.js`:

```javascript
const {
  Book,
  Category,
  Author,
  Publisher,
  BookAuthor,
} = require("../../models");
const { asyncHandler } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

/**
 * @desc    Получить все книги с фильтрацией и поиском
 * @route   GET /api/books
 * @access  Public
 */
const getBooks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = "",
    categoryId,
    authorId,
    publisherId,
    minPrice,
    maxPrice,
    language,
    format,
    sortBy = "createdAt",
    sortOrder = "DESC",
    featured = false,
  } = req.query;

  const offset = (page - 1) * limit;

  // Базовые условия фильтрации
  const where = { isActive: true };

  // Поиск по названию и описанию
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { subtitle: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Фильтры
  if (categoryId) where.categoryId = categoryId;
  if (publisherId) where.publisherId = publisherId;
  if (language) where.language = language;
  if (format) where.format = format;
  if (featured === "true") where.isFeatured = true;

  // Фильтр по цене
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  // Включения для связанных моделей
  const include = [
    {
      model: Category,
      as: "category",
      attributes: ["id", "name", "slug"],
    },
    {
      model: Publisher,
      as: "publisher",
      attributes: ["id", "name", "slug"],
    },
    {
      model: Author,
      as: "authors",
      attributes: ["id", "firstName", "lastName", "slug"],
      through: {
        attributes: ["role", "sortOrder"],
        as: "bookAuthor",
      },
    },
  ];

  // Фильтр по автору
  if (authorId) {
    include[2].through.where = { authorId };
  }

  // Валидация сортировки
  const allowedSortFields = [
    "title",
    "price",
    "publishedYear",
    "createdAt",
    "rating",
    "viewCount",
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const { count, rows } = await Book.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortField, sortDirection]],
    distinct: true,
  });

  res.status(200).json({
    success: true,
    data: {
      books: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
      filters: {
        search,
        categoryId,
        authorId,
        publisherId,
        minPrice,
        maxPrice,
        language,
        format,
        sortBy: sortField,
        sortOrder: sortDirection,
        featured,
      },
    },
  });
});

/**
 * @desc    Получить книгу по ID
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id, {
    include: [
      {
        model: Category,
        as: "category",
      },
      {
        model: Publisher,
        as: "publisher",
      },
      {
        model: Author,
        as: "authors",
        through: {
          attributes: ["role", "sortOrder"],
          as: "bookAuthor",
        },
      },
    ],
  });

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Книга не найдена",
    });
  }

  // Увеличение счетчика просмотров
  await book.incrementViewCount();

  res.status(200).json({
    success: true,
    data: { book },
  });
});

/**
 * @desc    Создать новую книгу
 * @route   POST /api/books
 * @access  Private/Admin
 */
const createBook = asyncHandler(async (req, res) => {
  const { authorIds, ...bookData } = req.body;

  // Создание книги
  const book = await Book.create(bookData);

  // Добавление авторов
  if (authorIds && authorIds.length > 0) {
    const bookAuthors = authorIds.map((authorId, index) => ({
      bookId: book.id,
      authorId,
      role: "author",
      sortOrder: index + 1,
    }));

    await BookAuthor.bulkCreate(bookAuthors);
  }

  // Получение книги с включениями
  const bookWithIncludes = await Book.findByPk(book.id, {
    include: [
      { model: Category, as: "category" },
      { model: Publisher, as: "publisher" },
      { model: Author, as: "authors" },
    ],
  });

  res.status(201).json({
    success: true,
    data: { book: bookWithIncludes },
  });
});

/**
 * @desc    Обновить книгу
 * @route   PUT /api/books/:id
 * @access  Private/Admin
 */
const updateBook = asyncHandler(async (req, res) => {
  const { authorIds, ...bookData } = req.body;

  let book = await Book.findByPk(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Книга не найдена",
    });
  }

  // Обновление книги
  book = await book.update(bookData);

  // Обновление авторов
  if (authorIds) {
    // Удаление старых связей
    await BookAuthor.destroy({ where: { bookId: book.id } });

    // Добавление новых связей
    if (authorIds.length > 0) {
      const bookAuthors = authorIds.map((authorId, index) => ({
        bookId: book.id,
        authorId,
        role: "author",
        sortOrder: index + 1,
      }));

      await BookAuthor.bulkCreate(bookAuthors);
    }
  }

  // Получение обновленной книги
  const updatedBook = await Book.findByPk(book.id, {
    include: [
      { model: Category, as: "category" },
      { model: Publisher, as: "publisher" },
      { model: Author, as: "authors" },
    ],
  });

  res.status(200).json({
    success: true,
    data: { book: updatedBook },
  });
});

/**
 * @desc    Удалить книгу
 * @route   DELETE /api/books/:id
 * @access  Private/Admin
 */
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Книга не найдена",
    });
  }

  // Мягкое удаление - помечаем как неактивную
  await book.update({ isActive: false });

  res.status(200).json({
    success: true,
    data: { message: "Книга удалена" },
  });
});

/**
 * @desc    Получить рекомендуемые книги
 * @route   GET /api/books/:id/recommendations
 * @access  Public
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Книга не найдена",
    });
  }

  // Поиск похожих книг по категории и авторам
  const recommendations = await Book.findAll({
    where: {
      isActive: true,
      id: { [Op.ne]: book.id },
      [Op.or]: [
        { categoryId: book.categoryId },
        // Можно добавить логику для поиска по авторам
      ],
    },
    include: [
      { model: Category, as: "category", attributes: ["name"] },
      { model: Author, as: "authors", attributes: ["firstName", "lastName"] },
    ],
    limit: 8,
    order: [
      ["rating", "DESC"],
      ["viewCount", "DESC"],
    ],
  });

  res.status(200).json({
    success: true,
    data: { recommendations },
  });
});

/**
 * @desc    Поиск книг с автодополнением
 * @route   GET /api/books/search/autocomplete
 * @access  Public
 */
const autocomplete = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Поисковый запрос должен содержать минимум 2 символа",
    });
  }

  const books = await Book.findAll({
    where: {
      isActive: true,
      title: { [Op.iLike]: `%${q}%` },
    },
    attributes: ["id", "title", "slug"],
    limit: 10,
    order: [["viewCount", "DESC"]],
  });

  res.status(200).json({
    success: true,
    data: { suggestions: books },
  });
});

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getRecommendations,
  autocomplete,
};
```

### 2. Маршруты для книг

Создайте файл `src/routes/books.js`:

```javascript
const express = require("express");
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getRecommendations,
  autocomplete,
} = require("../controllers/booksController");
const { protect, authorize } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Публичные маршруты
router.get("/", getBooks);
router.get("/search/autocomplete", autocomplete);
router.get("/:id", getBook);
router.get("/:id/recommendations", getRecommendations);

// Защищенные маршруты (только для админа)
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(schemas.bookCreation),
  createBook
);
router.put("/:id", protect, authorize("admin"), updateBook);
router.delete("/:id", protect, authorize("admin"), deleteBook);

module.exports = router;
```

---

## 📂 API для категорий (расширенный)

### 1. Расширенный контроллер категорий

Создайте файл `src/controllers/categoriesController.js`:

```javascript
const { Category, Book } = require("../../models");
const { asyncHandler } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

/**
 * @desc    Получить все категории с иерархией
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    parent = null,
    active = true,
    withBooks = false,
  } = req.query;

  const offset = (page - 1) * limit;

  const where = {};
  if (parent !== null) {
    where.parentId = parent === "null" ? null : parseInt(parent);
  }
  if (active !== "all") {
    where.isActive = active === "true";
  }

  const include = [
    {
      model: Category,
      as: "children",
      where: { isActive: true },
      required: false,
      attributes: ["id", "name", "slug", "description"],
    },
  ];

  // Включить количество книг в категории
  if (withBooks === "true") {
    include.push({
      model: Book,
      as: "books",
      where: { isActive: true },
      required: false,
      attributes: ["id"],
    });
  }

  const { count, rows } = await Category.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
      [{ model: Category, as: "children" }, "sortOrder", "ASC"],
    ],
  });

  // Подсчет книг для каждой категории
  const categoriesWithCounts = await Promise.all(
    rows.map(async (category) => {
      const categoryJson = category.toJSON();

      if (withBooks === "true") {
        const bookCount = await Book.count({
          where: {
            categoryId: category.id,
            isActive: true,
          },
        });
        categoryJson.bookCount = bookCount;
      }

      return categoryJson;
    })
  );

  res.status(200).json({
    success: true,
    data: {
      categories: categoriesWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
});

/**
 * @desc    Получить иерархию категорий (дерево)
 * @route   GET /api/categories/tree
 * @access  Public
 */
const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { isActive: true },
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
    ],
  });

  // Построение дерева категорий
  const buildTree = (categories, parentId = null) => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        ...cat.toJSON(),
        children: buildTree(categories, cat.id),
      }));
  };

  const tree = buildTree(categories);

  res.status(200).json({
    success: true,
    data: { categoryTree: tree },
  });
});

/**
 * @desc    Получить категорию со всеми подкатегориями
 * @route   GET /api/categories/:id/full
 * @access  Public
 */
const getCategoryFull = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id, {
    include: [
      {
        model: Category,
        as: "parent",
        attributes: ["id", "name", "slug"],
      },
      {
        model: Category,
        as: "children",
        where: { isActive: true },
        required: false,
        include: [
          {
            model: Category,
            as: "children",
            where: { isActive: true },
            required: false,
          },
        ],
      },
    ],
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Категория не найдена",
    });
  }

  // Подсчет книг в категории и подкатегориях
  const getAllCategoryIds = (cat) => {
    let ids = [cat.id];
    if (cat.children) {
      cat.children.forEach((child) => {
        ids = ids.concat(getAllCategoryIds(child));
      });
    }
    return ids;
  };

  const allCategoryIds = getAllCategoryIds(category);
  const bookCount = await Book.count({
    where: {
      categoryId: { [Op.in]: allCategoryIds },
      isActive: true,
    },
  });

  const categoryWithCount = {
    ...category.toJSON(),
    bookCount,
  };

  res.status(200).json({
    success: true,
    data: { category: categoryWithCount },
  });
});

/**
 * @desc    Создать новую категорию
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  // Проверка уникальности slug
  if (req.body.slug) {
    const existingCategory = await Category.findOne({
      where: { slug: req.body.slug },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Категория с таким slug уже существует",
      });
    }
  }

  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: { category },
  });
});

/**
 * @desc    Обновить порядок сортировки категорий
 * @route   PUT /api/categories/reorder
 * @access  Private/Admin
 */
const reorderCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body; // Массив { id, sortOrder }

  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({
      success: false,
      message: "Неверный формат данных",
    });
  }

  // Обновление порядка сортировки
  await Promise.all(
    categories.map((cat) =>
      Category.update({ sortOrder: cat.sortOrder }, { where: { id: cat.id } })
    )
  );

  res.status(200).json({
    success: true,
    message: "Порядок категорий обновлен",
  });
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryFull,
  createCategory,
  reorderCategories,
};
```

---

## ✍️ API для авторов (расширенный)

### 1. Расширенный контроллер авторов

Создайте файл `src/controllers/authorsController.js`:

```javascript
const { Author, Book, Category } = require('../../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * @desc    Получить всех авторов с фильтрацией
 * @route   GET /api/authors
 * @access  Public
 */
const getAuthors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    nationality = '',
    sortBy = 'lastName',
    sortOrder = 'ASC',
    withBooks = false
  } = req.query;

  const offset = (page - 1) * limit;

  const where = { isActive: true };

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { middleName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (nationality) {
    where.nationality = nationality;
  }

  const include = [];

  if (withBooks === 'true') {
    include.push({
      model: Book,
      as: 'books',
      where: { isActive: true },
      required: false,
      attributes: ['id', 'title', 'slug', 'price', 'imageUrl'],
      through: { attributes: ['role'] },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });
  }

  const allowedSortFields = ['firstName', 'lastName', 'birthDate', 'nationality'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'lastName';
  const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const { count, rows } = await Author.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortField, sortDirection]]
  });

  res.status(200).json({
    success: true,
    data: {
      authors: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @desc    Получить автора с подробной информацией
 * @route   GET /api/authors/:id
 * @access  Public
 */
const getAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findByPk(req.params.id, {
    include: [
      {
        model: Book,
        as: 'books',
        where: { isActive: true },
        required: false,
        through: {
          attributes: ['role', 'sortOrder'],
          as: 'bookAuthor'
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        order: [['publishedYear', 'DESC']]
      }
    ]
  });

  if (!author) {
    return res.status(404).json({
      success: false,
      message: 'Автор не найден'
    });
  }

  // Статистика автора
  const stats = {
    bookCount: author.books ? author.books.length : 0,
    avgRating: 0,
    totalViews: 0
  };

  if (author.books && author.books.length > 0) {
    const ratings = author.books.filter(book => book.rating).map(book => parseFloat(book.rating));
    if (ratings.length > 0) {
      stats.avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }

    stats.totalViews = author.books.reduce((total, book) => total + book.viewCount, 0);
  }

  const authorWithStats = {
    ...author.toJSON(),
    stats
  };

  res.status(200).json({
    success: true,
    data: { author: authorWithStats }
  });
});

/**
 * @desc    Получить популярных авторов
 * @route   GET /api/authors/popular
 * @access  Public
 */
const getPopularAuthors = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Получение авторов с подсчетом общих просмотров их книг
  const popularAuthors = await Author.findAll({
    where: { isActive: true },
    include: [
      {
        model: Book,
        as: 'books',
        where: { isActive: true },
        required: true,
        attributes: ['viewCount', 'rating'],
        through: { attributes: [] }
      }
    ],
    limit: parseInt(limit)
  });

  // Сортировка по популярности (сумме просмотров)
  const authorsWithStats = popularAuthors.map(author => {
    const authorJson = author.toJSON();
    const totalViews = author.books.reduce((sum, book) => sum + book.viewCount, 0);
    const avgRating = author.books
      .filter(book => book.rating)
      .reduce((sum, book, _, arr) => sum + book.rating / arr.length, 0);

    return {
      ...authorJson,
      totalViews,
      avgRating: Math.round(avgRating * 100) / 100,
      bookCount: author.books.length
    };
  }).sort((a, b) => b.totalViews - a.totalViews);

  res.status(200).json({
    success: true,
    data: { authors: authorsWithStats }
  });
});

/**
 * @desc    Поиск авторов с автодополнением
 * @route   GET /api/authors/search/autocomplete
 * @access  Public
 */
const autocompleteAuthors = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Поисковый запрос должен содержать минимум 2 символа'
    });
  }

  const authors = await Author.findAll({
    where: {
      isActive: true,
      [Op.or] = [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } }
      ]
    },
    attributes: ['id', 'firstName', 'lastName', 'slug'],
    limit: 10,
    order: [['lastName', 'ASC']]
  });

  const suggestions = authors.map(author => ({
    id: author.id,
    name: author.getFullName(),
    slug: author.slug
  }));

  res.status(200).json({
    success: true,
    data: { suggestions }
  });
});

module.exports = {
  getAuthors,
  getAuthor,
  getPopularAuthors,
  autocompleteAuthors
};
```

---

## 🏢 API для издательств

### 1. Контроллер издательств

Создайте файл `src/controllers/publishersController.js`:

```javascript
const { Publisher, Book, Category } = require("../../models");
const { asyncHandler } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

/**
 * @desc    Получить всех издателей
 * @route   GET /api/publishers
 * @access  Public
 */
const getPublishers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    country = "",
    withBooks = false,
  } = req.query;

  const offset = (page - 1) * limit;

  const where = { isActive: true };

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  if (country) {
    where.country = country;
  }

  const include = [];

  if (withBooks === "true") {
    include.push({
      model: Book,
      as: "books",
      where: { isActive: true },
      required: false,
      attributes: ["id", "title", "price"],
      limit: 5, // Показываем только топ-5 книг
    });
  }

  const { count, rows } = await Publisher.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["name", "ASC"]],
  });

  res.status(200).json({
    success: true,
    data: {
      publishers: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
});

/**
 * @desc    Получить издательство по ID
 * @route   GET /api/publishers/:id
 * @access  Public
 */
const getPublisher = asyncHandler(async (req, res) => {
  const publisher = await Publisher.findByPk(req.params.id, {
    include: [
      {
        model: Book,
        as: "books",
        where: { isActive: true },
        required: false,
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["name"],
          },
          {
            model: Author,
            as: "authors",
            attributes: ["firstName", "lastName"],
          },
        ],
      },
    ],
  });

  if (!publisher) {
    return res.status(404).json({
      success: false,
      message: "Издательство не найдено",
    });
  }

  res.status(200).json({
    success: true,
    data: { publisher },
  });
});

module.exports = {
  getPublishers,
  getPublisher,
};
```

---

## 📊 API статистики и аналитики

### 1. Контроллер статистики

Создайте файл `src/controllers/statsController.js`:

```javascript
const { Book, Category, Author, User, sequelize } = require("../../models");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Получить общую статистику
 * @route   GET /api/stats
 * @access  Public
 */
const getGeneralStats = asyncHandler(async (req, res) => {
  const [totalBooks, totalCategories, totalAuthors, totalUsers, featuredBooks] =
    await Promise.all([
      Book.count({ where: { isActive: true } }),
      Category.count({ where: { isActive: true } }),
      Author.count({ where: { isActive: true } }),
      User.count({ where: { isActive: true } }),
      Book.count({ where: { isActive: true, isFeatured: true } }),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalBooks,
      totalCategories,
      totalAuthors,
      totalUsers,
      featuredBooks,
    },
  });
});

/**
 * @desc    Получить популярные книги
 * @route   GET /api/stats/popular-books
 * @access  Public
 */
const getPopularBooks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const books = await Book.findAll({
    where: { isActive: true },
    include: [
      { model: Category, as: "category", attributes: ["name"] },
      { model: Author, as: "authors", attributes: ["firstName", "lastName"] },
    ],
    order: [["viewCount", "DESC"]],
    limit: parseInt(limit),
  });

  res.status(200).json({
    success: true,
    data: { books },
  });
});

module.exports = {
  getGeneralStats,
  getPopularBooks,
};
```

---

## 📋 Задания для самопроверки

1. **Добавьте full-text поиск** для более точного поиска по книгам
2. **Реализуйте систему рейтингов** и отзывов
3. **Создайте API для рекомендаций** на основе истории просмотров
4. **Добавьте экспорт данных** в различных форматах (CSV, PDF)

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полный набор CRUD API эндпоинтов  
✅ Расширенная фильтрация и поиск  
✅ Пагинация и сортировка  
✅ API для статистики  
✅ Автодополнение поиска

**Следующий шаг:** [09_SHOPPING_CART_API.md](09_SHOPPING_CART_API.md) - создание API для корзины покупок и заказов.

---

_Время выполнения: ~4-5 часов_  
_Сложность: 🟡 Средняя_
