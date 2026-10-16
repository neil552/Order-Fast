import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { routes } from './app.routes';
import { LocalDatabaseService } from './services/local-database.service';
import { AuthService, DEMO_STAFF_EMAIL, DEMO_STAFF_PASSWORD } from './services/auth.service';

const inMemoryDatabase = {
  error: signal(''),
  getAll: <T>() => Promise.resolve([] as T[]),
  put: <T extends { id: string }>(_store: 'products' | 'orders', _value: T) => Promise.resolve(),
  delete: (_store: 'products' | 'orders', _id: string) => Promise.resolve(),
};

describe('App', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: LocalDatabaseService, useValue: inMemoryDatabase },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show only customer navigation when no staff session exists', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('FastOrder');
    expect(compiled.querySelector('.brand-mark')?.tagName.toLowerCase()).toBe('svg');
    const mainNavigation = compiled.querySelector('nav[aria-label="Navegación principal"]');
    const viewSwitcher = compiled.querySelector('nav[aria-label="Cambiar vista"]');
    expect(mainNavigation).toBeTruthy();
    expect(mainNavigation?.textContent).not.toContain('Cocina');
    expect(mainNavigation?.textContent).not.toContain('Administración');
    expect(viewSwitcher).toBeNull();
    expect(compiled.querySelector('.staff-login-link')).toBeNull();
  });

  it('should show staff navigation after a successful demo sign-in', async () => {
    TestBed.inject(AuthService).login(DEMO_STAFF_EMAIL, DEMO_STAFF_PASSWORD);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const viewSwitcher = compiled.querySelector('nav[aria-label="Cambiar vista"]');
    expect(viewSwitcher?.textContent).toContain('Cocina');
    expect(viewSwitcher?.textContent).toContain('Admin');
    expect(compiled.querySelector('.staff-session-button')?.textContent).toContain('Cerrar sesión');
  });
});
