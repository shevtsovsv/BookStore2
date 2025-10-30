# Урок 23. Стилизация корзины

В этом уроке мы добавим стили для корзины, чтобы сделать интерфейс современным и удобным.

## Основные стили

```css
.cart-container {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 24px;
}
.cart-items {
  margin-bottom: 24px;
}
.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.cart-item img {
  width: 60px;
  height: 80px;
  object-fit: cover;
  margin-right: 16px;
}
.cart-item-title {
  flex: 1;
  font-size: 1.1em;
}
.cart-item-qty {
  width: 60px;
  text-align: center;
}
.cart-item-remove {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
}
.cart-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.2em;
  margin-top: 16px;
}
#checkout-btn {
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  cursor: pointer;
  font-size: 1em;
}
```

## UX-детали
- Кнопки удаления и оформления заказа выделены цветом
- Список товаров визуально разделён
- Итоговая сумма выделена

В следующем уроке реализуем динамику корзины на JavaScript.