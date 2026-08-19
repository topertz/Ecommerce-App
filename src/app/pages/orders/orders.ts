import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Order {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  status: string;
  stripe_session_id: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-orders',
  imports: [],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {

  private http = inject(HttpClient);

  orders: Order[] = [];

  selectedOrder: Order | null = null;

  orderItems: OrderItem[] = [];

  loading = true;

  loadingItems = false;


  constructor() {

    this.loadOrders();

  }


  loadOrders(): void {

    this.http
      .get<Order[]>('http://localhost:3000/api/orders')
      .subscribe({

        next: (orders) => {

          this.orders = orders;

          this.loading = false;

        },

        error: (error) => {

          console.error('ORDERS ERROR:', error);

          this.loading = false;

        }

      });

  }


  selectOrder(order: Order): void {

    this.selectedOrder = order;

    this.orderItems = [];

    this.loadingItems = true;


    this.http
      .get<OrderItem[]>(
        `http://localhost:3000/api/orders/${order.id}/items`
      )
      .subscribe({

        next: (items) => {

          this.orderItems = items;

          this.loadingItems = false;

        },

        error: (error) => {

          console.error(
            'ORDER ITEMS ERROR:',
            error
          );

          this.loadingItems = false;

        }

      });

  }


  closeOrder(): void {

    this.selectedOrder = null;

    this.orderItems = [];

  }

  updateStatus(status: string): void {

  if (!this.selectedOrder) {
    return;
  }

  this.http
    .put<Order>(
      `http://localhost:3000/api/orders/${this.selectedOrder.id}/status`,
      { status }
    )
    .subscribe({

      next: (updatedOrder) => {

        this.selectedOrder = updatedOrder;

        this.orders = this.orders.map(order =>
          order.id === updatedOrder.id
            ? updatedOrder
            : order
        );

      },

      error: (error) => {

        console.error(
          'UPDATE ORDER STATUS ERROR:',
          error
        );

      }

    });

}

}