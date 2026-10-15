import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnlineStatusService {
  readonly isOnline = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  setOnline(): void {
    this.isOnline.set(true);
  }
  setOffline(): void {
    this.isOnline.set(false);
  }
}
