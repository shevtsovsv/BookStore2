/**
 * Catalog page with filtering and pagination
 * Connects to the backend API for books, categories, and authors
 */
(function () {
  "use strict";

  // State management
  const state = {
    books: [],
    categories: [],
    currentPage: 1,
    itemsPerPage: 16,
    totalPages: 1,
    totalItems: 0,
    showAllItems: false,
    infiniteScrollMode: false,
    isLoadingMore: false,
    hasMoreBooks: true,
    scrollObserver: null,
    filters: {
      category: null,
      minPrice: null,
      maxPrice: null,
      authorType: null,
    },
  };

  // DOM elements
  const elements = {
    booksContainer: null,
    paginationContainer: null,
    itemsPerPageSelect: null,
    customItemsInput: null,
    applyCustomButton: null,
    infiniteScrollInfo: null,
    loadingMore: null,
    endOfCatalog: null,
    scrollSentinel: null,
    switchBackBtn: null,
    categoryFilter: null,
    priceFilter: null,
    authorTypeFilter: null,
    pageInfo: null,
    loading: null,
  };

  /**
   * Initialize the catalog page
   */
  async function init() {
    console.log("Initializing book catalog...");

    // Get DOM elements
    elements.booksContainer = document.getElementById("books-container");
    elements.paginationContainer = document.getElementById(
      "pagination-controls"
    );
    elements.itemsPerPageSelect = document.getElementById("items-per-page");
    elements.customItemsInput = document.getElementById("custom-items");
    elements.applyCustomButton = document.getElementById("apply-custom");
    elements.infiniteScrollInfo = document.getElementById(
      "infinite-scroll-info"
    );
    elements.loadingMore = document.getElementById("loading-more");
    elements.endOfCatalog = document.getElementById("end-of-catalog");
    elements.scrollSentinel = document.getElementById("scroll-sentinel");
    elements.switchBackBtn = document.getElementById("switch-back-btn");
    elements.pageInfo = document.getElementById("page-info");
    elements.loading = document.getElementById("loading");

    // Load initial data
    await loadCategories();
    setupEventListeners();
    await loadBooks();
  }

  /**
   * Load categories from API
   */
  async function loadCategories() {
    try {
      const response = await fetch("/api/categories?limit=100");
      const data = await response.json();

      if (data.success && data.data.categories) {
        state.categories = data.data.categories;
        renderCategoryFilters();
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  /**
   * Render category filter options
   */
  function renderCategoryFilters() {
    const select = document.getElementById("category-select");
    if (!select) return;

    // Keep the default "Все жанры" option and add categories
    const categoryOptions = state.categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");

    select.innerHTML = `
      <option value="">Все жанры</option>
      ${categoryOptions}
    `;

    // Add event listener
    select.addEventListener("change", handleCategoryChange);
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Items per page selector
    if (elements.itemsPerPageSelect) {
      elements.itemsPerPageSelect.addEventListener(
        "change",
        handleItemsPerPageChange
      );
    }

    // Custom items input
    if (elements.customItemsInput) {
      elements.customItemsInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyCustomItemsCount();
        }
      });
    }

    // Apply custom button
    if (elements.applyCustomButton) {
      elements.applyCustomButton.addEventListener(
        "click",
        applyCustomItemsCount
      );
    }

    // Switch back to pagination button
    if (elements.switchBackBtn) {
      elements.switchBackBtn.addEventListener("click", switchBackToPagination);
    }

    // Price filter
    const priceSelect = document.getElementById("price-select");
    if (priceSelect) {
      priceSelect.addEventListener("change", handlePriceChange);
    }

    // Author type filter
    const authorTypeSelect = document.getElementById("author-type-select");
    if (authorTypeSelect) {
      authorTypeSelect.addEventListener("change", handleAuthorTypeChange);
    }
  }

  /**
   * Handle items per page change
   */
  function handleItemsPerPageChange(e) {
    const value = e.target.value;

    // Hide/show custom input based on selection
    toggleCustomInput(value === "custom");

    if (value === "all") {
      // Switch to infinite scroll mode
      enableInfiniteScrollMode();
    } else if (value === "custom") {
      // Don't change anything yet, wait for user input
      return;
    } else {
      // Switch to regular pagination mode
      disableInfiniteScrollMode();
      state.itemsPerPage = parseInt(value);
      state.currentPage = 1;
      loadBooks();
    }
  }

  /**
   * Toggle custom input visibility
   */
  function toggleCustomInput(show) {
    if (elements.customItemsInput && elements.applyCustomButton) {
      elements.customItemsInput.style.display = show ? "block" : "none";
      elements.applyCustomButton.style.display = show ? "block" : "none";

      if (show) {
        elements.customItemsInput.focus();
      } else {
        elements.customItemsInput.value = "";
      }
    }
  }

  /**
   * Apply custom items count
   */
  function applyCustomItemsCount() {
    const customValue = parseInt(elements.customItemsInput.value);

    if (customValue && customValue > 0 && customValue <= 1000) {
      disableInfiniteScrollMode();
      state.itemsPerPage = customValue;
      state.currentPage = 1;
      toggleCustomInput(false);

      // Update select to show the applied custom value
      const option = document.createElement("option");
      option.value = customValue;
      option.textContent = customValue;
      option.selected = true;

      // Remove old custom option if exists
      const oldCustom = elements.itemsPerPageSelect.querySelector(
        'option[data-custom="true"]'
      );
      if (oldCustom) {
        oldCustom.remove();
      }

      option.setAttribute("data-custom", "true");
      elements.itemsPerPageSelect.insertBefore(
        option,
        elements.itemsPerPageSelect.children[
          elements.itemsPerPageSelect.children.length - 1
        ]
      );

      loadBooks();
    } else {
      alert("Пожалуйста, введите число от 1 до 1000");
      elements.customItemsInput.focus();
    }
  }

  /**
   * Enable infinite scroll mode
   */
  function enableInfiniteScrollMode() {
    console.log("Enabling infinite scroll mode");

    // Update state
    state.infiniteScrollMode = true;
    state.showAllItems = false; // We'll load in chunks
    state.currentPage = 1;
    state.itemsPerPage = 16; // Load 16 books at a time
    state.books = []; // Clear existing books
    state.hasMoreBooks = true;
    state.isLoadingMore = false;

    // Hide pagination and show infinite scroll UI
    hideElement(elements.paginationContainer);
    showElement(elements.infiniteScrollInfo);
    showElement(elements.scrollSentinel);

    // Clear container and load first batch
    elements.booksContainer.innerHTML = "";

    // Initialize scroll observer
    initScrollObserver();

    // Load first batch of books
    loadBooksInfiniteScroll();
  }

  /**
   * Disable infinite scroll mode
   */
  function disableInfiniteScrollMode() {
    console.log("Disabling infinite scroll mode");

    // Update state
    state.infiniteScrollMode = false;
    state.showAllItems = false;
    state.books = []; // Clear books array
    state.hasMoreBooks = true;
    state.isLoadingMore = false;

    // Destroy scroll observer
    if (state.scrollObserver) {
      state.scrollObserver.disconnect();
      state.scrollObserver = null;
    }

    // Hide infinite scroll UI and show pagination
    hideElement(elements.infiniteScrollInfo);
    hideElement(elements.loadingMore);
    hideElement(elements.endOfCatalog);
    hideElement(elements.scrollSentinel);
    showElement(elements.paginationContainer);
  }

  /**
   * Initialize scroll observer for infinite scroll
   */
  function initScrollObserver() {
    if (!elements.scrollSentinel) return;

    // Disconnect existing observer
    if (state.scrollObserver) {
      state.scrollObserver.disconnect();
    }

    // Create new observer
    state.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !state.isLoadingMore &&
            state.hasMoreBooks &&
            state.infiniteScrollMode
          ) {
            console.log("Scroll sentinel intersected, loading more books...");
            loadMoreBooks();
          }
        });
      },
      {
        root: null,
        rootMargin: "200px", // Start loading 200px before reaching the bottom
        threshold: 0.1,
      }
    );

    state.scrollObserver.observe(elements.scrollSentinel);
  }

  /**
   * Load books for infinite scroll (first batch)
   */
  async function loadBooksInfiniteScroll() {
    try {
      showLoading();
      await loadMoreBooks();
    } catch (error) {
      console.error("Error loading books for infinite scroll:", error);
      showError("Ошибка при загрузке книг");
    } finally {
      hideLoading();
    }
  }

  /**
   * Load more books for infinite scroll
   */
  async function loadMoreBooks() {
    if (
      state.isLoadingMore ||
      !state.hasMoreBooks ||
      !state.infiniteScrollMode
    ) {
      return;
    }

    state.isLoadingMore = true;
    showElement(elements.loadingMore);

    try {
      // Build query string
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.itemsPerPage,
        sortBy: "popularity",
        sortOrder: "DESC",
      });

      if (state.filters.category) {
        params.append("category", state.filters.category);
      }
      if (state.filters.minPrice !== null) {
        params.append("minPrice", state.filters.minPrice);
      }
      if (state.filters.maxPrice !== null) {
        params.append("maxPrice", state.filters.maxPrice);
      }
      if (state.filters.authorType) {
        params.append("authorType", state.filters.authorType);
      }

      const response = await fetch(`/api/books?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        const newBooks = data.data.books;

        if (newBooks.length > 0) {
          // Add new books to existing array
          state.books.push(...newBooks);
          state.totalItems = data.data.pagination.totalItems;

          // Render new books
          appendBooksToGrid(newBooks);

          // Update progress
          updateInfiniteScrollProgress();

          // Check if there are more books
          if (newBooks.length < state.itemsPerPage) {
            state.hasMoreBooks = false;
            showEndOfCatalog();
          } else {
            state.currentPage++;
          }
        } else {
          state.hasMoreBooks = false;
          showEndOfCatalog();
        }
      } else {
        showError("Не удалось загрузить книги");
      }
    } catch (error) {
      console.error("Error loading more books:", error);
      showError("Ошибка при загрузке книг");
    } finally {
      state.isLoadingMore = false;
      hideElement(elements.loadingMore);
    }
  }

  /**
   * Append new books to the grid
   */
  function appendBooksToGrid(newBooks) {
    if (!elements.booksContainer) return;

    newBooks.forEach((book, index) => {
      const bookHTML = createBookCardHTML(book);
      const bookElement = document.createElement("div");
      bookElement.innerHTML = bookHTML;
      const bookCard = bookElement.firstElementChild;

      // Add fade-in animation
      bookCard.classList.add("fade-in");
      bookCard.style.animationDelay = `${index * 0.1}s`;

      elements.booksContainer.appendChild(bookCard);
    });
  }

  /**
   * Create HTML for a single book card
   */
  function createBookCardHTML(book) {
    return `
      <div class="book-card" onclick="window.location.href='book-detail.html?id=${
        book.id
      }'" style="cursor: pointer;">
        <img
          src="../img/${book.image || "placeholder.jpg"}"
          alt="${book.title}"
          class="book-cover"
          loading="lazy"
          onerror="this.src='../img/placeholder.jpg'"
        />
        <div class="book-info">
          <h3>${book.title}</h3>
          <p><strong>Жанр:</strong> ${book.category?.name || "Не указан"}</p>
          ${
            book.authors && book.authors.length > 0
              ? `<p><strong>Автор:</strong> ${book.authors
                  .map((a) => a.name)
                  .join(", ")}</p>`
              : ""
          }
          <p><strong>Цена:</strong> ${book.price} руб.</p>
          <p class="book-description">${book.shortDescription || ""}</p>
          <div class="book-actions">
            <a href="book-detail.html?id=${
              book.id
            }" class="btn btn-details" onclick="event.stopPropagation();">
              Подробнее
            </a>
            <button class="btn btn-order" onclick="event.stopPropagation(); orderBook(${
              book.id
            }, '${book.title}')">
              Заказать
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update infinite scroll progress
   */
  function updateInfiniteScrollProgress() {
    if (!state.infiniteScrollMode || !elements.infiniteScrollInfo) return;

    const loaded = state.books.length;
    const total = state.totalItems;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;

    // Update progress text
    const loadedCountSpan = document.getElementById("loaded-count");
    const totalCountSpan = document.getElementById("total-count");
    const progressFill = document.getElementById("progress-fill");

    if (loadedCountSpan) loadedCountSpan.textContent = loaded;
    if (totalCountSpan) totalCountSpan.textContent = total;
    if (progressFill) progressFill.style.width = `${percentage}%`;
  }

  /**
   * Show end of catalog message
   */
  function showEndOfCatalog() {
    if (elements.endOfCatalog) {
      const finalCountSpan = document.getElementById("final-count");
      if (finalCountSpan) finalCountSpan.textContent = state.books.length;

      showElement(elements.endOfCatalog);
      hideElement(elements.scrollSentinel);
    }
  }

  /**
   * Switch back to pagination mode
   */
  function switchBackToPagination() {
    console.log("Switching back to pagination mode");

    // Update select value
    if (elements.itemsPerPageSelect) {
      elements.itemsPerPageSelect.value = "16";
    }

    // Disable infinite scroll
    disableInfiniteScrollMode();

    // Reset state
    state.itemsPerPage = 16;
    state.currentPage = 1;

    // Load books with pagination
    loadBooks();
  }

  /**
   * Helper functions for showing/hiding elements
   */
  function showElement(element) {
    if (element) element.style.display = "";
  }

  function hideElement(element) {
    if (element) element.style.display = "none";
  }

  /**
   * Handle category filter change
   */
  function handleCategoryChange(e) {
    state.filters.category = e.target.value || null;

    if (state.infiniteScrollMode) {
      // Reset infinite scroll state
      state.currentPage = 1;
      state.books = [];
      state.hasMoreBooks = true;
      elements.booksContainer.innerHTML = "";
      hideElement(elements.endOfCatalog);
      showElement(elements.scrollSentinel);
      loadBooksInfiniteScroll();
    } else {
      state.currentPage = 1;
      loadBooks();
    }
  }

  /**
   * Handle price filter change
   */
  function handlePriceChange(e) {
    const value = e.target.value;

    if (value === "all") {
      state.filters.minPrice = null;
      state.filters.maxPrice = null;
    } else if (value === "low") {
      state.filters.minPrice = 0;
      state.filters.maxPrice = 1000;
    } else if (value === "medium") {
      state.filters.minPrice = 1000;
      state.filters.maxPrice = 2000;
    } else if (value === "high") {
      state.filters.minPrice = 2000;
      state.filters.maxPrice = null;
    }

    if (state.infiniteScrollMode) {
      // Reset infinite scroll state
      state.currentPage = 1;
      state.books = [];
      state.hasMoreBooks = true;
      elements.booksContainer.innerHTML = "";
      hideElement(elements.endOfCatalog);
      showElement(elements.scrollSentinel);
      loadBooksInfiniteScroll();
    } else {
      state.currentPage = 1;
      loadBooks();
    }
  }

  /**
   * Handle author type filter change
   */
  function handleAuthorTypeChange(e) {
    const value = e.target.value;
    state.filters.authorType = value === "all" ? null : value;

    if (state.infiniteScrollMode) {
      // Reset infinite scroll state
      state.currentPage = 1;
      state.books = [];
      state.hasMoreBooks = true;
      elements.booksContainer.innerHTML = "";
      hideElement(elements.endOfCatalog);
      showElement(elements.scrollSentinel);
      loadBooksInfiniteScroll();
    } else {
      state.currentPage = 1;
      loadBooks();
    }
  }

  /**
   * Load books from API
   */
  async function loadBooks() {
    // If in infinite scroll mode, don't use this function
    if (state.infiniteScrollMode) {
      return;
    }

    try {
      showLoading();

      // Build query string
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.itemsPerPage,
        sortBy: "popularity",
        sortOrder: "DESC",
      });

      if (state.filters.category) {
        params.append("category", state.filters.category);
      }
      if (state.filters.minPrice !== null) {
        params.append("minPrice", state.filters.minPrice);
      }
      if (state.filters.maxPrice !== null) {
        params.append("maxPrice", state.filters.maxPrice);
      }
      if (state.filters.authorType) {
        params.append("authorType", state.filters.authorType);
      }

      const response = await fetch(`/api/books?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        state.books = data.data.books;
        state.totalPages = data.data.pagination.totalPages;
        state.totalItems = data.data.pagination.totalItems;
        state.currentPage = data.data.pagination.currentPage;

        renderBooks();
        renderPagination();
        updatePageInfo();
      } else {
        showError("Не удалось загрузить книги");
      }
    } catch (error) {
      console.error("Error loading books:", error);
      showError("Ошибка при загрузке книг");
    } finally {
      hideLoading();
    }
  }

  /**
   * Render books in the catalog
   */
  function renderBooks() {
    if (!elements.booksContainer) return;

    if (state.books.length === 0) {
      elements.booksContainer.innerHTML = `
        <div class="no-results">
          <p>По заданным фильтрам книги не найдены</p>
        </div>
      `;
      return;
    }

    const html = state.books
      .map(
        (book) => `
      <div class="book-card" onclick="window.location.href='book-detail.html?id=${
        book.id
      }'" style="cursor: pointer;">
        <img
          src="../img/${book.image || "placeholder.jpg"}"
          alt="${book.title}"
          class="book-cover"
          loading="lazy"
          onerror="this.src='../img/placeholder.jpg'"
        />
        <div class="book-info">
          <h3>${book.title}</h3>
          <p><strong>Жанр:</strong> ${book.category?.name || "Не указан"}</p>
          ${
            book.authors && book.authors.length > 0
              ? `<p><strong>Автор:</strong> ${book.authors
                  .map((a) => a.name)
                  .join(", ")}</p>`
              : ""
          }
          <p><strong>Цена:</strong> ${book.price} руб.</p>
          <p class="book-description">${book.shortDescription || ""}</p>
          <div class="book-actions">
            <a href="book-detail.html?id=${
              book.id
            }" class="btn btn-details" onclick="event.stopPropagation();">
              Подробнее
            </a>
            <button class="btn btn-order" onclick="event.stopPropagation(); orderBook(${
              book.id
            }, '${book.title}')">
              Заказать
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    elements.booksContainer.innerHTML = html;
  }

  /**
   * Render pagination controls
   */
  function renderPagination() {
    if (!elements.paginationContainer) return;

    // Hide pagination when showing all items
    if (state.showAllItems || state.totalPages <= 1) {
      elements.paginationContainer.innerHTML = "";
      elements.paginationContainer.style.display = "none";
      return;
    } else {
      elements.paginationContainer.style.display = "flex";
    }

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      state.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(`
      <button 
        class="page-btn" 
        ${state.currentPage === 1 ? "disabled" : ""}
        onclick="goToPage(${state.currentPage - 1})"
      >
        ← Назад
      </button>
    `);

    // First page
    if (startPage > 1) {
      pages.push(`
        <button class="page-btn" onclick="goToPage(1)">1</button>
      `);
      if (startPage > 2) {
        pages.push('<span class="page-ellipsis">...</span>');
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
        <button 
          class="page-btn ${i === state.currentPage ? "active" : ""}" 
          onclick="goToPage(${i})"
        >
          ${i}
        </button>
      `);
    }

    // Last page
    if (endPage < state.totalPages) {
      if (endPage < state.totalPages - 1) {
        pages.push('<span class="page-ellipsis">...</span>');
      }
      pages.push(`
        <button class="page-btn" onclick="goToPage(${state.totalPages})">
          ${state.totalPages}
        </button>
      `);
    }

    // Next button
    pages.push(`
      <button 
        class="page-btn" 
        ${state.currentPage === state.totalPages ? "disabled" : ""}
        onclick="goToPage(${state.currentPage + 1})"
      >
        Вперёд →
      </button>
    `);

    elements.paginationContainer.innerHTML = pages.join("");
  }

  /**
   * Update page info text
   */
  function updatePageInfo() {
    if (!elements.pageInfo) return;

    if (state.infiniteScrollMode) {
      elements.pageInfo.textContent = `Режим ленты: загружено ${state.books.length} книг`;
    } else {
      const start = (state.currentPage - 1) * state.itemsPerPage + 1;
      const end = Math.min(
        state.currentPage * state.itemsPerPage,
        state.totalItems
      );
      elements.pageInfo.textContent = `Показаны ${start}-${end} из ${state.totalItems} книг`;
    }
  }

  /**
   * Go to specific page
   */
  window.goToPage = function (page) {
    if (page < 1 || page > state.totalPages || page === state.currentPage) {
      return;
    }
    state.currentPage = page;
    loadBooks();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Order book handler - добавление в корзину
   */
  window.orderBook = async function (id, title) {
    try {
      // Проверяем авторизацию
      if (!Auth.isAuthenticated()) {
        alert("Для добавления в корзину необходимо войти в систему");
        return;
      }

      const token = AuthToken.get();
      if (!token) {
        alert("Ошибка авторизации. Пожалуйста, войдите в систему снова");
        return;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: id,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Книга "${title}" добавлена в корзину!`);
        // Обновить счётчик корзины в меню
        if (typeof Auth !== "undefined" && Auth.updateCartCount) {
          Auth.updateCartCount();
        }
      } else {
        if (response.status === 401) {
          Auth.logout();
          alert("Сессия истекла. Пожалуйста, войдите в систему снова");
        } else {
          alert(`Ошибка: ${result.message || "Не удалось добавить в корзину"}`);
        }
      }
    } catch (error) {
      console.error("Ошибка добавления в корзину:", error);
      alert("Ошибка связи с сервером");
    }
  };

  /**
   * Show loading indicator
   */
  function showLoading() {
    if (elements.loading) {
      elements.loading.style.display = "block";
    }
    if (elements.booksContainer) {
      elements.booksContainer.style.opacity = "0.5";
    }
  }

  /**
   * Hide loading indicator
   */
  function hideLoading() {
    if (elements.loading) {
      elements.loading.style.display = "none";
    }
    if (elements.booksContainer) {
      elements.booksContainer.style.opacity = "1";
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    if (elements.booksContainer) {
      elements.booksContainer.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button class="btn" onclick="location.reload()">Попробовать снова</button>
        </div>
      `;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
