const { CartItem, Book, User } = require("../../models");
const { sequelize } = require("../../models");

/**
 * Оформление заказа: атомарно уменьшает stock и увеличивает popularity (продано)
 */
const checkout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Получаем текущую корзину пользователя
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "price", "stock", "popularity"],
        },
      ],
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Корзина пуста",
      });
    }

    // Подготовим массив товаров для обработки
    const items = cartItems.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity,
      title: item.book.title,
    }));

    // Выполняем транзакцию для атомарного обновления
    await sequelize.transaction(async (t) => {
      for (const item of items) {
        // Блокируем строку книги для обновления
        const book = await Book.findByPk(item.bookId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (!book) {
          throw new Error(`Книга "${item.title}" не найдена`);
        }

        if (book.stock < item.quantity) {
          throw new Error(
            `Недостаточно товара: ${item.title}. Доступно: ${book.stock}, запрошено: ${item.quantity}`
          );
        }

        // Уменьшаем остаток и увеличиваем продажи
        book.stock -= item.quantity;
        book.popularity = (book.popularity || 0) + item.quantity;
        await book.save({ transaction: t });
      }

      // Очищаем корзину пользователя
      await CartItem.destroy({ where: { userId }, transaction: t });
    });

    res.json({
      success: true,
      message: "Заказ успешно оформлен!",
      data: {
        itemsCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Ошибка оформления заказа",
    });
  }
};

module.exports = { checkout };
