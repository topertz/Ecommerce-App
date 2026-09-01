import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product';
import { CartItem } from '../models/cart-item';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems = signal<CartItem[]>([]);

  readonly items = this.cartItems.asReadonly();

  readonly itemCount = computed(() => {
    return this.cartItems().reduce(
      (total, item) => total + item.quantity,
      0
    );
  });

  getItems(): CartItem[] {
    return this.cartItems();
  }

  addToCart(product: Product): void {
    const items = [...this.cartItems()];
    const existingItem = items.find(
      item => item.product.id === product.id
    );

    if (existingItem) {
      if (existingItem.quantity < 99) {
        existingItem.quantity++;
      }
    } else {
      items.push({
        product: product,
        quantity: 1
      });
    }
    this.cartItems.set(items);
  }

  removeFromCart(productId: number): void {
    this.cartItems.update(items =>
      items.filter(item => item.product.id !== productId)
    );
  }

  increaseQuantity(productId: number): void {
    this.cartItems.update(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(99, item.quantity + 1) }
          : item
      )
    );
  }

  decreaseQuantity(productId: number): void {
    this.cartItems.update(items =>
      items
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  getTotal(): number {
    return this.cartItems().reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );
  }
}