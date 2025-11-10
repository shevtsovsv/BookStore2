# 🛒 API корзины покупок

> **Сложность:** 🟡 Средняя  
> **Время выполнения:** 3-4 часа  
> **Предварительные требования:** Завершение части 08

## 🎯 Цели этой части

В этой части вы создадите полноценную систему корзины покупок с:

- Добавлением товаров в корзину
- Управлением количеством товаров
- Расчетом стоимости
- Системой заказов
- Историей покупок

---

## 🛒 Модель корзины (улучшенная)

### 1. Обновленная модель CartItem

Обновите файл `models/CartItem.js`:

```javascript
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
      });

      CartItem.belongsTo(models.Book, {
        foreignKey: "bookId",
        as: "book",
      });
    }

    // Метод для расчета общей стоимости позиции
    getTotalPrice() {
      return this.quantity * this.priceAtTime;
    }

    // Метод для обновления цены из книги
    async updatePriceFromBook() {
      const book = await this.getBook();
      if (book) {
        this.priceAtTime = book.price;
        await this.save();
      }
    }
  }

  CartItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Books",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 10, // Максимальное количество одной книги
        },
      },
      priceAtTime: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Цена книги на момент добавления в корзину",
      },
      addedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "CartItem",
      tableName: "cart_items",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId", "bookId"],
          name: "unique_user_book_cart",
        },
        {
          fields: ["userId"],
          name: "cart_user_index",
        },
      ],
    }
  );

  return CartItem;
};
```

### 2. Модель заказов

Создайте файл `models/Order.js`:

```javascript
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      Order.hasMany(models.OrderItem, {
        foreignKey: "orderId",
        as: "items",
        onDelete: "CASCADE",
      });
    }

    // Метод для подсчета общей суммы заказа
    async calculateTotal() {
      const items = await this.getItems();
      return items.reduce(
        (total, item) => total + item.quantity * item.price,
        0
      );
    }

    // Метод для получения статуса заказа с переводом
    getStatusText() {
      const statusMap = {
        pending: "Ожидает подтверждения",
        confirmed: "Подтвержден",
        processing: "Обрабатывается",
        shipped: "Отправлен",
        delivered: "Доставлен",
        cancelled: "Отменен",
        refunded: "Возвращен",
      };
      return statusMap[this.status] || this.status;
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "Уникальный номер заказа",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shippingAddress: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Адрес доставки в формате JSON",
      },
      paymentMethod: {
        type: DataTypes.ENUM("cash", "card", "online"),
        allowNull: false,
        defaultValue: "cash",
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Комментарии к заказу",
      },
      estimatedDelivery: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actualDelivery: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      hooks: {
        beforeCreate: async (order) => {
          // Генерация уникального номера заказа
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
          order.orderNumber = `BK${timestamp}${random}`;
        },
      },
    }
  );

  return Order;
};
```

### 3. Модель позиций заказа

Создайте файл `models/OrderItem.js`:

```javascript
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });

      OrderItem.belongsTo(models.Book, {
        foreignKey: "bookId",
        as: "book",
      });
    }

    // Метод для расчета общей стоимости позиции
    getTotalPrice() {
      return this.quantity * this.price;
    }
  }

  OrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
      },
      bookId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Books",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Цена книги на момент заказа",
      },
      bookTitle: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Название книги на момент заказа",
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      timestamps: true,
    }
  );

  return OrderItem;
};
```

---

## 🛒 Контроллер корзины

### 1. Основной контроллер корзины

Создайте файл `src/controllers/cartController.js`:

```javascript
const { CartItem, Book, Author, Category, User } = require("../../models");
const { asyncHandler } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

/**
 * @desc    Получить корзину пользователя
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Book,
        as: "book",
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name"],
          },
          {
            model: Author,
            as: "authors",
            attributes: ["id", "firstName", "lastName"],
            through: { attributes: [] },
          },
        ],
      },
    ],
    order: [["addedAt", "DESC"]],
  });

  // Проверка доступности книг и актуальности цен
  const updatedItems = await Promise.all(
    cartItems.map(async (item) => {
      const itemJson = item.toJSON();

      // Проверяем, доступна ли еще книга
      if (!item.book.isActive) {
        itemJson.isUnavailable = true;
        itemJson.unavailableReason = "Книга больше недоступна";
      }

      // Проверяем, изменилась ли цена
      if (item.book.price !== item.priceAtTime) {
        itemJson.priceChanged = true;
        itemJson.currentPrice = item.book.price;
        itemJson.oldPrice = item.priceAtTime;
      }

      return itemJson;
    })
  );

  // Подсчет общей суммы корзины
  const totalAmount = cartItems
    .filter((item) => item.book.isActive)
    .reduce((total, item) => total + item.quantity * item.priceAtTime, 0);

  const totalItems = cartItems
    .filter((item) => item.book.isActive)
    .reduce((total, item) => total + item.quantity, 0);

  res.status(200).json({
    success: true,
    data: {
      cartItems: updatedItems,
      summary: {
        totalItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        itemCount: cartItems.length,
      },
    },
  });
});

/**
 * @desc    Добавить товар в корзину
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { bookId, quantity = 1 } = req.body;

  // Проверка существования книги
  const book = await Book.findByPk(bookId);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Книга не найдена",
    });
  }

  if (!book.isActive) {
    return res.status(400).json({
      success: false,
      message: "Книга недоступна для покупки",
    });
  }

  // Проверка лимита количества
  if (quantity > 10) {
    return res.status(400).json({
      success: false,
      message: "Максимальное количество одной книги - 10 экземпляров",
    });
  }

  // Поиск существующей позиции в корзине
  let cartItem = await CartItem.findOne({
    where: {
      userId: req.user.id,
      bookId: bookId,
    },
  });

  if (cartItem) {
    // Обновление количества существующей позиции
    const newQuantity = cartItem.quantity + quantity;

    if (newQuantity > 10) {
      return res.status(400).json({
        success: false,
        message:
          "Общее количество этой книги в корзине не может превышать 10 экземпляров",
      });
    }

    cartItem.quantity = newQuantity;
    cartItem.priceAtTime = book.price; // Обновляем цену
    await cartItem.save();
  } else {
    // Создание новой позиции в корзине
    cartItem = await CartItem.create({
      userId: req.user.id,
      bookId: bookId,
      quantity: quantity,
      priceAtTime: book.price,
    });
  }

  // Получение обновленной позиции с книгой
  const cartItemWithBook = await CartItem.findByPk(cartItem.id, {
    include: [
      {
        model: Book,
        as: "book",
        include: [
          { model: Category, as: "category", attributes: ["name"] },
          {
            model: Author,
            as: "authors",
            attributes: ["firstName", "lastName"],
          },
        ],
      },
    ],
  });

  res.status(201).json({
    success: true,
    data: { cartItem: cartItemWithBook },
    message: "Товар добавлен в корзину",
  });
});

/**
 * @desc    Обновить количество товара в корзине
 * @route   PUT /api/cart/update/:id
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (quantity < 1 || quantity > 10) {
    return res.status(400).json({
      success: false,
      message: "Количество должно быть от 1 до 10",
    });
  }

  const cartItem = await CartItem.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: [{ model: Book, as: "book" }],
  });

  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: "Позиция в корзине не найдена",
    });
  }

  // Обновление количества и цены
  cartItem.quantity = quantity;
  cartItem.priceAtTime = cartItem.book.price; // Обновляем цену
  await cartItem.save();

  res.status(200).json({
    success: true,
    data: { cartItem },
    message: "Количество обновлено",
  });
});

/**
 * @desc    Удалить товар из корзины
 * @route   DELETE /api/cart/remove/:id
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const cartItem = await CartItem.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: "Позиция в корзине не найдена",
    });
  }

  await cartItem.destroy();

  res.status(200).json({
    success: true,
    message: "Товар удален из корзины",
  });
});

/**
 * @desc    Очистить корзину
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  await CartItem.destroy({
    where: { userId: req.user.id },
  });

  res.status(200).json({
    success: true,
    message: "Корзина очищена",
  });
});

/**
 * @desc    Синхронизировать цены в корзине
 * @route   POST /api/cart/sync-prices
 * @access  Private
 */
const syncPrices = asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { userId: req.user.id },
    include: [{ model: Book, as: "book" }],
  });

  const updatedItems = [];

  for (const item of cartItems) {
    if (item.book.price !== item.priceAtTime) {
      item.priceAtTime = item.book.price;
      await item.save();
      updatedItems.push(item);
    }
  }

  res.status(200).json({
    success: true,
    data: { updatedItems },
    message: `Обновлено цен: ${updatedItems.length}`,
  });
});

/**
 * @desc    Проверить доступность товаров в корзине
 * @route   GET /api/cart/validate
 * @access  Private
 */
const validateCart = asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { userId: req.user.id },
    include: [{ model: Book, as: "book" }],
  });

  const issues = [];
  const validItems = [];

  for (const item of cartItems) {
    const itemIssues = [];

    // Проверка доступности книги
    if (!item.book.isActive) {
      itemIssues.push("Книга больше недоступна");
    }

    // Проверка изменения цены
    if (item.book.price !== item.priceAtTime) {
      itemIssues.push(
        `Цена изменилась с ${item.priceAtTime} на ${item.book.price}`
      );
    }

    if (itemIssues.length > 0) {
      issues.push({
        cartItemId: item.id,
        bookTitle: item.book.title,
        issues: itemIssues,
      });
    } else {
      validItems.push(item);
    }
  }

  res.status(200).json({
    success: true,
    data: {
      isValid: issues.length === 0,
      issues,
      validItemsCount: validItems.length,
      totalItemsCount: cartItems.length,
    },
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncPrices,
  validateCart,
};
```

---

## 📦 Контроллер заказов

### 1. Основной контроллер заказов

Создайте файл `src/controllers/ordersController.js`:

```javascript
const {
  Order,
  OrderItem,
  CartItem,
  Book,
  User,
  sequelize,
} = require("../../models");
const { asyncHandler } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

/**
 * @desc    Создать заказ из корзины
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "cash", notes } = req.body;

  // Валидация адреса доставки
  if (!shippingAddress || !shippingAddress.address || !shippingAddress.phone) {
    return res.status(400).json({
      success: false,
      message: "Необходимо указать полный адрес доставки и телефон",
    });
  }

  // Получение товаров из корзины
  const cartItems = await CartItem.findAll({
    where: { userId: req.user.id },
    include: [{ model: Book, as: "book" }],
  });

  if (cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Корзина пуста",
    });
  }

  // Проверка доступности всех товаров
  const unavailableItems = cartItems.filter((item) => !item.book.isActive);
  if (unavailableItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Некоторые товары больше недоступны",
      data: { unavailableItems },
    });
  }

  // Расчет общей суммы заказа
  const totalAmount = cartItems.reduce((total, item) => {
    return total + item.quantity * item.book.price;
  }, 0);

  // Транзакция для создания заказа
  const transaction = await sequelize.transaction();

  try {
    // Создание заказа
    const order = await Order.create(
      {
        userId: req.user.id,
        totalAmount,
        shippingAddress,
        paymentMethod,
        notes,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
      },
      { transaction }
    );

    // Создание позиций заказа
    const orderItems = await Promise.all(
      cartItems.map((cartItem) =>
        OrderItem.create(
          {
            orderId: order.id,
            bookId: cartItem.bookId,
            quantity: cartItem.quantity,
            price: cartItem.book.price,
            bookTitle: cartItem.book.title,
          },
          { transaction }
        )
      )
    );

    // Очистка корзины
    await CartItem.destroy({
      where: { userId: req.user.id },
      transaction,
    });

    await transaction.commit();

    // Получение заказа с позициями
    const orderWithItems = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["id", "title", "imageUrl"],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: { order: orderWithItems },
      message: "Заказ успешно создан",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * @desc    Получить заказы пользователя
 * @route   GET /api/orders
 * @access  Private
 */
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

  const offset = (page - 1) * limit;

  const where = { userId: req.user.id };

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Book,
            as: "book",
            attributes: ["id", "title", "imageUrl", "slug"],
          },
        ],
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    success: true,
    data: {
      orders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    },
  });
});

/**
 * @desc    Получить заказ по ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Book,
            as: "book",
          },
        ],
      },
    ],
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Заказ не найден",
    });
  }

  res.status(200).json({
    success: true,
    data: { order },
  });
});

/**
 * @desc    Отменить заказ
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Заказ не найден",
    });
  }

  // Проверка возможности отмены
  if (!["pending", "confirmed"].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: "Заказ нельзя отменить на текущем этапе",
    });
  }

  order.status = "cancelled";
  await order.save();

  res.status(200).json({
    success: true,
    data: { order },
    message: "Заказ отменен",
  });
});

/**
 * @desc    Повторить заказ (добавить товары в корзину)
 * @route   POST /api/orders/:id/repeat
 * @access  Private
 */
const repeatOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Book, as: "book" }],
      },
    ],
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Заказ не найден",
    });
  }

  const addedItems = [];
  const unavailableItems = [];

  for (const orderItem of order.items) {
    if (!orderItem.book.isActive) {
      unavailableItems.push({
        title: orderItem.bookTitle,
        reason: "Книга больше недоступна",
      });
      continue;
    }

    // Попытка добавить в корзину
    const [cartItem, created] = await CartItem.findOrCreate({
      where: {
        userId: req.user.id,
        bookId: orderItem.bookId,
      },
      defaults: {
        quantity: orderItem.quantity,
        priceAtTime: orderItem.book.price,
      },
    });

    if (!created) {
      const newQuantity = Math.min(cartItem.quantity + orderItem.quantity, 10);
      cartItem.quantity = newQuantity;
      cartItem.priceAtTime = orderItem.book.price;
      await cartItem.save();
    }

    addedItems.push({
      title: orderItem.bookTitle,
      quantity: orderItem.quantity,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      addedItems,
      unavailableItems,
    },
    message: `Добавлено в корзину: ${addedItems.length} товаров`,
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  repeatOrder,
};
```

---

## 🛣️ Маршруты корзины и заказов

### 1. Маршруты корзины

Создайте файл `src/routes/cart.js`:

```javascript
const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncPrices,
  validateCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(protect);

router.get("/", getCart);
router.get("/validate", validateCart);
router.post("/add", validate(schemas.addToCart), addToCart);
router.post("/sync-prices", syncPrices);
router.put("/update/:id", updateCartItem);
router.delete("/remove/:id", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;
```

### 2. Маршруты заказов

Создайте файл `src/routes/orders.js`:

```javascript
const express = require("express");
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  repeatOrder,
} = require("../controllers/ordersController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(protect);

router.get("/", getOrders);
router.post("/", validate(schemas.createOrder), createOrder);
router.get("/:id", getOrder);
router.put("/:id/cancel", cancelOrder);
router.post("/:id/repeat", repeatOrder);

module.exports = router;
```

---

## ✅ Схемы валидации

### 1. Дополнительные схемы валидации

Добавьте в файл `src/middleware/validation.js`:

```javascript
// Добавьте эти схемы к существующим

const addToCartSchema = Joi.object({
  bookId: Joi.number().integer().positive().required().messages({
    "number.base": "ID книги должен быть числом",
    "number.positive": "ID книги должен быть положительным",
    "any.required": "ID книги обязателен",
  }),
  quantity: Joi.number().integer().min(1).max(10).default(1).messages({
    "number.min": "Количество должно быть минимум 1",
    "number.max": "Максимальное количество - 10",
  }),
});

const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    address: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    postalCode: Joi.string().min(5).max(10).required(),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .required(),
    email: Joi.string().email().optional(),
  }).required(),
  paymentMethod: Joi.string().valid("cash", "card", "online").default("cash"),
  notes: Joi.string().max(500).optional(),
});

// Добавьте к экспорту schemas
const schemas = {
  // ... существующие схемы
  addToCart: addToCartSchema,
  createOrder: createOrderSchema,
};
```

---

## 📊 Миграции для новых таблиц

### 1. Миграция для заказов

Создайте миграцию для таблицы заказов:

```bash
npx sequelize-cli migration:generate --name create-orders
```

```javascript
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("orders", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      shippingAddress: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.ENUM("cash", "card", "online"),
        allowNull: false,
        defaultValue: "cash",
      },
      paymentStatus: {
        type: Sequelize.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estimatedDelivery: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actualDelivery: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Индексы
    await queryInterface.addIndex("orders", ["userId"]);
    await queryInterface.addIndex("orders", ["orderNumber"]);
    await queryInterface.addIndex("orders", ["status"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("orders");
  },
};
```

### 2. Миграция для позиций заказов

```bash
npx sequelize-cli migration:generate --name create-order-items
```

---

## 📋 Задания для самопроверки

1. **Добавьте промокоды** и систему скидок
2. **Реализуйте отложенные покупки** (wishlist)
3. **Создайте систему уведомлений** о статусе заказа
4. **Добавьте интеграцию с платежными системами**

---

## 🎯 Что дальше?

После завершения этой части у вас будет:

✅ Полнофункциональная корзина покупок  
✅ Система заказов с отслеживанием статуса  
✅ Валидация товаров и цен  
✅ История покупок

**Следующий шаг:** [10_HTML_STRUCTURE.md](10_HTML_STRUCTURE.md) - создание HTML структуры frontend-части.

---

_Время выполнения: ~3-4 часа_  
_Сложность: 🟡 Средняя_
