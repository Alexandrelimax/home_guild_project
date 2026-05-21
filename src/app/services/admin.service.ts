import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { User, Quest } from '../interfaces/interface';
import { AdminAnalyticsResponse, QuestWithUserDTO, QuestCreateRequest, QuestReviewResponse, EventCreateRequest } from '../interfaces/dtos';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private api = inject(ApiService);

    getAnalytics(): Observable<AdminAnalyticsResponse> {
        return this.api.get<AdminAnalyticsResponse>('admin/analytics');
    }

    getPlayers(): Observable<User[]> {
        return this.api.get<User[]>('admin/users/players');
    }

    createTask(taskData: QuestCreateRequest): Observable<{message: string}> {
        return this.api.post<{message: string}>('admin/quests', taskData);
    }

    createEvent(eventData: EventCreateRequest): Observable<{message: string}> {
        return this.api.post<{message: string}>('admin/events', eventData);
    }

    resetDailyQuests(): Observable<{message: string}> {
        return this.api.post<{message: string}>('admin/quests/reset-daily', {});
    }

    getPendingTasks(): Observable<QuestWithUserDTO[]> {
        return this.api.get<QuestWithUserDTO[]>('admin/quests/analyzing');
    }

    reviewTask(questId: number, status: 'approved' | 'rejected'): Observable<QuestReviewResponse> {
        return this.api.post<QuestReviewResponse>(`admin/quests/${questId}/status?status=${status}`, {});
    }
}
