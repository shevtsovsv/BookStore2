# 🧪 Тестирование и документация

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 3-4 часа  
> **Предварительные требования:** Завершение частей 01-17

## 🎯 Цели этой части

В финальной части вы создадите полную систему тестирования и документации:

- Unit тесты для моделей и контроллеров
- Интеграционные тесты для API
- E2E тесты для пользовательского интерфейса
- Автоматическую генерацию API документации
- Пользовательские руководства
- Техническую документацию

---

## 🧪 Настройка тестирования

### 1. Установка зависимостей для тестирования

```bash
npm install --save-dev jest supertest @types/jest
```

### 2. Конфигурация Jest

Создайте файл `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "models/**/*.js",
    "!src/**/*.test.js",
    "!src/config/**",
    "!node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
  verbose: true,
};
```

### 3. Настройка тестовой среды

Создайте файл `tests/setup.js`:

```javascript
const { sequelize } = require("../models");

// Настройка тестовой БД
beforeAll(async () => {
  // Синхронизация БД для тестов
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Закрытие подключения
  await sequelize.close();
});

// Очистка БД между тестами
afterEach(async () => {
  // Очистка всех таблиц
  const models = Object.keys(sequelize.models);
  for (const model of models) {
    await sequelize.models[model].destroy({
      where: {},
      truncate: true,
      cascade: true,
    });
  }
});
```

### 4. Тестовая конфигурация БД

Обновите `config/config.json`:

```json
{
  "test": {
    "username": "bookstore_user",
    "password": "test_password",
    "database": "bookstore_test",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres",
    "logging": false,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    }
  }
}
```

---

## 🔍 Unit тесты

### 1. Тесты моделей

Создайте файл `tests/models/User.test.js`:

```javascript
const { User } = require("../../models");
const bcrypt = require("bcrypt");

describe("User Model", () => {
  describe("Validation", () => {
    test("should create user with valid data", async () => {
      const userData = {
        firstName: "Иван",
        lastName: "Петров",
        email: "ivan@example.com",
        password: "password123",
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.firstName).toBe("Иван");
      expect(user.lastName).toBe("Петров");
      expect(user.email).toBe("ivan@example.com");
      expect(user.role).toBe("user");
      expect(user.isActive).toBe(true);
    });

    test("should not create user without required fields", async () => {
      const userData = {
        firstName: "Иван",
        // Отсутствуют обязательные поля
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test("should not create user with invalid email", async () => {
      const userData = {
        firstName: "Иван",
        lastName: "Петров",
        email: "invalid-email",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test("should not create user with duplicate email", async () => {
      const userData = {
        firstName: "Иван",
        lastName: "Петров",
        email: "ivan@example.com",
        password: "password123",
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe("Methods", () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: "Иван",
        lastName: "Петров",
        email: "ivan@example.com",
        password: "password123",
      });
    });

    test("getFullName should return full name", () => {
      expect(user.getFullName()).toBe("Иван Петров");
    });

    test("toJSON should exclude password", () => {
      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.email).toBe("ivan@example.com");
    });
  });
});
```

### 2. Тесты Book модели

Создайте файл `tests/models/Book.test.js`:

```javascript
const { Book, Category, Publisher } = require("../../models");

describe("Book Model", () => {
  let category, publisher;

  beforeEach(async () => {
    category = await Category.create({
      name: "Художественная литература",
      slug: "fiction",
    });

    publisher = await Publisher.create({
      name: "АСТ",
      slug: "ast",
    });
  });

  describe("Validation", () => {
    test("should create book with valid data", async () => {
      const bookData = {
        title: "Война и мир",
        price: 599.0,
        stockQuantity: 10,
        categoryId: category.id,
        publisherId: publisher.id,
        slug: "voyna-i-mir",
      };

      const book = await Book.create(bookData);

      expect(book.id).toBeDefined();
      expect(book.title).toBe("Война и мир");
      expect(book.price).toBe("599.00");
      expect(book.isActive).toBe(true);
    });

    test("should validate price is not negative", async () => {
      const bookData = {
        title: "Test Book",
        price: -100,
        stockQuantity: 10,
        categoryId: category.id,
        slug: "test-book",
      };

      await expect(Book.create(bookData)).rejects.toThrow();
    });

    test("should validate discount price is lower than regular price", async () => {
      const bookData = {
        title: "Test Book",
        price: 100,
        discountPrice: 150,
        stockQuantity: 10,
        categoryId: category.id,
        slug: "test-book",
      };

      await expect(Book.create(bookData)).rejects.toThrow();
    });
  });

  describe("Methods", () => {
    let book;

    beforeEach(async () => {
      book = await Book.create({
        title: "Тестовая книга",
        price: 500.0,
        discountPrice: 400.0,
        stockQuantity: 5,
        categoryId: category.id,
        slug: "test-book",
      });
    });

    test("getCurrentPrice should return discount price if available", () => {
      expect(book.getCurrentPrice()).toBe("400.00");
    });

    test("getCurrentPrice should return regular price if no discount", async () => {
      book.discountPrice = null;
      expect(book.getCurrentPrice()).toBe("500.00");
    });

    test("getDiscountPercent should calculate discount percentage", () => {
      expect(book.getDiscountPercent()).toBe(20);
    });

    test("isInStock should return true if quantity > 0", () => {
      expect(book.isInStock()).toBe(true);
    });

    test("isInStock should return false if quantity = 0", async () => {
      book.stockQuantity = 0;
      expect(book.isInStock()).toBe(false);
    });
  });
});
```

---

## 🔗 Интеграционные тесты API

### 1. Настройка тестового сервера

Создайте файл `tests/helpers/testServer.js`:

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { sequelize } = require("../../models");

// Импорт маршрутов
const authRoutes = require("../../src/routes/auth");
const bookRoutes = require("../../src/routes/books");
const categoryRoutes = require("../../src/routes/categories");

const createTestServer = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Маршруты
  app.use("/api/auth", authRoutes);
  app.use("/api/books", bookRoutes);
  app.use("/api/categories", categoryRoutes);

  // Обработка ошибок
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  });

  return app;
};

module.exports = { createTestServer };
```

### 2. Тесты аутентификации

Создайте файл `tests/integration/auth.test.js`:

```javascript
const request = require("supertest");
const { createTestServer } = require("../helpers/testServer");
const { User } = require("../../models");

describe("Authentication API", () => {
  let app;

  beforeAll(() => {
    app = createTestServer();
  });

  describe("POST /api/auth/register", () => {
    test("should register new user with valid data", async () => {
      const userData = {
        firstName: "Иван",
        lastName: "Петров",
        email: "ivan@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("ivan@example.com");
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    test("should not register user with invalid email", async () => {
      const userData = {
        firstName: "Иван",
        lastName: "Петров",
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test("should not register user with duplicate email", async () => {
      const userData = {
        firstName: "Иван",
        lastName: "Петров",
        email: "test@example.com",
        password: "password123",
      };

      await request(app).post("/api/auth/register").send(userData);

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        firstName: "Тест",
        lastName: "Пользователь",
        email: "test@example.com",
        password: "password123",
      });
    });

    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.token).toBeDefined();
    });

    test("should not login with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

### 3. Тесты Books API

Создайте файл `tests/integration/books.test.js`:

```javascript
const request = require("supertest");
const { createTestServer } = require("../helpers/testServer");
const { User, Book, Category, Publisher } = require("../../models");

describe("Books API", () => {
  let app, authToken, category, publisher;

  beforeAll(() => {
    app = createTestServer();
  });

  beforeEach(async () => {
    // Создание админа для тестов
    const admin = await User.create({
      firstName: "Админ",
      lastName: "Системы",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    authToken = loginResponse.body.data.token;

    // Создание категории и издательства
    category = await Category.create({
      name: "Тестовая категория",
      slug: "test-category",
    });

    publisher = await Publisher.create({
      name: "Тестовое издательство",
      slug: "test-publisher",
    });
  });

  describe("GET /api/books", () => {
    beforeEach(async () => {
      // Создание тестовых книг
      await Book.bulkCreate([
        {
          title: "Книга 1",
          price: 500.0,
          stockQuantity: 10,
          categoryId: category.id,
          publisherId: publisher.id,
          slug: "book-1",
        },
        {
          title: "Книга 2",
          price: 600.0,
          stockQuantity: 5,
          categoryId: category.id,
          publisherId: publisher.id,
          slug: "book-2",
        },
      ]);
    });

    test("should get all books", async () => {
      const response = await request(app).get("/api/books").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    test("should filter books by category", async () => {
      const response = await request(app)
        .get(`/api/books?categoryId=${category.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
    });

    test("should search books by title", async () => {
      const response = await request(app)
        .get("/api/books?search=Книга 1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe("Книга 1");
    });
  });

  describe("POST /api/books", () => {
    test("should create new book as admin", async () => {
      const bookData = {
        title: "Новая книга",
        price: 799.0,
        stockQuantity: 15,
        categoryId: category.id,
        publisherId: publisher.id,
        slug: "new-book",
      };

      const response = await request(app)
        .post("/api/books")
        .set("Authorization", `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book.title).toBe("Новая книга");
    });

    test("should not create book without authentication", async () => {
      const bookData = {
        title: "Новая книга",
        price: 799.0,
        stockQuantity: 15,
        categoryId: category.id,
        slug: "new-book",
      };

      const response = await request(app)
        .post("/api/books")
        .send(bookData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## 🎭 E2E тесты

### 1. Установка Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Конфигурация Playwright

Создайте файл `playwright.config.js`:

```javascript
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. E2E тесты

Создайте файл `tests/e2e/book-catalog.spec.js`:

```javascript
const { test, expect } = require("@playwright/test");

test.describe("Book Catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display book catalog", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Каталог книг");
    await expect(page.locator(".book-card")).toHaveCount.toBeGreaterThan(0);
  });

  test("should filter books by category", async ({ page }) => {
    // Выбор категории
    await page.selectOption("#category-filter", {
      label: "Художественная литература",
    });

    // Ожидание обновления результатов
    await page.waitForSelector(".book-card");

    // Проверка фильтрации
    const books = await page.locator(".book-card").all();
    for (const book of books) {
      await expect(book.locator(".category")).toContainText(
        "Художественная литература"
      );
    }
  });

  test("should search books", async ({ page }) => {
    // Поиск книги
    await page.fill("#search-input", "Война и мир");
    await page.click("#search-button");

    // Ожидание результатов
    await page.waitForSelector(".book-card");

    // Проверка результатов поиска
    await expect(
      page.locator(".book-card").first().locator("h3")
    ).toContainText("Война и мир");
  });

  test("should open book details", async ({ page }) => {
    // Клик на первую книгу
    await page.click(".book-card:first-child");

    // Ожидание загрузки страницы деталей
    await page.waitForSelector(".book-details");

    // Проверка элементов страницы
    await expect(page.locator(".book-title")).toBeVisible();
    await expect(page.locator(".book-price")).toBeVisible();
    await expect(page.locator(".book-description")).toBeVisible();
    await expect(page.locator("#add-to-cart")).toBeVisible();
  });
});
```

### 4. Тесты корзины покупок

Создайте файл `tests/e2e/shopping-cart.spec.js`:

```javascript
const { test, expect } = require("@playwright/test");

test.describe("Shopping Cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should add book to cart", async ({ page }) => {
    // Открытие первой книги
    await page.click(".book-card:first-child");
    await page.waitForSelector(".book-details");

    // Добавление в корзину
    await page.click("#add-to-cart");

    // Проверка уведомления
    await expect(page.locator(".success-message")).toContainText(
      "Книга добавлена в корзину"
    );

    // Проверка счетчика корзины
    await expect(page.locator("#cart-count")).toContainText("1");
  });

  test("should update quantity in cart", async ({ page }) => {
    // Добавление книги в корзину
    await page.click(".book-card:first-child");
    await page.waitForSelector(".book-details");
    await page.click("#add-to-cart");

    // Переход в корзину
    await page.click("#cart-link");
    await page.waitForSelector(".cart-page");

    // Увеличение количества
    await page.click(".quantity-increase");

    // Проверка обновления количества
    await expect(page.locator(".quantity-input")).toHaveValue("2");

    // Проверка обновления общей суммы
    const totalElement = page.locator(".total-price");
    const total = await totalElement.textContent();
    expect(parseFloat(total.replace(/[^\d.]/g, ""))).toBeGreaterThan(0);
  });

  test("should remove book from cart", async ({ page }) => {
    // Добавление книги в корзину
    await page.click(".book-card:first-child");
    await page.waitForSelector(".book-details");
    await page.click("#add-to-cart");

    // Переход в корзину
    await page.click("#cart-link");
    await page.waitForSelector(".cart-page");

    // Удаление книги
    await page.click(".remove-item");

    // Подтверждение удаления
    await page.click(".confirm-remove");

    // Проверка пустой корзины
    await expect(page.locator(".empty-cart-message")).toBeVisible();
    await expect(page.locator("#cart-count")).toContainText("0");
  });
});
```

---

## 📖 API документация

### 1. Установка Swagger

```bash
npm install swagger-jsdoc swagger-ui-express
```

### 2. Настройка Swagger

Создайте файл `src/config/swagger.js`:

```javascript
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bookstore API",
      version: "1.0.0",
      description: "API для интернет-магазина книг",
      contact: {
        name: "Разработчик",
        email: "developer@bookstore.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
      {
        url: "https://your-domain.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "user"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Book: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            isbn: { type: "string" },
            price: { type: "number" },
            discountPrice: { type: "number" },
            stockQuantity: { type: "integer" },
            categoryId: { type: "integer" },
            publisherId: { type: "integer" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
```

### 3. Документирование маршрутов

Добавьте документацию в `src/routes/books.js`:

```javascript
/**
 * @swagger
 * /books:
 *   get:
 *     summary: Получить список книг
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество книг на странице
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Список книг получен успешно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         pages: { type: integer }
 */

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Создать новую книгу
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - stockQuantity
 *               - categoryId
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               isbn: { type: string }
 *               price: { type: number }
 *               discountPrice: { type: number }
 *               stockQuantity: { type: integer }
 *               categoryId: { type: integer }
 *               publisherId: { type: integer }
 *     responses:
 *       201:
 *         description: Книга создана успешно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

### 4. Интеграция в сервер

Обновите `server.js`:

```javascript
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

// API документация
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

// JSON спецификация
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
```

---

## 📚 Пользовательская документация

### 1. README для пользователей

Создайте файл `docs/USER_GUIDE.md`:

```markdown
# 📚 Руководство пользователя - Книжный интернет-магазин

## Добро пожаловать!

Наш интернет-магазин книг предоставляет удобный способ поиска, просмотра и покупки книг онлайн.

## Основные функции

### 🔍 Поиск и просмотр книг

1. **Поиск по названию**: Введите название книги в поисковую строку
2. **Фильтрация по категориям**: Используйте боковое меню для выбора категории
3. **Сортировка**: Сортируйте результаты по цене, популярности или дате

### 🛒 Покупки

1. **Добавление в корзину**: Нажмите кнопку "В корзину" на странице книги
2. **Управление количеством**: Измените количество в корзине
3. **Оформление заказа**: Перейдите в корзину и нажмите "Оформить заказ"

### 👤 Аккаунт пользователя

1. **Регистрация**: Создайте аккаунт для сохранения заказов
2. **Вход в систему**: Войдите для доступа к личному кабинету
3. **История заказов**: Просматривайте историю своих покупок

## Часто задаваемые вопросы

**Q: Как изменить количество товара в корзине?**
A: В корзине используйте кнопки "+" и "-" рядом с товаром или введите нужное количество.

**Q: Можно ли отменить заказ?**
A: Заказ можно отменить до момента отправки товара. Обратитесь в службу поддержки.

**Q: Как узнать статус заказа?**
A: Войдите в личный кабинет и перейдите в раздел "Мои заказы".

## Поддержка

Если у вас возникли проблемы:

- Email: support@bookstore.com
- Телефон: +7 (800) 123-45-67
- Время работы: 9:00 - 18:00 (МСК)
```

### 2. Руководство администратора

Создайте файл `docs/ADMIN_GUIDE.md`:

```markdown
# 👨‍💼 Руководство администратора

## Доступ к админ-панели

1. Войдите в систему с правами администратора
2. Перейдите по адресу `/admin`
3. Используйте административные функции

## Управление книгами

### Добавление новой книги

1. Перейдите в раздел "Книги"
2. Нажмите "Добавить книгу"
3. Заполните все обязательные поля
4. Загрузите изображение обложки
5. Сохраните книгу

### Редактирование книги

1. Найдите книгу в списке
2. Нажмите "Редактировать"
3. Внесите изменения
4. Сохраните изменения

## Управление заказами

### Обработка заказов

1. Перейдите в раздел "Заказы"
2. Просмотрите новые заказы
3. Измените статус заказа
4. Отправьте уведомление клиенту

## Аналитика

### Просмотр статистики

1. Перейдите в раздел "Аналитика"
2. Выберите период для анализа
3. Просмотрите отчеты по продажам
4. Экспортируйте данные при необходимости
```

---

## 📝 NPM скрипты

Обновите `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e",
    "docs:generate": "jsdoc -c jsdoc.config.js",
    "docs:serve": "http-server docs -p 8080",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix"
  }
}
```

---

## 🚀 Запуск тестов

### Unit и интеграционные тесты

```bash
# Запуск всех тестов
npm test

# Запуск с отслеживанием изменений
npm run test:watch

# Запуск с покрытием кода
npm run test:coverage
```

### E2E тесты

```bash
# Запуск E2E тестов
npm run test:e2e

# Запуск в headed режиме
npx playwright test --headed

# Запуск конкретного теста
npx playwright test book-catalog.spec.js
```

---

## 📊 CI/CD интеграция

### GitHub Actions для тестирования

Создайте файл `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: bookstore_user
          POSTGRES_DB: bookstore_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:coverage
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: bookstore_test
          DB_USER: bookstore_user
          DB_PASSWORD: test_password

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start server
        run: npm start &
        env:
          NODE_ENV: test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## 🎯 Заключение

Поздравляем! Вы завершили создание полнофункционального интернет-магазина книг.

### ✅ Что вы создали:

1. **Backend API** на Node.js + Express + PostgreSQL
2. **Frontend** с современным адаптивным дизайном
3. **Систему аутентификации** с JWT токенами
4. **Корзину покупок** и управление заказами
5. **Админ-панель** для управления контентом
6. **Полную систему тестирования** (Unit, Integration, E2E)
7. **API документацию** со Swagger
8. **Деплой на VDS** с SSL и мониторингом

### 📈 Возможности для развития:

- Интеграция с платежными системами
- Система отзывов и рейтингов
- Мобильное приложение
- Рекомендательная система
- Многоязычность
- Система скидок и промокодов

### 🔧 Поддержка проекта:

- Регулярно обновляйте зависимости
- Мониторьте производительность
- Создавайте резервные копии
- Анализируйте метрики пользователей

**Удачи в развитии вашего проекта! 🚀**

---

_Время выполнения: ~3-4 часа_  
_Сложность: 🟡 Средняя_

_Общее время всего курса: 48-71 час_
