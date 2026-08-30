import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail {

  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  product = signal<Product | undefined>(undefined);

  quantity = signal(1);

  totalPrice = computed(() => {
    const product = this.product();

    if (!product) {
      return 0;
    }

    return product.price * this.quantity();
  });

  constructor() {

    this.route.paramMap.subscribe(params => {

      const id = Number(params.get('id'));

      console.log('Product ID:', id);

      this.productService.getProductById(id).subscribe({

        next: (product) => {
          console.log('Product:', product);
          this.product.set(product);
        },

        error: (error) => {
          console.error('API error:', error);
          this.product.set(undefined);
        }

      });

    });

  }

  decreaseQuantity(): void {
    this.quantity.update(value => Math.max(1, value - 1));
  }

    increaseQuantity(): void {
    this.quantity.update(value => value + 1);
  }

  addToCart(): void {

    const product = this.product();

    if (product) {

      for (let i = 0; i < this.quantity(); i++) {
        this.cartService.addToCart(product);
      }

    }

  }

}