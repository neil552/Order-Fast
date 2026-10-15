import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Order } from '../models/fast-order';
import { LocalDatabaseService } from './local-database.service';
import { OnlineStatusService } from './online-status.service';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let orders: Order[];

  beforeEach(() => {
    orders = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LocalDatabaseService,
          useValue: {
            error: signal(''),
            getAll: () => Promise.resolve(orders),
            put: (_store: 'products' | 'orders', value: { id: string }) => {
              orders = [...orders.filter((order) => order.id !== value.id), value as Order];
              return Promise.resolve();
            },
            delete: () => Promise.resolve()
          }
        },
        {
          provide: OnlineStatusService,
          useValue: { isOnline: signal(false) }
        }
      ]
    });
  });

  it('stores an offline order as pending locally and updates its shared status', async () => {
    const service = TestBed.inject(OrderService);
    const order = await service.create({
      customerName: 'Demo',
      notes: 'Sin cebolla',
      items: [{ productId: 'smash-doble', name: 'Smash Doble', price: 12.9, quantity: 1 }],
      subtotal: 12.9,
      discount: 0,
      total: 12.9
    });

    expect(order.localState).toBe('Pendiente local');
    expect(order.status).toBe('Nuevo');
    expect(orders).toHaveLength(1);

    await service.updateStatus(order.id, 'En preparación');
    expect(service.orders()[0].status).toBe('En preparación');
    expect(orders[0].status).toBe('En preparación');
  });
});
