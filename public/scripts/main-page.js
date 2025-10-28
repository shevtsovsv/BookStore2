/**
 * Скрипт для главной страницы
 * Загружает и отображает 5 самых популярных книг
 */

// API endpoints
const API_BASE = "/api";
const POPULAR_BOOKS_ENDPOINT = `${API_BASE}/books/popular`;
const STATS_ENDPOINT = `${API_BASE}/books/stats`;

/**
 * Загружает популярные книги с сервера
 * @param {number} limit - количество книг для загрузки
 * @returns {Promise<Array>} массив популярных книг
 */
async function loadPopularBooks(limit = 5) {
  try {
    const response = await fetch(`${POPULAR_BOOKS_ENDPOINT}?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Ошибка при загрузке популярных книг");
    }

    return data.data.books;
  } catch (error) {
    console.error("Ошибка при загрузке популярных книг:", error);
    throw error;
  }
}

/**
 * Загружает статистику магазина с сервера
 * @returns {Promise<Object>} объект со статистикой магазина
 */
async function loadStoreStats() {
  try {
    const response = await fetch(STATS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Ошибка при загрузке статистики");
    }

    return data.data;
  } catch (error) {
    console.error("Ошибка при загрузке статистики:", error);
    throw error;
  }
}

/**
 * Создает HTML элемент для отображения книги
 * @param {Object} book - объект книги
 * @param {number} index - индекс книги (для класса позиционирования)
 * @returns {HTMLElement} HTML элемент с информацией о книге
 */

function createBookElement(book, index) {
  const bookElement = document.createElement("div");
  bookElement.className = `book-item abs-img img${index + 1}`;

  // Формируем ссылку на детальную страницу книги
  const bookLink = `/html/book-detail.html?id=${book.id}`;

  // Получаем имена авторов
  const authorsNames =
    book.authors?.map((author) => author.name).join(", ") || "Автор неизвестен";

  bookElement.innerHTML = `
        <a href="${bookLink}" class="book-link">
            <img src="img/${book.image || "book-placeholder.jpg"}" 
                 alt="${book.title}" 
                 class="book-image"
                 width="160" 
                 height="240"
                 loading="lazy">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${authorsNames}</p>
                <p class="book-price">${book.price} ₽</p>
                <p class="book-popularity">Популярность: ${book.popularity}</p>
                ${
                  book.stock <= 0
                    ? '<span class="out-of-stock">Нет в наличии</span>'
                    : ""
                }
                ${
                  book.stock > 0 && book.stock <= 5
                    ? '<span class="low-stock">Осталось мало</span>'
                    : ""
                }
            </div>
        </a>
    `;

  return bookElement;
}

/**
 * Отображает популярные книги в галерее
 * @param {Array} books - массив популярных книг
 */
function displayPopularBooks(books) {
  const gallery = document.getElementById("gallery");

  if (!gallery) {
    console.error("Элемент галереи не найден");
    return;
  }

  // Очищаем старое содержимое
  gallery.innerHTML = "";

  // Ограничиваем количество книг до 5 (или 6 если есть)
  const booksToShow = books.slice(0, 6);

  // Создаем и добавляем элементы книг
  booksToShow.forEach((book, index) => {
    const bookElement = createBookElement(book, index);
    gallery.appendChild(bookElement);
  });
}

/**
 * Отображает статистику магазина
 * @param {Object} stats - объект со статистикой
 */
function displayStoreStats(stats) {
  const container = document.getElementById("store-stats");

  if (!container) {
    console.error("Контейнер статистики не найден");
    return;
  }

  // Извлекаем данные из ответа
  const booksStats = stats.books || {};
  const genres = stats.genres || [];

  // Формируем HTML с данными статистики
  container.innerHTML = `
    <div class="stat-item">
      <div class="stat-number">${booksStats.totalBooks || 0}</div>
      <div class="stat-label">Всего книг</div>
    </div>
    
    <div class="stat-item">
      <div class="stat-number">${booksStats.totalGenres || 0}</div>
      <div class="stat-label">Жанров</div>
    </div>
    
    <div class="stat-item">
      <div class="stat-number">${booksStats.totalSold || 0}</div>
      <div class="stat-label">Продано</div>
    </div>
    
    <div class="stat-item genres">
      <div class="stat-label">Популярные жанры (продано)</div>
      <div class="genres-list">
        ${genres
          .slice(0, 3)
          .map(
            (genre) =>
              `<span class="genre-tag">${escapeHtml(genre.name)} (${
                genre.count
              })</span>`
          )
          .join("")}
      </div>
    </div>
  `;
}

/**
 * Экранирование HTML для безопасности
 * @param {string} text - текст для экранирования
 * @returns {string} экранированный текст
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Показывает сообщение об ошибке
 * @param {string} message - текст сообщения об ошибке
 */
function showErrorMessage(message) {
  const gallery = document.getElementById("gallery");

  if (gallery) {
    gallery.innerHTML = `
            <div class="error-message">
                <p>❌ ${message}</p>
                <p>Попробуйте обновить страницу или обратитесь к администратору.</p>
            </div>
        `;
  }
}

/**
 * Показывает индикатор загрузки
 */
function showLoadingIndicator() {
  const gallery = document.getElementById("gallery");

  if (gallery) {
    gallery.innerHTML = `
            <div class="loading-indicator">
                <p>⏳ Загружаем самые популярные книги...</p>
            </div>
        `;
  }
}

/**
 * Показывает ошибку статистики
 * @param {string} message - текст сообщения об ошибке
 */
function showStatsError(message) {
  const container = document.getElementById("store-stats");

  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
        <button onclick="loadAndDisplayStats()" class="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    `;
  }
}

/**
 * Загружает и отображает статистику магазина
 */
async function loadAndDisplayStats() {
  try {
    console.log("Загружаем статистику магазина...");
    const stats = await loadStoreStats();
    console.log("Загружена статистика:", stats);
    displayStoreStats(stats);
  } catch (error) {
    console.error("Ошибка при загрузке статистики:", error);
    showStatsError("Не удалось загрузить статистику магазина");
  }
}

/**
 * Инициализация главной страницы
 * Загружает и отображает популярные книги и статистику
 */
async function initMainPage() {
  console.log("Инициализация главной страницы...");

  try {
    // Показываем индикатор загрузки для популярных книг
    showLoadingIndicator();

    // Загружаем популярные книги (5 штук как требует преподаватель)
    const popularBooks = await loadPopularBooks(5);

    console.log("Загружены популярные книги:", popularBooks);

    if (popularBooks.length === 0) {
      showErrorMessage("Популярные книги не найдены");
      return;
    }

    // Отображаем книги
    displayPopularBooks(popularBooks);

    console.log("Главная страница успешно инициализирована");
  } catch (error) {
    console.error("Ошибка при инициализации главной страницы:", error);
    showErrorMessage("Не удалось загрузить популярные книги");
  }

  // Загружаем статистику параллельно (независимо от популярных книг)
  await loadAndDisplayStats();
}

/**
 * Обработчик события загрузки страницы
 */
document.addEventListener("DOMContentLoaded", initMainPage);

// Экспорт функций для возможного использования в других скриптах
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadPopularBooks,
    loadStoreStats,
    displayPopularBooks,
    displayStoreStats,
    loadAndDisplayStats,
    initMainPage,
  };
}
