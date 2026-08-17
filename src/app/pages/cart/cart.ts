import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../models/cart-item';
import { CartService } from '../../services/cart';
import { CheckoutService } from '../../services/checkout';


@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  cartItems: CartItem[] = [];

  loading = false;


  constructor(
    private cartService: CartService,
    private checkoutService: CheckoutService
  ) {

    this.cartItems = this.cartService.getItems();

  }


  increaseQuantity(productId: number): void {

    this.cartService.increaseQuantity(productId);

    this.cartItems = this.cartService.getItems();

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


  checkout(): void {

    if (this.cartItems.length === 0) {
      return;
    }

    this.loading = true;

    this.checkoutService
      .createCheckoutSession(this.cartItems)
      .subscribe({

        next: (response) => {

          window.location.href = response.url;

        },

        error: (error) => {

          console.error('CHECKOUT ERROR:', error);

          this.loading = false;

        }

      });

  }

}