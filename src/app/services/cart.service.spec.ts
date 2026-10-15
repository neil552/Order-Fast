import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEMO_PRODUCTS } from '../models/fast-order';
import { CartService } from './cart.service';
import { ProductService } from './product.service';

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    localStorage.removeItem('fastorder-cart');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProductService,
          useValue: { products: signal(DEMO_PRODUCTS) }
        }
      ]
    });
    cart = TestBed.inject(CartService);
  });

  it('combines product quantities and calculates the subtotal', () => {
    cart.add('smash-doble');
    cart.add('smash-doble');
    cart.add('papas-loaded');

    expect(cart.count()).toBe(3);
    expect(cart.subtotal()).toBeCloseTo(33.7);
    expect(cart.lines()).toHaveLength(2);
  });

  it('updates and removes lines, persisting the cart locally', () => {
    cart.add('smash-doble');
    cart.add('smash-doble');
    cart.setQuantity('smash-doble', 1);

    expect(cart.count()).toBe(1);
    expect(cart.subtotal()).toBeCloseTo(12.9);
    expect(JSON.parse(localStorage.getItem('fastorder-cart') ?? '[]')).toEqual([
      { productId: 'smash-doble', quantity: 1 }
    ]);

    cart.setQuantity('smash-doble', 0);
    expect(cart.count()).toBe(0);
    expect(cart.lines()).toHaveLength(0);
  });
});
