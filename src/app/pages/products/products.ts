import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-products',
  imports: [RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products {

  private cartService = inject(CartService);
  private productService = inject(ProductService);

  products = signal<Product[]>([]);

  searchTerm = signal('');

  selectedCategory = signal('All');

  categories = signal<string[]>(['All']);

  filteredProducts = computed(() => {

    const products = this.products();

    const search = this.searchTerm()
      .toLowerCase()
      .trim();

    const category = this.selectedCategory();

    return products.filter(product => {

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      const matchesCategory =
        category === 'All' ||
        product.category === category;

      return matchesSearch && matchesCategory;

    });

  });

  constructor() {

    this.productService.getProducts().subscribe(products => {

      this.products.set(products);

      const categories = [
        'All',
        ...new Set(
          products.map(product => product.category)
        )
      ];

      this.categories.set(categories);

    });

  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

}