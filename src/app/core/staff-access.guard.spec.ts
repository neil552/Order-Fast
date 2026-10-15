import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';

describe('staffAccessGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('redirects unauthenticated visitors from staff routes to login', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/cocina');

    expect(TestBed.inject(Router).url).toContain('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
  });
});
