const {
  Book,
  Category,
  Publisher,
  Author,
  BookAuthor,
} = require("../../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

/**
 * Получение списка книг с пагинацией и фильтрацией
 * Поддерживает бесконечный скроллинг как требует преподаватель
 */
const getBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      publisher,
      search,
      sortBy = "popularity",
      sortOrder = "DESC",
      minPrice,
      maxPrice,
      inStock = true,
      authorType,
    } = req.query;

    // Валидация параметров
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Максимум 100 книг за раз
    const offset = (pageNum - 1) * limitNum;

    // Построение условий WHERE
    const whereConditions = {};

    // Только книги в наличии (как требует преподаватель)
    if (inStock === "true" || inStock === true) {
      whereConditions.stock = { [Op.gt]: 0 };
    }

    // Поиск по названию
    if (search) {
      whereConditions.title = {
        [Op.iLike]: `%${search}%`, // PostgreSQL поиск без учёта регистра
      };
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereConditions.price[Op.lte] = parseFloat(maxPrice);
    }

    // Фильтр по категории
    if (category) {
      whereConditions.categoryId = category;
    }

    // Фильтр по издательству
    if (publisher) {
      whereConditions.publisherId = publisher;
    }

    // Условия для включения авторов с фильтром по типу
    const authorInclude = {
      model: Author,
      as: "authors",
      attributes: ["id", "name", "authorType"],
      through: { attributes: [] },
    };

    // Фильтр по типу автора (russian/foreign)
    if (authorType && (authorType === "russian" || authorType === "foreign")) {
      authorInclude.where = { authorType };
      authorInclude.required = true; // INNER JOIN для фильтрации
    }

    // Сортировка
    const allowedSortFields = ["popularity", "price", "title", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "popularity";
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Запрос к базе данных
    const { count, rows: books } = await Book.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Publisher,
          as: "publisher",
          attributes: ["id", "name", "country"],
        },
        authorInclude,
      ],
      order: [[sortField, sortDirection]],
      limit: limitNum,
      offset: offset,
      distinct: true, // Важно для правильного подсчёта при JOIN
    });

    // Метаданные для пагинации
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        books: books.map((book) => ({
          id: book.id,
          title: book.title,
          price: parseFloat(book.price),
          priceCategory: book.priceCategory,
          stock: book.stock,
          shortDescription: book.shortDescription,
          fullDescription: book.fullDescription,
          image: book.image,
          popularity: book.popularity,
          category: book.category,
          publisher: book.publisher,
          authors:
            book.authors?.map((author) => ({
              id: author.id,
              name: author.name,
              authorType: author.authorType,
            })) || [],
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: count,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении списка книг",
    });
  }
};

/**
 * Получение топ популярных книг (для главной страницы)
 * Первые 10 самых популярных книг как требует преподаватель
 */
const getPopularBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const books = await Book.findAll({
      where: {
        stock: { [Op.gt]: 0 }, // Только книги в наличии
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Publisher,
          as: "publisher",
          attributes: ["id", "name"],
        },
        {
          model: Author,
          as: "authors",
          attributes: ["id", "name", "authorType"],
          through: { attributes: [] },
        },
      ],
      order: [["popularity", "DESC"]],
      limit: limitNum,
    });

    res.json({
      success: true,
      data: {
        books: books.map((book) => ({
          id: book.id,
          title: book.title,
          price: parseFloat(book.price),
          priceCategory: book.priceCategory,
          stock: book.stock,
          shortDescription: book.shortDescription,
          image: book.image,
          popularity: book.popularity,
          category: book.category,
          publisher: book.publisher,
          authors:
            book.authors?.map((author) => ({
              id: author.id,
              name: author.name,
              authorType: author.authorType,
            })) || [],
        })),
      },
    });
  } catch (error) {
    console.error("Get popular books error:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении популярных книг",
    });
  }
};

/**
 * Получение детальной информации о книге
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug", "description"],
        },
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
          ],
        },
        {
          model: Author,
          as: "authors",
          attributes: ["id", "name", "bio", "authorType"],
          through: { attributes: [] },
        },
      ],
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Книга не найдена",
      });
    }

    res.json({
      success: true,
      data: {
        book: {
          id: book.id,
          title: book.title,
          price: parseFloat(book.price),
          priceCategory: book.priceCategory,
          stock: book.stock,
          shortDescription: book.shortDescription,
          fullDescription: book.fullDescription,
          image: book.image,
          popularity: book.popularity,
          category: book.category,
          publisher: book.publisher,
          authors:
            book.authors?.map((author) => ({
              id: author.id,
              name: author.name,
              bio: author.bio,
              authorType: author.authorType,
            })) || [],
          isAvailable: book.stock > 0,
          isLowStock: book.stock > 0 && book.stock <= 5,
        },
      },
    });
  } catch (error) {
    console.error("Get book by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении информации о книге",
    });
  }
};

/**
 * Получение статистики магазина
 * Возвращает общую информацию о книгах, жанрах и продажах
 */
const getStats = async (req, res) => {
  try {
    console.log("Получение статистики магазина...");

    // Общая статистика по книгам
    const totalBooks = await Book.count();

    // Количество категорий (жанров)
    const totalGenres = await Category.count();

    // Общее количество проданных книг (сумма всех popularity)
    const totalSoldResult = await Book.sum("popularity");
    const totalSold = totalSoldResult || 0;

    // Популярные жанры по количеству проданных книг
    const genresWithSales = await Category.findAll({
      attributes: [
        "id",
        "name",
        // Сумма popularity (проданных книг) в каждой категории
        [
          Book.sequelize.fn("SUM", Book.sequelize.col("books.popularity")),
          "totalSold",
        ],
      ],
      include: [
        {
          model: Book,
          as: "books", // Указываем правильный алиас для ассоциации
          attributes: [],
          required: true, // INNER JOIN - только категории с книгами
        },
      ],
      group: ["Category.id", "Category.name"],
      order: [
        [
          Book.sequelize.fn("SUM", Book.sequelize.col("books.popularity")),
          "DESC",
        ],
      ],
      raw: true,
    });

    // Форматируем данные для ответа
    const stats = {
      books: {
        totalBooks,
        totalGenres,
        totalSold: Math.round(totalSold),
      },
      genres: genresWithSales.map((genre) => ({
        name: genre.name,
        count: Math.round(parseInt(genre.totalSold) || 0),
      })),
    };

    console.log("Статистика собрана:", stats);

    res.json({
      success: true,
      message: "Статистика магазина получена успешно",
      data: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении статистики",
    });
  }
};

module.exports = {
  getBooks,
  getPopularBooks,
  getBookById,
  getStats,
};
