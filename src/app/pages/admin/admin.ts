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
    const product = this.products().find(product => product.id === id);

    if (!product) {
      return;
    }

    const confirmed = confirm(`Are you sure want to delete "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update(products =>
          products.filter(product => product.id !== id)
        );
        this.successMessage = 'Product deleted successfully.';
      },
      error: (error) => {
        console.error('DELETE ERROR:', error);
        this.errorMessage = error.error?.message || 'Failed to delete product.';
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

  newProduct: Omit<Product, 'id'> = {
    name: '',
    price: 0,
    description: '',
    image: '',
    category: ''
  };

  showAddProduct = false;
  errorMessage = '';
  successMessage = '';

  openAddProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.newProduct = {
      name: '',
      price: 0,
      description: '',
      image: '',
      category: ''
    };

    this.showAddProduct = true;
  }

  cancelAddProduct(): void {
    this.showAddProduct = false;
  }

  addProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const product = {
      name: this.newProduct.name.trim(),
      price: Number(this.newProduct.price),
      description: this.newProduct.description.trim(),
      image: this.newProduct.image.trim(),
      category: this.newProduct.category.trim()
    };

    if (!product.name) {
      this.errorMessage = 'Product name is required.';
      return;
    }

    if (!Number.isFinite(product.price) || product.price <= 0) {
      this.errorMessage = 'Price must be greater than 0.';
      return;
    }

    if (!product.description) {
      this.errorMessage = 'Description is required.';
      return;
    }

    if (!product.category) {
      this.errorMessage = 'Category is required.';
      return;
    }

    this.productService.createProduct(product).subscribe({
      next: (createdProduct) => {
        this.products.update(products => [
          ...products,
          createdProduct
        ]);

        this.showAddProduct = false;
        this.successMessage = 'Product created successfully.';
      },

      error: (error) => {
        console.error('CREATE PRODUCT ERROR:', error);
        this.errorMessage = error.error?.message || 'Failed to create product.';
      }
    });
  }
}