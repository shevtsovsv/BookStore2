const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticateToken } = require("../middleware/auth");
const {
  validateCartItemId,
  validateAddToCart,
  validateUpdateQuantity,
} = require("../middleware/cartValidation");

// Все маршруты корзины требуют аутентификации
router.use(authenticateToken);

/**
 * @route   GET /api/cart
 * @desc    Получение корзины текущего пользователя
 * @access  Private
 */
router.get("/", cartController.getCart);

/**
 * @route   POST /api/cart
 * @desc    Добавление книги в корзину
 * @access  Private
 * @body    { bookId: number, quantity?: number }
 */
router.post("/", validateAddToCart, cartController.addToCart);

/**
 * @route   PUT /api/cart/:id
 * @desc    Обновление количества товара в корзине
 * @access  Private
 * @params  id - ID позиции в корзине
 * @body    { quantity: number }
 */
router.put(
  "/:id",
  validateCartItemId,
  validateUpdateQuantity,
  cartController.updateCartItem
);

/**
 * @route   DELETE /api/cart/:id
 * @desc    Удаление товара из корзины
 * @access  Private
 * @params  id - ID позиции в корзине
 */
router.delete("/:id", validateCartItemId, cartController.removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Очистка корзины
 * @access  Private
 */
router.delete("/", cartController.clearCart);

/**
 * @route   POST /api/cart/checkout
 * @desc    Оформление заказа
 * @access  Private
 */
const checkoutController = require("../controllers/checkoutController");
router.post("/checkout", checkoutController.checkout);

module.exports = router;
