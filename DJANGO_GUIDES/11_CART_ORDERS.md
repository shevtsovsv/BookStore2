# 11_CART_ORDERS.md — Корзина и заказы (Django)

> Сложность: 🔴 Сложная

## Цель
Разработать архитектуру корзины покупок и обработки заказов для BookStore: модели, сериализаторы, ViewSet'ы и транзакции.

## Модели для BookStore

```python
# bookstore/models.py
from django.db import models
from django.contrib.auth.models import User

class CartItem(models.Model):
    """Товар в корзине пользователя"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    book = models.ForeignKey('Book', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'book')
        ordering = ['-updated_at']
    
    @property
    def total_price(self):
        return self.book.price * self.quantity

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает подтверждения'),
        ('confirmed', 'Подтвержден'),
        ('processing', 'В обработке'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    delivery_address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    book = models.ForeignKey('Book', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Цена на момент заказа
```

## Сериализаторы для BookStore

```python
# bookstore/serializers.py
from rest_framework import serializers
from .models import CartItem, Order, OrderItem

class CartItemSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_price = serializers.DecimalField(source='book.price', max_digits=10, decimal_places=2, read_only=True)
    book_image = serializers.URLField(source='book.image_url', read_only=True)
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'book', 'book_title', 'book_price', 'book_image', 'quantity', 'total_price', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Количество должно быть больше 0")
        return value

class OrderItemSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['book', 'book_title', 'book_isbn', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_email', 'status', 'total_amount',
            'first_name', 'last_name', 'email', 'phone',
            'delivery_address', 'items', 'created_at'
        ]
        read_only_fields = ['user', 'total_amount', 'created_at']
```

## ViewSets для BookStore

```python
# bookstore/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import CartItem, Order, OrderItem, Book
from .serializers import CartItemSerializer, OrderSerializer

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related('book')
    
    def perform_create(self, serializer):
        # Проверяем, есть ли уже такая книга в корзине
        book = serializer.validated_data['book']
        quantity = serializer.validated_data['quantity']
        
        cart_item, created = CartItem.objects.get_or_create(
            user=self.request.user,
            book=book,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Очистить всю корзину"""
        CartItem.objects.filter(user=request.user).delete()
        return Response({'message': 'Корзина очищена'})
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Сводка по корзине"""
        cart_items = self.get_queryset()
        total = sum(item.total_price for item in cart_items)
        
        return Response({
            'items_count': cart_items.count(),
            'total_amount': total,
            'items': CartItemSerializer(cart_items, many=True).data
        })

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__book')
    
    @action(detail=False, methods=['post'])
    def create_from_cart(self, request):
        """Создать заказ из корзины"""
        cart_items = CartItem.objects.filter(user=request.user).select_related('book')
        
        if not cart_items.exists():
            return Response(
                {'error': 'Корзина пуста'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем наличие всех товаров
        for item in cart_items:
            if item.book.stock_quantity < item.quantity:
                return Response(
                    {'error': f'Недостаточно товара "{item.book.title}" на складе'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Создаем заказ в транзакции
        with transaction.atomic():
            total_amount = sum(item.total_price for item in cart_items)
            
            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                first_name=request.data.get('first_name'),
                last_name=request.data.get('last_name'),
                email=request.data.get('email'),
                phone=request.data.get('phone'),
                delivery_address=request.data.get('delivery_address'),
            )
            
            # Создаем позиции заказа и обновляем остатки
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    book=item.book,
                    quantity=item.quantity,
                    price=item.book.price
                )
                
                # Уменьшаем остаток на складе
                item.book.stock_quantity -= item.quantity
                item.book.save()
            
            # Очищаем корзину
            cart_items.delete()
        
        return Response(
            OrderSerializer(order).data, 
            status=status.HTTP_201_CREATED
        )
```

- `CartItemSerializer` для управления корзиной.
- `OrderSerializer` и `OrderItemSerializer` для создания/просмотра заказов.

При создании заказа используйте writable nested или ручную логику в `create()` сериализатора.

## Транзакции

При оформлении заказа важно выполнить всё в транзакции:

```python
from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    user = request.user
    cart_items = CartItem.objects.filter(user=user)

    with transaction.atomic():
        # Проверить наличие и цены
        order = Order.objects.create(user=user, total_amount=0, status='pending')
        total = 0
        for item in cart_items.select_related('book'):
            if item.quantity > item.book.stock:
                raise ValidationError('Недостаточно на складе')
            OrderItem.objects.create(
                order=order,
                book=item.book,
                price=item.book.price,
                quantity=item.quantity
            )
            item.book.stock -= item.quantity
            item.book.save()
            total += item.book.price * item.quantity

        order.total_amount = total
        order.status = 'processing'
        order.save()
        cart_items.delete()

    return Response({'order_id': order.id}, status=201)
```

## Идемпотентность и повторные запросы

- При интеграции с платёжными шлюзами используйте идемпотентные ключи (payment intent id).
- Храните статус платежа и обрабатывайте колбэки безопасно.

## Тестирование и нагрузка

- Пишите unit и интеграционные тесты (см. `12_TESTING.md`).
- Проработайте конкурентный доступ к stock — оптимально использовать SELECT FOR UPDATE / row-level locking.

*Конец 11_CART_ORDERS.md*