import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { Cart } from './pages/cart/cart';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Admin } from './pages/admin/admin';
import { Success } from './pages/success/success';
import { Orders } from './pages/orders/orders';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { Login } from './pages/login/login';
import { adminGuard } from './guards/admin-guard';

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
        component: AdminDashboard,
        canActivate: [adminGuard]
    },
    {
        path: 'admin/products',
        component: Admin,
        canActivate: [adminGuard]
    },
    {
        path: 'admin/orders',
        component: Orders,
        canActivate: [adminGuard]
    },
    {
        path: 'success',
        component: Success
    },
    {
        path: 'login',
        component: Login
    },
];
