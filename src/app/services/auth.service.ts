import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { QuestService } from './quest.service';
import { EventService } from './event.service';
import { RewardService } from './reward.service';
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

  // Estados reativos
  private _currentUser = signal<UserDTO | null>(null);
  private _token = signal<string | null>(localStorage.getItem(environment.authTokenKey));

  // Selectors públicos
  readonly currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  isAdmin = computed(() => this._currentUser()?.role === 'admin');

  constructor() {
    // Se o app abrir e houver token, valida e busca o perfil
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
      switchMap(() => this.refreshProfile()) // Espera o perfil chegar para "dar o OK" pro componente
    );
  }
  register(userData: UserCreate) {
    return this.api.post<UserDTO>('auth/register', userData);
  }

  logout() {
    localStorage.removeItem(environment.authTokenKey);
    this._token.set(null);
    this._currentUser.set(null);
    this.userService.clear();
    this.questService.setQuests([]);
    this.eventService.setLogs([]);
    this.rewardService.setRewards([]);
    this.router.navigate(['/login']);
  }

  refreshProfile() {
    return this.api.get<UserDTO>('auth/me').pipe(
      tap(user => {
        this._currentUser.set(user);
        this.userService.setUser(user); // Sincroniza com o UserService
      }),
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