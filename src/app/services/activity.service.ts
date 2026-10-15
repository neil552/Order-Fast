import { inject, Injectable, signal } from '@angular/core';
import { ActivityEntry } from '../models/fast-order';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly storage = inject(LocalStorageService);
  readonly entries = signal<ActivityEntry[]>(this.storage.read<ActivityEntry[]>('fastorder-activity', []));

  log(description: string): void {
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      description,
      createdAt: new Date().toISOString()
    };
    const entries = [entry, ...this.entries()].slice(0, 30);
    try {
      this.storage.write('fastorder-activity', entries);
      this.entries.set(entries);
    } catch (error) {
      console.error('No se pudo guardar la actividad local.', error);
      throw new Error('No se pudo guardar la actividad en este dispositivo.');
    }
  }

}
