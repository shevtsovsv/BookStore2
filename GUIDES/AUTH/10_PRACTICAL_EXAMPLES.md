# 🛠️ Урок 10: Практические примеры

## 🎯 Реальные сценарии и решения

В финальном уроке рассмотрим полные практические примеры интеграции всех компонентов системы аутентификации в реальном приложении BookStore.

## 🏗️ Полная интеграция системы

### Структура проекта с аутентификацией:

```
bookstore/
├── server.js                 # Основной сервер
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── bookController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── sessionMiddleware.js
│   │   └── securityMiddleware.js
│   ├── services/
│   │   ├── sessionManager.js
│   │   ├── emailService.js
│   │   └── notificationService.js
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       └── books.js
└── public/
    ├── scripts/
    │   ├── auth-utils.js
    │   ├── session-client.js
    │   ├── route-guard.js
    │   └── book-catalog.js
    └── html/
        ├── login.html
        ├── register.html
        ├── profile.html
        └── admin.html
```

## 🔧 Полный пример: Защищенный каталог книг

### bookController.js с авторизацией:

```javascript
// src/controllers/bookController.js

const { Book, Author, Category, User } = require("../models");
const { Op } = require("sequelize");

class BookController {
  // Получение каталога книг (публичный доступ)
  static async getCatalog(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        author,
        search,
        sortBy = "title",
        sortOrder = "ASC",
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Фильтрация по категории
      if (category) {
        where.categoryId = category;
      }

      // Поиск
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const books = await Book.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        include: [
          { model: Author, as: "authors" },
          { model: Category, as: "category" },
        ],
      });

      // Добавляем персонализацию для авторизованных пользователей
      let personalizedData = {};
      if (req.user) {
        personalizedData = await this.getPersonalizedData(
          req.user.userId,
          books.rows
        );
      }

      res.json({
        success: true,
        books: books.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(books.count / limit),
          totalItems: books.count,
          itemsPerPage: parseInt(limit),
        },
        personalization: personalizedData,
      });
    } catch (error) {
      console.error("Ошибка получения каталога:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка получения каталога книг",
      });
    }
  }

  // Получение персонализированных данных
  static async getPersonalizedData(userId, books) {
    try {
      // Получаем избранное пользователя
      const favorites = await this.getUserFavorites(userId);
      const favoriteIds = favorites.map((f) => f.bookId);

      // Получаем историю просмотров
      const viewHistory = await this.getUserViewHistory(userId);

      // Получаем рекомендации
      const recommendations = await this.getRecommendations(userId);

      // Добавляем флаги к книгам
      const booksWithFlags = books.map((book) => ({
        ...book.toJSON(),
        isFavorite: favoriteIds.includes(book.bookId),
        viewedAt:
          viewHistory.find((v) => v.bookId === book.bookId)?.viewedAt || null,
      }));

      return {
        favorites: favoriteIds,
        recommendations: recommendations,
        recentlyViewed: viewHistory.slice(0, 5),
        books: booksWithFlags,
      };
    } catch (error) {
      console.error("Ошибка получения персонализированных данных:", error);
      return {};
    }
  }

  // Получение детальной информации о книге
  static async getBookDetails(req, res) {
    try {
      const { bookId } = req.params;

      const book = await Book.findByPk(bookId, {
        include: [
          { model: Author, as: "authors" },
          { model: Category, as: "category" },
        ],
      });

      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Книга не найдена",
        });
      }

      // Логируем просмотр для авторизованных пользователей
      if (req.user) {
        await this.logBookView(req.user.userId, bookId);
      }

      // Получаем связанные книги
      const relatedBooks = await this.getRelatedBooks(book.categoryId, bookId);

      // Персонализированные данные
      let personalizedData = {};
      if (req.user) {
        personalizedData = await this.getPersonalizedBookData(
          req.user.userId,
          bookId
        );
      }

      res.json({
        success: true,
        book: book,
        relatedBooks: relatedBooks,
        personalization: personalizedData,
      });
    } catch (error) {
      console.error("Ошибка получения деталей книги:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка получения информации о книге",
      });
    }
  }

  // Добавление книги в избранное (требует авторизации)
  static async addToFavorites(req, res) {
    try {
      const { bookId } = req.params;
      const userId = req.user.userId;

      // Проверяем существование книги
      const book = await Book.findByPk(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Книга не найдена",
        });
      }

      // Проверяем, не добавлена ли уже
      const existing = await this.checkFavoriteExists(userId, bookId);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Книга уже в избранном",
        });
      }

      // Добавляем в избранное
      await this.addBookToFavorites(userId, bookId);

      // Логируем действие
      await this.logUserAction(userId, "ADD_TO_FAVORITES", { bookId });

      res.json({
        success: true,
        message: "Книга добавлена в избранное",
      });
    } catch (error) {
      console.error("Ошибка добавления в избранное:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка добавления в избранное",
      });
    }
  }

  // Удаление из избранного (требует авторизации)
  static async removeFromFavorites(req, res) {
    try {
      const { bookId } = req.params;
      const userId = req.user.userId;

      const removed = await this.removeBookFromFavorites(userId, bookId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: "Книга не найдена в избранном",
        });
      }

      // Логируем действие
      await this.logUserAction(userId, "REMOVE_FROM_FAVORITES", { bookId });

      res.json({
        success: true,
        message: "Книга удалена из избранного",
      });
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка удаления из избранного",
      });
    }
  }

  // Создание книги (только для администраторов)
  static async createBook(req, res) {
    try {
      const {
        title,
        description,
        price,
        categoryId,
        authorIds,
        isbn,
        publishedYear,
        imageUrl,
      } = req.body;

      // Валидация данных
      const validation = await this.validateBookData(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: "Ошибка валидации",
          errors: validation.errors,
        });
      }

      // Создаем книгу в транзакции
      const sequelize = require("../models").sequelize;
      const result = await sequelize.transaction(async (t) => {
        // Создаем книгу
        const book = await Book.create(
          {
            title,
            description,
            price,
            categoryId,
            isbn,
            publishedYear,
            imageUrl,
            createdBy: req.user.userId,
          },
          { transaction: t }
        );

        // Связываем с авторами
        if (authorIds && authorIds.length > 0) {
          await book.setAuthors(authorIds, { transaction: t });
        }

        return book;
      });

      // Логируем создание
      await this.logUserAction(req.user.userId, "CREATE_BOOK", {
        bookId: result.bookId,
      });

      res.status(201).json({
        success: true,
        message: "Книга создана успешно",
        book: result,
      });
    } catch (error) {
      console.error("Ошибка создания книги:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка создания книги",
      });
    }
  }

  // Обновление книги (только для администраторов)
  static async updateBook(req, res) {
    try {
      const { bookId } = req.params;
      const updateData = req.body;

      // Проверяем существование книги
      const book = await Book.findByPk(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Книга не найдена",
        });
      }

      // Валидация данных
      const validation = await this.validateBookData(updateData, false);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: "Ошибка валидации",
          errors: validation.errors,
        });
      }

      // Обновляем в транзакции
      const sequelize = require("../models").sequelize;
      await sequelize.transaction(async (t) => {
        // Обновляем основные данные
        await book.update(
          {
            ...updateData,
            updatedBy: req.user.userId,
          },
          { transaction: t }
        );

        // Обновляем связи с авторами если нужно
        if (updateData.authorIds) {
          await book.setAuthors(updateData.authorIds, { transaction: t });
        }
      });

      // Логируем обновление
      await this.logUserAction(req.user.userId, "UPDATE_BOOK", {
        bookId: bookId,
        changes: Object.keys(updateData),
      });

      res.json({
        success: true,
        message: "Книга обновлена успешно",
      });
    } catch (error) {
      console.error("Ошибка обновления книги:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка обновления книги",
      });
    }
  }

  // Удаление книги (только для администраторов)
  static async deleteBook(req, res) {
    try {
      const { bookId } = req.params;

      const book = await Book.findByPk(bookId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Книга не найдена",
        });
      }

      // Проверяем, нет ли активных заказов с этой книгой
      const hasActiveOrders = await this.checkActiveOrders(bookId);
      if (hasActiveOrders) {
        return res.status(400).json({
          success: false,
          message: "Нельзя удалить книгу с активными заказами",
        });
      }

      // Мягкое удаление
      await book.update({
        isDeleted: true,
        deletedBy: req.user.userId,
        deletedAt: new Date(),
      });

      // Логируем удаление
      await this.logUserAction(req.user.userId, "DELETE_BOOK", {
        bookId: bookId,
        title: book.title,
      });

      res.json({
        success: true,
        message: "Книга удалена успешно",
      });
    } catch (error) {
      console.error("Ошибка удаления книги:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка удаления книги",
      });
    }
  }

  // Вспомогательные методы
  static async getUserFavorites(userId) {
    // Реализация получения избранного
    // return await UserFavorite.findAll({ where: { userId } });
    return [];
  }

  static async getUserViewHistory(userId) {
    // Реализация получения истории просмотров
    // return await ViewHistory.findAll({ where: { userId }, order: [['viewedAt', 'DESC']] });
    return [];
  }

  static async getRecommendations(userId) {
    // Реализация системы рекомендаций
    return [];
  }

  static async logBookView(userId, bookId) {
    // Логирование просмотра книги
    console.log(`User ${userId} viewed book ${bookId}`);
  }

  static async getRelatedBooks(categoryId, excludeBookId) {
    return await Book.findAll({
      where: {
        categoryId: categoryId,
        bookId: { [Op.ne]: excludeBookId },
      },
      limit: 5,
      include: [{ model: Author, as: "authors" }],
    });
  }

  static async getPersonalizedBookData(userId, bookId) {
    const isFavorite = await this.checkFavoriteExists(userId, bookId);
    return { isFavorite };
  }

  static async checkFavoriteExists(userId, bookId) {
    // Проверка существования в избранном
    return false;
  }

  static async addBookToFavorites(userId, bookId) {
    // Добавление в избранное
    console.log(`Added book ${bookId} to favorites for user ${userId}`);
  }

  static async removeBookFromFavorites(userId, bookId) {
    // Удаление из избранного
    console.log(`Removed book ${bookId} from favorites for user ${userId}`);
    return true;
  }

  static async logUserAction(userId, action, details) {
    console.log(`User action: ${userId} -> ${action}`, details);
  }

  static async validateBookData(data, isCreate = true) {
    const errors = [];

    if (isCreate && !data.title) {
      errors.push("Название книги обязательно");
    }

    if (data.price && (data.price < 0 || data.price > 10000)) {
      errors.push("Цена должна быть от 0 до 10000");
    }

    if (data.isbn && !/^\d{10}(\d{3})?$/.test(data.isbn.replace(/-/g, ""))) {
      errors.push("Неверный формат ISBN");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  static async checkActiveOrders(bookId) {
    // Проверка активных заказов
    return false;
  }
}

module.exports = BookController;
```

## 🎮 Клиентская интеграция: Защищенный каталог

### book-catalog.js с авторизацией:

```javascript
// public/scripts/book-catalog.js

class AuthenticatedBookCatalog {
  constructor() {
    this.currentUser = Auth.getCurrentUser();
    this.favorites = new Set();
    this.cartItems = new Set();
    this.initializeCatalog();
  }

  async initializeCatalog() {
    // Загружаем каталог
    await this.loadCatalog();

    // Загружаем персональные данные если авторизован
    if (this.currentUser) {
      await this.loadPersonalData();
    }

    this.setupEventListeners();
    this.setupInfiniteScroll();
  }

  async loadCatalog(page = 1, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 12,
        ...filters,
      });

      const headers = {
        "Content-Type": "application/json",
      };

      // Добавляем токен если авторизован
      if (Auth.isAuthenticated()) {
        headers["Authorization"] = `Bearer ${Auth.getToken()}`;
      }

      const response = await fetch(`/api/books?${params}`, { headers });

      if (!response.ok) {
        throw new Error("Ошибка загрузки каталога");
      }

      const data = await response.json();

      if (page === 1) {
        this.renderCatalog(data.books);
      } else {
        this.appendBooks(data.books);
      }

      // Обновляем персонализацию
      if (data.personalization) {
        this.updatePersonalization(data.personalization);
      }

      this.updatePagination(data.pagination);
    } catch (error) {
      console.error("Ошибка загрузки каталога:", error);
      Notifications.error("Не удалось загрузить каталог");
    }
  }

  async loadPersonalData() {
    try {
      const [favoritesData, cartData] = await Promise.all([
        this.loadFavorites(),
        this.loadCart(),
      ]);

      this.favorites = new Set(favoritesData);
      this.cartItems = new Set(cartData);

      this.updateBookStates();
    } catch (error) {
      console.error("Ошибка загрузки персональных данных:", error);
    }
  }

  async loadFavorites() {
    if (!Auth.isAuthenticated()) return [];

    try {
      const response = await fetch("/api/users/favorites", {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.favorites || [];
      }
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    }

    return [];
  }

  async loadCart() {
    if (!Auth.isAuthenticated()) {
      // Загружаем из localStorage для неавторизованных
      return JSON.parse(localStorage.getItem("cart") || "[]");
    }

    try {
      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.items?.map((item) => item.bookId) || [];
      }
    } catch (error) {
      console.error("Ошибка загрузки корзины:", error);
    }

    return [];
  }

  renderCatalog(books) {
    const container = document.getElementById("books-container");
    if (!container) return;

    container.innerHTML = books
      .map((book) => this.renderBookCard(book))
      .join("");
    this.updateBookStates();
  }

  renderBookCard(book) {
    const isFavorite = this.favorites.has(book.bookId);
    const inCart = this.cartItems.has(book.bookId);
    const isAuthenticated = Auth.isAuthenticated();

    return `
      <div class="book-card" data-book-id="${book.bookId}">
        <div class="book-image">
          <img src="${book.imageUrl || "/img/book-placeholder.jpg"}" 
               alt="${book.title}" 
               loading="lazy">
          
          ${
            isAuthenticated
              ? `
            <button class="favorite-btn ${isFavorite ? "active" : ""}" 
                    data-book-id="${book.bookId}"
                    title="${
                      isFavorite
                        ? "Удалить из избранного"
                        : "Добавить в избранное"
                    }">
              <span class="heart-icon">${isFavorite ? "❤️" : "🤍"}</span>
            </button>
          `
              : ""
          }
        </div>

        <div class="book-info">
          <h3 class="book-title">
            <a href="/book/${book.bookId}">${book.title}</a>
          </h3>
          
          <p class="book-authors">
            ${
              book.authors?.map((author) => author.name).join(", ") ||
              "Неизвестный автор"
            }
          </p>
          
          <p class="book-price">
            <span class="price">${book.price} ₽</span>
            ${
              book.originalPrice && book.originalPrice > book.price
                ? `
              <span class="original-price">${book.originalPrice} ₽</span>
            `
                : ""
            }
          </p>

          <div class="book-actions">
            <button class="add-to-cart-btn ${inCart ? "in-cart" : ""}" 
                    data-book-id="${book.bookId}"
                    ${inCart ? "disabled" : ""}>
              <span class="btn-text">
                ${inCart ? "✓ В корзине" : "🛒 В корзину"}
              </span>
            </button>

            ${
              isAuthenticated
                ? `
              <button class="quick-buy-btn" data-book-id="${book.bookId}">
                <span class="btn-text">Купить сейчас</span>
              </button>
            `
                : `
              <button class="login-prompt-btn" onclick="this.promptLogin()">
                <span class="btn-text">Войти для покупки</span>
              </button>
            `
            }
          </div>

          ${
            book.viewedAt
              ? `
            <div class="book-meta">
              <span class="viewed-badge">
                👁️ Просмотрено ${new Date(book.viewedAt).toLocaleDateString()}
              </span>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Обработка избранного
    document.addEventListener("click", async (e) => {
      if (e.target.closest(".favorite-btn")) {
        await this.handleFavoriteClick(e.target.closest(".favorite-btn"));
      }
    });

    // Обработка корзины
    document.addEventListener("click", async (e) => {
      if (e.target.closest(".add-to-cart-btn")) {
        await this.handleAddToCart(e.target.closest(".add-to-cart-btn"));
      }
    });

    // Быстрая покупка
    document.addEventListener("click", async (e) => {
      if (e.target.closest(".quick-buy-btn")) {
        await this.handleQuickBuy(e.target.closest(".quick-buy-btn"));
      }
    });

    // Фильтры
    const filterForm = document.getElementById("filter-form");
    if (filterForm) {
      filterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.applyFilters();
      });
    }

    // Поиск
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.performSearch(e.target.value);
        }, 500);
      });
    }
  }

  @AuthRequired.requireAuth
  async handleFavoriteClick(button) {
    const bookId = button.dataset.bookId;
    const isCurrentlyFavorite = this.favorites.has(parseInt(bookId));

    try {
      button.disabled = true;

      if (isCurrentlyFavorite) {
        await this.removeFromFavorites(bookId);
      } else {
        await this.addToFavorites(bookId);
      }

      // Обновляем UI
      this.updateFavoriteButton(button, !isCurrentlyFavorite);
    } catch (error) {
      console.error("Ошибка обработки избранного:", error);
      Notifications.error("Не удалось обновить избранное");
    } finally {
      button.disabled = false;
    }
  }

  async addToFavorites(bookId) {
    const response = await fetch(`/api/books/${bookId}/favorite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Не удалось добавить в избранное");
    }

    this.favorites.add(parseInt(bookId));
    Notifications.success("Книга добавлена в избранное");
  }

  async removeFromFavorites(bookId) {
    const response = await fetch(`/api/books/${bookId}/favorite`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Не удалось удалить из избранного");
    }

    this.favorites.delete(parseInt(bookId));
    Notifications.success("Книга удалена из избранного");
  }

  async handleAddToCart(button) {
    const bookId = button.dataset.bookId;

    try {
      button.disabled = true;

      if (Auth.isAuthenticated()) {
        await this.addToCartAuthenticated(bookId);
      } else {
        await this.addToCartGuest(bookId);
      }

      // Обновляем UI
      this.updateCartButton(button, true);
      this.cartItems.add(parseInt(bookId));
    } catch (error) {
      console.error("Ошибка добавления в корзину:", error);
      Notifications.error("Не удалось добавить в корзину");
    } finally {
      button.disabled = false;
    }
  }

  async addToCartAuthenticated(bookId) {
    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookId: parseInt(bookId), quantity: 1 }),
    });

    if (!response.ok) {
      throw new Error("Не удалось добавить в корзину");
    }

    Notifications.success("Книга добавлена в корзину");
    this.updateCartCounter();
  }

  addToCartGuest(bookId) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!cart.includes(parseInt(bookId))) {
      cart.push(parseInt(bookId));
      localStorage.setItem("cart", JSON.stringify(cart));
      Notifications.success("Книга добавлена в корзину");
      this.updateCartCounter();
    }
  }

  @AuthRequired.requireAuth
  async handleQuickBuy(button) {
    const bookId = button.dataset.bookId;

    try {
      // Добавляем в корзину если еще не добавлено
      if (!this.cartItems.has(parseInt(bookId))) {
        await this.addToCartAuthenticated(bookId);
      }

      // Перенаправляем на оформление заказа
      window.location.href = `/checkout?quick=true&book=${bookId}`;
    } catch (error) {
      console.error("Ошибка быстрой покупки:", error);
      Notifications.error("Не удалось выполнить быструю покупку");
    }
  }

  updatePersonalization(personalization) {
    // Обновляем избранное
    if (personalization.favorites) {
      this.favorites = new Set(personalization.favorites);
    }

    // Показываем рекомендации
    if (personalization.recommendations?.length > 0) {
      this.showRecommendations(personalization.recommendations);
    }

    // Показываем недавно просмотренные
    if (personalization.recentlyViewed?.length > 0) {
      this.showRecentlyViewed(personalization.recentlyViewed);
    }
  }

  showRecommendations(recommendations) {
    const container = document.getElementById("recommendations");
    if (!container) return;

    container.innerHTML = `
      <div class="recommendations-section">
        <h3>📚 Рекомендации для вас</h3>
        <div class="recommendations-grid">
          ${recommendations
            .slice(0, 4)
            .map((book) => this.renderMiniBookCard(book))
            .join("")}
        </div>
      </div>
    `;
  }

  showRecentlyViewed(recentlyViewed) {
    const container = document.getElementById("recently-viewed");
    if (!container) return;

    container.innerHTML = `
      <div class="recently-viewed-section">
        <h3>👁️ Недавно просмотренные</h3>
        <div class="recently-viewed-grid">
          ${recentlyViewed
            .slice(0, 5)
            .map((item) => this.renderMiniBookCard(item.book))
            .join("")}
        </div>
      </div>
    `;
  }

  renderMiniBookCard(book) {
    return `
      <div class="mini-book-card">
        <a href="/book/${book.bookId}">
          <img src="${book.imageUrl || "/img/book-placeholder.jpg"}" alt="${
      book.title
    }">
          <div class="mini-book-info">
            <h4>${book.title}</h4>
            <p>${book.price} ₽</p>
          </div>
        </a>
      </div>
    `;
  }

  updateBookStates() {
    // Обновляем состояние кнопок избранного
    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      const bookId = parseInt(btn.dataset.bookId);
      const isFavorite = this.favorites.has(bookId);
      this.updateFavoriteButton(btn, isFavorite);
    });

    // Обновляем состояние кнопок корзины
    document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      const bookId = parseInt(btn.dataset.bookId);
      const inCart = this.cartItems.has(bookId);
      this.updateCartButton(btn, inCart);
    });
  }

  updateFavoriteButton(button, isFavorite) {
    const heartIcon = button.querySelector(".heart-icon");
    if (heartIcon) {
      heartIcon.textContent = isFavorite ? "❤️" : "🤍";
    }

    button.classList.toggle("active", isFavorite);
    button.title = isFavorite
      ? "Удалить из избранного"
      : "Добавить в избранное";
  }

  updateCartButton(button, inCart) {
    const btnText = button.querySelector(".btn-text");
    if (btnText) {
      btnText.textContent = inCart ? "✓ В корзине" : "🛒 В корзину";
    }

    button.classList.toggle("in-cart", inCart);
    button.disabled = inCart;
  }

  updateCartCounter() {
    const counter = document.getElementById("cart-count");
    if (counter) {
      const count = Auth.isAuthenticated()
        ? this.cartItems.size
        : JSON.parse(localStorage.getItem("cart") || "[]").length;

      counter.textContent = count;
      counter.style.display = count > 0 ? "inline" : "none";
    }
  }

  applyFilters() {
    const formData = new FormData(document.getElementById("filter-form"));
    const filters = Object.fromEntries(formData.entries());

    // Удаляем пустые фильтры
    Object.keys(filters).forEach((key) => {
      if (!filters[key]) delete filters[key];
    });

    this.loadCatalog(1, filters);
  }

  performSearch(query) {
    if (query.trim()) {
      this.loadCatalog(1, { search: query.trim() });
    } else {
      this.loadCatalog(1);
    }
  }

  setupInfiniteScroll() {
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;

    window.addEventListener("scroll", () => {
      if (isLoading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;

      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        isLoading = true;
        currentPage++;

        this.loadCatalog(currentPage).finally(() => {
          isLoading = false;
        });
      }
    });
  }

  promptLogin() {
    if (
      confirm(
        "Для покупки книг необходимо войти в систему. Перейти на страницу входа?"
      )
    ) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "/login.html";
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  window.bookCatalog = new AuthenticatedBookCatalog();
  console.log("📚 Аутентифицированный каталог книг инициализирован");
});
```

## 📱 Адаптивная защита страниц

### Пример универсального шаблона:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Каталог книг - BookStore</title>
    <link rel="stylesheet" href="../style/main.css" />
    <link rel="stylesheet" href="../style/catalog.css" />
  </head>
  <body>
    <!-- Прелоадер -->
    <div id="page-loader" class="page-loader">
      <div class="loader-content">
        <div class="spinner"></div>
        <p>Загрузка каталога...</p>
      </div>
    </div>

    <!-- Основной контент -->
    <div id="main-content" style="display: none;">
      <!-- Навигация -->
      <nav class="navbar">
        <div class="nav-container">
          <a href="../index.html" class="nav-brand">📚 BookStore</a>

          <div class="nav-menu">
            <a href="../catalog.html" class="nav-link active">Каталог</a>
            <a href="../about.html" class="nav-link">О нас</a>
            <a href="../contacts.html" class="nav-link">Контакты</a>
          </div>

          <div class="nav-actions">
            <!-- Для неавторизованных -->
            <div id="guest-actions" class="auth-actions" style="display: none;">
              <a href="../login.html" class="nav-link">Войти</a>
              <a href="../register.html" class="nav-btn">Регистрация</a>
            </div>

            <!-- Для авторизованных -->
            <div id="user-actions" class="auth-actions" style="display: none;">
              <a href="../favorites.html" class="nav-link">
                <span class="nav-icon">❤️</span>
                Избранное
              </a>
              <a href="../cart.html" class="nav-link cart-link">
                <span class="nav-icon">🛒</span>
                Корзина
                <span id="cart-count" class="cart-counter">0</span>
              </a>
              <div class="user-menu">
                <button class="user-menu-btn">
                  <span id="user-name">Пользователь</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-menu">
                  <a href="../profile.html">Профиль</a>
                  <a href="../orders.html">Мои заказы</a>
                  <div class="dropdown-divider"></div>
                  <a href="#" onclick="Auth.logout()">Выйти</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Основное содержимое -->
      <main class="catalog-main">
        <!-- Фильтры и поиск -->
        <aside class="catalog-sidebar">
          <form id="filter-form" class="filter-form">
            <div class="search-section">
              <input
                type="text"
                id="search-input"
                placeholder="Поиск книг..."
              />
            </div>

            <div class="filter-section">
              <h3>Категории</h3>
              <div id="categories-filter"></div>
            </div>

            <div class="filter-section">
              <h3>Цена</h3>
              <div class="price-range">
                <input type="number" name="minPrice" placeholder="От" />
                <input type="number" name="maxPrice" placeholder="До" />
              </div>
            </div>

            <div class="filter-actions">
              <button type="submit" class="filter-btn">Применить</button>
              <button type="reset" class="filter-btn secondary">
                Сбросить
              </button>
            </div>
          </form>
        </aside>

        <!-- Каталог книг -->
        <section class="catalog-content">
          <!-- Сортировка -->
          <div class="catalog-header">
            <div class="catalog-stats">
              <span id="results-count">Найдено книг: 0</span>
            </div>
            <div class="catalog-controls">
              <select id="sort-select" name="sortBy">
                <option value="title">По названию</option>
                <option value="price">По цене</option>
                <option value="createdAt">По дате добавления</option>
              </select>
            </div>
          </div>

          <!-- Персонализированные секции (только для авторизованных) -->
          <div id="personalized-sections" style="display: none;">
            <div id="recommendations"></div>
            <div id="recently-viewed"></div>
          </div>

          <!-- Сетка книг -->
          <div id="books-container" class="books-grid">
            <!-- Книги загружаются динамически -->
          </div>

          <!-- Индикатор загрузки -->
          <div
            id="loading-more"
            class="loading-indicator"
            style="display: none;"
          >
            <div class="spinner-small"></div>
            <span>Загрузка...</span>
          </div>
        </section>
      </main>
    </div>

    <!-- Скрипты -->
    <script src="../scripts/notifications.js"></script>
    <script src="../scripts/auth-utils.js"></script>
    <script src="../scripts/route-guard.js"></script>
    <script src="../scripts/session-client.js"></script>
    <script src="../scripts/book-catalog.js"></script>

    <script>
      // Инициализация страницы
      document.addEventListener("DOMContentLoaded", async function () {
        const pageLoader = document.getElementById("page-loader");
        const mainContent = document.getElementById("main-content");

        try {
          // Проверяем аутентификацию
          const isAuthenticated = Auth.isAuthenticated();

          // Настраиваем интерфейс
          setupNavigation(isAuthenticated);

          // Показываем контент
          pageLoader.style.display = "none";
          mainContent.style.display = "block";

          // Инициализируем каталог
          if (window.bookCatalog) {
            console.log("📚 Каталог книг загружен");
          }
        } catch (error) {
          console.error("Ошибка инициализации страницы:", error);
          pageLoader.innerHTML = `
                    <div class="loader-content">
                        <div class="error-icon">❌</div>
                        <p>Ошибка загрузки страницы</p>
                        <button onclick="location.reload()" class="retry-btn">Повторить</button>
                    </div>
                `;
        }
      });

      function setupNavigation(isAuthenticated) {
        const guestActions = document.getElementById("guest-actions");
        const userActions = document.getElementById("user-actions");
        const personalizedSections = document.getElementById(
          "personalized-sections"
        );

        if (isAuthenticated) {
          const user = Auth.getCurrentUser();

          guestActions.style.display = "none";
          userActions.style.display = "flex";
          personalizedSections.style.display = "block";

          // Обновляем имя пользователя
          const userNameElement = document.getElementById("user-name");
          if (userNameElement && user) {
            userNameElement.textContent = user.firstName || user.username;
          }

          // Инициализируем счетчик корзины
          updateCartCounter();
        } else {
          guestActions.style.display = "flex";
          userActions.style.display = "none";
          personalizedSections.style.display = "none";
        }
      }

      async function updateCartCounter() {
        try {
          const response = await fetch("/api/cart", {
            headers: {
              Authorization: `Bearer ${Auth.getToken()}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const count = data.items?.length || 0;

            const counter = document.getElementById("cart-count");
            if (counter) {
              counter.textContent = count;
              counter.style.display = count > 0 ? "inline" : "none";
            }
          }
        } catch (error) {
          console.error("Ошибка обновления счетчика корзины:", error);
        }
      }
    </script>
  </body>
</html>
```

## 🧪 Практические задания

### Задание 1: Многоуровневые роли

Создайте систему с ролями: guest → user → premium → moderator → admin

### Задание 2: Социальная авторизация

Интегрируйте OAuth с Google, Facebook, GitHub

### Задание 3: Двухфакторная аутентификация

Реализуйте 2FA через SMS, Email и TOTP приложения

### Задание 4: Аудит безопасности

Создайте полную систему логирования и мониторинга безопасности

### Задание 5: Микросервисная авторизация

Разделите систему авторизации на отдельные микросервисы

---

## 🎓 Заключение курса

**Поздравляем!** Вы прошли полный курс по системе аутентификации и авторизации. Теперь вы знаете:

- 🔐 JWT токены и refresh tokens
- 🛡️ Защиту от основных угроз безопасности
- 📊 Управление сессиями и мониторинг
- 🎮 Клиентскую и серверную интеграцию
- 🔧 Практическую реализацию в реальном проекте

**Следующие шаги:**

1. Внедрите изученные техники в свои проекты
2. Изучите дополнительные технологии (OAuth, SAML, WebAuthn)
3. Практикуйтесь в написании безопасного кода
4. Следите за новыми угрозами и методами защиты

**Удачи в разработке безопасных приложений!** 🚀
