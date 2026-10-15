import { Injectable, signal } from '@angular/core';

export const DEMO_STAFF_EMAIL = 'personal@fastorder.demo';
export const DEMO_STAFF_PASSWORD = 'FastOrder2026!';

const SESSION_KEY = 'fastorder-demo-staff-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly error = signal('');
  readonly isAuthenticated = signal(this.readSession());

  login(email: string, password: string): boolean {
    this.error.set('');
    if (email.trim().toLocaleLowerCase() !== DEMO_STAFF_EMAIL || password !== DEMO_STAFF_PASSWORD) {
      return false;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, 'active');
      this.isAuthenticated.set(true);
      return true;
    } catch (error) {
      this.reportStorageError('iniciar sesión', error);
      return false;
    }
  }

  logout(): boolean {
    this.error.set('');
    try {
      sessionStorage.removeItem(SESSION_KEY);
      this.isAuthenticated.set(false);
      return true;
    } catch (error) {
      this.reportStorageError('cerrar sesión', error);
      return false;
    }
  }

  private readSession(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'active';
    } catch (error) {
      this.reportStorageError('leer la sesión', error);
      return false;
    }
  }

  private reportStorageError(action: string, error: unknown): void {
    console.error(`No se pudo ${action} en el almacenamiento de sesión.`, error);
    this.error.set('El navegador no permitió guardar o leer la sesión de demostración.');
  }
}
