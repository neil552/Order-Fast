import { computed, inject, Injectable, signal } from '@angular/core';
import { Order, OrderStatus } from '../models/fast-order';
import { LocalDatabaseService } from './local-database.service';
import { OnlineStatusService } from './online-status.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly database = inject(LocalDatabaseService);
  private readonly online = inject(OnlineStatusService);
  readonly orders = signal<Order[]>([]);
  readonly recentOrders = computed(() => [...this.orders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.load();
  }

  async create(order: Omit<Order, 'id' | 'createdAt' | 'status' | 'localState'>): Promise<Order> {
    await this.ready;
    const created: Order = {
      ...order,
      id: `FO-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'Nuevo',
      localState: this.online.isOnline() ? 'Guardado local' : 'Pendiente local'
    };
    await this.database.put('orders', created);
    this.orders.update((orders) => [...orders, created]);
    return created;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.ready;
    const order = this.orders().find((item) => item.id === id);
    if (!order) throw new Error(`No se encontró el pedido ${id}.`);
    const updated = { ...order, status };
    await this.database.put('orders', updated);
    this.orders.update((orders) => orders.map((item) => item.id === id ? updated : item));
  }

  private async load(): Promise<void> {
    try {
      this.orders.set(await this.database.getAll<Order>('orders'));
    } catch (error) {
      console.error('No se pudieron cargar los pedidos guardados.', error);
    }
  }
}
