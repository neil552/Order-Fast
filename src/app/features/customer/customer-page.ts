import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-customer-page',
  imports: [CurrencyPipe, NgOptimizedImage],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> SABOR HECHO AL MOMENTO</span>
        <h1>¡Tu antojo,<br /><span>a un clic.</span></h1>
        <p>
          Buena comida, buenos momentos. Elige tus favoritos y nosotros nos encargamos del resto.
        </p>
        <label class="search-field">
          <span class="material-symbols-rounded" aria-hidden="true">search</span>
          <input
            type="search"
            placeholder="¿Qué se te antoja hoy?"
            aria-label="Buscar productos"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
          @if (query()) {
            <button class="search-clear" aria-label="Limpiar búsqueda" (click)="query.set('')">
              ×
            </button>
          }
        </label>
        <div class="hero-note"><span>✦</span> Preparado al momento <i>·</i> Siempre fresco</div>
      </div>
      <div class="hero-image">
        <img
          ngSrc="/products/hero.svg"
          fill
          priority
          alt="Hamburguesa artesanal con queso y papas fritas"
        />
        <div class="hero-image-shade"></div>
        <div class="hero-price"><span>Favorito de la casa</span><strong>Desde $12.90</strong></div>
        <div class="hero-image-dots" aria-hidden="true">● ● ●</div>
      </div>
    </section>

    <section class="category-section" aria-labelledby="categories-title">
      <div class="section-heading compact-heading">
        <div>
          <span class="eyebrow muted-eyebrow">ALGO PARA CADA ANTOJO</span>
          <h2 id="categories-title">¿Qué se te antoja?</h2>
        </div>
        <span class="muted">Elige tu categoría favorita</span>
      </div>
      <div class="category-list" aria-label="Filtrar por categoría">
        @for (category of categories(); track category.name) {
          <button
            class="category-chip"
            [class.selected]="selectedCategory() === category.name"
            (click)="selectedCategory.set(category.name)"
          >
            <span class="category-icon material-symbols-rounded" aria-hidden="true">{{
              category.icon
            }}</span>
            <span>{{ category.name }}</span>
          </button>
        }
      </div>
    </section>

    <section class="catalog-section" aria-labelledby="popular-title">
      <div class="section-heading">
        <div>
          <span class="eyebrow muted-eyebrow">HECHOS PARA DISFRUTAR</span>
          <h2 id="popular-title">
            {{ selectedCategory() === 'Todas' ? 'Más populares' : selectedCategory() }}
          </h2>
        </div>
        <span class="catalog-count">{{ visibleProducts().length }} productos</span>
      </div>
      @if (visibleProducts().length) {
        <div class="product-grid">
          @for (product of visibleProducts(); track product.id) {
            <article class="product-card">
              <div class="product-image-wrap">
                <img
                  [ngSrc]="product.image"
                  fill
                  [alt]="product.name"
                  loading="lazy"
                />
                <span class="product-tag">{{ product.category }}</span>
                <button
                  class="favorite-button material-symbols-rounded"
                  [attr.aria-label]="'Agregar ' + product.name + ' al carrito'"
                  (click)="add(product.id)"
                >
                  add_shopping_cart
                </button>
              </div>
              <div class="product-content">
                <div class="product-title-line">
                  <h3>{{ product.name }}</h3>
                  <span class="rating">★ 4.9</span>
                </div>
                <p>{{ product.description }}</p>
                <div class="product-buy">
                  <strong>{{ product.price | currency: 'USD' : 'symbol' : '1.2-2' }}</strong
                  ><button (click)="add(product.id)">+ Agregar</button>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-icon material-symbols-rounded">search_off</span>
          <h3>No encontramos productos</h3>
          <p>Prueba con otra búsqueda o categoría.</p>
          <button class="button button-outline" (click)="resetFilters()">Ver todo el menú</button>
        </div>
      }
    </section>
    @if (addedMessage()) {
      <div class="toast" role="status">{{ addedMessage() }}</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerPage {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  readonly selectedCategory = signal('Todas');
  readonly query = signal('');
  readonly addedMessage = signal('');
  readonly categories = computed(() => {
    const icons: Record<string, string> = {
      Todas: 'restaurant_menu',
      Hamburguesas: 'lunch_dining',
      Pizzas: 'local_pizza',
      Combos: 'fastfood',
      Snacks: 'tapas',
      Bebidas: 'local_cafe',
    };
    return ['Todas', ...this.productService.categories()].map((name) => ({
      name,
      icon: icons[name] ?? '✦',
    }));
  });
  readonly visibleProducts = computed(() => {
    const search = this.query().trim().toLocaleLowerCase();
    return this.productService
      .activeProducts()
      .filter(
        (product) =>
          (this.selectedCategory() === 'Todas' || product.category === this.selectedCategory()) &&
          (!search ||
            `${product.name} ${product.description} ${product.category}`
              .toLocaleLowerCase()
              .includes(search)),
      );
  });

  add(productId: string): void {
    this.cart.add(productId);
    const product = this.productService.products().find((item) => item.id === productId);
    this.addedMessage.set(`${product?.name ?? 'Producto'} agregado al carrito`);
    setTimeout(() => this.addedMessage.set(''), 2200);
  }

  resetFilters(): void {
    this.query.set('');
    this.selectedCategory.set('Todas');
  }
}
