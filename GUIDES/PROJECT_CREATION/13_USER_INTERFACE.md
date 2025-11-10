# 🎮 Пользовательский интерфейс

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 4-5 часов  
> **Предварительные требования:** Завершение части 12

## 🎯 Цели этой части

В этой части вы создадите интерактивный пользовательский интерфейс с:

- Компонентами для каталога книг
- Системой корзины покупок
- Модальными окнами и формами
- Адаптивным меню и навигацией
- Поиском и фильтрацией

---

## 📚 Каталог книг (JavaScript)

### 1. Основной скрипт каталога

Обновите файл `public/scripts/book-catalog.js`:

```javascript
/* ===================================
   КАТАЛОГ КНИГ
   =================================== */

class BookCatalog {
  constructor() {
    this.currentPage = 1;
    this.currentFilters = {};
    this.currentSort = "createdAt-DESC";
    this.currentView = "grid";
    this.loading = false;
    this.searchTimeout = null;

    this.elements = {
      booksGrid: document.getElementById("booksGrid"),
      loadingState: document.getElementById("loadingState"),
      emptyState: document.getElementById("emptyState"),
      pagination: document.getElementById("pagination"),
      searchInput: document.getElementById("searchInput"),
      searchSuggestions: document.getElementById("searchSuggestions"),
      filterPanel: document.getElementById("filterPanel"),
      sortSelect: document.getElementById("sortSelect"),
      viewButtons: document.querySelectorAll(".view-btn"),
      categoryFilter: document.getElementById("categoryFilter"),
      minPrice: document.getElementById("minPrice"),
      maxPrice: document.getElementById("maxPrice"),
      languageFilter: document.getElementById("languageFilter"),
    };

    this.init();
  }

  async init() {
    this.loadFromUrl();
    this.attachEventListeners();
    await this.loadCategories();
    await this.loadBooks();
  }

  // Загрузка параметров из URL
  loadFromUrl() {
    const urlParams = Utils.getUrlParams();

    this.currentPage = parseInt(urlParams.get("page")) || 1;
    this.currentSort = urlParams.get("sort") || "createdAt-DESC";
    this.currentView = urlParams.get("view") || "grid";

    this.currentFilters = {
      search: urlParams.get("search") || "",
      category: urlParams.get("category") || "",
      minPrice: urlParams.get("minPrice") || "",
      maxPrice: urlParams.get("maxPrice") || "",
      language: urlParams.get("language") || "",
      author: urlParams.get("author") || "",
      publisher: urlParams.get("publisher") || "",
    };

    this.updateUIFromState();
  }

  // Обновление интерфейса на основе текущего состояния
  updateUIFromState() {
    // Поиск
    if (this.elements.searchInput) {
      this.elements.searchInput.value = this.currentFilters.search;
    }

    // Сортировка
    if (this.elements.sortSelect) {
      this.elements.sortSelect.value = this.currentSort;
    }

    // Вид отображения
    this.elements.viewButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === this.currentView);
    });

    // Фильтры
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.value = this.currentFilters.category;
    }
    if (this.elements.minPrice) {
      this.elements.minPrice.value = this.currentFilters.minPrice;
    }
    if (this.elements.maxPrice) {
      this.elements.maxPrice.value = this.currentFilters.maxPrice;
    }
    if (this.elements.languageFilter) {
      this.elements.languageFilter.value = this.currentFilters.language;
    }

    // Применение вида отображения
    this.applyViewMode();
  }

  // Прикрепление обработчиков событий
  attachEventListeners() {
    // Поиск
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener(
        "input",
        Utils.debounce((e) => {
          this.handleSearch(e.target.value);
        }, CONSTANTS.SEARCH_DEBOUNCE_TIME)
      );

      this.elements.searchInput.addEventListener("focus", () => {
        this.showSearchSuggestions();
      });

      this.elements.searchInput.addEventListener("blur", () => {
        setTimeout(() => this.hideSearchSuggestions(), 200);
      });
    }

    // Сортировка
    if (this.elements.sortSelect) {
      this.elements.sortSelect.addEventListener("change", (e) => {
        this.handleSortChange(e.target.value);
      });
    }

    // Вид отображения
    this.elements.viewButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.handleViewChange(btn.dataset.view);
      });
    });

    // Фильтры
    const filterElements = [
      this.elements.categoryFilter,
      this.elements.languageFilter,
    ];

    filterElements.forEach((element) => {
      if (element) {
        element.addEventListener("change", () => {
          this.handleFiltersChange();
        });
      }
    });

    // Цена с дебаунсом
    [this.elements.minPrice, this.elements.maxPrice].forEach((element) => {
      if (element) {
        element.addEventListener(
          "input",
          Utils.debounce(() => {
            this.handleFiltersChange();
          }, 500)
        );
      }
    });

    // Кнопки фильтров
    const applyFiltersBtn = document.getElementById("applyFilters");
    const clearFiltersBtn = document.getElementById("clearFilters");
    const filterToggleBtn = document.getElementById("filterToggle");

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        this.handleFiltersChange();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        this.clearFilters();
      });
    }

    if (filterToggleBtn) {
      filterToggleBtn.addEventListener("click", () => {
        this.toggleFilterPanel();
      });
    }

    // Сброс фильтров из empty state
    const resetSearchBtn = document.getElementById("resetSearch");
    if (resetSearchBtn) {
      resetSearchBtn.addEventListener("click", () => {
        this.clearFilters();
      });
    }

    // Обработка кликов по карточкам книг
    if (this.elements.booksGrid) {
      this.elements.booksGrid.addEventListener("click", (e) => {
        this.handleBookGridClick(e);
      });
    }
  }

  // Загрузка категорий для фильтра
  async loadCategories() {
    try {
      const response = await api.getCategories({ withBooks: true });
      const categories = response.data.categories;

      if (this.elements.categoryFilter) {
        this.elements.categoryFilter.innerHTML =
          '<option value="">Все категории</option>';
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.slug || category.id;
          option.textContent = `${category.name} (${category.bookCount || 0})`;
          this.elements.categoryFilter.appendChild(option);
        });
      }

      // Обновление dropdown в навигации
      this.updateCategoriesDropdown(categories);
    } catch (error) {
      console.error("Ошибка загрузки категорий:", error);
    }
  }

  // Обновление dropdown категорий в навигации
  updateCategoriesDropdown(categories) {
    const dropdown = document.getElementById("categoriesDropdown");
    if (!dropdown) return;

    dropdown.innerHTML = categories
      .map(
        (category) => `
      <a href="/books?category=${
        category.slug || category.id
      }" class="dropdown-item">
        ${category.name}
        ${
          category.bookCount
            ? `<span class="count">(${category.bookCount})</span>`
            : ""
        }
      </a>
    `
      )
      .join("");
  }

  // Загрузка книг
  async loadBooks() {
    if (this.loading) return;

    this.loading = true;
    this.showLoading();

    try {
      const params = {
        page: this.currentPage,
        limit: CONSTANTS.ITEMS_PER_PAGE,
        ...this.currentFilters,
      };

      // Парсинг сортировки
      const [sortBy, sortOrder] = this.currentSort.split("-");
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const response = await api.getBooks(params);
      const { books, pagination } = response.data;

      this.renderBooks(books);
      this.renderPagination(pagination);

      // Обновление URL
      this.updateUrl();

      // Скрытие состояния загрузки
      this.hideLoading();

      // Показ empty state если нет результатов
      if (books.length === 0) {
        this.showEmptyState();
      } else {
        this.hideEmptyState();
      }
    } catch (error) {
      console.error("Ошибка загрузки книг:", error);
      notifications.error("Ошибка загрузки книг", {
        title: "Ошибка сети",
        actions: [
          {
            text: "Повторить",
            handler: () => this.loadBooks(),
          },
        ],
      });
      this.hideLoading();
      this.showEmptyState();
    } finally {
      this.loading = false;
    }
  }

  // Отображение книг
  renderBooks(books) {
    if (!this.elements.booksGrid) return;

    if (books.length === 0) {
      this.elements.booksGrid.innerHTML = "";
      return;
    }

    const template = this.currentView === "grid" ? "bookCard" : "bookListItem";

    this.elements.booksGrid.innerHTML = books
      .map((book) => Templates[template](book))
      .join("");

    // Добавление анимации появления
    const bookElements = this.elements.booksGrid.querySelectorAll(
      ".book-card, .book-list-item"
    );
    bookElements.forEach((element, index) => {
      element.style.animationDelay = `${index * 50}ms`;
      element.classList.add("animate-fade-in-up");
    });
  }

  // Отображение пагинации
  renderPagination(pagination) {
    if (!this.elements.pagination) return;

    if (pagination.pages <= 1) {
      this.elements.pagination.innerHTML = "";
      return;
    }

    this.elements.pagination.innerHTML = this.createPaginationHTML(pagination);

    // Обработчики для пагинации
    this.elements.pagination.addEventListener("click", (e) => {
      e.preventDefault();
      const pageLink = e.target.closest("[data-page]");
      if (pageLink) {
        const page = parseInt(pageLink.dataset.page);
        this.goToPage(page);
      }
    });
  }

  // Создание HTML пагинации
  createPaginationHTML(pagination) {
    const { page, pages, total } = pagination;
    let html = "";

    // Информация о результатах
    html += `
      <div class="pagination-info">
        Страница ${page} из ${pages} (всего ${total} книг)
      </div>
    `;

    html += '<div class="pagination-controls">';

    // Предыдущая страница
    if (page > 1) {
      html += `
        <a href="#" class="pagination-btn" data-page="${page - 1}">
          <i class="fas fa-chevron-left"></i>
          Предыдущая
        </a>
      `;
    }

    // Номера страниц
    html += '<div class="pagination-numbers">';

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
        const isActive = i === page ? "active" : "";
        html += `
          <a href="#" class="pagination-number ${isActive}" data-page="${i}">
            ${i}
          </a>
        `;
      } else if (
        (i === page - 3 && page > 4) ||
        (i === page + 3 && page < pages - 3)
      ) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
    }

    html += "</div>";

    // Следующая страница
    if (page < pages) {
      html += `
        <a href="#" class="pagination-btn" data-page="${page + 1}">
          Следующая
          <i class="fas fa-chevron-right"></i>
        </a>
      `;
    }

    html += "</div>";

    return html;
  }

  // Обработчики событий
  handleSearch(query) {
    this.currentFilters.search = query;
    this.currentPage = 1;
    this.loadBooks();

    if (query.length >= 2) {
      this.loadSearchSuggestions(query);
    } else {
      this.hideSearchSuggestions();
    }
  }

  handleSortChange(sort) {
    this.currentSort = sort;
    this.currentPage = 1;
    this.loadBooks();
  }

  handleViewChange(view) {
    this.currentView = view;

    this.elements.viewButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    this.applyViewMode();
    this.updateUrl();
  }

  handleFiltersChange() {
    this.currentFilters = {
      ...this.currentFilters,
      category: this.elements.categoryFilter?.value || "",
      minPrice: this.elements.minPrice?.value || "",
      maxPrice: this.elements.maxPrice?.value || "",
      language: this.elements.languageFilter?.value || "",
    };

    this.currentPage = 1;
    this.loadBooks();
  }

  handleBookGridClick(e) {
    const addToCartBtn = e.target.closest(".add-to-cart-btn");
    const wishlistBtn = e.target.closest(".wishlist-btn");
    const quickViewBtn = e.target.closest(".quick-view-btn");

    if (addToCartBtn) {
      e.preventDefault();
      const bookId = addToCartBtn.dataset.bookId;
      this.addToCart(bookId);
    } else if (wishlistBtn) {
      e.preventDefault();
      const bookId = wishlistBtn.dataset.bookId;
      this.toggleWishlist(bookId);
    } else if (quickViewBtn) {
      e.preventDefault();
      const bookId = quickViewBtn.dataset.bookId;
      this.showQuickView(bookId);
    }
  }

  // Вспомогательные методы
  goToPage(page) {
    this.currentPage = page;
    this.loadBooks();
    this.scrollToTop();
  }

  scrollToTop() {
    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      Utils.scrollToElement(catalogSection, 100);
    }
  }

  applyViewMode() {
    if (this.elements.booksGrid) {
      this.elements.booksGrid.className = `books-${this.currentView}`;
    }
  }

  clearFilters() {
    this.currentFilters = {
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      language: "",
      author: "",
      publisher: "",
    };
    this.currentPage = 1;

    // Очистка формы
    if (this.elements.searchInput) this.elements.searchInput.value = "";
    if (this.elements.categoryFilter) this.elements.categoryFilter.value = "";
    if (this.elements.minPrice) this.elements.minPrice.value = "";
    if (this.elements.maxPrice) this.elements.maxPrice.value = "";
    if (this.elements.languageFilter) this.elements.languageFilter.value = "";

    this.hideSearchSuggestions();
    this.loadBooks();
  }

  toggleFilterPanel() {
    if (this.elements.filterPanel) {
      this.elements.filterPanel.classList.toggle("show");
    }
  }

  // Состояния интерфейса
  showLoading() {
    if (this.elements.loadingState) {
      this.elements.loadingState.style.display = "block";
    }
    if (this.elements.booksGrid) {
      this.elements.booksGrid.style.display = "none";
    }
  }

  hideLoading() {
    if (this.elements.loadingState) {
      this.elements.loadingState.style.display = "none";
    }
    if (this.elements.booksGrid) {
      this.elements.booksGrid.style.display = "grid";
    }
  }

  showEmptyState() {
    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = "block";
    }
  }

  hideEmptyState() {
    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = "none";
    }
  }

  // Автодополнение поиска
  async loadSearchSuggestions(query) {
    try {
      const response = await api.autocompleteBooks(query);
      const suggestions = response.data.suggestions;
      this.renderSearchSuggestions(suggestions);
    } catch (error) {
      console.error("Ошибка загрузки подсказок:", error);
    }
  }

  renderSearchSuggestions(suggestions) {
    if (!this.elements.searchSuggestions || suggestions.length === 0) {
      this.hideSearchSuggestions();
      return;
    }

    this.elements.searchSuggestions.innerHTML = suggestions
      .map(
        (suggestion) => `
      <div class="search-suggestion" data-book-id="${suggestion.id}">
        <i class="fas fa-book"></i>
        <span>${suggestion.title}</span>
      </div>
    `
      )
      .join("");

    this.elements.searchSuggestions.style.display = "block";

    // Обработчики для подсказок
    this.elements.searchSuggestions.addEventListener("click", (e) => {
      const suggestion = e.target.closest(".search-suggestion");
      if (suggestion) {
        const bookId = suggestion.dataset.bookId;
        window.location.href = `/book/${bookId}`;
      }
    });
  }

  showSearchSuggestions() {
    if (
      this.elements.searchSuggestions &&
      this.elements.searchInput.value.length >= 2
    ) {
      this.elements.searchSuggestions.style.display = "block";
    }
  }

  hideSearchSuggestions() {
    if (this.elements.searchSuggestions) {
      this.elements.searchSuggestions.style.display = "none";
    }
  }

  // Корзина и избранное
  async addToCart(bookId) {
    try {
      const response = await api.addToCart(bookId, 1);
      notifications.success("Книга добавлена в корзину");

      // Обновление счетчика корзины
      window.cartManager?.updateCartCount();
    } catch (error) {
      if (error.status === 401) {
        notifications.warning("Войдите в аккаунт для добавления в корзину", {
          actions: [
            {
              text: "Войти",
              handler: () => (window.location.href = "/login"),
            },
          ],
        });
      } else {
        notifications.error(error.message || "Ошибка добавления в корзину");
      }
    }
  }

  async toggleWishlist(bookId) {
    // Заглушка для функции избранного
    notifications.info("Функция избранного будет доступна в следующих версиях");
  }

  async showQuickView(bookId) {
    // Заглушка для быстрого просмотра
    window.location.href = `/book/${bookId}`;
  }

  // Обновление URL
  updateUrl() {
    const params = {
      page: this.currentPage > 1 ? this.currentPage : null,
      sort: this.currentSort !== "createdAt-DESC" ? this.currentSort : null,
      view: this.currentView !== "grid" ? this.currentView : null,
      ...Object.fromEntries(
        Object.entries(this.currentFilters).filter(([key, value]) => value)
      ),
    };

    Utils.updateUrl(params);
  }

  // Публичные методы
  refresh() {
    this.loadBooks();
  }

  setFilter(key, value) {
    this.currentFilters[key] = value;
    this.currentPage = 1;
    this.updateUIFromState();
    this.loadBooks();
  }

  getState() {
    return {
      page: this.currentPage,
      filters: { ...this.currentFilters },
      sort: this.currentSort,
      view: this.currentView,
    };
  }
}

// Инициализация каталога при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("booksGrid")) {
    window.bookCatalog = new BookCatalog();
  }
});
```

### 2. Компонент корзины

Создайте файл `public/scripts/cart-manager.js`:

```javascript
/* ===================================
   МЕНЕДЖЕР КОРЗИНЫ
   =================================== */

class CartManager {
  constructor() {
    this.cartItems = [];
    this.cartCount = 0;
    this.cartTotal = 0;
    this.isOpen = false;

    this.elements = {
      cartBtn: document.getElementById("cartBtn"),
      cartBadge: document.getElementById("cartBadge"),
      miniCart: document.getElementById("miniCart"),
      miniCartBody: document.getElementById("miniCartBody"),
    };

    this.init();
  }

  async init() {
    this.attachEventListeners();
    await this.loadCart();
    this.updateCartDisplay();
  }

  attachEventListeners() {
    // Открытие/закрытие мини-корзины
    if (this.elements.cartBtn) {
      this.elements.cartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleMiniCart();
      });
    }

    // Закрытие при клике вне корзины
    document.addEventListener("click", (e) => {
      if (this.isOpen && !e.target.closest(".cart-container")) {
        this.closeMiniCart();
      }
    });

    // Обработка событий корзины
    if (this.elements.miniCart) {
      this.elements.miniCart.addEventListener("click", (e) => {
        this.handleMiniCartClick(e);
      });
    }

    // Слушатель обновлений корзины
    window.addEventListener("cartUpdated", () => {
      this.loadCart();
    });
  }

  // Загрузка корзины с сервера
  async loadCart() {
    try {
      const response = await api.getCart();
      const { cartItems, summary } = response.data;

      this.cartItems = cartItems;
      this.cartCount = summary.totalItems;
      this.cartTotal = summary.totalAmount;

      this.updateCartDisplay();
    } catch (error) {
      if (error.status !== 401) {
        console.error("Ошибка загрузки корзины:", error);
      }
      this.resetCart();
    }
  }

  // Обновление отображения корзины
  updateCartDisplay() {
    this.updateCartBadge();
    this.updateMiniCartContent();
  }

  // Обновление счетчика
  updateCartBadge() {
    if (this.elements.cartBadge) {
      this.elements.cartBadge.textContent = this.cartCount;
      this.elements.cartBadge.style.display =
        this.cartCount > 0 ? "inline" : "none";
    }
  }

  // Обновление содержимого мини-корзины
  updateMiniCartContent() {
    if (!this.elements.miniCartBody) return;

    if (this.cartItems.length === 0) {
      this.elements.miniCartBody.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Корзина пуста</p>
        </div>
      `;
      return;
    }

    const itemsHTML = this.cartItems
      .slice(0, 3)
      .map(
        (item) => `
      <div class="mini-cart-item" data-item-id="${item.id}">
        <div class="mini-cart-item-image">
          <img src="${
            item.book.imageUrl || "/img/book-placeholder.jpg"
          }" alt="${item.book.title}">
        </div>
        <div class="mini-cart-item-info">
          <h4 class="mini-cart-item-title">${item.book.title}</h4>
          <div class="mini-cart-item-price">
            ${item.quantity} × ${Utils.formatPrice(item.priceAtTime)}
          </div>
        </div>
        <button class="mini-cart-item-remove" data-item-id="${item.id}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `
      )
      .join("");

    const totalHTML = `
      <div class="mini-cart-total">
        <span>Итого: ${Utils.formatPrice(this.cartTotal)}</span>
      </div>
    `;

    const moreItemsHTML =
      this.cartItems.length > 3
        ? `
      <div class="mini-cart-more">
        и еще ${this.cartItems.length - 3} товар(ов)
      </div>
    `
        : "";

    this.elements.miniCartBody.innerHTML =
      itemsHTML + moreItemsHTML + totalHTML;
  }

  // Управление видимостью мини-корзины
  toggleMiniCart() {
    if (this.isOpen) {
      this.closeMiniCart();
    } else {
      this.openMiniCart();
    }
  }

  openMiniCart() {
    if (this.elements.miniCart) {
      this.elements.miniCart.classList.add("show");
      this.isOpen = true;
    }
  }

  closeMiniCart() {
    if (this.elements.miniCart) {
      this.elements.miniCart.classList.remove("show");
      this.isOpen = false;
    }
  }

  // Обработка кликов в мини-корзине
  handleMiniCartClick(e) {
    const removeBtn = e.target.closest(".mini-cart-item-remove");

    if (removeBtn) {
      e.preventDefault();
      const itemId = removeBtn.dataset.itemId;
      this.removeFromCart(itemId);
    }
  }

  // Добавление в корзину
  async addToCart(bookId, quantity = 1) {
    try {
      const response = await api.addToCart(bookId, quantity);
      await this.loadCart();
      notifications.success("Товар добавлен в корзину");

      // Кратковременное открытие мини-корзины
      this.openMiniCart();
      setTimeout(() => this.closeMiniCart(), 3000);

      return response;
    } catch (error) {
      throw error;
    }
  }

  // Удаление из корзины
  async removeFromCart(itemId) {
    try {
      await api.removeFromCart(itemId);
      await this.loadCart();
      notifications.success("Товар удален из корзины");
    } catch (error) {
      notifications.error("Ошибка удаления товара");
      console.error("Ошибка удаления из корзины:", error);
    }
  }

  // Очистка корзины
  async clearCart() {
    try {
      await api.clearCart();
      await this.loadCart();
      notifications.success("Корзина очищена");
    } catch (error) {
      notifications.error("Ошибка очистки корзины");
      console.error("Ошибка очистки корзины:", error);
    }
  }

  // Сброс корзины (локально)
  resetCart() {
    this.cartItems = [];
    this.cartCount = 0;
    this.cartTotal = 0;
    this.updateCartDisplay();
  }

  // Публичные методы
  getCartCount() {
    return this.cartCount;
  }

  getCartTotal() {
    return this.cartTotal;
  }

  getCartItems() {
    return [...this.cartItems];
  }

  async updateCartCount() {
    await this.loadCart();
  }
}

// CSS стили для мини-корзины
const miniCartStyles = `
.cart-container {
  position: relative;
}

.cart-btn {
  position: relative;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
}

.cart-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color-hover);
  color: var(--text-primary);
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.mini-cart {
  position: absolute;
  top: 100%;
  right: 0;
  width: 350px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  visibility: hidden;
  z-index: var(--z-dropdown);
  margin-top: 8px;
}

.mini-cart.show {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}

.mini-cart-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.mini-cart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.mini-cart-body {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
}

.mini-cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.mini-cart-item:last-child {
  border-bottom: none;
}

.mini-cart-item-image {
  width: 50px;
  height: 60px;
  flex-shrink: 0;
}

.mini-cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.mini-cart-item-info {
  flex: 1;
  min-width: 0;
}

.mini-cart-item-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-cart-item-price {
  font-size: 12px;
  color: var(--text-secondary);
}

.mini-cart-item-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.mini-cart-item-remove:hover {
  color: var(--danger-color);
}

.mini-cart-total {
  padding: 12px 0;
  border-top: 1px solid var(--border-color);
  font-weight: 600;
  text-align: center;
}

.mini-cart-more {
  padding: 8px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
}

.mini-cart-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.empty-cart {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
}

.empty-cart i {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .mini-cart {
    width: 300px;
    right: -50px;
  }
}
`;

// Инициализация менеджера корзины
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("cartBtn")) {
    window.cartManager = new CartManager();
  }
});
```

---

## 📱 Мобильное меню

### 1. Адаптивная навигация

Создайте файл `public/scripts/mobile-menu.js`:

```javascript
/* ===================================
   МОБИЛЬНОЕ МЕНЮ
   =================================== */

class MobileMenu {
  constructor() {
    this.isOpen = false;
    this.elements = {
      toggle: document.getElementById("mobileMenuToggle"),
      menu: document.querySelector(".nav-menu"),
      overlay: null,
    };

    this.init();
  }

  init() {
    this.createOverlay();
    this.attachEventListeners();
    this.checkScreenSize();
  }

  createOverlay() {
    this.elements.overlay = document.createElement("div");
    this.elements.overlay.className = "mobile-menu-overlay";
    document.body.appendChild(this.elements.overlay);
  }

  attachEventListeners() {
    // Переключатель меню
    if (this.elements.toggle) {
      this.elements.toggle.addEventListener("click", () => {
        this.toggle();
      });
    }

    // Закрытие при клике на overlay
    this.elements.overlay.addEventListener("click", () => {
      this.close();
    });

    // Закрытие при изменении размера экрана
    window.addEventListener(
      "resize",
      Utils.throttle(() => {
        this.checkScreenSize();
      }, 250)
    );

    // Закрытие при нажатии Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    // Обработка кликов по ссылкам меню
    if (this.elements.menu) {
      this.elements.menu.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (link && !link.classList.contains("dropdown-toggle")) {
          this.close();
        }
      });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    document.body.classList.add("mobile-menu-open");

    if (this.elements.menu) {
      this.elements.menu.classList.add("mobile-menu-active");
    }

    this.elements.overlay.classList.add("active");

    // Анимация кнопки
    if (this.elements.toggle) {
      this.elements.toggle.classList.add("active");
    }

    // Предотвращение прокрутки
    document.body.style.overflow = "hidden";
  }

  close() {
    this.isOpen = false;
    document.body.classList.remove("mobile-menu-open");

    if (this.elements.menu) {
      this.elements.menu.classList.remove("mobile-menu-active");
    }

    this.elements.overlay.classList.remove("active");

    // Анимация кнопки
    if (this.elements.toggle) {
      this.elements.toggle.classList.remove("active");
    }

    // Восстановление прокрутки
    document.body.style.overflow = "";
  }

  checkScreenSize() {
    if (window.innerWidth >= CONSTANTS.BREAKPOINTS.md && this.isOpen) {
      this.close();
    }
  }
}

// CSS стили для мобильного меню
const mobileMenuStyles = `
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-menu-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-toggle span:not(:last-child) {
  margin-bottom: 4px;
}

.mobile-menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(3px, 3px);
}

.mobile-menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(3px, -3px);
}

.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-menu-overlay.active {
  opacity: 1;
  visibility: visible;
}

@media (max-width: 767px) {
  .mobile-menu-toggle {
    display: flex;
  }

  .nav-menu {
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    background: var(--bg-primary);
    border-left: 1px solid var(--border-color);
    transition: right 0.3s ease;
    z-index: var(--z-modal);
    overflow-y: auto;
    padding-top: 80px;
  }

  .nav-menu.mobile-menu-active {
    right: 0;
  }

  .nav-list {
    flex-direction: column;
    padding: 20px;
  }

  .nav-item {
    width: 100%;
    border-bottom: 1px solid var(--border-color);
  }

  .nav-link {
    display: block;
    padding: 15px 0;
    font-size: 16px;
  }

  .dropdown-menu {
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    box-shadow: none;
    border: none;
    padding-left: 20px;
    background: var(--bg-secondary);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .dropdown.active .dropdown-menu {
    max-height: 300px;
  }

  .search-container {
    order: -1;
    width: 100%;
    margin-bottom: 20px;
  }

  .user-actions {
    order: 1;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
  }
}

body.mobile-menu-open {
  overflow: hidden;
}
`;

// Инициализация мобильного меню
document.addEventListener("DOMContentLoaded", () => {
  window.mobileMenu = new MobileMenu();
});
```

---

## 📋 Задания для самопроверки

1. **Добавьте систему избранного** с локальным хранением
2. **Реализуйте сравнение товаров** между собой
3. **Создайте продвинутые фильтры** с диапазонами и чекбоксами
4. **Добавьте бесконечную прокрутку** вместо пагинации

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Интерактивный каталог книг  
✅ Система корзины покупок  
✅ Адаптивное мобильное меню  
✅ Поиск с автодополнением

**Следующий шаг:** [14_SECURITY_BEST_PRACTICES.md](14_SECURITY_BEST_PRACTICES.md) - реализация мер безопасности.

---

_Время выполнения: ~4-5 часов_  
_Сложность: 🟡 Средняя_
