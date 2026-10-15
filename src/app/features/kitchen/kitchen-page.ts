import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Order, OrderStatus } from '../../models/fast-order';
import { ActivityService } from '../../services/activity.service';
import { NotificationService } from '../../services/notification.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-kitchen-page',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="page-intro kitchen-intro">
      <div>
        <span class="eyebrow muted-eyebrow">OPERACIÓN LOCAL</span>
        <h1>Tablero de cocina</h1>
        <p>Estados compartidos con el cliente en este dispositivo.</p>
      </div>
      <div class="kitchen-tools">
        <button class="button button-outline" (click)="enableNotifications()">
          {{
            notifications.permission() === 'granted' ? 'Avisos activados' : 'Activar avisos'
          }}</button
        ><span class="live-label"><span class="live-dot"></span> En vivo local</span>
      </div>
    </div>
    @if (notice()) {
      <p class="notice" role="status">{{ notice() }}</p>
    }
    <div class="kitchen-stats">
      @for (status of statuses; track status) {
        <div class="kitchen-stat">
          <span>{{ status }}</span
          ><strong>{{ count(status) }}</strong
          ><span class="stat-symbol material-symbols-rounded" aria-hidden="true">{{
            status === 'Nuevo'
              ? 'add_shopping_cart'
              : status === 'En preparación'
                ? 'schedule'
                : status === 'Listo'
                  ? 'check_circle'
                  : 'inventory_2'
          }}</span>
        </div>
      }
    </div>
    <div class="kitchen-board">
      @for (status of statuses; track status) {
        <section class="kitchen-column">
          <header>
            <span
              class="column-marker"
              [class.marker-new]="status === 'Nuevo'"
              [class.marker-preparing]="status === 'En preparación'"
              [class.marker-ready]="status === 'Listo'"
              [class.marker-done]="status === 'Entregado'"
            ></span>
            <h2>{{ status }}</h2>
            <span class="column-count">{{ count(status) }}</span>
          </header>
          @for (order of ordersFor(status); track order.id) {
            <article class="kitchen-order">
              <div class="kitchen-order-head">
                <strong>{{ order.id }}</strong
                ><span>{{ order.createdAt | date: 'shortTime' }}</span>
              </div>
              <p class="kitchen-customer">{{ order.customerName }}</p>
              <ul>
                @for (item of order.items; track item.productId) {
                  <li>
                    <strong>{{ item.quantity }}×</strong> {{ item.name }}
                  </li>
                }
              </ul>
              @if (order.notes) {
                <p class="kitchen-note"><b>Nota:</b> {{ order.notes }}</p>
              }
              <div class="kitchen-order-foot">
                <strong>{{ order.total | currency: 'USD' : 'symbol' : '1.2-2' }}</strong
                ><span>{{ order.localState }}</span>
              </div>
              @if (nextStatus(status); as next) {
                <button class="button button-primary kitchen-action" (click)="advance(order, next)">
                  Marcar {{ next.toLocaleLowerCase() }} →
                </button>
              }
            </article>
          } @empty {
            <div class="column-empty">
              <span class="material-symbols-rounded" aria-hidden="true">inbox</span>
              <p>No hay pedidos en esta etapa.</p>
            </div>
          }
        </section>
      }
    </div>
    <p class="demo-note">
      Los cambios se guardan localmente. No existe sincronización con un servidor o con otros
      dispositivos.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenPage {
  private readonly orderService = inject(OrderService);
  private readonly activity = inject(ActivityService);
  readonly notifications = inject(NotificationService);
  readonly orders = this.orderService.recentOrders;
  readonly notice = signal('');
  readonly statuses: OrderStatus[] = ['Nuevo', 'En preparación', 'Listo', 'Entregado'];

  count(status: OrderStatus): number {
    return this.orders().filter((order) => order.status === status).length;
  }

  ordersFor(status: OrderStatus): Order[] {
    return this.orders().filter((order) => order.status === status);
  }

  nextStatus(status: OrderStatus): OrderStatus | null {
    const index = this.statuses.indexOf(status);
    return this.statuses[index + 1] ?? null;
  }

  async advance(order: Order, status: OrderStatus): Promise<void> {
    this.notice.set('');
    try {
      await this.orderService.updateStatus(order.id, status);
      this.notifications.notify(
        'FastOrder · Estado actualizado',
        `El pedido ${order.id} está ${status.toLocaleLowerCase()}.`,
      );
      try {
        this.activity.log(`Pedido ${order.id}: estado actualizado a «${status}».`);
      } catch {
        this.notice.set('Estado actualizado; no se pudo registrar la actividad local.');
      }
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo actualizar el pedido.');
    }
  }

  async enableNotifications(): Promise<void> {
    await this.notifications.requestPermission();
    this.notice.set(
      this.notifications.permission() === 'granted'
        ? 'Avisos locales activados para cambios de estado mientras esta aplicación está abierta.'
        : 'El navegador no concedió permiso para las notificaciones locales.',
    );
  }
}
