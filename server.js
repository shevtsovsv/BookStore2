require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware безопасности
app.use(
  helmet({
    contentSecurityPolicy: false, // Отключаем для локальной разработки
  })
);

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
};
app.use(cors(corsOptions));

// Парсинг JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, "public")));

// API маршруты
const apiRoutes = require("./src/routes/api");
const authRoutes = require("./src/routes/auth");
const booksRoutes = require("./src/routes/books");
const categoriesRoutes = require("./src/routes/categories");
const publishersRoutes = require("./src/routes/publishers");
const authorsRoutes = require("./src/routes/authors");
const cartRoutes = require("./src/routes/cart");

// Подключение API маршрутов
app.use("/api", apiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/publishers", publishersRoutes);
app.use("/api/authors", authorsRoutes);
app.use("/api/cart", cartRoutes);

// Базовый роут для проверки сервера
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Сервер работает",
    timestamp: new Date().toISOString(),
  });
});

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: "Страница не найдена" });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Произошла ошибка сервера",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📝 Окружение: ${process.env.NODE_ENV}`);
});
