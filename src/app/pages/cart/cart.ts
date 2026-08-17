import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../models/cart-item';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  cartItems: CartItem[] = [];

  constructor(private cartService: CartService) {
    this.cartItems = this.cartService.getItems();
  }

  increaseQuantity(productId: number): void {
    this.cartService.increaseQuantity(productId);
  }

  decreaseQuantity(productId: number): void {
    this.cartService.decreaseQuantity(productId);
    this.cartItems = this.cartService.getItems();
  }

  removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
    this.cartItems = this.cartService.getItems();
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.cartItems = [];
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }
}