# 🏗️ HTML структура Frontend

> **Сложность:** 🟢 Легкая  
> **Время выполнения:** 2-3 часа  
> **Предварительные требования:** Завершение части 09

## 🎯 Цели этой части

В этой части вы создадите современную HTML структуру для:

- Главной страницы с каталогом книг
- Страницы детального просмотра книги
- Системы аутентификации (вход/регистрация)
- Корзины покупок и оформления заказа
- Профиля пользователя

---

## 📁 Структура HTML файлов

### 1. Обновление главной страницы

Обновите файл `public/index.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Книжный магазин - Главная</title>

    <!-- SEO Meta Tags -->
    <meta
      name="description"
      content="Лучший книжный магазин с широким выбором книг всех жанров. Быстрая доставка, низкие цены."
    />
    <meta
      name="keywords"
      content="книги, книжный магазин, литература, покупка книг онлайн"
    />
    <meta name="author" content="Книжный магазин" />

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Книжный магазин - Главная" />
    <meta
      property="og:description"
      content="Лучший книжный магазин с широким выбором книг"
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="/" />

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/img/favicon.ico" />

    <!-- CSS -->
    <link rel="stylesheet" href="/style/main.css" />
    <link rel="stylesheet" href="/style/components.css" />
    <link rel="stylesheet" href="/style/responsive.css" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Icons -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body>
    <!-- Loader -->
    <div id="loader" class="loader">
      <div class="loader-spinner"></div>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="container">
        <nav class="navbar">
          <!-- Logo -->
          <div class="navbar-brand">
            <a href="/" class="brand-link">
              <i class="fas fa-book"></i>
              <span>BookStore</span>
            </a>
          </div>

          <!-- Search Bar -->
          <div class="search-container">
            <form class="search-form" id="searchForm">
              <div class="search-input-group">
                <input
                  type="search"
                  id="searchInput"
                  class="search-input"
                  placeholder="Поиск книг, авторов..."
                  autocomplete="off"
                />
                <button type="submit" class="search-btn">
                  <i class="fas fa-search"></i>
                </button>
              </div>
              <!-- Search Suggestions -->
              <div id="searchSuggestions" class="search-suggestions"></div>
            </form>
          </div>

          <!-- Navigation Menu -->
          <nav class="nav-menu">
            <ul class="nav-list">
              <li class="nav-item">
                <a href="/" class="nav-link active">Главная</a>
              </li>
              <li class="nav-item dropdown">
                <a href="#" class="nav-link dropdown-toggle">
                  Каталог <i class="fas fa-chevron-down"></i>
                </a>
                <div class="dropdown-menu" id="categoriesDropdown">
                  <!-- Категории будут загружены динамически -->
                </div>
              </li>
              <li class="nav-item">
                <a href="/authors" class="nav-link">Авторы</a>
              </li>
              <li class="nav-item">
                <a href="/publishers" class="nav-link">Издательства</a>
              </li>
              <li class="nav-item">
                <a href="/contacts" class="nav-link">Контакты</a>
              </li>
            </ul>
          </nav>

          <!-- User Actions -->
          <div class="user-actions">
            <!-- Cart -->
            <div class="cart-container">
              <button class="cart-btn" id="cartBtn">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-badge" id="cartBadge">0</span>
              </button>
              <!-- Mini Cart Dropdown -->
              <div class="mini-cart" id="miniCart">
                <div class="mini-cart-header">
                  <h3>Корзина</h3>
                </div>
                <div class="mini-cart-body" id="miniCartBody">
                  <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Корзина пуста</p>
                  </div>
                </div>
                <div class="mini-cart-footer">
                  <a href="/cart" class="btn btn-primary btn-block"
                    >Перейти в корзину</a
                  >
                </div>
              </div>
            </div>

            <!-- User Menu -->
            <div class="user-menu" id="userMenu">
              <!-- Для неаутентифицированных пользователей -->
              <div class="auth-buttons" id="authButtons">
                <a href="/login" class="btn btn-outline">Вход</a>
                <a href="/register" class="btn btn-primary">Регистрация</a>
              </div>

              <!-- Для аутентифицированных пользователей -->
              <div
                class="user-dropdown"
                id="userDropdown"
                style="display: none;"
              >
                <button class="user-btn" id="userBtn">
                  <div class="user-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <span class="user-name" id="userName">Пользователь</span>
                  <i class="fas fa-chevron-down"></i>
                </button>
                <div class="dropdown-menu user-dropdown-menu">
                  <a href="/profile" class="dropdown-item">
                    <i class="fas fa-user-circle"></i>
                    Профиль
                  </a>
                  <a href="/orders" class="dropdown-item">
                    <i class="fas fa-box"></i>
                    Мои заказы
                  </a>
                  <a href="/wishlist" class="dropdown-item">
                    <i class="fas fa-heart"></i>
                    Избранное
                  </a>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    Выход
                  </button>
                </div>
              </div>
            </div>

            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" id="mobileMenuToggle">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">Добро пожаловать в мир книг</h1>
            <p class="hero-subtitle">
              Откройте для себя тысячи увлекательных книг всех жанров
            </p>
            <div class="hero-actions">
              <a href="#catalog" class="btn btn-primary btn-lg"
                >Перейти к каталогу</a
              >
              <a href="#featured" class="btn btn-outline btn-lg"
                >Рекомендуемые</a
              >
            </div>
          </div>
          <div class="hero-image">
            <img src="/img/hero-books.jpg" alt="Книги" loading="lazy" />
          </div>
        </div>
      </section>

      <!-- Featured Books -->
      <section class="featured-section" id="featured">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Рекомендуемые книги</h2>
            <p class="section-subtitle">Популярные и новые поступления</p>
          </div>
          <div class="books-grid" id="featuredBooks">
            <!-- Книги будут загружены динамически -->
          </div>
          <div class="section-footer">
            <a href="/books?featured=true" class="btn btn-outline"
              >Посмотреть все</a
            >
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="categories-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Категории книг</h2>
            <p class="section-subtitle">Выберите интересующий вас жанр</p>
          </div>
          <div class="categories-grid" id="categoriesGrid">
            <!-- Категории будут загружены динамически -->
          </div>
        </div>
      </section>

      <!-- Catalog Section -->
      <section class="catalog-section" id="catalog">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Каталог книг</h2>
            <div class="catalog-controls">
              <!-- Filters -->
              <div class="filters">
                <button class="filter-toggle" id="filterToggle">
                  <i class="fas fa-filter"></i>
                  Фильтры
                </button>
                <div class="filter-panel" id="filterPanel">
                  <div class="filter-group">
                    <label class="filter-label">Категория</label>
                    <select class="filter-select" id="categoryFilter">
                      <option value="">Все категории</option>
                    </select>
                  </div>
                  <div class="filter-group">
                    <label class="filter-label">Цена</label>
                    <div class="price-range">
                      <input
                        type="number"
                        class="price-input"
                        id="minPrice"
                        placeholder="От"
                      />
                      <input
                        type="number"
                        class="price-input"
                        id="maxPrice"
                        placeholder="До"
                      />
                    </div>
                  </div>
                  <div class="filter-group">
                    <label class="filter-label">Язык</label>
                    <select class="filter-select" id="languageFilter">
                      <option value="">Любой</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div class="filter-actions">
                    <button class="btn btn-primary" id="applyFilters">
                      Применить
                    </button>
                    <button class="btn btn-outline" id="clearFilters">
                      Очистить
                    </button>
                  </div>
                </div>
              </div>

              <!-- Sort -->
              <div class="sort-container">
                <select class="sort-select" id="sortSelect">
                  <option value="createdAt-DESC">Сначала новые</option>
                  <option value="title-ASC">По названию (А-Я)</option>
                  <option value="title-DESC">По названию (Я-А)</option>
                  <option value="price-ASC">Сначала дешевые</option>
                  <option value="price-DESC">Сначала дорогие</option>
                  <option value="rating-DESC">По рейтингу</option>
                </select>
              </div>

              <!-- View Mode -->
              <div class="view-mode">
                <button class="view-btn active" data-view="grid" title="Сетка">
                  <i class="fas fa-th"></i>
                </button>
                <button class="view-btn" data-view="list" title="Список">
                  <i class="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Books Grid -->
          <div class="books-container">
            <div class="books-grid" id="booksGrid">
              <!-- Книги будут загружены динамически -->
            </div>

            <!-- Pagination -->
            <div class="pagination-container">
              <nav class="pagination" id="pagination">
                <!-- Пагинация будет создана динамически -->
              </nav>
            </div>
          </div>

          <!-- Loading State -->
          <div class="loading-state" id="loadingState">
            <div class="loading-spinner"></div>
            <p>Загрузка книг...</p>
          </div>

          <!-- Empty State -->
          <div class="empty-state" id="emptyState" style="display: none;">
            <i class="fas fa-search"></i>
            <h3>Книги не найдены</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
            <button class="btn btn-primary" id="resetSearch">
              Сбросить фильтры
            </button>
          </div>
        </div>
      </section>

      <!-- Newsletter -->
      <section class="newsletter-section">
        <div class="container">
          <div class="newsletter-content">
            <h2 class="newsletter-title">Не пропустите новинки!</h2>
            <p class="newsletter-subtitle">
              Подпишитесь на нашу рассылку и узнавайте о новых книгах первыми
            </p>
            <form class="newsletter-form" id="newsletterForm">
              <div class="newsletter-input-group">
                <input
                  type="email"
                  class="newsletter-input"
                  placeholder="Ваш email"
                  required
                />
                <button type="submit" class="btn btn-primary">
                  Подписаться
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3 class="footer-title">BookStore</h3>
            <p class="footer-description">
              Ваш надежный партнер в мире литературы. Лучшие книги по доступным
              ценам.
            </p>
            <div class="social-links">
              <a href="#" class="social-link" title="VKontakte">
                <i class="fab fa-vk"></i>
              </a>
              <a href="#" class="social-link" title="Telegram">
                <i class="fab fa-telegram"></i>
              </a>
              <a href="#" class="social-link" title="Instagram">
                <i class="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <div class="footer-section">
            <h4 class="footer-subtitle">Каталог</h4>
            <ul class="footer-links">
              <li>
                <a href="/books?category=fiction">Художественная литература</a>
              </li>
              <li>
                <a href="/books?category=nonfiction">Научная литература</a>
              </li>
              <li><a href="/books?category=children">Детские книги</a></li>
              <li>
                <a href="/books?category=education">Учебная литература</a>
              </li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-subtitle">Покупателям</h4>
            <ul class="footer-links">
              <li><a href="/delivery">Доставка и оплата</a></li>
              <li><a href="/returns">Возврат товара</a></li>
              <li><a href="/faq">Частые вопросы</a></li>
              <li><a href="/support">Поддержка</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-subtitle">Контакты</h4>
            <div class="contact-info">
              <div class="contact-item">
                <i class="fas fa-phone"></i>
                <span>+7 (999) 123-45-67</span>
              </div>
              <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span>info@bookstore.ru</span>
              </div>
              <div class="contact-item">
                <i class="fas fa-clock"></i>
                <span>Пн-Пт: 9:00-18:00</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p class="copyright">&copy; 2024 BookStore. Все права защищены.</p>
            <div class="footer-bottom-links">
              <a href="/privacy">Политика конфиденциальности</a>
              <a href="/terms">Пользовательское соглашение</a>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- Toast Notifications -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Modals -->
    <div class="modal-overlay" id="modalOverlay"></div>

    <!-- Scripts -->
    <script src="/scripts/utils.js"></script>
    <script src="/scripts/api.js"></script>
    <script src="/scripts/auth.js"></script>
    <script src="/scripts/cart.js"></script>
    <script src="/scripts/book-catalog.js"></script>
    <script src="/scripts/main.js"></script>
  </body>
</html>
```

### 2. Страница детального просмотра книги

Создайте файл `public/html/book-detail.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{bookTitle}} - Книжный магазин</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="{{bookDescription}}" />
    <meta name="keywords" content="{{bookKeywords}}" />

    <!-- Open Graph -->
    <meta property="og:title" content="{{bookTitle}}" />
    <meta property="og:description" content="{{bookDescription}}" />
    <meta property="og:image" content="{{bookImage}}" />
    <meta property="og:type" content="book" />

    <!-- CSS -->
    <link rel="stylesheet" href="/style/main.css" />
    <link rel="stylesheet" href="/style/components.css" />
    <link rel="stylesheet" href="/style/book-detail.css" />
    <link rel="stylesheet" href="/style/responsive.css" />

    <!-- Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Icons -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body>
    <!-- Header (simplified for book page) -->
    <header class="header header-simple">
      <div class="container">
        <nav class="navbar">
          <div class="navbar-brand">
            <a href="/" class="brand-link">
              <i class="fas fa-book"></i>
              <span>BookStore</span>
            </a>
          </div>

          <div class="search-container">
            <form class="search-form" id="searchForm">
              <input
                type="search"
                id="searchInput"
                class="search-input"
                placeholder="Поиск книг..."
              />
              <button type="submit" class="search-btn">
                <i class="fas fa-search"></i>
              </button>
            </form>
          </div>

          <div class="user-actions">
            <div class="cart-container">
              <button class="cart-btn" id="cartBtn">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-badge" id="cartBadge">0</span>
              </button>
            </div>
            <div class="user-menu" id="userMenu"></div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <div class="container">
        <ol class="breadcrumb-list" id="breadcrumbList">
          <li class="breadcrumb-item">
            <a href="/">Главная</a>
          </li>
          <li class="breadcrumb-item">
            <a href="/books">Каталог</a>
          </li>
          <li class="breadcrumb-item" id="categoryBreadcrumb">
            <!-- Категория будет добавлена динамически -->
          </li>
          <li class="breadcrumb-item active" id="bookBreadcrumb">
            <!-- Название книги будет добавлено динамически -->
          </li>
        </ol>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main">
      <div class="container">
        <!-- Book Detail -->
        <div class="book-detail" id="bookDetail">
          <!-- Контент будет загружен динамически -->
        </div>

        <!-- Loading State -->
        <div class="loading-state" id="loadingState">
          <div class="loading-spinner"></div>
          <p>Загрузка информации о книге...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" id="errorState" style="display: none;">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Книга не найдена</h2>
          <p>Возможно, книга была удалена или перемещена</p>
          <a href="/books" class="btn btn-primary">Вернуться к каталогу</a>
        </div>

        <!-- Related Books -->
        <section class="related-books" id="relatedBooks" style="display: none;">
          <div class="section-header">
            <h2 class="section-title">Похожие книги</h2>
          </div>
          <div class="books-grid" id="relatedBooksGrid">
            <!-- Похожие книги будут загружены динамически -->
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <!-- Упрощенная версия футера -->
      <div class="container">
        <div class="footer-simple">
          <div class="footer-brand">
            <h3>BookStore</h3>
            <p>&copy; 2024 Все права защищены</p>
          </div>
          <div class="footer-links">
            <a href="/privacy">Конфиденциальность</a>
            <a href="/terms">Условия</a>
            <a href="/contacts">Контакты</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Quick View Modal -->
    <div class="modal" id="quickViewModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Быстрый просмотр</h3>
            <button class="modal-close" id="quickViewClose">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" id="quickViewContent">
            <!-- Контент быстрого просмотра -->
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Scripts -->
    <script src="/scripts/utils.js"></script>
    <script src="/scripts/api.js"></script>
    <script src="/scripts/auth.js"></script>
    <script src="/scripts/cart.js"></script>
    <script src="/scripts/book-detail.js"></script>
  </body>
</html>
```

### 3. Страница авторизации

Обновите файл `public/html/login.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Вход в аккаунт - Книжный магазин</title>

    <!-- CSS -->
    <link rel="stylesheet" href="/style/main.css" />
    <link rel="stylesheet" href="/style/auth.css" />
    <link rel="stylesheet" href="/style/responsive.css" />

    <!-- Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Icons -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body class="auth-page">
    <!-- Header -->
    <header class="auth-header">
      <div class="container">
        <div class="auth-brand">
          <a href="/" class="brand-link">
            <i class="fas fa-book"></i>
            <span>BookStore</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="auth-main">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header-content">
            <h1 class="auth-title">Добро пожаловать!</h1>
            <p class="auth-subtitle">Войдите в свой аккаунт</p>
          </div>

          <!-- Login Form -->
          <form class="auth-form" id="loginForm">
            <div class="form-group">
              <label for="email" class="form-label">
                <i class="fas fa-envelope"></i>
                Email
              </label>
              <input
                type="email"
                id="email"
                class="form-input"
                placeholder="example@email.com"
                required
                autocomplete="email"
              />
              <div class="form-error" id="emailError"></div>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">
                <i class="fas fa-lock"></i>
                Пароль
              </label>
              <div class="password-input-group">
                <input
                  type="password"
                  id="password"
                  class="form-input"
                  placeholder="Введите пароль"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  id="passwordToggle"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="form-error" id="passwordError"></div>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="rememberMe" class="checkbox" />
                <span class="checkbox-custom"></span>
                Запомнить меня
              </label>
              <a href="/forgot-password" class="forgot-link">Забыли пароль?</a>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block auth-btn"
              id="loginBtn"
            >
              <span class="btn-text">Войти</span>
              <div class="btn-spinner" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </button>

            <div class="form-error form-error-global" id="formError"></div>
          </form>

          <!-- Social Login -->
          <div class="social-login">
            <div class="social-divider">
              <span>или войдите с помощью</span>
            </div>
            <div class="social-buttons">
              <button class="social-btn social-btn-google" id="googleLogin">
                <i class="fab fa-google"></i>
                Google
              </button>
              <button class="social-btn social-btn-vk" id="vkLogin">
                <i class="fab fa-vk"></i>
                VKontakte
              </button>
            </div>
          </div>

          <!-- Register Link -->
          <div class="auth-footer">
            <p class="auth-switch">
              Нет аккаунта?
              <a href="/register" class="auth-link">Зарегистрироваться</a>
            </p>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="auth-benefits">
          <h3>Преимущества регистрации:</h3>
          <ul class="benefits-list">
            <li>
              <i class="fas fa-heart"></i>
              Список избранных книг
            </li>
            <li>
              <i class="fas fa-shopping-cart"></i>
              Быстрое оформление заказов
            </li>
            <li>
              <i class="fas fa-history"></i>
              История покупок
            </li>
            <li>
              <i class="fas fa-bell"></i>
              Уведомления о новинках
            </li>
          </ul>
        </div>
      </div>
    </main>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Scripts -->
    <script src="/scripts/utils.js"></script>
    <script src="/scripts/api.js"></script>
    <script src="/scripts/auth.js"></script>
    <script src="/scripts/login.js"></script>
  </body>
</html>
```

### 4. Страница регистрации

Обновите файл `public/html/register.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Регистрация - Книжный магазин</title>

    <!-- CSS -->
    <link rel="stylesheet" href="/style/main.css" />
    <link rel="stylesheet" href="/style/auth.css" />
    <link rel="stylesheet" href="/style/responsive.css" />

    <!-- Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Icons -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body class="auth-page">
    <!-- Header -->
    <header class="auth-header">
      <div class="container">
        <div class="auth-brand">
          <a href="/" class="brand-link">
            <i class="fas fa-book"></i>
            <span>BookStore</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="auth-main">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header-content">
            <h1 class="auth-title">Создать аккаунт</h1>
            <p class="auth-subtitle">
              Присоединяйтесь к нашему сообществу читателей
            </p>
          </div>

          <!-- Registration Form -->
          <form class="auth-form" id="registerForm" novalidate>
            <div class="form-row">
              <div class="form-group form-group-half">
                <label for="firstName" class="form-label">
                  <i class="fas fa-user"></i>
                  Имя
                </label>
                <input
                  type="text"
                  id="firstName"
                  class="form-input"
                  placeholder="Ваше имя"
                  required
                  autocomplete="given-name"
                />
                <div class="form-error" id="firstNameError"></div>
              </div>

              <div class="form-group form-group-half">
                <label for="lastName" class="form-label">
                  <i class="fas fa-user"></i>
                  Фамилия
                </label>
                <input
                  type="text"
                  id="lastName"
                  class="form-input"
                  placeholder="Ваша фамилия"
                  required
                  autocomplete="family-name"
                />
                <div class="form-error" id="lastNameError"></div>
              </div>
            </div>

            <div class="form-group">
              <label for="email" class="form-label">
                <i class="fas fa-envelope"></i>
                Email
              </label>
              <input
                type="email"
                id="email"
                class="form-input"
                placeholder="example@email.com"
                required
                autocomplete="email"
              />
              <div class="form-error" id="emailError"></div>
              <div class="form-help">
                Мы не передаем ваш email третьим лицам
              </div>
            </div>

            <div class="form-group">
              <label for="phone" class="form-label">
                <i class="fas fa-phone"></i>
                Телефон (необязательно)
              </label>
              <input
                type="tel"
                id="phone"
                class="form-input"
                placeholder="+7 (999) 123-45-67"
                autocomplete="tel"
              />
              <div class="form-error" id="phoneError"></div>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">
                <i class="fas fa-lock"></i>
                Пароль
              </label>
              <div class="password-input-group">
                <input
                  type="password"
                  id="password"
                  class="form-input"
                  placeholder="Минимум 8 символов"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  id="passwordToggle"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="form-error" id="passwordError"></div>

              <!-- Password Strength Indicator -->
              <div class="password-strength" id="passwordStrength">
                <div class="strength-bar">
                  <div class="strength-fill" id="strengthFill"></div>
                </div>
                <div class="strength-text" id="strengthText">
                  Введите пароль
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">
                <i class="fas fa-lock"></i>
                Подтвердите пароль
              </label>
              <div class="password-input-group">
                <input
                  type="password"
                  id="confirmPassword"
                  class="form-input"
                  placeholder="Повторите пароль"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  id="confirmPasswordToggle"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="form-error" id="confirmPasswordError"></div>
            </div>

            <!-- Agreements -->
            <div class="form-agreements">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  id="termsAgree"
                  class="checkbox"
                  required
                />
                <span class="checkbox-custom"></span>
                Я согласен с
                <a href="/terms" target="_blank" class="agreement-link"
                  >условиями использования</a
                >
              </label>

              <label class="checkbox-label">
                <input
                  type="checkbox"
                  id="privacyAgree"
                  class="checkbox"
                  required
                />
                <span class="checkbox-custom"></span>
                Я согласен с
                <a href="/privacy" target="_blank" class="agreement-link"
                  >политикой конфиденциальности</a
                >
              </label>

              <label class="checkbox-label">
                <input
                  type="checkbox"
                  id="newsletterSubscribe"
                  class="checkbox"
                />
                <span class="checkbox-custom"></span>
                Подписаться на рассылку о новинках и акциях
              </label>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block auth-btn"
              id="registerBtn"
            >
              <span class="btn-text">Создать аккаунт</span>
              <div class="btn-spinner" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </button>

            <div class="form-error form-error-global" id="formError"></div>
          </form>

          <!-- Login Link -->
          <div class="auth-footer">
            <p class="auth-switch">
              Уже есть аккаунт?
              <a href="/login" class="auth-link">Войти</a>
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Success Modal -->
    <div class="modal" id="successModal">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body text-center">
            <div class="success-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <h3>Регистрация успешна!</h3>
            <p>Проверьте вашу почту для подтверждения аккаунта</p>
            <button class="btn btn-primary" id="successOk">Понятно</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Scripts -->
    <script src="/scripts/utils.js"></script>
    <script src="/scripts/api.js"></script>
    <script src="/scripts/auth.js"></script>
    <script src="/scripts/register.js"></script>
  </body>
</html>
```

---

## 🛒 Страница корзины

### 1. Создание страницы корзины

Создайте файл `public/html/cart.html`:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Корзина покупок - Книжный магазин</title>

    <!-- CSS -->
    <link rel="stylesheet" href="/style/main.css" />
    <link rel="stylesheet" href="/style/components.css" />
    <link rel="stylesheet" href="/style/cart.css" />
    <link rel="stylesheet" href="/style/responsive.css" />

    <!-- Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Icons -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body>
    <!-- Header -->
    <header class="header header-simple">
      <div class="container">
        <nav class="navbar">
          <div class="navbar-brand">
            <a href="/" class="brand-link">
              <i class="fas fa-book"></i>
              <span>BookStore</span>
            </a>
          </div>
          <div class="user-actions">
            <div class="user-menu" id="userMenu"></div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <div class="container">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <a href="/">Главная</a>
          </li>
          <li class="breadcrumb-item active">Корзина</li>
        </ol>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-shopping-cart"></i>
            Корзина покупок
          </h1>
        </div>

        <!-- Cart Content -->
        <div class="cart-container" id="cartContainer">
          <!-- Контент корзины будет загружен динамически -->
        </div>

        <!-- Loading State -->
        <div class="loading-state" id="loadingState">
          <div class="loading-spinner"></div>
          <p>Загрузка корзины...</p>
        </div>

        <!-- Empty Cart -->
        <div class="empty-cart" id="emptyCart" style="display: none;">
          <div class="empty-cart-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <h2>Ваша корзина пуста</h2>
          <p>Добавьте книги из каталога, чтобы начать покупки</p>
          <a href="/books" class="btn btn-primary">Перейти к каталогу</a>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer"></footer>

    <!-- Remove Item Modal -->
    <div class="modal" id="removeItemModal">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Удалить товар</h3>
            <button class="modal-close" id="removeModalClose">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>Вы уверены, что хотите удалить этот товар из корзины?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="cancelRemove">Отмена</button>
            <button class="btn btn-danger" id="confirmRemove">Удалить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Scripts -->
    <script src="/scripts/utils.js"></script>
    <script src="/scripts/api.js"></script>
    <script src="/scripts/auth.js"></script>
    <script src="/scripts/cart.js"></script>
    <script src="/scripts/cart-page.js"></script>
  </body>
</html>
```

---

## 📱 Компоненты и шаблоны

### 1. Шаблон карточки книги

Создайте файл `public/scripts/templates.js`:

```javascript
// Шаблоны для динамического создания HTML

const Templates = {
  // Карточка книги для сетки
  bookCard: (book) => `
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-image">
                <img 
                    src="${book.imageUrl || "/img/book-placeholder.jpg"}" 
                    alt="${book.title}"
                    loading="lazy"
                >
                <div class="book-overlay">
                    <button class="btn btn-sm btn-primary quick-view-btn" data-book-id="${
                      book.id
                    }">
                        <i class="fas fa-eye"></i>
                        Быстрый просмотр
                    </button>
                </div>
                ${
                  book.isFeatured
                    ? '<div class="book-badge featured">Рекомендуем</div>'
                    : ""
                }
                ${book.isNew ? '<div class="book-badge new">Новинка</div>' : ""}
            </div>
            
            <div class="book-info">
                <div class="book-category">
                    <a href="/books?category=${
                      book.category?.slug || ""
                    }" class="category-link">
                        ${book.category?.name || "Без категории"}
                    </a>
                </div>
                
                <h3 class="book-title">
                    <a href="/book/${book.slug || book.id}" class="book-link">
                        ${book.title}
                    </a>
                </h3>
                
                ${
                  book.subtitle
                    ? `<p class="book-subtitle">${book.subtitle}</p>`
                    : ""
                }
                
                <div class="book-authors">
                    ${
                      book.authors
                        ?.map(
                          (author) =>
                            `<a href="/author/${
                              author.slug || author.id
                            }" class="author-link">
                            ${author.firstName} ${author.lastName}
                        </a>`
                        )
                        .join(", ") || "Автор не указан"
                    }
                </div>
                
                <div class="book-rating">
                    ${this.renderRating(book.rating || 0)}
                    <span class="rating-count">(${book.reviewCount || 0})</span>
                </div>
                
                <div class="book-footer">
                    <div class="book-price">
                        ${
                          book.oldPrice
                            ? `<span class="old-price">${book.oldPrice} ₽</span>`
                            : ""
                        }
                        <span class="current-price">${book.price} ₽</span>
                    </div>
                    
                    <div class="book-actions">
                        <button class="btn btn-sm btn-outline wishlist-btn" data-book-id="${
                          book.id
                        }">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn btn-sm btn-primary add-to-cart-btn" data-book-id="${
                          book.id
                        }">
                            <i class="fas fa-shopping-cart"></i>
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

  // Карточка книги для списка
  bookListItem: (book) => `
        <div class="book-list-item" data-book-id="${book.id}">
            <div class="book-image">
                <img 
                    src="${book.imageUrl || "/img/book-placeholder.jpg"}" 
                    alt="${book.title}"
                    loading="lazy"
                >
            </div>
            
            <div class="book-content">
                <div class="book-header">
                    <div class="book-category">
                        <a href="/books?category=${
                          book.category?.slug || ""
                        }" class="category-link">
                            ${book.category?.name || "Без категории"}
                        </a>
                    </div>
                    
                    <h3 class="book-title">
                        <a href="/book/${
                          book.slug || book.id
                        }" class="book-link">
                            ${book.title}
                        </a>
                    </h3>
                    
                    <div class="book-authors">
                        ${
                          book.authors
                            ?.map(
                              (author) =>
                                `<a href="/author/${
                                  author.slug || author.id
                                }" class="author-link">
                                ${author.firstName} ${author.lastName}
                            </a>`
                            )
                            .join(", ") || "Автор не указан"
                        }
                    </div>
                </div>
                
                <div class="book-description">
                    ${
                      book.description
                        ? book.description.substring(0, 200) + "..."
                        : ""
                    }
                </div>
                
                <div class="book-meta">
                    <span class="book-year">${book.publishedYear || ""}</span>
                    <span class="book-pages">${book.pages || ""} стр.</span>
                    <span class="book-language">${
                      book.language === "ru" ? "Русский" : book.language
                    }</span>
                </div>
            </div>
            
            <div class="book-sidebar">
                <div class="book-rating">
                    ${this.renderRating(book.rating || 0)}
                    <span class="rating-count">(${book.reviewCount || 0})</span>
                </div>
                
                <div class="book-price">
                    ${
                      book.oldPrice
                        ? `<span class="old-price">${book.oldPrice} ₽</span>`
                        : ""
                    }
                    <span class="current-price">${book.price} ₽</span>
                </div>
                
                <div class="book-actions">
                    <button class="btn btn-outline wishlist-btn" data-book-id="${
                      book.id
                    }">
                        <i class="far fa-heart"></i>
                        В избранное
                    </button>
                    <button class="btn btn-primary add-to-cart-btn" data-book-id="${
                      book.id
                    }">
                        <i class="fas fa-shopping-cart"></i>
                        В корзину
                    </button>
                </div>
            </div>
        </div>
    `,

  // Элемент корзины
  cartItem: (item) => `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-image">
                <img 
                    src="${item.book.imageUrl || "/img/book-placeholder.jpg"}" 
                    alt="${item.book.title}"
                >
            </div>
            
            <div class="cart-item-info">
                <h3 class="cart-item-title">
                    <a href="/book/${item.book.slug || item.book.id}">
                        ${item.book.title}
                    </a>
                </h3>
                
                <div class="cart-item-authors">
                    ${
                      item.book.authors
                        ?.map(
                          (author) => `${author.firstName} ${author.lastName}`
                        )
                        .join(", ") || "Автор не указан"
                    }
                </div>
                
                <div class="cart-item-meta">
                    <span class="cart-item-category">${
                      item.book.category?.name || ""
                    }</span>
                    ${
                      item.priceChanged
                        ? `<span class="price-changed-badge">Цена изменилась</span>`
                        : ""
                    }
                </div>
            </div>
            
            <div class="cart-item-quantity">
                <button class="quantity-btn quantity-minus" data-item-id="${
                  item.id
                }">
                    <i class="fas fa-minus"></i>
                </button>
                <input 
                    type="number" 
                    class="quantity-input" 
                    value="${item.quantity}" 
                    min="1" 
                    max="10"
                    data-item-id="${item.id}"
                >
                <button class="quantity-btn quantity-plus" data-item-id="${
                  item.id
                }">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            
            <div class="cart-item-price">
                ${
                  item.priceChanged && item.oldPrice
                    ? `<span class="old-price">${item.oldPrice} ₽</span>`
                    : ""
                }
                <span class="current-price">${item.priceAtTime} ₽</span>
                <span class="total-price">${(
                  item.quantity * item.priceAtTime
                ).toFixed(2)} ₽</span>
            </div>
            
            <div class="cart-item-actions">
                <button class="btn btn-sm btn-outline wishlist-btn" data-book-id="${
                  item.book.id
                }">
                    <i class="far fa-heart"></i>
                </button>
                <button class="btn btn-sm btn-danger remove-item-btn" data-item-id="${
                  item.id
                }">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `,

  // Рендер звездного рейтинга
  renderRating: (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = "";

    // Заполненные звезды
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }

    // Половинчатая звезда
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }

    // Пустые звезды
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }

    return `<div class="rating-stars" data-rating="${rating}">${stars}</div>`;
  },

  // Пагинация
  pagination: (currentPage, totalPages, baseUrl = "") => {
    if (totalPages <= 1) return "";

    let pagination = '<div class="pagination">';

    // Предыдущая страница
    if (currentPage > 1) {
      pagination += `
                <a href="${baseUrl}?page=${
        currentPage - 1
      }" class="pagination-btn pagination-prev">
                    <i class="fas fa-chevron-left"></i>
                    Предыдущая
                </a>
            `;
    }

    // Номера страниц
    pagination += '<div class="pagination-numbers">';

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        const isActive = i === currentPage ? "active" : "";
        pagination += `
                    <a href="${baseUrl}?page=${i}" class="pagination-number ${isActive}">
                        ${i}
                    </a>
                `;
      } else if (
        (i === currentPage - 3 && currentPage > 4) ||
        (i === currentPage + 3 && currentPage < totalPages - 3)
      ) {
        pagination += '<span class="pagination-ellipsis">...</span>';
      }
    }

    pagination += "</div>";

    // Следующая страница
    if (currentPage < totalPages) {
      pagination += `
                <a href="${baseUrl}?page=${
        currentPage + 1
      }" class="pagination-btn pagination-next">
                    Следующая
                    <i class="fas fa-chevron-right"></i>
                </a>
            `;
    }

    pagination += "</div>";

    return pagination;
  },
};

// Экспорт для использования в других скриптах
if (typeof module !== "undefined" && module.exports) {
  module.exports = Templates;
}
```

---

## 📋 Задания для самопроверки

1. **Добавьте семантические HTML5 теги** для лучшей доступности
2. **Реализуйте micro-разметку** для SEO
3. **Создайте компонент поиска** с автодополнением
4. **Добавьте прогрессивную веб-приложение** (PWA) функциональность

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Современная HTML структура  
✅ Семантическая разметка  
✅ Адаптивные шаблоны  
✅ Компоненты для повторного использования

**Следующий шаг:** [11_CSS_STYLING.md](11_CSS_STYLING.md) - создание современных CSS стилей.

---

_Время выполнения: ~2-3 часа_  
_Сложность: 🟢 Легкая_
