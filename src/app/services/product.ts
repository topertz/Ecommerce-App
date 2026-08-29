import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/products';


  getProducts(): Observable<Product[]> {

    return this.http.get<Product[]>(this.apiUrl);

  }


  getProductById(id: number): Observable<Product | undefined> {

    return this.getProducts().pipe(
      map(products =>
        products.find(product => product.id === id)
      )
    );

  }


  createProduct(product: Omit<Product, 'id'>): Observable<Product> {

    return this.http.post<Product>(
      this.apiUrl,
      product
    );

  }


  updateProduct(
    id: number,
    product: Omit<Product, 'id'>
  ): Observable<Product> {

    return this.http.put<Product>(
      `${this.apiUrl}/${id}`,
      product
    );

  }


  deleteProduct(id: number): Observable<any> {

  return this.http.delete<any>(
    `${this.apiUrl}/${id}`
  );

}

  deleteAllProducts(): Observable<any> {
    return this.http.delete<any>(this.apiUrl);
  }

}