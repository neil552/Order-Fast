import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { LocalDatabaseService } from './services/local-database.service';
import { OnlineStatusService } from './services/online-status.service';
import { LocalStorageService } from './services/local-storage.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(window:online)': 'online.setOnline()',
    '(window:offline)': 'online.setOffline()',
    '(window:beforeinstallprompt)': 'captureInstallPrompt($event)',
  },
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly cart: CartService = inject(CartService);
  protected readonly online: OnlineStatusService = inject(OnlineStatusService);
  private readonly database = inject(LocalDatabaseService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);
  protected readonly storageNotice = computed(
    () => this.database.error() || this.localStorage.error(),
  );
  protected installPrompt: InstallPromptEvent | null = null;

  protected captureInstallPrompt(event: Event): void {
    event.preventDefault();
    this.installPrompt = event as InstallPromptEvent;
  }

  protected async installApp(): Promise<void> {
    if (!this.installPrompt) return;
    await this.installPrompt.prompt();
    this.installPrompt = null;
  }

  protected logout(): void {
    if (this.auth.logout()) void this.router.navigateByUrl('/');
  }
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
