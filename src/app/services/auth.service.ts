import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, forkJoin, of } from 'rxjs';
import { tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { UserService } from './user.service';
import { QuestService } from './quest.service';
import { EventService } from './event.service';
import { RewardService } from './reward.service';
import { NotificationService } from './notification.service';
import { EventQuestService } from './event-quest.service';
import { environment } from '../../environments/environment';
import {
  UserDTO,
  LoginRequest,
  Token,
  UserCreate
} from '../interfaces/dtos';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private userService = inject(UserService);
  private router = inject(Router);
  private questService = inject(QuestService);
  private eventService = inject(EventService);
  private rewardService = inject(RewardService);
  private notificationService = inject(NotificationService);
  private eventQuestService = inject(EventQuestService);

  private _currentUser = signal<UserDTO | null>(null);
  private _token = signal<string | null>(localStorage.getItem(environment.authTokenKey));

  readonly currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  isAdmin = computed(() => this._currentUser()?.role === 'admin');

  constructor() {
    if (this._token()) {
      this.refreshProfile().subscribe({
        error: () => this.logout()
      });
    }
  }

  login(credentials: LoginRequest) {
    return this.api.post<Token>('auth/login', credentials).pipe(
      tap(res => {
        localStorage.setItem(environment.authTokenKey, res.access_token);
        this._token.set(res.access_token);
      }),
      switchMap(() => this.refreshProfile())
    );
  }

  register(userData: UserCreate) {
    return this.api.post<UserDTO>('auth/register', userData);
  }

  logout() {
    if (!this._token()) return;
    localStorage.removeItem(environment.authTokenKey);
    this._token.set(null);
    this._currentUser.set(null);
    this.userService.clear();
    this.questService.setQuests([]);
    this.eventService.setLogs([]);
    this.rewardService.setRewards([]);
    this.notificationService.clear();
    this.eventQuestService.clear();
    this.router.navigate(['/login']);
  }

  refreshProfile() {
    return this.api.get<UserDTO>('auth/me').pipe(
      tap(user => {
        this._currentUser.set(user);
        this.userService.setUser(user);
      }),
      switchMap(() =>
        forkJoin([
          this.notificationService.load().pipe(catchError(() => of([]))),
          this.eventQuestService.load().pipe(catchError(() => of([]))),
        ])
      ),
      catchError(err => {
        if (err.status === 401) this.logout();
        return throwError(() => err);
      })
    );
  }

  userId() {
    return this._currentUser()?.id || null;
  }
}
