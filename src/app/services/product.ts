import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/products.json');
  }

  getProductById(id: number): Observable<Product | undefined> {

    return this.getProducts().pipe(
      map(products =>
        products.find(product => product.id === id)
      )
    );

  }

}