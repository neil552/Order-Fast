import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order, OrderStatus, Product, ProductCategory } from '../../models/fast-order';
import { ActivityService } from '../../services/activity.service';
import { NotificationService } from '../../services/notification.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';

type AdminTab = 'Resumen' | 'Productos' | 'Categorías' | 'Pedidos' | 'Reportes' | 'Configuración';

@Component({
  selector: 'app-admin-page',
  imports: [CurrencyPipe, DatePipe, FormsModule, NgOptimizedImage],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <span class="eyebrow muted-eyebrow">ESPACIO DE TRABAJO</span>
        <h1>Administración</h1>
        <p>Control de FastOrder</p>
        <nav aria-label="Secciones de administración">
          @for (tab of tabs; track tab) {
            <button [class.admin-nav-active]="selectedTab() === tab" (click)="selectedTab.set(tab)">
              <span class="material-symbols-rounded" aria-hidden="true">{{ icons[tab] }}</span
              >{{ tab }}
              @if (tab === 'Pedidos' && orders().length) {
                <span class="admin-nav-count">{{ orders().length }}</span>
              }
            </button>
          }
        </nav>
        <div class="sidebar-foot">
          <span class="sidebar-status-dot"></span><span>Datos guardados en este dispositivo</span>
        </div>
      </aside>
      <section class="admin-content">
        <header class="admin-page-header">
          <div>
            <span class="eyebrow muted-eyebrow"
              >FASTORDER / {{ selectedTab().toLocaleUpperCase() }}</span
            >
            <h2>{{ selectedTab() }}</h2>
          </div>
          <span class="demo-badge">MODO DEMOSTRACIÓN</span>
        </header>
        @if (notice()) {
          <p class="notice" [class.notice-error]="isError()" role="status">{{ notice() }}</p>
        }

        @if (selectedTab() === 'Resumen') {
          <div class="metric-grid">
            <article class="metric-card">
              <span>Pedidos registrados</span><strong>{{ orders().length }}</strong
              ><small>Desde que se inició esta demo</small>
            </article>
            <article class="metric-card">
              <span>Ingresos locales</span
              ><strong>{{ revenue() | currency: 'USD' : 'symbol' : '1.2-2' }}</strong
              ><small>Suma de pedidos guardados</small>
            </article>
            <article class="metric-card">
              <span>Productos activos</span><strong>{{ activeProducts() }}</strong
              ><small>De {{ products().length }} productos</small>
            </article>
            <article class="metric-card">
              <span>Pedidos por atender</span><strong>{{ pendingOrders() }}</strong
              ><small>Nuevos o en preparación</small>
            </article>
          </div>
          <div class="admin-panels">
            <section class="admin-panel">
              <div class="panel-title">
                <div>
                  <h3>Actividad reciente</h3>
                  <p>Eventos guardados localmente</p>
                </div>
              </div>
              @if (activity.entries().length) {
                <div class="activity-list">
                  @for (entry of activity.entries().slice(0, 7); track entry.id) {
                    <article>
                      <span class="activity-dot"></span>
                      <div>
                        <p>{{ entry.description }}</p>
                        <time>{{ entry.createdAt | date: 'short' }}</time>
                      </div>
                    </article>
                  }
                </div>
              } @else {
                <div class="panel-empty">
                  Aún no hay actividad. Crea un pedido o actualiza un producto para empezar.
                </div>
              }
            </section>
            <section class="admin-panel">
              <div class="panel-title">
                <div>
                  <h3>Pedidos recientes</h3>
                  <p>{{ orders().length }} registros locales</p>
                </div>
                <button class="text-button" (click)="selectedTab.set('Pedidos')">
                  Ver pedidos →
                </button>
              </div>
              @if (recentOrders().length) {
                <div class="mini-orders">
                  @for (order of recentOrders().slice(0, 5); track order.id) {
                    <article>
                      <div>
                        <strong>{{ order.id }}</strong
                        ><span>{{ order.createdAt | date: 'short' }}</span>
                      </div>
                      <strong>{{ order.total | currency: 'USD' : 'symbol' : '1.2-2' }}</strong>
                    </article>
                  }
                </div>
              } @else {
                <div class="panel-empty">
                  No hay pedidos todavía. Los indicadores reflejan únicamente actividad real de esta
                  demo.
                </div>
              }
            </section>
          </div>
          <p class="demo-note">
            El catálogo de ocho productos es información inicial de demostración. No hay datos de
            clientes ni ventas de un restaurante real.
          </p>
        }

        @if (selectedTab() === 'Productos') {
          <div class="admin-toolbar">
            <label class="search-field admin-search"
              ><span class="material-symbols-rounded" aria-hidden="true">search</span
              ><input
                type="search"
                placeholder="Buscar producto"
                [value]="productQuery()"
                (input)="productQuery.set($any($event.target).value)" /></label
            ><button class="button button-primary" (click)="startNewProduct()">
              <span class="material-symbols-rounded" aria-hidden="true">add</span>Nuevo producto
            </button>
          </div>
          @if (editing()) {
            <form class="editor-card" (ngSubmit)="saveProduct()">
              <div class="panel-title">
                <div>
                  <h3>{{ editing() === 'new' ? 'Crear producto' : 'Editar producto' }}</h3>
                  <p>Los cambios se guardan localmente.</p>
                </div>
                <button
                  type="button"
                  class="icon-button material-symbols-rounded"
                  aria-label="Cerrar formulario"
                  (click)="cancelEdit()"
                >
                  close
                </button>
              </div>
              <div class="form-grid">
                <label class="field-label"
                  >Nombre<input
                    required
                    maxlength="60"
                    [ngModel]="draft().name"
                    (ngModelChange)="setDraft('name', $event)"
                    name="name"
                /></label>
                <label class="field-label"
                  >Categoría<select
                    required
                    [ngModel]="draft().category"
                    (ngModelChange)="setDraft('category', $event)"
                    name="category"
                  >
                    @for (category of productsService.categories(); track category) {
                      <option [value]="category">{{ category }}</option>
                    }
                  </select></label
                >
                <label class="field-label"
                  >Precio (USD)<input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    [ngModel]="draft().price"
                    (ngModelChange)="setDraft('price', $event)"
                    name="price"
                /></label>
                <label class="field-label"
                  >Ruta de imagen<input
                    [ngModel]="draft().image"
                    (ngModelChange)="setDraft('image', $event)"
                    name="image"
                    placeholder="/products/smash-doble.svg"
                /></label>
                <label class="field-label form-wide"
                  >Descripción<textarea
                    maxlength="180"
                    [ngModel]="draft().description"
                    (ngModelChange)="setDraft('description', $event)"
                    name="description"
                    rows="2"
                  ></textarea>
                </label>
              </div>
              @if (formError()) {
                <p class="form-error" role="alert">{{ formError() }}</p>
              }
              <div class="editor-actions">
                <button type="button" class="button button-outline" (click)="cancelEdit()">
                  Cancelar</button
                ><button class="button button-primary" type="submit">Guardar producto</button>
              </div>
            </form>
          }
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (product of filteredProducts(); track product.id) {
                  <tr>
                    <td>
                      <div class="table-product">
                        <img
                          [ngSrc]="product.image"
                          [alt]="''"
                          width="42"
                          height="42"
                          loading="lazy"
                        />
                        <div>
                          <strong>{{ product.name }}</strong
                          ><span>{{ product.description }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ product.category }}</td>
                    <td>{{ product.price | currency: 'USD' : 'symbol' : '1.2-2' }}</td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-ready]="product.active"
                        [class.status-done]="!product.active"
                        >{{ product.active ? 'Activo' : 'Inactivo' }}</span
                      >
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="text-button" (click)="editProduct(product)">Editar</button
                        ><button class="text-button" (click)="toggleProduct(product)">
                          {{ product.active ? 'Desactivar' : 'Activar' }}</button
                        ><button class="text-button danger-text" (click)="removeProduct(product)">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="table-empty">
                      No hay productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="demo-note">
            El catálogo inicial y sus ilustraciones se incluyen en la aplicación para funcionar sin
            conexión después de cargarla.
          </p>
        }

        @if (selectedTab() === 'Categorías') {
          <section class="admin-panel category-panel">
            <div class="panel-title">
              <div>
                <h3>Organiza el menú</h3>
                <p>Las categorías se guardan en el almacenamiento local del navegador.</p>
              </div>
            </div>
            <form class="category-create" (ngSubmit)="addCategory()">
              <label class="field-label"
                >Nueva categoría<input
                  required
                  maxlength="32"
                  [(ngModel)]="newCategory"
                  name="newCategory"
                  placeholder="Ej. Postres" /></label
              ><button class="button button-primary">Agregar categoría</button>
            </form>
            <div class="category-admin-list">
              @for (category of productsService.categories(); track category) {
                <form
                  class="category-admin-row"
                  (ngSubmit)="renameCategory(category, categoryName.value)"
                >
                  <span class="category-icon material-symbols-rounded" aria-hidden="true">sell</span
                  ><input
                    #categoryName
                    required
                    maxlength="32"
                    [value]="category"
                    [attr.aria-label]="'Nombre de categoría ' + category"
                  /><span>{{ categoryProductCount(category) }} productos</span
                  ><button class="text-button" [disabled]="categoryName.value.trim() === category">
                    Guardar
                  </button>
                </form>
              }
            </div>
          </section>
        }

        @if (selectedTab() === 'Pedidos') {
          <div class="admin-toolbar">
            <label class="search-field admin-search"
              ><span class="material-symbols-rounded" aria-hidden="true">search</span
              ><input
                type="search"
                placeholder="Buscar número de pedido"
                [value]="orderQuery()"
                (input)="orderQuery.set($any($event.target).value)" /></label
            ><select
              class="admin-select"
              aria-label="Filtrar pedidos por estado"
              [value]="orderStatus()"
              (change)="orderStatus.set($any($event.target).value)"
            >
              <option value="Todos">Todos los estados</option>
              @for (status of statuses; track status) {
                <option>{{ status }}</option>
              }
            </select>
          </div>
          <div class="table-wrap">
            <table class="data-table order-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (order of filteredOrders(); track order.id) {
                  <tr>
                    <td>
                      <strong>{{ order.id }}</strong
                      ><span class="table-subline">{{ order.localState }}</span>
                    </td>
                    <td>{{ order.createdAt | date: 'short' }}</td>
                    <td>
                      {{ order.items.map((item) => item.quantity + '× ' + item.name).join(', ') }}
                    </td>
                    <td>{{ order.total | currency: 'USD' : 'symbol' : '1.2-2' }}</td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-new]="order.status === 'Nuevo'"
                        [class.status-preparing]="order.status === 'En preparación'"
                        [class.status-ready]="order.status === 'Listo'"
                        [class.status-done]="order.status === 'Entregado'"
                        >{{ order.status }}</span
                      >
                    </td>
                    <td>
                      <select
                        class="row-select"
                        [attr.aria-label]="'Estado del pedido ' + order.id"
                        [ngModel]="order.status"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="setOrderStatus(order, $event)"
                      >
                        @for (status of statuses; track status) {
                          <option>{{ status }}</option>
                        }
                      </select>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="table-empty">
                      No hay pedidos guardados que coincidan. Los pedidos son locales y no se
                      comparten entre dispositivos.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (selectedTab() === 'Reportes') {
          <div class="report-intro">
            <div>
              <h3>Rendimiento del menú</h3>
              <p>Unidades por producto según los pedidos guardados en este navegador.</p>
            </div>
            <span class="demo-badge">DATOS LOCALES</span>
          </div>
          <div class="metric-grid report-metrics">
            <article class="metric-card">
              <span>Pedidos</span><strong>{{ orders().length }}</strong
              ><small>Sin pedidos ficticios</small>
            </article>
            <article class="metric-card">
              <span>Venta bruta local</span
              ><strong>{{ revenue() | currency: 'USD' : 'symbol' : '1.2-2' }}</strong
              ><small>Total de órdenes guardadas</small>
            </article>
            <article class="metric-card">
              <span>Descuentos</span
              ><strong>{{ discounts() | currency: 'USD' : 'symbol' : '1.2-2' }}</strong
              ><small>Códigos de demostración aplicados</small>
            </article>
          </div>
          <section class="admin-panel chart-panel">
            <div class="panel-title">
              <div>
                <h3>Productos más pedidos</h3>
                <p>Unidades acumuladas. El gráfico se completa al registrar pedidos.</p>
              </div>
            </div>
            @if (sales().length) {
              <div
                class="bar-chart"
                role="img"
                aria-label="Gráfico de unidades vendidas por producto"
              >
                @for (sale of sales(); track sale.name) {
                  <div class="bar-row">
                    <span class="bar-label">{{ sale.name }}</span
                    ><span class="bar-track"
                      ><span
                        class="bar-fill"
                        [style.width.%]="barWidth(sale.quantity)"
                      ></span></span
                    ><strong>{{ sale.quantity }}</strong>
                  </div>
                }
              </div>
            } @else {
              <div class="chart-empty">
                <span class="empty-icon material-symbols-rounded">bar_chart</span>
                <p>Aún no hay pedidos para calcular ventas.</p>
                <span>Este reporte se calcula a partir de pedidos locales reales.</span>
              </div>
            }
          </section>
        }

        @if (selectedTab() === 'Configuración') {
          <section class="admin-panel settings-panel">
            <div class="panel-title">
              <div>
                <h3>Preferencias de la aplicación</h3>
                <p>Configuración guardada para este navegador.</p>
              </div>
            </div>
            <div class="setting-row">
              <div>
                <strong>Avisos locales de cocina</strong>
                <p>Notifica cambios de estado mientras FastOrder está abierto.</p>
              </div>
              <button class="button button-outline" (click)="requestNotifications()">
                {{
                  notifications.permission() === 'granted'
                    ? 'Permiso concedido'
                    : 'Solicitar permiso'
                }}
              </button>
            </div>
            <div class="setting-row">
              <div>
                <strong>Estado de almacenamiento</strong>
                <p>
                  Productos y pedidos se conservan en IndexedDB. El carrito y preferencias usan
                  LocalStorage.
                </p>
              </div>
              <span class="local-badge">Solo dispositivo</span>
            </div>
            <div class="setting-row">
              <div>
                <strong>Pedidos sin conexión</strong>
                <p>
                  Se marcan como pendientes locales; no hay backend ni sincronización automática.
                </p>
              </div>
              <span class="local-badge">Sin servidor</span>
            </div>
            <p class="demo-note">
              Las notificaciones push del servidor y los pagos reales quedan fuera del alcance de
              esta aplicación frontend.
            </p>
          </section>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  readonly productsService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  readonly activity = inject(ActivityService);
  readonly notifications = inject(NotificationService);
  readonly tabs: AdminTab[] = [
    'Resumen',
    'Productos',
    'Categorías',
    'Pedidos',
    'Reportes',
    'Configuración',
  ];
  readonly icons: Record<AdminTab, string> = {
    Resumen: 'dashboard',
    Productos: 'inventory_2',
    Categorías: 'category',
    Pedidos: 'receipt_long',
    Reportes: 'bar_chart',
    Configuración: 'settings',
  };
  readonly statuses: OrderStatus[] = ['Nuevo', 'En preparación', 'Listo', 'Entregado'];
  readonly selectedTab = signal<AdminTab>('Resumen');
  readonly notice = signal('');
  readonly isError = signal(false);
  readonly formError = signal('');
  readonly editing = signal<'new' | 'existing' | null>(null);
  readonly productQuery = signal('');
  readonly orderQuery = signal('');
  readonly orderStatus = signal('Todos');
  readonly products = this.productsService.products;
  readonly orders = this.orderService.recentOrders;
  readonly activeProducts = computed(
    () => this.products().filter((product) => product.active).length,
  );
  readonly revenue = computed(() => this.orders().reduce((total, order) => total + order.total, 0));
  readonly discounts = computed(() =>
    this.orders().reduce((total, order) => total + order.discount, 0),
  );
  readonly pendingOrders = computed(
    () =>
      this.orders().filter((order) => order.status === 'Nuevo' || order.status === 'En preparación')
        .length,
  );
  readonly recentOrders = this.orderService.recentOrders;
  readonly draft = signal<Product>(this.emptyProduct());
  newCategory = '';
  readonly filteredProducts = computed(() => {
    const search = this.productQuery().trim().toLocaleLowerCase();
    return this.products().filter(
      (product) =>
        !search || `${product.name} ${product.category}`.toLocaleLowerCase().includes(search),
    );
  });
  readonly filteredOrders = computed(() => {
    const search = this.orderQuery().trim().toLocaleLowerCase();
    return this.orders().filter(
      (order) =>
        (this.orderStatus() === 'Todos' || order.status === this.orderStatus()) &&
        (!search || order.id.toLocaleLowerCase().includes(search)),
    );
  });
  readonly sales = computed(() => {
    const quantities = new Map<string, number>();
    for (const order of this.orders()) {
      for (const item of order.items)
        quantities.set(item.name, (quantities.get(item.name) ?? 0) + item.quantity);
    }
    return [...quantities.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  });

  barWidth(quantity: number): number {
    const max = Math.max(...this.sales().map((sale) => sale.quantity), 1);
    return Math.max(3, (quantity / max) * 100);
  }

  categoryProductCount(category: string): number {
    return this.products().filter((product) => product.category === category).length;
  }

  startNewProduct(): void {
    this.draft.set(this.emptyProduct());
    this.formError.set('');
    this.editing.set('new');
  }

  editProduct(product: Product): void {
    this.draft.set({ ...product });
    this.formError.set('');
    this.editing.set('existing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setDraft(
    field: 'name' | 'description' | 'price' | 'category' | 'image',
    value: string | number,
  ): void {
    this.draft.update((draft) => ({
      ...draft,
      [field]: field === 'price' ? Number(value) : value,
    }));
  }

  async saveProduct(): Promise<void> {
    const product = {
      ...this.draft(),
      name: this.draft().name.trim(),
      description: this.draft().description.trim(),
      image: this.draft().image.trim() || '/products/smash-doble.svg',
    };
    if (
      !product.name ||
      !product.category ||
      !Number.isFinite(product.price) ||
      product.price <= 0
    ) {
      this.formError.set('Completa nombre y categoría, y usa un precio mayor que cero.');
      return;
    }
    const activityDescription = `${this.editing() === 'new' ? 'Producto creado' : 'Producto actualizado'}: ${product.name}.`;
    try {
      await this.productsService.save(product);
      this.editing.set(null);
      this.showNotice(`Producto «${product.name}» guardado.`);
      try {
        this.activity.log(activityDescription);
      } catch {
        this.showNotice(`Producto «${product.name}» guardado; no se pudo registrar la actividad.`);
      }
    } catch (error) {
      this.formError.set(
        error instanceof Error ? error.message : 'No se pudo guardar el producto.',
      );
    }
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.formError.set('');
  }

  async toggleProduct(product: Product): Promise<void> {
    try {
      await this.productsService.save({ ...product, active: !product.active });
      this.activity.log(
        `Producto ${product.active ? 'desactivado' : 'activado'}: ${product.name}.`,
      );
      this.showNotice(`${product.name}: ${product.active ? 'desactivado' : 'activado'}.`);
    } catch (error) {
      this.showError(error);
    }
  }

  async removeProduct(product: Product): Promise<void> {
    if (!window.confirm(`¿Eliminar «${product.name}» del catálogo local?`)) return;
    try {
      await this.productsService.remove(product.id);
      this.activity.log(`Producto eliminado: ${product.name}.`);
      this.showNotice(`${product.name} eliminado del catálogo.`);
    } catch (error) {
      this.showError(error);
    }
  }

  addCategory(): void {
    const category = this.newCategory.trim();
    if (
      !category ||
      this.productsService
        .categories()
        .some((item) => item.toLocaleLowerCase() === category.toLocaleLowerCase())
    ) {
      this.showError(new Error('Escribe una categoría nueva que aún no exista.'));
      return;
    }
    this.saveCategoryList(
      [...this.productsService.categories(), category],
      `Categoría «${category}» creada.`,
    );
    this.newCategory = '';
  }

  async renameCategory(previous: string, nextValue: string): Promise<void> {
    const next = nextValue.trim();
    if (
      !next ||
      (next !== previous &&
        this.productsService
          .categories()
          .some((item) => item.toLocaleLowerCase() === next.toLocaleLowerCase()))
    ) {
      this.showError(new Error('El nombre debe ser válido y diferente a las demás categorías.'));
      return;
    }
    const categories = this.productsService
      .categories()
      .map((item) => (item === previous ? next : item));
    if (!this.saveCategoryList(categories, `Categoría «${previous}» actualizada.`)) return;
    try {
      for (const product of this.products().filter((item) => item.category === previous)) {
        await this.productsService.save({ ...product, category: next });
      }
    } catch (error) {
      this.showError(error);
    }
  }

  async setOrderStatus(order: Order, value: string): Promise<void> {
    if (!this.statuses.includes(value as OrderStatus)) return;
    try {
      await this.orderService.updateStatus(order.id, value as OrderStatus);
      this.notifications.notify(
        'FastOrder · Estado actualizado',
        `El pedido ${order.id} está ${value.toLocaleLowerCase()}.`,
      );
      try {
        this.activity.log(`Pedido ${order.id}: estado actualizado a «${value}».`);
        this.showNotice(`Pedido ${order.id} actualizado a «${value}».`);
      } catch {
        this.showNotice(`Pedido ${order.id} actualizado; no se pudo registrar la actividad.`);
      }
    } catch (error) {
      this.showError(error);
    }
  }

  async requestNotifications(): Promise<void> {
    await this.notifications.requestPermission();
    this.showNotice(
      this.notifications.permission() === 'granted'
        ? 'Se permitirán avisos locales cuando esta aplicación esté abierta.'
        : 'El navegador no concedió permiso para las notificaciones.',
    );
  }

  private saveCategoryList(categories: ProductCategory[], message: string): boolean {
    try {
      this.productsService.saveCategories(categories);
      this.showNotice(message);
      try {
        this.activity.log(message);
      } catch {
        this.showNotice(`${message} No se pudo registrar la actividad.`);
      }
      return true;
    } catch (error) {
      this.showError(error);
      return false;
    }
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    this.isError.set(false);
  }

  private showError(error: unknown): void {
    this.notice.set(
      error instanceof Error ? error.message : 'Ocurrió un error al guardar los cambios.',
    );
    this.isError.set(true);
  }

  private emptyProduct(): Product {
    const category = this.productsService.categories()[0] ?? 'Hamburguesas';
    return {
      id: `product-${crypto.randomUUID()}`,
      name: '',
      description: '',
      price: 0,
      category,
      image: '/products/smash-doble.svg',
      active: true,
    };
  }
}
