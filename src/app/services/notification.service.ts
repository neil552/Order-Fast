import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly permission = signal(this.currentPermission());

  async requestPermission(): Promise<void> {
    if (!('Notification' in globalThis)) {
      this.permission.set('unsupported');
      return;
    }
    this.permission.set(await Notification.requestPermission());
  }

  notify(title: string, message: string): void {
    if (this.currentPermission() === 'granted') {
      new Notification(title, { body: message, icon: '/icons/icon.svg' });
    }
  }

  private currentPermission(): NotificationPermission | 'unsupported' {
    return 'Notification' in globalThis ? Notification.permission : 'unsupported';
  }
}
