// book-catalog.js - Скрипт для генерации каталога книг из JSON
(function () {
  let booksData = [];

  // Статические данные как fallback
  const fallbackBooks = [
    {
      id: "book1",
      title: "Унесённые ветром",
      author: "Маргарет Митчелл",
      genre: "Романтика",
      price: 900,
      priceCategory: "low",
      authorType: "foreign",
      image: "book1.jpg",
      shortDescription: "«Унесённые ветром» — масштабная история...",
      fullDescription:
        "«Унесённые ветром» — роман американской писательницы Маргарет Митчелл, опубликованный в 1936 году.",
      classes: ["romance", "foreign", "price-low"],
    },
    {
      id: "book2",
      title: "Гроза",
      author: "Александр Островский",
      genre: "Драма",
      price: 550,
      priceCategory: "low",
      authorType: "russian",
      image: "book2.jpg",
      shortDescription: "«Гроза» — драма о столкновении...",
      fullDescription:
        "«Гроза» — пьеса А. Н. Островского в пяти действиях, написанная в 1859 году.",
      classes: ["drama", "russian", "price-low"],
    },
    {
      id: "book3",
      title: "Море и звезды",
      author: "Алексей Бирюлин",
      genre: "Биография",
      price: 1670,
      priceCategory: "high",
      authorType: "russian",
      image: "book3.jpg",
      shortDescription: "«Море и звезды» — исторический роман-биография...",
      fullDescription:
        "«Море и звезды» — художественно-документальное произведение о великих мореплавателях.",
      classes: ["bio", "russian", "price-high"],
    },
    {
      id: "book4",
      title: "Человек-амфибия",
      author: "Александр Беляев",
      genre: "Фантастика",
      price: 1750,
      priceCategory: "high",
      authorType: "russian",
      image: "book4.jpg",
      shortDescription: "«Человек-амфибия» — научно-фантастическая драма...",
      fullDescription:
        "«Человек-амфибия» — научно-фантастический роман Александра Беляева, опубликованный в 1928 году.",
      classes: ["fantasy", "russian", "price-high"],
    },
    {
      id: "book5",
      title: "Маленький принц",
      author: "Антуан де Сент-Экзюпери",
      genre: "Фантастика",
      price: 890,
      priceCategory: "low",
      authorType: "foreign",
      image: "book5.jpg",
      shortDescription: "«Маленький принц» — философская сказка-притча...",
      fullDescription:
        "«Маленький принц» — наиболее известное произведение Антуана де Сент-Экзюпери.",
      classes: ["fantasy", "foreign", "price-low"],
    },
    {
      id: "book6",
      title: "Великий Гэтсби",
      author: "Фрэнсис Скотт Фицджеральд",
      genre: "Драма",
      price: 1200,
      priceCategory: "high",
      authorType: "foreign",
      image: "book6.jpg",
      shortDescription: "«Великий Гэтсби» — трагическая история...",
      fullDescription:
        "«Великий Гэтсби» — роман американского писателя Фрэнсиса Скотта Фицджеральда.",
      classes: ["drama", "foreign", "price-high"],
    },
  ];

  // Загружаем данные о книгах из JSON
  async function loadBooksData() {
    try {
      console.log("Начинаем загрузку данных из JSON...");
      const response = await fetch("../data/books.json");
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Данные успешно загружены из JSON файла:", data);
      return data.books;
    } catch (error) {
      console.error("Ошибка загрузки данных из JSON:", error);

      // Проверяем, является ли ошибка CORS
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("TypeError")
      ) {
        console.warn(
          "⚠️ CORS блокировка: Браузер блокирует загрузку локальных файлов."
        );
        console.info(
          "💡 Для полной функциональности используйте HTTP сервер (например, Live Server в VS Code)"
        );
        console.info("📁 Пока используем встроенные данные...");
      }

      // Проверяем, есть ли глобальные данные из book-data.js
      if (window.BOOKS_DATA && window.BOOKS_DATA.books) {
        console.log("✅ Используем данные из book-data.js");
        return window.BOOKS_DATA.books;
      }

      console.log("📋 Используем статические fallback данные");
      return fallbackBooks;
    }
  }

  // Функция для добавления книги в корзину
  async function orderBook(bookId) {
    const book = booksData.find((b) => b.id === bookId);
    const bookTitle = book ? book.title : "книга";

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
          bookId: bookId,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`"${bookTitle}" добавлена в корзину!`);
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
  }

  // Делаем функцию глобальной
  window.orderBook = orderBook;

  // Генерируем навигацию по книгам
  function generateNavigation(books) {
    const navigation = document.getElementById("book-navigation");
    const links = books
      .map((book, index) => `<a href="#${book.id}">${book.title}</a>`)
      .join(" | ");
    navigation.innerHTML = links;
  }

  // Генерируем карточку книги
  function generateBookCard(book) {
    const classNames = book.classes.join(" ");

    return `
      <div id="${book.id}" class="book-card ${classNames}" data-book-id="${book.id}">
        <img
          src="../img/${book.image}"
          alt="${book.title} — обложка"
          class="book-cover"
          loading="lazy"
          width="250"
          height="350"
        />
        <div class="book-info">
          <h3>${book.title}</h3>
          <p><strong>Автор:</strong> ${book.author}</p>
          <p><strong>Жанр:</strong> ${book.genre}</p>
          <p><strong>Описание:</strong> ${book.shortDescription}</p>
          <p><strong>Цена:</strong> ${book.price} руб.</p>
          <div class="book-actions">
            <button 
              class="btn btn-order" 
              data-book-id="${book.id}"
              aria-label="Заказать ${book.title}"
            >Заказать</button>
            <button 
              class="btn btn-details" 
              data-book-id="${book.id}"
              aria-label="Подробнее о книге ${book.title}"
            >Подробнее</button>
          </div>
        </div>
      </div>
    `;
  }

  // Рендерим каталог книг
  function renderBooksCatalog(books) {
    console.log("🎨 Начинаем рендеринг каталога...");
    const container = document.getElementById("books-container");
    console.log("📦 Контейнер найден:", !!container);

    if (!books || books.length === 0) {
      console.error("❌ Нет книг для рендеринга");
      container.innerHTML = `
        <div class="error">
          <p>Не удалось загрузить каталог книг. Попробуйте перезагрузить страницу.</p>
        </div>
      `;
      return;
    }

    console.log("📚 Рендерим", books.length, "книг");
    const cardsHTML = books.map(generateBookCard).join("");
    console.log("🏗️ HTML сгенерирован, длина:", cardsHTML.length);
    console.log("📝 Первые 200 символов HTML:", cardsHTML.substring(0, 200));

    container.innerHTML = cardsHTML;
    console.log("✅ HTML вставлен в контейнер");

    // Проверяем, что карточки действительно появились
    const addedCards = container.querySelectorAll(".book-card");
    console.log("🎯 Найдено карточек в DOM:", addedCards.length);

    // Принудительно устанавливаем display: flex для всех карточек
    addedCards.forEach(function (card) {
      card.style.setProperty("display", "flex", "important");
    });
    console.log("🎨 Стили применены принудительно");

    // Добавляем обработчики событий
    setupCardEventListeners();
  }

  // Настройка обработчиков событий для карточек
  function setupCardEventListeners() {
    console.log("🎯 Настраиваем обработчики событий...");

    // Проверяем, сколько элементов найдено
    const detailButtons = document.querySelectorAll(".btn-details");
    const orderButtons = document.querySelectorAll(".btn-order");
    const bookCards = document.querySelectorAll(".book-card");

    console.log("Найдено кнопок 'Подробнее':", detailButtons.length);
    console.log("Найдено кнопок 'Заказать':", orderButtons.length);
    console.log("Найдено карточек книг:", bookCards.length);

    // Обработчики для кнопок "Подробнее"
    detailButtons.forEach((button, index) => {
      console.log(`Настраиваем кнопку "Подробнее" #${index}`, button);
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = this.getAttribute("data-book-id");
        console.log("🔍 Переход к деталям книги:", bookId);
        window.location.href = `book-detail.html?id=${bookId}`;
      });
    });

    // Обработчики для кнопок "Заказать"
    orderButtons.forEach((button, index) => {
      console.log(`Настраиваем кнопку "Заказать" #${index}`, button);
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = this.getAttribute("data-book-id");
        console.log("🛒 Заказ книги:", bookId);
        orderBook(bookId);
      });
    });

    // Обработчики для кликов по карточкам
    bookCards.forEach((card, index) => {
      console.log(`Настраиваем карточку #${index}`, card);
      card.addEventListener("click", function (e) {
        console.log("Клик по карточке, target:", e.target);
        // Проверяем, что клик не по кнопке
        if (!e.target.closest(".book-actions")) {
          const bookId = this.getAttribute("data-book-id");
          console.log("📚 Клик по карточке книги:", bookId);
          window.location.href = `book-detail.html?id=${bookId}`;
        } else {
          console.log("Клик по кнопке, игнорируем");
        }
      });

      // Добавляем курсор pointer
      card.style.cursor = "pointer";
    });

    console.log("✅ Обработчики событий настроены");
  }

  // Показываем ошибку загрузки
  function showError(message) {
    const container = document.getElementById("books-container");
    if (container) {
      container.innerHTML = `
        <div class="error">
          <h2>Ошибка загрузки</h2>
          <p>${message}</p>
          <button onclick="location.reload()" class="buy-btn">Перезагрузить страницу</button>
        </div>
      `;
    }
  }

  // Основная функция инициализации
  async function init() {
    console.log("🚀 Инициализация каталога книг...");
    console.log("📍 Контейнер:", document.getElementById("books-container"));

    try {
      booksData = await loadBooksData();
      console.log("📚 Загружено книг:", booksData ? booksData.length : 0);
      console.log("📋 Данные книг:", booksData);

      if (booksData && booksData.length > 0) {
        console.log(`✅ Загружено ${booksData.length} книг`);
        generateNavigation(booksData);
        renderBooksCatalog(booksData);
        console.log("🎨 Каталог отрендерен");
      } else {
        console.error("❌ Данные о книгах не загружены или пусты");
        const container = document.getElementById("books-container");
        if (container) {
          container.innerHTML = `
            <div class="error">
              <h2>Ошибка</h2>
              <p>Каталог книг пуст или не удалось загрузить данные</p>
              <button onclick="location.reload()" class="buy-btn">Перезагрузить страницу</button>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("💥 Ошибка инициализации:", error);
      const container = document.getElementById("books-container");
      if (container) {
        container.innerHTML = `
          <div class="error">
            <h2>Ошибка инициализации</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()" class="buy-btn">Перезагрузить страницу</button>
          </div>
        `;
      }
    }
  }

  // Запускаем инициализацию когда DOM готов
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
