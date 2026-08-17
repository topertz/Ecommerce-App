import { Component, inject, signal } from '@angular/core';
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

  addToCart(): void {

    const product = this.product();

    if (product) {
      this.cartService.addToCart(product);
    }

  }

}