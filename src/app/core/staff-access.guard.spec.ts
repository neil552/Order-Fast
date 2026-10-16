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

  it('redirects unknown links to staff login and returns to the admin area', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/a/neil19B');

    const router = TestBed.inject(Router);
    expect(router.url).toContain('/login');
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe('/admin');
    expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
  });

  it('redirects authenticated visitors from unknown links to the admin area', async () => {
    sessionStorage.setItem('fastorder-demo-staff-session', 'active');
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/a/neil19B');

    expect(TestBed.inject(Router).url).toBe('/admin');
  });
});
