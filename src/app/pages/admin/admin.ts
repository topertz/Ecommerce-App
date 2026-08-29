import { Component, inject, signal } from '@angular/core';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {

  private productService = inject(ProductService);

  products = signal<Product[]>([]);

  editingProduct: Product | null = null;

  constructor() {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
      },
      error: (error) => {
        console.error('PRODUCT API ERROR:', error);
      }
    });
  }

  editProduct(product: Product): void {
    this.editingProduct = { ...product };
  }

  cancelEdit(): void {
    this.editingProduct = null;
  }

  saveProduct(): void {
    if (!this.editingProduct) {
      return;
    }

    const { id, ...productData } = this.editingProduct;

    this.productService.updateProduct(id, productData).subscribe({
      next: (updatedProduct) => {
        this.products.update(products =>
          products.map(product =>
            product.id === updatedProduct.id
              ? updatedProduct
              : product
          )
        );

        this.editingProduct = null;
      },
      error: (error) => {
        console.error('UPDATE ERROR:', error);
      }
    });
  }

  deleteProduct(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update(products =>
          products.filter(product => product.id !== id)
        );
      },
      error: (error) => {
        console.error('DELETE ERROR:', error);
      }
    });
  }

  deleteAllProducts(): void {
    if (this.products().length === 0) {
      return;
    }

    const confirmed = confirm(
      'Are you sure want to delete ALL products? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    this.productService.deleteAllProducts().subscribe({
      next: () => {
        this.products.set([]);
      },
      error: (error) => {
        console.error('DELETE ALL PRODUCTS ERROR:', error);
      }
    });
  }
}