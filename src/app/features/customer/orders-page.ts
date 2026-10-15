import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderStatus } from '../../models/fast-order';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow muted-eyebrow">TU HISTORIAL LOCAL</span>
        <h1>Mis pedidos</h1>
        <p>Pedidos creados en este navegador; no se sincronizan con otros dispositivos.</p>
      </div>
      <a class="button button-outline" routerLink="/">← Volver al menú</a>
    </div>
    <div class="filter-row">
      <label class="search-field admin-search"
        ><span class="material-symbols-rounded" aria-hidden="true">search</span
        ><input
          type="search"
          placeholder="Buscar por número de pedido"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
      /></label>
      <select
        aria-label="Filtrar por estado"
        [value]="status()"
        (change)="status.set($any($event.target).value)"
      >
        <option value="Todos">Todos los estados</option>
        <option>Nuevo</option>
        <option>En preparación</option>
        <option>Listo</option>
        <option>Entregado</option>
      </select>
    </div>
    @if (orders().length) {
      <div class="orders-list">
        @for (order of filteredOrders(); track order.id) {
          <article class="order-card">
            <div class="order-card-head">
              <div>
                <span class="order-number">{{ order.id }}</span
                ><span
                  class="status-pill"
                  [class.status-new]="order.status === 'Nuevo'"
                  [class.status-preparing]="order.status === 'En preparación'"
                  [class.status-ready]="order.status === 'Listo'"
                  [class.status-done]="order.status === 'Entregado'"
                  >{{ order.status }}</span
                >
              </div>
              <strong>{{ order.total | currency: 'USD' : 'symbol' : '1.2-2' }}</strong>
            </div>
            <p class="order-date">
              {{ order.createdAt | date: 'medium' }} <span>·</span> {{ order.localState }}
            </p>
            <p class="order-summary">
              {{ order.items.map((item) => item.quantity + '× ' + item.name).join(' · ') }}
            </p>
            @if (order.notes) {
              <p class="order-note">Observaciones: {{ order.notes }}</p>
            }
            @if (order.localState === 'Pendiente local') {
              <p class="pending-note">Pendiente local, sin enviar a servidor.</p>
            }
          </article>
        }
      </div>
      @if (!filteredOrders().length) {
        <div class="empty-state">
          <h3>No hay coincidencias</h3>
          <p>Cambia el texto o el filtro de estado.</p>
        </div>
      }
    } @else {
      <div class="empty-state orders-empty">
        <span class="empty-icon material-symbols-rounded">receipt_long</span>
        <h2>Aún no hay pedidos</h2>
        <p>Cuando confirmes un pedido de demostración, aparecerá aquí.</p>
        <a class="button button-primary" routerLink="/">Explorar el menú</a>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly service = inject(OrderService);
  readonly orders = this.service.recentOrders;
  readonly query = signal('');
  readonly status = signal('Todos');
  readonly filteredOrders = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return this.orders().filter(
      (order) =>
        (this.status() === 'Todos' || order.status === this.status()) &&
        (!query || order.id.toLocaleLowerCase().includes(query)),
    );
  });
  protected readonly orderStatuses: OrderStatus[] = [
    'Nuevo',
    'En preparación',
    'Listo',
    'Entregado',
  ];
}
