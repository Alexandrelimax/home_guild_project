import { Injectable, signal, computed, inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { GameLog } from '../interfaces/interface';

const LAST_SEEN_KEY = 'hg_notif_last_seen';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);

  private readonly _notifications = signal<GameLog[]>([]);
  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY) ?? '';
    return this._notifications().filter(n => n.created_at > lastSeen).length;
  });

  load() {
    return this.api.get<GameLog[]>('users/notifications').pipe(
      tap(items => this._notifications.set(items))
    );
  }

  markAllRead() {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
  }

  clear() {
    this._notifications.set([]);
  }
}
