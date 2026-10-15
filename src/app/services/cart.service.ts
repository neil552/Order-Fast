import { computed, inject, Injectable, signal } from '@angular/core';
import { CartItem } from '../models/fast-order';
import { ProductService } from './product.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productService = inject(ProductService);
  private readonly storage = inject(LocalStorageService);
  readonly items = signal<CartItem[]>(this.storage.read<CartItem[]>('fastorder-cart', []));
  readonly lines = computed(() => this.items().flatMap((item) => {
    const product = this.productService.products().find((candidate) => candidate.id === item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  }));
  readonly count = computed(() => this.lines().reduce((count, line) => count + line.quantity, 0));
  readonly subtotal = computed(() => this.lines().reduce((total, line) => total + line.product.price * line.quantity, 0));

  add(productId: string): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.productId === productId);
      return existing
        ? items.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { productId, quantity: 1 }];
    });
    this.persist();
  }

  setQuantity(productId: string, quantity: number): void {
    this.items.update((items) => quantity <= 0
      ? items.filter((item) => item.productId !== productId)
      : items.map((item) => item.productId === productId ? { ...item, quantity: Math.floor(quantity) } : item));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  private persist(): void {
    try {
      this.storage.write('fastorder-cart', this.items());
    } catch (error) {
      console.error('No se pudo guardar el carrito.', error);
      throw error;
    }
  }
}
