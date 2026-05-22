import { Injectable, signal, computed, inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { EventQuest } from '../interfaces/interface';

@Injectable({ providedIn: 'root' })
export class EventQuestService {
  private api = inject(ApiService);

  private readonly _eventQuests = signal<EventQuest[]>([]);
  readonly eventQuests = this._eventQuests.asReadonly();

  readonly activeEventQuests = computed(() =>
    this._eventQuests().filter(q => q.status !== 'approved')
  );

  load() {
    return this.api.get<EventQuest[]>('users/events').pipe(
      tap(quests => this._eventQuests.set(quests))
    );
  }

  updateStatus(questId: number, status: EventQuest['status']) {
    this._eventQuests.update(qs =>
      qs.map(q => q.id === questId ? { ...q, status } : q)
    );
  }

  clear() {
    this._eventQuests.set([]);
  }
}
