# ⚡ Оптимизация производительности

> **Сложность:** 🔴 Сложная  
> **Время выполнения:** 4-5 часов  
> **Предварительные требования:** Завершение части 14

## 🎯 Цели этой части

В этой части вы оптимизируете производительность приложения:

- Кэширование данных и запросов
- Оптимизация базы данных
- Сжатие и минификация ресурсов
- Мониторинг производительности
- CDN и статические ресурсы

---

## 🚀 Система кэширования

### 1. Redis кэш для данных

Установите Redis и настройте кэширование. Создайте файл `src/utils/cache.js`:

```javascript
const redis = require("redis");
const NodeCache = require("node-cache");

// Fallback кэш в памяти если Redis недоступен
const memoryCache = new NodeCache({
  stdTTL: 600, // 10 минут по умолчанию
  checkperiod: 120, // проверка каждые 2 минуты
  deleteOnExpire: true,
  maxKeys: 1000,
});

class CacheManager {
  constructor() {
    this.redisClient = null;
    this.isRedisConnected = false;
    this.initRedis();
  }

  async initRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redisClient.on("connect", () => {
        console.log("Redis client connected");
        this.isRedisConnected = true;
      });

      this.redisClient.on("error", (err) => {
        console.error("Redis client error:", err);
        this.isRedisConnected = false;
      });

      this.redisClient.on("end", () => {
        console.log("Redis client disconnected");
        this.isRedisConnected = false;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn("Redis not available, using memory cache:", error.message);
      this.isRedisConnected = false;
    }
  }

  // Получение данных из кэша
  async get(key) {
    try {
      if (this.isRedisConnected) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return memoryCache.get(key) || null;
      }
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  // Сохранение данных в кэш
  async set(key, value, ttl = 600) {
    try {
      if (this.isRedisConnected) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        memoryCache.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  // Удаление из кэша
  async del(key) {
    try {
      if (this.isRedisConnected) {
        await this.redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  // Удаление по паттерну
  async delPattern(pattern) {
    try {
      if (this.isRedisConnected) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        const keys = memoryCache.keys();
        keys.forEach((key) => {
          if (key.includes(pattern.replace("*", ""))) {
            memoryCache.del(key);
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Cache pattern delete error:", error);
      return false;
    }
  }

  // Проверка существования ключа
  async exists(key) {
    try {
      if (this.isRedisConnected) {
        return await this.redisClient.exists(key);
      } else {
        return memoryCache.has(key);
      }
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  // Получение времени жизни ключа
  async ttl(key) {
    try {
      if (this.isRedisConnected) {
        return await this.redisClient.ttl(key);
      } else {
        return memoryCache.getTtl(key);
      }
    } catch (error) {
      console.error("Cache TTL error:", error);
      return -1;
    }
  }

  // Инкремент значения
  async incr(key, amount = 1) {
    try {
      if (this.isRedisConnected) {
        return await this.redisClient.incrBy(key, amount);
      } else {
        const current = memoryCache.get(key) || 0;
        const newValue = current + amount;
        memoryCache.set(key, newValue);
        return newValue;
      }
    } catch (error) {
      console.error("Cache increment error:", error);
      return null;
    }
  }

  // Статистика кэша
  async getStats() {
    try {
      if (this.isRedisConnected) {
        const info = await this.redisClient.info("memory");
        const keyspace = await this.redisClient.info("keyspace");
        return {
          type: "redis",
          connected: true,
          memory: info,
          keyspace: keyspace,
        };
      } else {
        return {
          type: "memory",
          connected: false,
          keys: memoryCache.keys().length,
          stats: memoryCache.getStats(),
        };
      }
    } catch (error) {
      return {
        type: "error",
        connected: false,
        error: error.message,
      };
    }
  }

  // Очистка всего кэша
  async flush() {
    try {
      if (this.isRedisConnected) {
        await this.redisClient.flushDb();
      } else {
        memoryCache.flushAll();
      }
      return true;
    } catch (error) {
      console.error("Cache flush error:", error);
      return false;
    }
  }

  // Закрытие соединения
  async close() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      memoryCache.close();
    } catch (error) {
      console.error("Cache close error:", error);
    }
  }
}

// Singleton instance
const cache = new CacheManager();

// Middleware для кэширования ответов API
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Кэшируем только GET запросы
    if (req.method !== "GET") {
      return next();
    }

    // Создаем ключ кэша на основе URL и query параметров
    const cacheKey = `api:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      // Проверяем наличие данных в кэше
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      // Перехватываем оригинальный res.json
      const originalJson = res.json;
      res.json = function (data) {
        // Сохраняем только успешные ответы
        if (res.statusCode === 200 && data) {
          cache.set(cacheKey, data, duration);
        }
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Кэш-стратегии для разных типов данных
const CacheStrategies = {
  // Книги - кэшируем на 1 час
  books: {
    ttl: 3600,
    keyPrefix: "books:",
    tags: ["books", "catalog"],
  },

  // Категории - кэшируем на 6 часов
  categories: {
    ttl: 21600,
    keyPrefix: "categories:",
    tags: ["categories", "navigation"],
  },

  // Авторы - кэшируем на 2 часа
  authors: {
    ttl: 7200,
    keyPrefix: "authors:",
    tags: ["authors", "catalog"],
  },

  // Поиск - кэшируем на 30 минут
  search: {
    ttl: 1800,
    keyPrefix: "search:",
    tags: ["search", "temporary"],
  },

  // Статистика - кэшируем на 5 минут
  stats: {
    ttl: 300,
    keyPrefix: "stats:",
    tags: ["statistics", "admin"],
  },

  // Пользовательские данные - кэшируем на 15 минут
  users: {
    ttl: 900,
    keyPrefix: "users:",
    tags: ["users", "profile"],
  },
};

// Функции для работы с типизированным кэшем
const typedCache = {
  // Получение книг с кэшированием
  async getBooks(filters = {}) {
    const key = `${CacheStrategies.books.keyPrefix}${JSON.stringify(filters)}`;
    return await cache.get(key);
  },

  async setBooks(filters = {}, data) {
    const key = `${CacheStrategies.books.keyPrefix}${JSON.stringify(filters)}`;
    return await cache.set(key, data, CacheStrategies.books.ttl);
  },

  // Получение категорий с кэшированием
  async getCategories() {
    const key = `${CacheStrategies.categories.keyPrefix}all`;
    return await cache.get(key);
  },

  async setCategories(data) {
    const key = `${CacheStrategies.categories.keyPrefix}all`;
    return await cache.set(key, data, CacheStrategies.categories.ttl);
  },

  // Инвалидация кэша по тегам
  async invalidateByTag(tag) {
    const patterns = Object.values(CacheStrategies)
      .filter((strategy) => strategy.tags.includes(tag))
      .map((strategy) => `${strategy.keyPrefix}*`);

    for (const pattern of patterns) {
      await cache.delPattern(pattern);
    }
  },

  // Warm up кэша популярными данными
  async warmUp() {
    console.log("Warming up cache...");

    try {
      // Предзагрузка категорий
      const { Category } = require("../models");
      const categories = await Category.findAll();
      await this.setCategories(categories);

      // Предзагрузка популярных книг
      const { Book } = require("../models");
      const popularBooks = await Book.findAll({
        limit: 20,
        order: [["createdAt", "DESC"]],
      });
      await this.setBooks({ popular: true }, popularBooks);

      console.log("Cache warmed up successfully");
    } catch (error) {
      console.error("Cache warm up error:", error);
    }
  },
};

module.exports = {
  cache,
  cacheMiddleware,
  CacheStrategies,
  typedCache,
};
```

### 2. Оптимизация запросов к базе данных

Создайте файл `src/utils/dbOptimization.js`:

```javascript
const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");

class DatabaseOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.queryStats = new Map();
  }

  // Анализ медленных запросов
  async analyzeSlowQueries() {
    try {
      const slowQueries = await sequelize.query(
        `
        SELECT 
          query,
          mean_exec_time,
          calls,
          total_exec_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_exec_time > 100 
        ORDER BY mean_exec_time DESC 
        LIMIT 20
      `,
        { type: QueryTypes.SELECT }
      );

      return slowQueries;
    } catch (error) {
      console.error("Error analyzing slow queries:", error);
      return [];
    }
  }

  // Анализ использования индексов
  async analyzeIndexUsage() {
    try {
      const indexStats = await sequelize.query(
        `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
      `,
        { type: QueryTypes.SELECT }
      );

      // Неиспользуемые индексы
      const unusedIndexes = await sequelize.query(
        `
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 
        AND indexdef NOT LIKE '%UNIQUE%'
      `,
        { type: QueryTypes.SELECT }
      );

      return { indexStats, unusedIndexes };
    } catch (error) {
      console.error("Error analyzing index usage:", error);
      return { indexStats: [], unusedIndexes: [] };
    }
  }

  // Создание рекомендуемых индексов
  async createRecommendedIndexes() {
    const indexes = [
      // Индексы для поиска книг
      {
        name: "idx_books_search",
        table: "Books",
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_search 
                 ON "Books" USING gin(to_tsvector('russian', title || ' ' || COALESCE(description, '')))`,
      },

      // Индекс для фильтрации по категории и цене
      {
        name: "idx_books_category_price",
        table: "Books",
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_category_price 
                 ON "Books" (category_id, price) WHERE is_active = true`,
      },

      // Индекс для сортировки по дате создания
      {
        name: "idx_books_created_active",
        table: "Books",
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_created_active 
                 ON "Books" (created_at DESC) WHERE is_active = true`,
      },

      // Индекс для корзины пользователя
      {
        name: "idx_cart_user_book",
        table: "CartItems",
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_user_book 
                 ON "CartItems" (user_id, book_id)`,
      },

      // Составной индекс для авторов книг
      {
        name: "idx_book_authors_composite",
        table: "BookAuthors",
        query: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_authors_composite 
                 ON "BookAuthors" (book_id, author_id)`,
      },
    ];

    const results = [];

    for (const index of indexes) {
      try {
        console.log(`Creating index: ${index.name}`);
        await sequelize.query(index.query);
        results.push({ name: index.name, status: "created" });
      } catch (error) {
        console.error(`Error creating index ${index.name}:`, error.message);
        results.push({
          name: index.name,
          status: "error",
          error: error.message,
        });
      }
    }

    return results;
  }

  // Оптимизация конфигурации базы данных
  async optimizeDatabase() {
    const optimizations = [
      // Увеличение shared_buffers
      "ALTER SYSTEM SET shared_buffers = '256MB'",

      // Оптимизация work_mem
      "ALTER SYSTEM SET work_mem = '64MB'",

      // Настройка checkpoint
      "ALTER SYSTEM SET checkpoint_completion_target = 0.9",

      // Включение статистики
      "ALTER SYSTEM SET track_activities = on",
      "ALTER SYSTEM SET track_counts = on",
      "ALTER SYSTEM SET track_io_timing = on",
    ];

    console.log("Database optimization requires manual configuration.");
    console.log("Recommended settings:");
    optimizations.forEach((setting) => console.log(setting));

    return optimizations;
  }

  // Статистика по таблицам
  async getTableStats() {
    try {
      const stats = await sequelize.query(
        `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `,
        { type: QueryTypes.SELECT }
      );

      return stats;
    } catch (error) {
      console.error("Error getting table stats:", error);
      return [];
    }
  }

  // Очистка статистики
  async resetStats() {
    try {
      await sequelize.query("SELECT pg_stat_reset()");
      console.log("Database statistics reset");
      return true;
    } catch (error) {
      console.error("Error resetting stats:", error);
      return false;
    }
  }

  // VACUUM и ANALYZE таблиц
  async maintenanceTables() {
    const tables = [
      "Books",
      "Users",
      "Categories",
      "Authors",
      "CartItems",
      "BookAuthors",
    ];
    const results = [];

    for (const table of tables) {
      try {
        // VACUUM ANALYZE для каждой таблицы
        await sequelize.query(`VACUUM ANALYZE "${table}"`);
        results.push({ table, status: "completed" });
        console.log(`Maintenance completed for table: ${table}`);
      } catch (error) {
        results.push({ table, status: "error", error: error.message });
        console.error(`Maintenance error for table ${table}:`, error.message);
      }
    }

    return results;
  }

  // Мониторинг активности базы данных
  async getActivityStats() {
    try {
      const activity = await sequelize.query(
        `
        SELECT 
          datname as database,
          numbackends as connections,
          xact_commit as commits,
          xact_rollback as rollbacks,
          blks_read as disk_reads,
          blks_hit as cache_hits,
          temp_files,
          temp_bytes,
          deadlocks
        FROM pg_stat_database 
        WHERE datname = current_database()
      `,
        { type: QueryTypes.SELECT }
      );

      const locks = await sequelize.query(
        `
        SELECT 
          mode,
          COUNT(*) as count
        FROM pg_locks 
        WHERE granted = true
        GROUP BY mode
        ORDER BY count DESC
      `,
        { type: QueryTypes.SELECT }
      );

      return { activity: activity[0], locks };
    } catch (error) {
      console.error("Error getting activity stats:", error);
      return { activity: {}, locks: [] };
    }
  }
}

// Middleware для логирования медленных запросов
const queryLogger = (sequelize) => {
  sequelize.addHook("beforeQuery", (options, query) => {
    query.startTime = Date.now();
  });

  sequelize.addHook("afterQuery", (options, query) => {
    const duration = Date.now() - query.startTime;

    if (duration > 1000) {
      // Логируем запросы дольше 1 секунды
      console.warn(`Slow query detected (${duration}ms):`, {
        sql: options.sql.substring(0, 200),
        duration,
        type: options.type,
      });
    }
  });
};

// Оптимизированные запросы для часто используемых операций
const optimizedQueries = {
  // Получение книг с полной информацией
  getBooksWithDetails: async (limit = 12, offset = 0, filters = {}) => {
    const whereConditions = ["b.is_active = true"];
    const params = { limit, offset };

    if (filters.categoryId) {
      whereConditions.push("b.category_id = :categoryId");
      params.categoryId = filters.categoryId;
    }

    if (filters.minPrice) {
      whereConditions.push("b.price >= :minPrice");
      params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice) {
      whereConditions.push("b.price <= :maxPrice");
      params.maxPrice = filters.maxPrice;
    }

    const query = `
      SELECT 
        b.id,
        b.title,
        b.subtitle,
        b.description,
        b.price,
        b.image_url,
        b.published_year,
        c.name as category_name,
        p.name as publisher_name,
        string_agg(a.name, ', ') as authors
      FROM "Books" b
      LEFT JOIN "Categories" c ON b.category_id = c.id
      LEFT JOIN "Publishers" p ON b.publisher_id = p.id
      LEFT JOIN "BookAuthors" ba ON b.id = ba.book_id
      LEFT JOIN "Authors" a ON ba.author_id = a.id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY b.id, c.name, p.name
      ORDER BY b.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    return await sequelize.query(query, {
      replacements: params,
      type: QueryTypes.SELECT,
    });
  },

  // Поиск книг с полнотекстовым поиском
  searchBooks: async (searchTerm, limit = 12) => {
    const query = `
      SELECT 
        b.id,
        b.title,
        b.subtitle,
        b.price,
        b.image_url,
        c.name as category_name,
        string_agg(a.name, ', ') as authors,
        ts_rank(to_tsvector('russian', b.title || ' ' || COALESCE(b.description, '')), 
                plainto_tsquery('russian', :searchTerm)) as rank
      FROM "Books" b
      LEFT JOIN "Categories" c ON b.category_id = c.id
      LEFT JOIN "BookAuthors" ba ON b.id = ba.book_id
      LEFT JOIN "Authors" a ON ba.author_id = a.id
      WHERE b.is_active = true
        AND to_tsvector('russian', b.title || ' ' || COALESCE(b.description, '')) 
            @@ plainto_tsquery('russian', :searchTerm)
      GROUP BY b.id, c.name, rank
      ORDER BY rank DESC, b.title
      LIMIT :limit
    `;

    return await sequelize.query(query, {
      replacements: { searchTerm, limit },
      type: QueryTypes.SELECT,
    });
  },

  // Статистика продаж
  getSalesStats: async (days = 30) => {
    const query = `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(o.id) as orders_count,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order
      FROM "Orders" o
      WHERE o.created_at >= CURRENT_DATE - INTERVAL ':days days'
        AND o.status = 'completed'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `;

    return await sequelize.query(query, {
      replacements: { days },
      type: QueryTypes.SELECT,
    });
  },
};

module.exports = {
  DatabaseOptimizer,
  queryLogger,
  optimizedQueries,
};
```

---

## 📦 Сжатие и минификация

### 1. Компрессия ресурсов

Создайте файл `src/middleware/compression.js`:

```javascript
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const { promisify } = require("util");

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

// Настройки компрессии
const compressionOptions = {
  // Уровень компрессии (1-9, где 9 - максимальный)
  level: 6,

  // Минимальный размер для компрессии
  threshold: 1024,

  // Фильтр типов файлов для компрессии
  filter: (req, res) => {
    // Не сжимать уже сжатые файлы
    if (res.getHeader("Content-Encoding")) {
      return false;
    }

    // Не сжимать изображения и видео
    const contentType = res.getHeader("Content-Type");
    if (
      contentType &&
      (contentType.includes("image/") ||
        contentType.includes("video/") ||
        contentType.includes("audio/"))
    ) {
      return false;
    }

    // Сжимать текстовые файлы
    return compression.filter(req, res);
  },

  // Предпочтительные алгоритмы сжатия
  brotli: {
    enabled: true,
    zlib: {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
      },
    },
  },
};

// Предварительное сжатие статических файлов
class StaticCompressor {
  constructor(staticDir) {
    this.staticDir = staticDir;
    this.compressedFiles = new Map();
  }

  // Сжатие файла с помощью gzip
  async compressFileGzip(filePath) {
    try {
      const data = fs.readFileSync(filePath);
      const compressed = await gzip(data);
      const gzipPath = `${filePath}.gz`;

      fs.writeFileSync(gzipPath, compressed);

      return {
        original: data.length,
        compressed: compressed.length,
        ratio: ((compressed.length / data.length) * 100).toFixed(2),
        path: gzipPath,
      };
    } catch (error) {
      console.error(`Error compressing ${filePath}:`, error);
      return null;
    }
  }

  // Сжатие файла с помощью Brotli
  async compressFileBrotli(filePath) {
    try {
      const data = fs.readFileSync(filePath);
      const compressed = await brotli(data);
      const brotliPath = `${filePath}.br`;

      fs.writeFileSync(brotliPath, compressed);

      return {
        original: data.length,
        compressed: compressed.length,
        ratio: ((compressed.length / data.length) * 100).toFixed(2),
        path: brotliPath,
      };
    } catch (error) {
      console.error(`Error compressing ${filePath} with Brotli:`, error);
      return null;
    }
  }

  // Сжатие всех подходящих файлов в директории
  async compressStaticFiles() {
    const results = {
      processed: 0,
      compressed: 0,
      totalSaved: 0,
      files: [],
    };

    try {
      const files = await this.findCompressibleFiles(this.staticDir);

      for (const file of files) {
        results.processed++;

        // Проверяем, нужно ли сжимать файл
        if (this.shouldCompress(file)) {
          const gzipResult = await this.compressFileGzip(file);
          const brotliResult = await this.compressFileBrotli(file);

          if (gzipResult || brotliResult) {
            results.compressed++;

            const fileResult = {
              original: file,
              gzip: gzipResult,
              brotli: brotliResult,
            };

            results.files.push(fileResult);

            if (gzipResult) {
              results.totalSaved += gzipResult.original - gzipResult.compressed;
            }
          }
        }
      }

      console.log(
        `Compression completed: ${results.compressed}/${results.processed} files compressed`
      );
      console.log(
        `Total space saved: ${(results.totalSaved / 1024).toFixed(2)} KB`
      );

      return results;
    } catch (error) {
      console.error("Error during static file compression:", error);
      return results;
    }
  }

  // Поиск файлов для сжатия
  async findCompressibleFiles(dir) {
    const files = [];
    const extensions = [
      ".js",
      ".css",
      ".html",
      ".json",
      ".svg",
      ".txt",
      ".xml",
    ];

    const walkDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(dir);
    return files;
  }

  // Проверка, нужно ли сжимать файл
  shouldCompress(filePath) {
    try {
      const stat = fs.statSync(filePath);

      // Сжимаем только файлы больше 1KB
      if (stat.size < 1024) {
        return false;
      }

      // Проверяем, не сжат ли уже файл
      if (fs.existsSync(`${filePath}.gz`) || fs.existsSync(`${filePath}.br`)) {
        const originalStat = stat;
        const gzipStat = fs.existsSync(`${filePath}.gz`)
          ? fs.statSync(`${filePath}.gz`)
          : null;

        // Пересжимаем, если оригинал новее
        if (gzipStat && originalStat.mtime <= gzipStat.mtime) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Middleware для обслуживания предварительно сжатых файлов
  createPreCompressedMiddleware() {
    return (req, res, next) => {
      const acceptEncoding = req.headers["accept-encoding"] || "";
      const filePath = path.join(this.staticDir, req.path);

      // Проверяем поддержку Brotli
      if (acceptEncoding.includes("br")) {
        const brotliPath = `${filePath}.br`;
        if (fs.existsSync(brotliPath)) {
          res.setHeader("Content-Encoding", "br");
          res.setHeader("Content-Type", this.getContentType(filePath));
          return res.sendFile(path.resolve(brotliPath));
        }
      }

      // Проверяем поддержку Gzip
      if (acceptEncoding.includes("gzip")) {
        const gzipPath = `${filePath}.gz`;
        if (fs.existsSync(gzipPath)) {
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Content-Type", this.getContentType(filePath));
          return res.sendFile(path.resolve(gzipPath));
        }
      }

      next();
    };
  }

  // Определение Content-Type для файла
  getContentType(filePath) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      ".js": "application/javascript",
      ".css": "text/css",
      ".html": "text/html",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".txt": "text/plain",
      ".xml": "application/xml",
    };

    return mimeTypes[ext] || "application/octet-stream";
  }

  // Очистка старых сжатых файлов
  async cleanupCompressedFiles() {
    const cleanedFiles = [];

    try {
      const allFiles = await this.findCompressibleFiles(this.staticDir);

      for (const file of allFiles) {
        const gzipFile = `${file}.gz`;
        const brotliFile = `${file}.br`;

        // Удаляем сжатые файлы, если оригинал не существует
        if (!fs.existsSync(file)) {
          if (fs.existsSync(gzipFile)) {
            fs.unlinkSync(gzipFile);
            cleanedFiles.push(gzipFile);
          }
          if (fs.existsSync(brotliFile)) {
            fs.unlinkSync(brotliFile);
            cleanedFiles.push(brotliFile);
          }
        }
      }

      console.log(
        `Cleaned up ${cleanedFiles.length} orphaned compressed files`
      );
      return cleanedFiles;
    } catch (error) {
      console.error("Error during cleanup:", error);
      return [];
    }
  }
}

// Middleware для кэширования и компрессии статических файлов
const staticCacheMiddleware = (maxAge = 86400) => {
  return (req, res, next) => {
    // Устанавливаем заголовки кэширования для статических файлов
    const staticExtensions = [
      ".js",
      ".css",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".ico",
      ".woff",
      ".woff2",
    ];
    const ext = path.extname(req.path);

    if (staticExtensions.includes(ext)) {
      res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
      res.setHeader(
        "ETag",
        require("crypto").createHash("md5").update(req.path).digest("hex")
      );
    }

    next();
  };
};

module.exports = {
  compressionOptions,
  StaticCompressor,
  staticCacheMiddleware,
};
```

---

## 📊 Мониторинг производительности

### 1. Performance Monitor

Создайте файл `src/utils/performanceMonitor.js`:

```javascript
const os = require("os");
const process = require("process");
const { performance } = require("perf_hooks");

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      startTime: Date.now(),
    };

    this.requestTimes = [];
    this.maxRequestTimeHistory = 1000;

    // Запуск мониторинга системных ресурсов
    this.startSystemMonitoring();
  }

  // Middleware для мониторинга запросов
  createRequestMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = performance.now();
      req.startTime = startTime;

      // Перехватываем завершение ответа
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Обновляем метрики
        this.recordRequest(responseTime, res.statusCode);

        // Логируем медленные запросы
        if (responseTime > 5000) {
          // более 5 секунд
          console.warn(`Slow request detected:`, {
            method: req.method,
            url: req.originalUrl,
            responseTime: `${responseTime.toFixed(2)}ms`,
            statusCode: res.statusCode,
            userAgent: req.get("User-Agent"),
            ip: req.ip,
          });
        }

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Запись метрик запроса
  recordRequest(responseTime, statusCode) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime =
      this.metrics.totalResponseTime / this.metrics.requests;

    if (statusCode >= 400) {
      this.metrics.errors++;
    }

    // Сохраняем время ответа
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > this.maxRequestTimeHistory) {
      this.requestTimes.shift();
    }
  }

  // Получение текущих метрик
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      // Метрики приложения
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate:
        this.metrics.requests > 0
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
          : 0,
      averageResponseTime: this.metrics.averageResponseTime.toFixed(2),
      uptime: Date.now() - this.metrics.startTime,

      // Метрики памяти
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },

      // Метрики CPU
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        usage: this.getCpuPercentage(),
      },

      // Метрики системы
      system: {
        loadAverage: os.loadavg(),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
        freeMemory: Math.round(os.freemem() / 1024 / 1024),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
      },

      // Статистика времени ответа
      responseTime: this.getResponseTimeStats(),
    };
  }

  // Статистика времени ответа
  getResponseTimeStats() {
    if (this.requestTimes.length === 0) {
      return { min: 0, max: 0, median: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      min: sorted[0].toFixed(2),
      max: sorted[len - 1].toFixed(2),
      median: sorted[Math.floor(len / 2)].toFixed(2),
      p95: sorted[Math.floor(len * 0.95)].toFixed(2),
      p99: sorted[Math.floor(len * 0.99)].toFixed(2),
    };
  }

  // Процент использования CPU
  getCpuPercentage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;

    return (100 - ~~((100 * idle) / total)).toFixed(2);
  }

  // Проверка здоровья системы
  healthCheck() {
    const metrics = this.getMetrics();
    const issues = [];

    // Проверка памяти
    if (metrics.memory.used > metrics.memory.total * 0.9) {
      issues.push({
        type: "memory",
        level: "critical",
        message: `High memory usage: ${metrics.memory.used}MB / ${metrics.memory.total}MB`,
      });
    } else if (metrics.memory.used > metrics.memory.total * 0.8) {
      issues.push({
        type: "memory",
        level: "warning",
        message: `Memory usage warning: ${metrics.memory.used}MB / ${metrics.memory.total}MB`,
      });
    }

    // Проверка CPU
    if (parseFloat(metrics.cpu.usage) > 90) {
      issues.push({
        type: "cpu",
        level: "critical",
        message: `High CPU usage: ${metrics.cpu.usage}%`,
      });
    } else if (parseFloat(metrics.cpu.usage) > 70) {
      issues.push({
        type: "cpu",
        level: "warning",
        message: `CPU usage warning: ${metrics.cpu.usage}%`,
      });
    }

    // Проверка времени ответа
    if (parseFloat(metrics.averageResponseTime) > 2000) {
      issues.push({
        type: "response_time",
        level: "warning",
        message: `Slow response time: ${metrics.averageResponseTime}ms average`,
      });
    }

    // Проверка ошибок
    if (parseFloat(metrics.errorRate) > 5) {
      issues.push({
        type: "error_rate",
        level: "warning",
        message: `High error rate: ${metrics.errorRate}%`,
      });
    }

    return {
      status:
        issues.length === 0
          ? "healthy"
          : issues.some((i) => i.level === "critical")
          ? "critical"
          : "warning",
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  // Мониторинг системных ресурсов
  startSystemMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();

      // Отслеживаем пиковое использование памяти
      if (memUsage.heapUsed > this.metrics.peakMemoryUsage) {
        this.metrics.peakMemoryUsage = memUsage.heapUsed;
      }

      // Логируем критические состояния
      const metrics = this.getMetrics();
      const health = this.healthCheck();

      if (health.status === "critical") {
        console.error("CRITICAL SYSTEM STATE:", health.issues);
      }

      // Принудительная очистка мусора при высоком использовании памяти
      if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
        if (global.gc) {
          global.gc();
          console.log("Forced garbage collection triggered");
        }
      }
    }, 30000); // Каждые 30 секунд
  }

  // Генерация отчета производительности
  generateReport() {
    const metrics = this.getMetrics();
    const health = this.healthCheck();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        status: health.status,
        uptime: `${Math.floor(metrics.uptime / 1000 / 60)} minutes`,
        requests: metrics.requests,
        errorRate: `${metrics.errorRate}%`,
        avgResponseTime: `${metrics.averageResponseTime}ms`,
      },
      performance: metrics,
      health: health,
      recommendations: this.getRecommendations(metrics, health),
    };
  }

  // Получение рекомендаций по оптимизации
  getRecommendations(metrics, health) {
    const recommendations = [];

    // Рекомендации по памяти
    if (metrics.memory.used > 512) {
      recommendations.push({
        type: "memory",
        priority: "medium",
        suggestion:
          "Consider implementing memory-efficient data structures or increasing available memory",
      });
    }

    // Рекомендации по времени ответа
    if (parseFloat(metrics.averageResponseTime) > 1000) {
      recommendations.push({
        type: "performance",
        priority: "high",
        suggestion:
          "Optimize database queries and implement caching strategies",
      });
    }

    // Рекомендации по ошибкам
    if (parseFloat(metrics.errorRate) > 2) {
      recommendations.push({
        type: "reliability",
        priority: "high",
        suggestion: "Investigate and fix sources of errors in the application",
      });
    }

    return recommendations;
  }

  // Сброс метрик
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      startTime: Date.now(),
    };
    this.requestTimes = [];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = {
  PerformanceMonitor,
  performanceMonitor,
};
```

---

## 📋 Задания для самопроверки

1. **Настройте Redis кэширование** с разными стратегиями TTL
2. **Создайте индексы для базы данных** и измерьте улучшение
3. **Реализуйте предварительное сжатие** статических файлов
4. **Настройте мониторинг производительности** с алертами

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Эффективная система кэширования  
✅ Оптимизированная база данных  
✅ Сжатие ресурсов  
✅ Мониторинг производительности

**Следующий шаг:** [16_PRODUCTION_PREPARATION.md](16_PRODUCTION_PREPARATION.md) - подготовка к продакшену.

---

_Время выполнения: ~4-5 часов_  
_Сложность: 🔴 Сложная_
