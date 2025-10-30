# Урок 24. Динамика корзины на JavaScript

В этом уроке реализуем работу корзины с помощью JavaScript:

- Добавление/удаление товаров
- Изменение количества
- Пересчёт итоговой суммы

## Основные функции

```js
// cart-data.js
let cart = [];

function addToCart(book) {
  const existing = cart.find((item) => item.id === book.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...book, qty: 1 });
  }
  renderCart();
}

function removeFromCart(bookId) {
  cart = cart.filter((item) => item.id !== bookId);
  renderCart();
}

function changeQty(bookId, qty) {
  const item = cart.find((item) => item.id === bookId);
  if (item && qty > 0) {
    item.qty = qty;
    renderCart();
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  // ...реализация рендера корзины в DOM
}
```

## UX-детали

- После каждого действия корзина перерисовывается
- Итоговая сумма обновляется автоматически
- При удалении последнего товара отображается сообщение "Корзина пуста"

В следующем уроке рассмотрим оформление заказа и интеграцию с сервером.
