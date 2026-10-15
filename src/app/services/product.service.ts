import { computed, inject, Injectable, signal } from '@angular/core';
import { DEMO_PRODUCTS, Product, ProductCategory, PRODUCT_CATEGORIES } from '../models/fast-order';
import { LocalDatabaseService } from './local-database.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly database = inject(LocalDatabaseService);
  private readonly storage = inject(LocalStorageService);
  readonly products = signal<Product[]>(DEMO_PRODUCTS);
  readonly categories = signal<ProductCategory[]>(this.readCategories());
  readonly activeProducts = computed(() => this.products().filter((product) => product.active));
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.load();
  }

  async save(product: Product): Promise<void> {
    await this.ready;
    await this.database.put('products', product);
    this.products.update((products) => {
      const exists = products.some((item) => item.id === product.id);
      return exists
        ? products.map((item) => (item.id === product.id ? product : item))
        : [...products, product];
    });
  }

  async remove(id: string): Promise<void> {
    await this.ready;
    await this.database.delete('products', id);
    this.products.update((products) => products.filter((product) => product.id !== id));
  }

  saveCategories(categories: ProductCategory[]): void {
    this.storage.write('fastorder-categories', categories);
    this.categories.set(categories);
  }

  private async load(): Promise<void> {
    try {
      const saved = await this.database.getAll<Product>('products');
      if (saved.length === 0) {
        for (const product of DEMO_PRODUCTS) await this.database.put('products', product);
        this.products.set(DEMO_PRODUCTS);
      } else {
        const defaults = new Map(DEMO_PRODUCTS.map((product) => [product.id, product]));
        const migrated = saved.map((product) => {
          const initial = defaults.get(product.id);
          const isLegacyDemoImage =
            product.image === `/products/${product.id}.svg` ||
            product.image.startsWith('https://images.unsplash.com/');
          return {
            ...product,
            ...(initial && isLegacyDemoImage ? { image: initial.image } : {}),
          };
        });
        for (const product of migrated) {
          if (product.image !== saved.find((item) => item.id === product.id)?.image) {
            await this.database.put('products', product);
          }
        }
        const order = new Map(DEMO_PRODUCTS.map((product, index) => [product.id, index]));
        this.products.set(migrated.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity)));
      }
    } catch (error) {
      console.error('No se pudo cargar el catálogo guardado.', error);
    }
  }

  private readCategories(): ProductCategory[] {
    return this.storage.read('fastorder-categories', [...PRODUCT_CATEGORIES]);
  }
}
