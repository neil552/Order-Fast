import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="login-shell">
      <div class="login-card">
        <span class="eyebrow muted-eyebrow">ACCESO DE PERSONAL</span>
        <h1>Iniciar sesión</h1>
        <p class="login-description">Accede a las vistas locales de cocina y administración.</p>
        <form (ngSubmit)="signIn()">
          <label class="field-label">
            Correo
            <input type="email" name="email" [(ngModel)]="email" autocomplete="username" required />
          </label>
          <label class="field-label">
            Contraseña
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              autocomplete="current-password"
              required
            />
          </label>
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          @if (auth.error()) {
            <p class="form-error" role="alert">{{ auth.error() }}</p>
          }
          <button class="button button-primary login-submit" type="submit">Iniciar sesión</button>
        </form>
        <a class="login-back" routerLink="/">Volver a la tienda</a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly error = signal('');
  email = '';
  password = '';

  signIn(): void {
    this.error.set('');
    if (!this.auth.login(this.email, this.password)) {
      this.error.set('El correo o la contraseña no son válidos.');
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin';
    const allowedReturnUrl = /^\/(admin|cocina)(?:[/?#].*)?$/.test(returnUrl)
      ? returnUrl
      : '/admin';
    void this.router.navigateByUrl(allowedReturnUrl);
  }
}
