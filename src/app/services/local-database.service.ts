import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalDatabaseService {
  private readonly databaseName = 'fastorder-local';
  private databasePromise: Promise<IDBDatabase> | null = null;
  readonly error = signal('');

  getAll<T>(storeName: 'products' | 'orders'): Promise<T[]> {
    return this.request<T[]>(storeName, 'readonly', (store) => store.getAll());
  }

  put<T extends { id: string }>(storeName: 'products' | 'orders', value: T): Promise<void> {
    return this.request<void>(storeName, 'readwrite', (store) => store.put(value));
  }

  delete(storeName: 'products' | 'orders', id: string): Promise<void> {
    return this.request<void>(storeName, 'readwrite', (store) => store.delete(id));
  }

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este navegador.'));
        return;
      }
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('products')) {
          database.createObjectStore('products', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('orders')) {
          database.createObjectStore('orders', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB.'));
      request.onblocked = () => reject(new Error('IndexedDB está bloqueado por otra pestaña abierta.'));
    });
    const database = opening.catch((error: unknown) => {
      this.databasePromise = null;
      const message = error instanceof Error ? error.message : 'No se pudo acceder a IndexedDB.';
      this.error.set(`No se pudo abrir el almacenamiento local: ${message}`);
      throw error;
    });
    this.databasePromise = database;
    return database;
  }

  private async request<T>(
    storeName: 'products' | 'orders',
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const database = await this.open();
    return new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = action(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result as T);
      request.onerror = () => reject(request.error ?? new Error(`Error al actualizar ${storeName}.`));
      transaction.onabort = () => reject(transaction.error ?? new Error(`Se canceló la operación en ${storeName}.`));
      transaction.onerror = () => reject(transaction.error ?? new Error(`Falló una operación en ${storeName}.`));
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : `No se pudo guardar ${storeName}.`;
      this.error.set(`Error de almacenamiento local: ${message}`);
      throw error;
    });
  }
}
