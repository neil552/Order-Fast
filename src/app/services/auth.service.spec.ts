import { TestBed } from '@angular/core/testing';
import { AuthService, DEMO_STAFF_EMAIL, DEMO_STAFF_PASSWORD } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('authenticates the demo staff account and persists the session for this tab', () => {
    const service = TestBed.inject(AuthService);

    expect(service.login(DEMO_STAFF_EMAIL, DEMO_STAFF_PASSWORD)).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem('fastorder-demo-staff-session')).toBe('active');
  });

  it('rejects invalid credentials without creating a session', () => {
    const service = TestBed.inject(AuthService);

    expect(service.login(DEMO_STAFF_EMAIL, 'incorrecta')).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('fastorder-demo-staff-session')).toBeNull();
  });

  it('clears the staff session on logout', () => {
    const service = TestBed.inject(AuthService);
    service.login(DEMO_STAFF_EMAIL, DEMO_STAFF_PASSWORD);

    expect(service.logout()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('fastorder-demo-staff-session')).toBeNull();
  });
});
