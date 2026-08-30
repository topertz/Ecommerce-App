import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../models/cart-item';

interface CheckoutResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api';


  createCheckoutSession(items: CartItem[]) {

    const checkoutItems = items.map(item => ({
      id: item.product.id,
      quantity: item.quantity
    }));

    return this.http.post<CheckoutResponse>(
      `${this.apiUrl}/create-checkout-session`,
      {
        items: checkoutItems
      }
    );

  }

}