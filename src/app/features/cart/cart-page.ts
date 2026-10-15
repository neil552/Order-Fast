import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { OnlineStatusService } from '../../services/online-status.service';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, FormsModule, NgOptimizedImage, RouterLink],
  template: `
    <div class="page-intro">
      <div>
        <span class="eyebrow muted-eyebrow">TU PEDIDO</span>
        <h1>Carrito</h1>
        <p>Revisa tus favoritos y confirma tu pedido.</p>
      </div>
      <span class="muted"
        >{{ cart.count() }} {{ cart.count() === 1 ? 'producto' : 'productos' }}</span
      >
    </div>
    @if (confirmation()) {
      <section class="confirmation-panel" role="status">
        <span class="confirmation-mark material-symbols-rounded">check</span>
        <div>
          <h2>¡Pedido registrado!</h2>
          <p>
            Tu pedido <strong>{{ confirmation() }}</strong> está
            <strong>{{ confirmationState() }}</strong> en este dispositivo.
          </p>
          <p class="muted">No se realizó ningún pago ni se envió el pedido a un restaurante.</p>
        </div>
        <a class="button button-primary" routerLink="/pedidos">Ver mis pedidos</a>
        <button
          class="icon-button dismiss-confirmation material-symbols-rounded"
          aria-label="Cerrar confirmación del pedido"
          (click)="dismissConfirmation()"
        >
          close
        </button>
      </section>
    }
    <div class="cart-layout">
      <section class="cart-items-panel">
        <div class="panel-title">
          <h2>Tu selección</h2>
          <span class="muted">Precios en USD</span>
        </div>
        @if (cart.lines().length) {
          <div class="cart-lines">
            @for (line of cart.lines(); track line.product.id) {
              <article class="cart-line">
                <img
                  [ngSrc]="line.product.image"
                  [alt]="line.product.name"
                  width="90"
                  height="90"
                  loading="lazy"
                />
                <div class="cart-line-copy">
                  <h3>{{ line.product.name }}</h3>
                  <p>{{ line.product.category }}</p>
                  <strong>{{ line.product.price | currency: 'USD' : 'symbol' : '1.2-2' }}</strong>
                </div>
                <div
                  class="quantity-control"
                  [attr.aria-label]="'Cantidad de ' + line.product.name"
                >
                  <button
                    [attr.aria-label]="'Quitar una unidad de ' + line.product.name"
                    (click)="cart.setQuantity(line.product.id, line.quantity - 1)"
                  >
                    −
                  </button>
                  <span>{{ line.quantity }}</span>
                  <button
                    [attr.aria-label]="'Agregar una unidad de ' + line.product.name"
                    (click)="cart.setQuantity(line.product.id, line.quantity + 1)"
                  >
                    +
                  </button>
                </div>
                <button
                  class="remove-button"
                  [attr.aria-label]="'Eliminar ' + line.product.name"
                  (click)="cart.setQuantity(line.product.id, 0)"
                >
                  Eliminar
                </button>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state cart-empty">
            <span class="empty-icon material-symbols-rounded">shopping_bag</span>
            <h3>Tu carrito está esperando</h3>
            <p>Agrega algo rico del menú para empezar.</p>
            <a class="button button-primary" routerLink="/">Explorar menú</a>
          </div>
        }
        <label class="field-label customer-name-field"
          >Nombre para identificar el pedido
          <input
            [(ngModel)]="customerName"
            name="customerName"
            required
            maxlength="60"
            placeholder="Tu nombre"
          />
        </label>
        <label class="field-label notes-field"
          >Observaciones para la cocina
          <textarea
            [(ngModel)]="notes"
            name="notes"
            rows="3"
            maxlength="240"
            placeholder="Ej. Sin cebolla, salsa aparte..."
          ></textarea>
        </label>
      </section>
      <aside class="checkout-card">
        <span class="eyebrow muted-eyebrow">RESUMEN</span>
        <h2>Detalle del pedido</h2>
        <div class="coupon-box">
          <label for="coupon">Código de descuento</label>
          <div>
            <input id="coupon" [(ngModel)]="coupon" placeholder="Prueba BIENVENIDA" /><button
              class="button button-outline"
              (click)="applyCoupon()"
            >
              Aplicar
            </button>
          </div>
          @if (couponMessage()) {
            <span class="coupon-message" role="status">{{ couponMessage() }}</span>
          }
        </div>
        <div class="summary-row">
          <span>Subtotal</span
          ><span>{{ cart.subtotal() | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
        </div>
        @if (discount() > 0) {
          <div class="summary-row discount-row">
            <span>Descuento de demostración</span
            ><span>−{{ discount() | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
          </div>
        }
        <div class="summary-row"><span>Entrega</span><span class="free-label">Gratis</span></div>
        <div class="summary-total">
          <strong>Total</strong
          ><strong>{{ total() | currency: 'USD' : 'symbol' : '1.2-2' }}</strong>
        </div>
        <p class="checkout-disclaimer">Demostración local. No se procesan pagos.</p>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <button
          class="button button-primary checkout-button"
          [disabled]="!cart.lines().length || !customerName.trim() || submitting"
          (click)="placeOrder()"
        >
          {{ submitting ? 'Guardando pedido…' : 'Confirmar pedido local' }}
          <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
        </button>
        <p class="safe-note">
          <span class="material-symbols-rounded" aria-hidden="true">shield</span>
          {{
            online.isOnline()
              ? 'El pedido queda guardado solo en este dispositivo.'
              : 'Sin conexión: el pedido quedará pendiente en este dispositivo.'
          }}
        </p>
      </aside>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  readonly cart = inject(CartService);
  readonly online = inject(OnlineStatusService);
  private readonly orders = inject(OrderService);
  private readonly activity = inject(ActivityService);
  readonly discount = signal(0);
  readonly total = computed(() => Math.max(0, this.cart.subtotal() - this.discount()));
  readonly couponMessage = signal('');
  readonly confirmation = signal('');
  readonly confirmationState = signal('');
  readonly error = signal('');
  customerName = '';
  notes = '';
  coupon = '';
  submitting = false;

  applyCoupon(): void {
    if (this.coupon.trim().toUpperCase() === 'BIENVENIDA') {
      this.discount.set(Math.min(5, this.cart.subtotal() * 0.1));
      this.couponMessage.set('Descuento de demostración aplicado (10%, hasta $5).');
    } else {
      this.discount.set(0);
      this.couponMessage.set('Código no válido. Prueba BIENVENIDA.');
    }
  }

  async placeOrder(): Promise<void> {
    if (!this.cart.lines().length || !this.customerName.trim() || this.submitting) return;
    this.error.set('');
    this.submitting = true;
    try {
      const order = await this.orders.create({
        customerName: this.customerName.trim(),
        notes: this.notes.trim(),
        items: this.cart.lines().map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
        })),
        subtotal: this.cart.subtotal(),
        discount: this.discount(),
        total: this.total(),
      });
      this.cart.clear();
      this.confirmation.set(order.id);
      this.confirmationState.set(order.localState);
      try {
        this.activity.log(`Pedido ${order.id} creado (${order.localState.toLocaleLowerCase()}).`);
      } catch {
        this.error.set('El pedido quedó guardado, pero no se pudo actualizar la actividad local.');
      }
      this.customerName = '';
      this.notes = '';
      this.coupon = '';
      this.discount.set(0);
      this.couponMessage.set('');
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No se pudo guardar el pedido local.',
      );
    } finally {
      this.submitting = false;
    }
  }

  dismissConfirmation(): void {
    this.confirmation.set('');
    this.confirmationState.set('');
  }
}
