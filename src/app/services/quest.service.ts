import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Quest } from '../interfaces/interface';
import { tap, finalize } from 'rxjs/operators';
import { UserService } from './user.service';
import { EventService } from './event.service';
import { QuestSubmitResponse, QuestReviewResponse } from '../interfaces/dtos';


@Injectable({ providedIn: 'root' })
export class QuestService {
    private api = inject(ApiService);
    private userService = inject(UserService);
    private eventService = inject(EventService);

    private readonly _quests = signal<Quest[]>([]);
    readonly quests = computed(() => this._quests());

    setQuests(quests: Quest[]) {
        this._quests.set(quests);
    }

    hydrateFromDashboard(quests: Quest[]) {
        this.setQuests(quests);
    }

    updateQuest(updated: Quest) {
        this._quests.update(qs =>
            qs.map(q => q.id === updated.id ? updated : q)
        );
    }

    submitForAnalysis(questId: number) {
        this.userService.setLoading(true);

        // O back já valida se a quest é sua via Token no GamificationService
        return this.api.post<QuestSubmitResponse>(`quests/${questId}/submit`, {}).pipe(
            tap(res => {
                this.updateQuest(res.quest);
                this.eventService.addLogs(res.new_logs);
            }),
            finalize(() => this.userService.setLoading(false))
        );
    }

    processStatus(questId: number, status: 'approved' | 'rejected') {
        this.userService.setLoading(true);

        // A URL continua recebendo o status via Query, mas o reviewer_id some da URL
        return this.api.post<QuestReviewResponse>(
            `quests/${questId}/status?status=${status}`,
            {}
        ).pipe(
            tap(res => {
                this.userService.setUser(res.user);
                this.updateQuest(res.quest);
                this.eventService.addLogs(res.new_logs);
            }),
            finalize(() => this.userService.setLoading(false))
        );
    }
}