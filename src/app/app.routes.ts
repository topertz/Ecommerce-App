import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { Cart } from './pages/cart/cart';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'products',
        component: Products
    },
    {
        path: 'products/:id',
        component: ProductDetail
    },
    {
        path: 'cart',
        component: Cart
    },
    {
        path: 'admin',
        component: Admin
    }
];
