/**
 * JavaScript для страницы корзины
 */

document.addEventListener("DOMContentLoaded", function () {
  // Проверить авторизацию
  if (!Auth.isAuthenticated()) {
    showEmptyCart("Для просмотра корзины необходимо войти в систему");
    return;
  }

  loadCart();
});

/**
 * Загрузить содержимое корзины
 */
async function loadCart() {
  try {
    const token = AuthToken.get();
    if (!token) {
      showEmptyCart("Ошибка авторизации");
      return;
    }

    const response = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        Auth.logout();
        showEmptyCart("Сессия истекла. Пожалуйста, войдите в систему снова");
        return;
      }
      throw new Error("Ошибка загрузки корзины");
    }

    const data = await response.json();

    if (data.success && data.data.items && data.data.items.length > 0) {
      displayCartItems(data.data);
    } else {
      showEmptyCart();
    }
  } catch (error) {
    console.error("Ошибка загрузки корзины:", error);
    showEmptyCart("Ошибка загрузки корзины");
  }
}

/**
 * Отобразить товары в корзине
 */
function displayCartItems(cartData) {
  const cartContent = document.getElementById("cart-content");
  const cartItems = document.getElementById("cart-items");
  const cartList = cartItems.querySelector(".cart-list");

  // Скрыть загрузку, показать корзину
  cartContent.style.display = "none";
  cartItems.style.display = "block";

  // Очистить список
  cartList.innerHTML = "";

  // Добавить товары
  cartData.items.forEach((item) => {
    const cartItem = createCartItemElement(item);
    cartList.appendChild(cartItem);
  });

  // Обновить итоги
  updateCartSummary(cartData.summary);
}

/**
 * Создать элемент товара в корзине
 */
function createCartItemElement(item) {
  const div = document.createElement("div");
  div.className = "cart-item";
  div.innerHTML = `
        <div class="cart-item-image">
            <img src="../img/${item.book.image || "book-placeholder.jpg"}" 
                 alt="${item.book.title}" />
        </div>
        <div class="cart-item-info">
            <h3>${item.book.title}</h3>
            <p class="cart-item-price">${item.book.price} ₽</p>
            ${
              item.book.publisher
                ? `<p class="cart-item-publisher">Издательство: ${item.book.publisher}</p>`
                : ""
            }
        </div>
        <div class="cart-item-controls">
            <div class="quantity-controls">
                <button onclick="updateQuantity(${item.id}, ${
    item.quantity - 1
  })" 
                        ${item.quantity <= 1 ? "disabled" : ""}>-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, ${
    item.quantity + 1
  })" 
                        ${
                          item.quantity >= item.book.stock ? "disabled" : ""
                        }>+</button>
            </div>
            <div class="item-total">${item.book.totalPrice} ₽</div>
            <button class="remove-btn" onclick="removeFromCart(${
              item.id
            })">Удалить</button>
        </div>
    `;
  return div;
}

/**
 * Обновить итоги корзины
 */
function updateCartSummary(summary) {
  document.getElementById("total-items").textContent = summary.totalItems;
  document.getElementById(
    "total-amount"
  ).textContent = `${summary.totalAmount} ₽`;
}

/**
 * Показать пустую корзину
 */
function showEmptyCart(message = null) {
  const cartContent = document.getElementById("cart-content");
  const emptyCart = document.getElementById("empty-cart");
  const cartItems = document.getElementById("cart-items");

  cartContent.style.display = "none";
  cartItems.style.display = "none";
  emptyCart.style.display = "block";

  if (message) {
    const emptyState = emptyCart.querySelector(".empty-state h2");
    emptyState.textContent = message;
  }
}

/**
 * Обновить количество товара
 */
async function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(itemId);
    return;
  }

  try {
    const token = AuthToken.get();
    const response = await fetch(`/api/cart/${itemId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: newQuantity }),
    });

    if (response.ok) {
      loadCart(); // Перезагрузить корзину
      Auth.updateCartCount(); // Обновить счетчик в навигации
    } else {
      throw new Error("Ошибка обновления количества");
    }
  } catch (error) {
    console.error("Ошибка обновления количества:", error);
    showNotification("Ошибка обновления количества", "error");
  }
}

/**
 * Удалить товар из корзины
 */
async function removeFromCart(itemId) {
  try {
    const token = AuthToken.get();
    const response = await fetch(`/api/cart/${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      showNotification("Товар удалён из корзины", "success");
      loadCart(); // Перезагрузить корзину
      Auth.updateCartCount(); // Обновить счетчик в навигации
    } else {
      throw new Error("Ошибка удаления товара");
    }
  } catch (error) {
    console.error("Ошибка удаления товара:", error);
    showNotification("Ошибка удаления товара", "error");
  }
}

/**
 * Очистить корзину
 */
async function clearCart() {
  try {
    const token = AuthToken.get();

    // Получить все товары в корзине
    const response = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Удалить каждый товар
      for (const item of data.data.items) {
        await fetch(`/api/cart/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      showNotification("Корзина очищена", "success");
      showEmptyCart();
      Auth.updateCartCount(); // Обновить счетчик в навигации
    }
  } catch (error) {
    console.error("Ошибка очистки корзины:", error);
    showNotification("Ошибка очистки корзины", "error");
  }
}

/**
 * Оформить заказ
 */
async function checkout(event) {
  try {
    const token = AuthToken.get();
    if (!token) {
      showNotification(
        "Ошибка авторизации. Пожалуйста, войдите в систему",
        "error"
      );
      return;
    }

    // Показать индикатор загрузки
    const checkoutBtn =
      event?.target || document.querySelector(".cart-actions .btn-primary");
    if (checkoutBtn) {
      const originalText = checkoutBtn.textContent;
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Оформление...";
    }

    const response = await fetch("/api/cart/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      showNotification(
        `Заказ успешно оформлен! Куплено ${data.data.itemsCount} позиций (${data.data.totalQuantity} шт.)`,
        "success"
      );
      // Перезагрузить корзину (она должна быть пуста)
      setTimeout(() => {
        loadCart();
        Auth.updateCartCount();
      }, 1500);
    } else {
      showNotification(`Ошибка: ${data.message}`, "error");
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = "Оформить заказ";
      }
    }
  } catch (error) {
    console.error("Checkout error:", error);
    showNotification("Ошибка связи с сервером", "error");
    const checkoutBtn =
      event?.target || document.querySelector(".cart-actions .btn-primary");
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Оформить заказ";
    }
  }
}

/**
 * Показать уведомление
 */
function showNotification(message, type = "info") {
  // Удалить предыдущие уведомления
  const existing = document.querySelector(".notification");
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Показать уведомление с анимацией
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Скрыть через 3 секунды
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
