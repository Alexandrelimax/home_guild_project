import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap, finalize, of, Observable } from 'rxjs'; // Adicionado Observable
import { UserService } from './user.service';
import { QuestService } from './quest.service';
import { EventService } from './event.service';
import { BadgeService } from './badge.service';
import { AuthService } from './auth.service';
import { DashboardData } from '../interfaces/interface';

@Injectable({ providedIn: 'root' })
export class GameService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private userService = inject(UserService);
  private questService = inject(QuestService);
  private eventService = inject(EventService);
  private badgeService = inject(BadgeService);

  /**
   * Forçamos o retorno a ser Observable<DashboardData | null>
   * Isso resolve o erro de "This expression is not callable" no subscribe
   */
  loadDashboard(): Observable<DashboardData | null> {
    // 1. Verificamos se o usuário está autenticado
    if (!this.auth.isAuthenticated()) {
      return of(null);
    }

    this.userService.setLoading(true);

    // O TypeScript agora entende que DashboardData é um subtipo válido do retorno
    return this.api.get<DashboardData>(`users/dashboard`).pipe(
      tap(data => this.hydrateAll(data)),
      finalize(() => this.userService.setLoading(false))
    );
  }

  private hydrateAll(data: DashboardData) {
    this.userService.setUser(data.profile);
    this.questService.hydrateFromDashboard(data.active_quests);
    this.eventService.hydrateFromDashboard(data.recent_logs);
    this.badgeService.hydrateFromDashboard(data.badges);
  }
}