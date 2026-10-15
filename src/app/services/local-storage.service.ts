import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  readonly error = signal('');

  read<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value) as T;
    } catch (error) {
      console.error(`No se pudo leer "${key}" de LocalStorage.`, error);
      this.error.set(`No se pudo leer el almacenamiento del navegador: ${this.message(error)}`);
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      const message = `No se pudo guardar "${key}" en LocalStorage: ${this.message(error)}`;
      this.error.set(message);
      throw new Error(message);
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'error desconocido';
  }
}
