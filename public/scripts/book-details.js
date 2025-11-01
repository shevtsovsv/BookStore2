// Book Details Page JavaScript
let currentBook = null;
let publisherModal = null;

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Book details page loaded");
  initializePage();
});

// Initialize all page functionality
function initializePage() {
  initializeModal();
  loadBookDetails();
  setupEventListeners();
}

// Initialize modal functionality
function initializeModal() {
  publisherModal = document.getElementById("publisher-modal");

  if (publisherModal) {
    // Close modal when clicking the X button
    const closeBtn = publisherModal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside
    publisherModal.addEventListener("click", function (e) {
      if (e.target === publisherModal) {
        closeModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && publisherModal.classList.contains("show")) {
        closeModal();
      }
    });
  }
}

// Setup additional event listeners
function setupEventListeners() {
  // Add to cart button
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", addToCart);
  }
}

// Get book ID from URL parameters
function getBookIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Load book details from API
async function loadBookDetails() {
  const bookId = getBookIdFromURL();
  console.log("Loading book details for ID:", bookId);
  console.log("Book ID type:", typeof bookId);

  if (!bookId) {
    showError("ID книги не найден в URL");
    return;
  }

  try {
    showLoading(true);

    // First try to fetch from API
    let book = null;
    try {
      console.log("Trying API...");
      console.log("API URL:", `/api/books/${bookId}`);
      const response = await fetch(`/api/books/${bookId}`);
      console.log("API Response status:", response.status);

      if (response.ok) {
        const apiResponse = await response.json();
        console.log("API Response:", apiResponse);

        // Check if API returns data in wrapper format
        if (apiResponse.success && apiResponse.data && apiResponse.data.book) {
          // Формат: {success: true, data: {book: {...}}}
          book = apiResponse.data.book;
          console.log("Book extracted from data.book wrapper:", book);
        } else if (apiResponse.success && apiResponse.data) {
          // Формат: {success: true, data: {...}}
          book = apiResponse.data;
          console.log("Book extracted from data wrapper:", book);
        } else if (apiResponse.id || apiResponse.title) {
          // Direct book object
          book = apiResponse;
          console.log("Book loaded directly from API:", book);
        } else {
          throw new Error("Некорректный формат данных от API");
        }
      } else {
        const errorText = await response.text();
        console.log("API Error response:", errorText);
        throw new Error("API не доступен: " + response.status);
      }
    } catch (apiError) {
      console.warn("API недоступен, пробуем JSON файл:", apiError);

      // Fallback to JSON file
      console.log("Trying JSON file...");
      const jsonResponse = await fetch("../data/books.json");
      console.log("JSON Response status:", jsonResponse.status);

      if (!jsonResponse.ok) {
        throw new Error(
          "Не удалось загрузить данные из JSON: " + jsonResponse.status
        );
      }

      const data = await jsonResponse.json();
      console.log("JSON data loaded:", data);
      console.log("Total books in JSON:", data.books.length);
      console.log("Looking for book with ID:", bookId);

      // Try both string and number comparison
      book = data.books.find((b) => {
        console.log(
          "Comparing:",
          b.id,
          "with",
          bookId,
          "types:",
          typeof b.id,
          typeof bookId
        );
        return (
          b.id === bookId ||
          b.id === parseInt(bookId) ||
          b.id.toString() === bookId
        );
      });

      console.log("Book found in JSON:", book);

      if (!book) {
        console.error(
          "Book not found. Available IDs:",
          data.books.map((b) => b.id)
        );
        throw new Error("Книга не найдена с ID: " + bookId);
      }
    }

    currentBook = book;
    console.log("Current book set to:", currentBook);
    renderBookDetails(book);
  } catch (error) {
    console.error("Ошибка загрузки деталей книги:", error);
    showError("Ошибка загрузки информации о книге: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Render book details on the page
function renderBookDetails(book) {
  console.log("Rendering book details:", book);

  try {
    // Update page title
    document.title = `${book.title} - Книжный магазин`;
    console.log("Page title updated");

    // Update breadcrumb
    updateBreadcrumb(book.title);
    console.log("Breadcrumb updated");

    // Update book image
    const bookImage = document.getElementById("book-image");
    if (bookImage) {
      // Handle different image field names and formats
      let imageSrc = "../img/book1.jpg"; // default fallback

      if (book.image_url) {
        imageSrc = book.image_url;
      } else if (book.image) {
        imageSrc = `../img/${book.image}`;
      } else if (book.cover_image) {
        imageSrc = book.cover_image;
      }

      bookImage.src = imageSrc;
      bookImage.alt = book.title || "Обложка книги";
      console.log("Book image updated to:", imageSrc);
    } else {
      console.error("Book image element not found");
    }

    // Update book title
    const bookTitle = document.getElementById("book-title");
    if (bookTitle) {
      const title = book.title || "Название не указано";
      bookTitle.textContent = title;
      console.log("Book title updated to:", title);
    } else {
      console.error("Book title element not found");
    }

    // Update book metadata - handle both API and JSON format
    console.log("Processing book metadata:", {
      title: book.title,
      Authors: book.Authors,
      author: book.author,
      Category: book.Category,
      genre: book.genre,
      Publisher: book.Publisher,
      publisher: book.publisher,
    });

    // Handle authors from different formats
    let authors = "Автор не указан";
    if (
      book.authors &&
      Array.isArray(book.authors) &&
      book.authors.length > 0
    ) {
      // API format with lowercase authors array
      authors = book.authors
        .map((author) => {
          if (typeof author === "string") return author;
          return (
            author.name ||
            `${author.first_name || ""} ${author.last_name || ""}`.trim() ||
            "Неизвестный автор"
          );
        })
        .join(", ");
    } else if (
      book.Authors &&
      Array.isArray(book.Authors) &&
      book.Authors.length > 0
    ) {
      // API format with Authors array (capitalized)
      authors = book.Authors.map((author) => {
        if (typeof author === "string") return author;
        return (
          author.name ||
          `${author.first_name || ""} ${author.last_name || ""}`.trim() ||
          "Неизвестный автор"
        );
      }).join(", ");
    } else if (book.author) {
      // JSON format with author string
      authors = book.author;
    }

    // Handle category
    let category = "Не указана";
    if (book.category && book.category.name) {
      // API format with lowercase category
      category = book.category.name;
    } else if (book.Category && book.Category.name) {
      // API format with capitalized Category
      category = book.Category.name;
    } else if (book.genre) {
      // JSON format with genre
      category = book.genre;
    }

    // Handle publisher
    let publisher = "Не указано";
    let publisherObj = null;
    if (book.publisher && book.publisher.name) {
      // API format with lowercase publisher
      publisher = book.publisher.name;
      publisherObj = book.publisher;
    } else if (book.Publisher && book.Publisher.name) {
      // API format with capitalized Publisher
      publisher = book.Publisher.name;
      publisherObj = book.Publisher;
    } else if (typeof book.publisher === "string") {
      // JSON format with publisher string
      publisher = book.publisher;
    }

    console.log("Formatted data:", { authors, category, publisher });

    updateBookMeta("book-authors", authors, false);
    updateBookMeta("book-category", category, false);
    updateBookMeta("book-publisher", publisher, true, publisherObj);

    // Only show fields that have data
    if (book.pages) {
      updateBookMeta("book-pages", `${book.pages} стр.`, false);
      showMetaField("book-pages");
    } else {
      hideMetaField("book-pages");
    }

    if (book.publication_year || book.year) {
      updateBookMeta("book-year", book.publication_year || book.year, false);
      showMetaField("book-year");
    } else {
      hideMetaField("book-year");
    }

    if (book.isbn) {
      updateBookMeta("book-isbn", book.isbn, false);
      showMetaField("book-isbn");
    } else {
      hideMetaField("book-isbn");
    }

    // Update price
    const bookPrice = document.getElementById("book-price");
    if (bookPrice) {
      const priceText = book.price ? `${book.price} ₽` : "Цена не указана";
      bookPrice.textContent = priceText;
      console.log("Price updated to:", priceText);
    } else {
      console.error("Book price element not found");
    }

    // Update description
    const bookDescription = document.getElementById("book-description");
    if (bookDescription) {
      const descText =
        book.description ||
        book.fullDescription ||
        book.shortDescription ||
        "Описание отсутствует";
      bookDescription.textContent = descText;
      console.log("Description updated:", descText.substring(0, 50) + "...");
    } else {
      console.error("Book description element not found");
    }

    // Update add to cart button
    const addToCartBtn = document.getElementById("add-to-cart-btn");
    if (addToCartBtn) {
      const hasPrice = book.price && book.price > 0;
      addToCartBtn.disabled = !hasPrice;
      if (!hasPrice) {
        addToCartBtn.textContent = "Недоступно";
        addToCartBtn.classList.add("disabled");
      } else {
        addToCartBtn.textContent = "Добавить в корзину";
        addToCartBtn.classList.remove("disabled");
      }
      console.log("Add to cart button updated, enabled:", hasPrice);
    } else {
      console.error("Add to cart button element not found");
    }

    console.log("Book details rendering completed successfully");
  } catch (error) {
    console.error("Ошибка отображения деталей книги:", error);
    showError("Ошибка отображения информации о книге");
  }
}

// Update breadcrumb navigation
function updateBreadcrumb(bookTitle) {
  const breadcrumbTitle = document.getElementById("breadcrumb-title");
  if (breadcrumbTitle && bookTitle) {
    breadcrumbTitle.textContent =
      bookTitle.length > 50 ? bookTitle.substring(0, 50) + "..." : bookTitle;
  }
}

// Update book metadata field
function updateBookMeta(
  elementId,
  value,
  isPublisher = false,
  publisherData = null
) {
  console.log(`Updating ${elementId} with value:`, value);
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return;
  }

  if (isPublisher && publisherData) {
    element.innerHTML = `<span class="publisher-link" onclick="showPublisherModal()">${value}</span>`;
    // Store publisher data for modal
    window.currentPublisher = publisherData;
    console.log(`Publisher link created for ${value}`);
  } else {
    element.textContent = value;
    console.log(`Text content set for ${elementId}: ${value}`);
  }
}

// Show metadata field
function showMetaField(elementId) {
  const element = document.getElementById(elementId);
  if (element && element.parentElement) {
    element.parentElement.style.display = "block";
  }
}

// Hide metadata field
function hideMetaField(elementId) {
  const element = document.getElementById(elementId);
  if (element && element.parentElement) {
    element.parentElement.style.display = "none";
  }
}

// Format authors array for display
function formatAuthors(authors) {
  if (!authors) {
    return "Автор не указан";
  }

  // If it's already a string (from JSON data)
  if (typeof authors === "string") {
    return authors;
  }

  // If it's an array from API
  if (Array.isArray(authors) && authors.length > 0) {
    return authors
      .map((author) => `${author.first_name} ${author.last_name}`.trim())
      .join(", ");
  }

  return "Автор не указан";
}

// Show publisher modal
function showPublisherModal() {
  const publisher = window.currentPublisher;

  if (!publisher) {
    showError("Информация о издательстве недоступна");
    return;
  }

  // Update modal content
  updatePublisherModalContent(publisher);

  // Show modal
  if (publisherModal) {
    publisherModal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

// Update publisher modal content
function updatePublisherModalContent(publisher) {
  const elements = {
    "publisher-name": publisher.name || "Не указано",
    "publisher-description": publisher.description || "Описание отсутствует",
    "publisher-country": publisher.country || "Не указана",
    "publisher-founded": publisher.founded_year || "Не указан",
    "publisher-email": publisher.contact_email || "Не указан",
  };

  // Update text elements
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      if (id === "publisher-email" && value !== "Не указан") {
        element.innerHTML = `<a href="mailto:${value}">${value}</a>`;
      } else {
        element.textContent = value;
      }
    }
  });

  // Update website link
  const websiteElement = document.getElementById("publisher-website");
  if (websiteElement) {
    if (publisher.website) {
      const url = publisher.website.startsWith("http")
        ? publisher.website
        : `https://${publisher.website}`;
      websiteElement.innerHTML = `<a href="${url}" target="_blank" class="publisher-website">${publisher.website}</a>`;
    } else {
      websiteElement.textContent = "Не указан";
    }
  }
}

// Close modal
function closeModal() {
  if (publisherModal) {
    publisherModal.classList.remove("show");
    document.body.style.overflow = "";
  }
}

// Add book to cart
async function addToCart() {
  if (!currentBook) {
    showError("Информация о книге недоступна");
    return;
  }

  try {
    // Проверяем авторизацию через утилиты
    if (!Auth.isAuthenticated()) {
      showError("Для добавления в корзину необходимо войти в систему");
      return;
    }

    // Получаем токен через утилиты
    const token = AuthToken.get();
    if (!token) {
      showError(
        "Ошибка токена авторизации. Пожалуйста, войдите в систему снова"
      );
      return;
    }

    console.log("Adding to cart - Book ID:", currentBook.id);
    console.log("Token exists:", !!token);

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookId: currentBook.id,
        quantity: 1,
      }),
    });

    console.log("Cart API response status:", response.status);
    const result = await response.json();
    console.log("Cart API response:", result);

    if (response.ok) {
      showSuccess("Книга добавлена в корзину!");
      // Обновить счётчик корзины в меню
      if (typeof Auth !== "undefined" && Auth.updateCartCount) {
        Auth.updateCartCount();
      }
    } else {
      // Проверяем, не истек ли токен
      if (response.status === 401) {
        Auth.logout();
        showError("Сессия истекла. Пожалуйста, войдите в систему снова");
      } else {
        throw new Error(result.message || "Ошибка добавления в корзину");
      }
    }
  } catch (error) {
    console.error("Ошибка добавления в корзину:", error);
    showError("Ошибка добавления в корзину: " + error.message);
  }
}

// Show loading state
function showLoading(show) {
  const content = document.querySelector(".book-detail");
  const loadingElement = document.getElementById("loading");

  if (show) {
    if (content) content.style.display = "none";
    if (!loadingElement) {
      const loading = document.createElement("div");
      loading.id = "loading";
      loading.innerHTML = "<p>Загрузка информации о книге...</p>";
      loading.style.textAlign = "center";
      loading.style.padding = "50px";
      document.querySelector("main").appendChild(loading);
    }
  } else {
    if (content) content.style.display = "grid";
    if (loadingElement) loadingElement.remove();
  }
}

// Show notification
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  container.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add("show"), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Show success notification
function showSuccess(message) {
  showNotification(message, "success");
}

// Show error notification
function showError(message) {
  showNotification(message, "error");
}
