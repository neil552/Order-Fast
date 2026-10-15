export type ProductCategory = string;
export type OrderStatus = 'Nuevo' | 'En preparación' | 'Listo' | 'Entregado';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  active: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  localState: 'Pendiente local' | 'Guardado local';
}

export interface ActivityEntry {
  id: string;
  description: string;
  createdAt: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Hamburguesas',
  'Pizzas',
  'Combos',
  'Snacks',
  'Bebidas'
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'smash-doble',
    name: 'Smash Doble',
    description: 'Doble carne smash, queso cheddar, pepinillos y salsa de la casa.',
    price: 12.9,
    category: 'Hamburguesas',
    image: '/products/smash%20doble.webp',
    active: true
  },
  {
    id: 'combo-bacon-club',
    name: 'Combo Bacon Club',
    description: 'Hamburguesa con tocino, papas doradas y bebida fría.',
    price: 16.5,
    category: 'Combos',
    image: '/products/combo%20bacon%20club.webp',
    active: true
  },
  {
    id: 'pizza-pepperoni',
    name: 'Pizza Pepperoni',
    description: 'Pepperoni crujiente, mozzarella fundida y salsa artesanal.',
    price: 14.9,
    category: 'Pizzas',
    image: '/products/Pizza%20Pepperoni.webp',
    active: true
  },
  {
    id: 'papas-loaded',
    name: 'Papas Loaded',
    description: 'Papas crocantes con cheddar cremoso, tocino y cebollín.',
    price: 7.9,
    category: 'Snacks',
    image: '/products/Papas%20Loaded.webp',
    active: true
  },
  {
    id: 'nuggets-crispy',
    name: 'Nuggets Crispy',
    description: 'Seis piezas de pollo crujiente con salsa para acompañar.',
    price: 8.5,
    category: 'Snacks',
    image: '/products/Nuggets%20Crispy.webp',
    active: true
  },
  {
    id: 'shake-chocolate',
    name: 'Shake Chocolate',
    description: 'Batido de chocolate, helado cremoso y crema batida.',
    price: 5.9,
    category: 'Bebidas',
    image: '/products/Shake%20Chocolate.webp',
    active: true
  },
  {
    id: 'classic-cheese',
    name: 'Classic Cheese',
    description: 'Carne a la parrilla, queso americano, lechuga y tomate.',
    price: 11.5,
    category: 'Hamburguesas',
    image: '/products/Classic%20Cheese.webp',
    active: true
  },
  {
    id: 'alitas-bbq',
    name: 'Alitas BBQ',
    description: 'Alitas bañadas en salsa BBQ ahumada con toque dulce.',
    price: 9.9,
    category: 'Snacks',
    image: '/products/Alitas%20BBQ.webp',
    active: true
  }
];
