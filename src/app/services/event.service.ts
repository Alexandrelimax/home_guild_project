import { Injectable, signal, computed } from '@angular/core';
import { GameLog } from '../interfaces/interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {
    private readonly _event_log = signal<GameLog[]>([]);

    readonly logs = computed(() => this._event_log());

    setLogs(logs: GameLog[]) {
        this._event_log.set(logs);
    }

    hydrateFromDashboard(logs: GameLog[]) {
        this.setLogs(logs);
    }

    addLogs(newLogs: GameLog[]) {
        const ordered = [...newLogs].reverse();

        this._event_log.update(state => [
            ...ordered,
            ...state
        ].slice(0, environment.game.eventLogMaxSize));
    }

    addError(message: string) {
        this.addLogs([{
            id: Date.now().toString(),
            type: 'error',
            message,
            created_at: new Date().toISOString()
        }]);
    }
}