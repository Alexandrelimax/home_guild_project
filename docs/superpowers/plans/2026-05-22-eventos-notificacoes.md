# Eventos e Notificações para Players — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que players recebam notificações de novos eventos via sininho, visualizem os eventos em uma página dedicada (`/events`) e sejam notificados quando um badge for desbloqueado.

**Architecture:** Backend expõe dois novos endpoints (`/users/notifications`, `/users/events`) alimentados por dois novos tipos de log (`event_assigned`, `badge_unlocked`). Frontend adiciona `NotificationService`, `EventQuestService`, uma página `/events` e um componente de sininho no header do player. O estado de "lido/não lido" é gerenciado via `localStorage` no frontend — sem nova tabela no banco.

**Tech Stack:** FastAPI · SQLModel · Python 3.11+ (backend) · Angular 21 · Signals · Standalone Components · Tailwind CSS (frontend)

---

## Branches

- Backend: `feature/eventos-notificacoes` no repo `home_guild_backend`
- Frontend: `feature/eventos-notificacoes` no repo `home_guild_frontend`

---

## Mapa de arquivos

### Backend (`home_guild_backend/`)

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Modificar | `app/services/admin_service.py` | Criar log `event_assigned` ao distribuir evento |
| Modificar | `app/services/gamification_service.py` | Trocar log `"info"` → `"badge_unlocked"` ao conceder badge |
| Modificar | `app/repositories/quest_repository.py` | Novo método: buscar quests de evento por player |
| Modificar | `app/repositories/log_repository.py` | Novo método: buscar logs de notificação |
| Modificar | `app/models/schema.py` | Novo DTO: `EventQuestDTO` |
| Modificar | `app/routes/dashboard_route.py` | Dois novos endpoints: `/users/notifications` e `/users/events` |

### Frontend (`home_guild_frontend/`)

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Modificar | `src/app/interfaces/interface.ts` | Adicionar `EventQuest`; ampliar union de `GameLog.type` |
| Criar | `src/app/services/notification.service.ts` | Estado reativo das notificações + lógica de não-lido |
| Criar | `src/app/services/event-quest.service.ts` | Estado reativo das quests de evento |
| Modificar | `src/app/services/auth.service.ts` | Inicializar novos services no login/logout |
| Criar | `src/app/players/components/event-card/event-card.component.ts` | Card de evento (badge bloqueado/desbloqueado) |
| Criar | `src/app/players/components/event-card/event-card.html` | Template do card |
| Criar | `src/app/players/pages/events/events.component.ts` | Página `/events` |
| Criar | `src/app/players/pages/events/events.html` | Template da página |
| Criar | `src/app/layout/notification-bell/notification-bell.component.ts` | Sininho + dropdown de notificações |
| Criar | `src/app/layout/notification-bell/notification-bell.html` | Template do sininho |
| Modificar | `src/app/players/components/header/header.component.ts` | Importar e renderizar sininho |
| Modificar | `src/app/players/components/header/header.html` | Adicionar sininho no lado direito |
| Modificar | `src/app/players/components/sidebar/sidebar.html` | Adicionar link "Eventos" |
| Modificar | `src/app/app.routes.ts` | Adicionar rota `/events` |

---

## Task 1: Backend — Criar branch e ajustar tipos de log

**Files:**
- Modify: `app/services/admin_service.py`
- Modify: `app/services/gamification_service.py`

- [ ] **Criar branch no backend**

```bash
cd home_guild_backend
git checkout -b feature/eventos-notificacoes
```

- [ ] **Adicionar `LogRepository` ao `AdminService` e criar log `event_assigned`**

Substituir o conteúdo completo de `app/services/admin_service.py`:

```python
from sqlmodel import Session
from app.models.entities import Quest, Badge
from app.models.schema import (
    AdminAnalyticsResponse,
    UserMetricsDTO,
    UserDTO,
    QuestWithUserDTO,
    QuestDTO,
    QuestCreateRequest,
    EventCreateRequest,
)
from app.repositories.user_repository import UserRepository
from app.repositories.quest_repository import QuestRepository
from app.repositories.badge_repository import BadgeRepository
from app.repositories.log_repository import LogRepository


class AdminService:
    def __init__(self, session: Session):
        self.user_repo = UserRepository(session)
        self.quest_repo = QuestRepository(session)
        self.badge_repo = BadgeRepository(session)
        self.log_repo = LogRepository(session)

    def get_analytics(self) -> AdminAnalyticsResponse:
        players = self.user_repo.get_all_players()
        player_ids = [p.id for p in players]

        counts = self.quest_repo.get_quest_counts_by_user(player_ids)

        users_metrics = [
            UserMetricsDTO(
                user=UserDTO.model_validate(p),
                total_completed=counts.get((p.id, "approved"), 0),
                active_quests=counts.get((p.id, "pending"), 0),
            )
            for p in players
        ]
        system_metrics = {
            "pending_analysis": self.quest_repo.get_quests_count_by_status("analyzing"),
            "total_approved": self.quest_repo.get_quests_count_by_status("approved"),
            "total_rejected": self.quest_repo.get_quests_count_by_status("rejected"),
            "total_players": len(players),
        }
        return AdminAnalyticsResponse(users_metrics=users_metrics, system_metrics=system_metrics)

    def get_analyzing_quests(self) -> list[QuestWithUserDTO]:
        quests = self.quest_repo.get_analyzing_quests()
        if not quests:
            return []

        users = self.user_repo.get_by_ids(list({q.user_id for q in quests}))
        return [
            QuestWithUserDTO(
                quest=QuestDTO.model_validate(q),
                user=UserDTO.model_validate(users[q.user_id]),
            )
            for q in quests
            if q.user_id in users
        ]

    def create_quests(self, data: QuestCreateRequest) -> int:
        return self._distribute_quests(
            user_ids=data.target_user_ids,
            title=data.title,
            description=data.description,
            xp=data.xp,
            bits=data.bits,
            is_recurring=data.is_recurring,
        )

    def create_event(self, data: EventCreateRequest) -> int:
        event_badge = Badge(
            title=data.badge_title,
            description=data.badge_description,
            icon=data.badge_icon,
            card_image=data.badge_card_image,
            rarity=data.badge_rarity,
        )
        self.badge_repo.save(event_badge)

        return self._distribute_quests(
            user_ids=data.target_user_ids,
            title=data.title,
            description=data.description,
            xp=data.xp,
            bits=data.bits,
            event_badge_id=event_badge.id,
        )

    def reset_daily_quests(self) -> int:
        templates = self.quest_repo.get_recurring_templates()
        if not templates:
            return 0

        existing_pending = self.quest_repo.get_pending_recurring_pairs()
        count = 0
        for title, desc, xp, bits, uid in templates:
            if (uid, title) not in existing_pending:
                self.quest_repo.save(Quest(
                    title=title,
                    description=desc,
                    xp=xp,
                    bits=bits,
                    user_id=uid,
                    status="pending",
                    is_recurring=True,
                ))
                count += 1
        return count

    def _distribute_quests(
        self,
        user_ids: list[int],
        title: str,
        description: str | None,
        xp: int,
        bits: int,
        is_recurring: bool = False,
        event_badge_id: int | None = None,
    ) -> int:
        count = 0
        for uid in user_ids:
            if self.user_repo.get_by_id(uid):
                self.quest_repo.save(Quest(
                    title=title,
                    description=description,
                    xp=xp,
                    bits=bits,
                    user_id=uid,
                    status="pending",
                    is_recurring=is_recurring,
                    event_badge_id=event_badge_id,
                ))
                if event_badge_id is not None:
                    self.log_repo.create_log(
                        user_id=uid,
                        message=f"⚡ Novo Evento: {title}!",
                        log_type="event_assigned",
                    )
                count += 1
        return count
```

- [ ] **Trocar tipo do log de badge em `gamification_service.py`**

Localizar a linha dentro de `review_quest()` no bloco `if quest.event_badge_id:`:

```python
# Antes (linha ~75):
logs.append(self.log_repo.create_log(user.id, f"🏆 Conquista Desbloqueada: {badge.title}!", "info"))

# Depois:
logs.append(self.log_repo.create_log(user.id, f"🏆 Conquista Desbloqueada: {badge.title}!", "badge_unlocked"))
```

---

## Task 2: Backend — Novos métodos de repositório

**Files:**
- Modify: `app/repositories/quest_repository.py`
- Modify: `app/repositories/log_repository.py`

- [ ] **Adicionar `get_event_quests_by_user` em `quest_repository.py`**

Adicionar ao final da classe `QuestRepository`:

```python
def get_event_quests_by_user(self, user_id: int) -> list[Quest]:
    statement = (
        select(Quest)
        .where(Quest.user_id == user_id)
        .where(Quest.event_badge_id.is_not(None))
        .order_by(Quest.updated_at.desc())
    )
    return self.session.exec(statement).all()
```

- [ ] **Adicionar `get_notifications_by_user` em `log_repository.py`**

Adicionar ao final da classe `LogRepository`:

```python
def get_notifications_by_user(self, user_id: int, limit: int = 20) -> list[Log]:
    statement = (
        select(Log)
        .where(Log.user_id == user_id)
        .where(col(Log.type).in_(["event_assigned", "badge_unlocked"]))
        .order_by(desc(Log.created_at))
        .limit(limit)
    )
    return self.session.exec(statement).all()
```

Atualizar o import no topo de `log_repository.py`:

```python
from sqlmodel import Session, select, desc, col
```

---

## Task 3: Backend — Novo schema e endpoints

**Files:**
- Modify: `app/models/schema.py`
- Modify: `app/routes/dashboard_route.py`

- [ ] **Adicionar `EventQuestDTO` em `schema.py`**

Adicionar após a classe `QuestDTO` (por volta da linha 73):

```python
class EventQuestDTO(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    xp: int
    bits: int
    status: str
    badge: BadgeDTO
    updated_at: Optional[datetime] = None

    model_config = base_config
```

- [ ] **Adicionar os dois endpoints em `dashboard_route.py`**

Substituir o conteúdo completo de `app/routes/dashboard_route.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List

from app.config.database import get_session
from app.models.entities import User
from app.services.gamification_service import GamificationService
from app.models.schema import DashboardResponse, LogDTO, EventQuestDTO, BadgeDTO
from app.config.get_token import get_current_user
from app.repositories.log_repository import LogRepository
from app.repositories.quest_repository import QuestRepository
from app.repositories.badge_repository import BadgeRepository

router_users = APIRouter(prefix="/users", tags=["Users"])


@router_users.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    data = GamificationService(session).get_user_dashboard(current_user.id)
    if not data:
        raise HTTPException(status_code=404, detail="Dados do dashboard não encontrados")
    return data


@router_users.get("/notifications", response_model=List[LogDTO])
def get_notifications(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return LogRepository(session).get_notifications_by_user(current_user.id)


@router_users.get("/events", response_model=List[EventQuestDTO])
def get_event_quests(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    quests = QuestRepository(session).get_event_quests_by_user(current_user.id)
    badge_repo = BadgeRepository(session)
    result = []
    for q in quests:
        badge = badge_repo.get_by_id(q.event_badge_id)
        if badge:
            result.append(EventQuestDTO(
                id=q.id,
                title=q.title,
                description=q.description,
                xp=q.xp,
                bits=q.bits,
                status=q.status,
                badge=BadgeDTO.model_validate(badge),
                updated_at=q.updated_at,
            ))
    return result
```

- [ ] **Commit do backend**

```bash
cd home_guild_backend
git add app/services/admin_service.py \
        app/services/gamification_service.py \
        app/repositories/quest_repository.py \
        app/repositories/log_repository.py \
        app/models/schema.py \
        app/routes/dashboard_route.py
git commit -m "feat: add event notification endpoints and log types

- Creates event_assigned log when admin distributes event quest
- Changes badge award log type from info to badge_unlocked
- Adds get_event_quests_by_user to QuestRepository
- Adds get_notifications_by_user to LogRepository
- Adds EventQuestDTO schema
- Exposes GET /users/notifications and GET /users/events endpoints"
```

- [ ] **Verificar que o servidor sobe sem erros**

```bash
cd home_guild_backend
uvicorn main:app --reload
# Esperado: Application startup complete. na porta 8000
# Acessar http://localhost:8000/docs e confirmar que os endpoints aparecem:
#   GET /users/notifications
#   GET /users/events
```

---

## Task 4: Frontend — Criar branch e atualizar interfaces

**Files:**
- Modify: `src/app/interfaces/interface.ts`

- [ ] **Criar branch no frontend**

```bash
cd home_guild_frontend
git checkout -b feature/eventos-notificacoes
```

- [ ] **Atualizar `interface.ts`**

Substituir o conteúdo completo de `src/app/interfaces/interface.ts`:

```typescript
export interface User {
    readonly id: number;
    readonly name: string;
    readonly email: string;
    readonly role: 'user' | 'admin';
    readonly avatar: string;
    readonly xp: number;
    readonly level: number;
    readonly bits: number;
}

export interface Badge {
    readonly id: number;
    readonly title: string;
    readonly description: string;
    readonly icon: string;
    readonly card_image: string;
    readonly rarity: 'comum' | 'raro' | 'lendario';
}

export interface Quest {
    readonly id: number;
    readonly title: string;
    readonly description?: string;
    readonly xp: number;
    readonly bits: number;
    readonly status: 'pending' | 'approved' | 'analyzing';
    readonly is_recurring?: boolean;
    readonly user_id: number;
}

export interface EventQuest {
    readonly id: number;
    readonly title: string;
    readonly description?: string;
    readonly xp: number;
    readonly bits: number;
    readonly status: 'pending' | 'analyzing' | 'approved';
    readonly badge: Badge;
    readonly updated_at?: string;
}

export interface Reward {
    readonly id: number;
    readonly title: string;
    readonly description: string;
    readonly cost: number;
    readonly min_level: number;
    readonly type: 'bits' | 'milestone';
    readonly icon: string;
    readonly redeemed: boolean;
}

export interface GameLog {
    readonly id: string;
    readonly message: string;
    readonly type:
        | 'info'
        | 'approved'
        | 'rejected'
        | 'analyzing'
        | 'levelup'
        | 'downgrade'
        | 'error'
        | 'event_assigned'
        | 'badge_unlocked'
        | 'legendary_unlock';
    readonly created_at: string;
}

export interface DashboardData {
    profile: User;
    badges: Badge[];
    recent_logs: GameLog[];
    active_quests: Quest[];
}

export interface GameState {
    user: User | null;
    quests: Quest[];
    logs: GameLog[];
    badges: Badge[];
    rewards: Reward[];
    loading: boolean;
}
```

---

## Task 5: Frontend — NotificationService

**Files:**
- Create: `src/app/services/notification.service.ts`

- [ ] **Criar `notification.service.ts`**

```typescript
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
```

---

## Task 6: Frontend — EventQuestService

**Files:**
- Create: `src/app/services/event-quest.service.ts`

- [ ] **Criar `event-quest.service.ts`**

```typescript
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
```

---

## Task 7: Frontend — Atualizar AuthService

**Files:**
- Modify: `src/app/services/auth.service.ts`

- [ ] **Substituir o conteúdo completo de `auth.service.ts`**

```typescript
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
```

- [ ] **Commit dos services**

```bash
cd home_guild_frontend
git add src/app/interfaces/interface.ts \
        src/app/services/notification.service.ts \
        src/app/services/event-quest.service.ts \
        src/app/services/auth.service.ts
git commit -m "feat: add NotificationService and EventQuestService

- Extends GameLog.type union with event_assigned and badge_unlocked
- Adds EventQuest interface
- NotificationService: loads /users/notifications, tracks unread count via localStorage
- EventQuestService: loads /users/events, exposes activeEventQuests computed
- AuthService: initializes both services on login, clears them on logout"
```

- [ ] **Validar build dos services**

```bash
cd home_guild_frontend
ng build --configuration development 2>&1 | tail -5
# Esperado: Application bundle generation complete.
```

---

## Task 8: Frontend — EventCardComponent

**Files:**
- Create: `src/app/players/components/event-card/event-card.component.ts`
- Create: `src/app/players/components/event-card/event-card.html`

- [ ] **Criar `event-card.component.ts`**

```typescript
import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { EventQuest } from '../../../interfaces/interface';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [],
  templateUrl: './event-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent {
  eventQuest = input.required<EventQuest>();
  onSubmit = output<number>();

  statusConfig = computed(() => {
    switch (this.eventQuest().status) {
      case 'analyzing':
        return { label: 'EM ANÁLISE', color: 'text-amber-400', border: 'border-amber-500/40' };
      case 'approved':
        return { label: 'CONCLUÍDA', color: 'text-emerald-400', border: 'border-emerald-500/40' };
      default:
        return { label: 'PENDENTE', color: 'text-amber-300', border: 'border-amber-500/60' };
    }
  });

  badgeLocked = computed(() => this.eventQuest().status !== 'approved');
}
```

- [ ] **Criar `event-card.html`**

```html
<div
  class="relative p-5 rounded-xl border-2 transition-all duration-300 bg-gradient-to-br from-amber-950/40 to-slate-900/60"
  [class]="statusConfig().border">

  <!-- Label de evento -->
  <div class="flex items-center justify-between mb-4">
    <span class="text-[10px] font-orbitron font-black tracking-[0.25em] text-amber-400 uppercase">
      ⚡ Evento Especial
    </span>
    <span class="text-[9px] font-orbitron font-bold px-2 py-1 rounded bg-black/30 border border-white/5"
      [class]="statusConfig().color">
      {{ statusConfig().label }}
    </span>
  </div>

  <div class="flex gap-4 items-start">

    <!-- Info do evento -->
    <div class="flex-1">
      <h3 class="text-sm font-orbitron text-slate-100 uppercase tracking-tight mb-2">
        {{ eventQuest().title }}
      </h3>
      <p class="text-[11px] text-slate-400 font-mono leading-relaxed mb-4">
        {{ eventQuest().description }}
      </p>

      <div class="flex gap-3 mb-4">
        <span class="text-xs font-orbitron text-amber-400">+{{ eventQuest().xp }} <span class="text-[8px] opacity-70">XP</span></span>
        <span class="text-xs font-orbitron text-cyan-400">+{{ eventQuest().bits }} <span class="text-[8px] opacity-70">BITS</span></span>
      </div>

      @if (eventQuest().status === 'pending') {
        <button
          (click)="onSubmit.emit(eventQuest().id)"
          class="w-full py-2 bg-amber-900/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded text-[9px] font-orbitron uppercase tracking-widest transition-all animate-pulse">
          Concluir e Enviar ✓
        </button>
      }

      @if (eventQuest().status === 'analyzing') {
        <div class="w-full py-2 text-center bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-orbitron uppercase tracking-widest">
          🔍 Aguardando análise...
        </div>
      }
    </div>

    <!-- Preview do badge -->
    <div class="flex flex-col items-center gap-2 min-w-[72px]">
      <div
        class="w-16 h-16 rounded-full border-2 border-purple-500/60 bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-content-center overflow-hidden transition-all duration-500"
        [class.blur-sm]="badgeLocked()"
        [class.opacity-40]="badgeLocked()">
        <img
          [src]="eventQuest().badge.icon"
          [alt]="eventQuest().badge.title"
          class="w-full h-full object-cover rounded-full"
          onerror="this.style.display='none'">
      </div>
      <span class="text-[9px] font-mono text-center"
        [class.text-slate-600]="badgeLocked()"
        [class.text-purple-400]="!badgeLocked()">
        {{ badgeLocked() ? 'Bloqueado' : 'Desbloqueado!' }}
      </span>
    </div>

  </div>
</div>
```

---

## Task 9: Frontend — EventsPage

**Files:**
- Create: `src/app/players/pages/events/events.component.ts`
- Create: `src/app/players/pages/events/events.html`

- [ ] **Criar `events.component.ts`**

```typescript
import { Component, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventQuestService } from '../../../services/event-quest.service';
import { QuestService } from '../../../services/quest.service';
import { EventService } from '../../../services/event.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [EventCardComponent, PageHeaderComponent],
  templateUrl: './events.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  eventQuestService = inject(EventQuestService);
  private questService = inject(QuestService);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  handleSubmit(questId: number) {
    this.questService.submitForAnalysis(questId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.eventQuestService.updateStatus(questId, 'analyzing'),
        error: () => this.eventService.addError('Erro ao enviar evento para análise'),
      });
  }
}
```

- [ ] **Criar `events.html`**

```html
<app-page-header
  title="Eventos"
  subtitle="Missões especiais com badges exclusivos">
</app-page-header>

<div class="mt-8">
  @if (eventQuestService.activeEventQuests().length === 0) {
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <span class="text-5xl mb-4">🔔</span>
      <h3 class="font-orbitron text-slate-400 text-sm uppercase tracking-widest mb-2">
        Nenhum evento ativo
      </h3>
      <p class="text-[11px] font-mono text-slate-600">
        Fique de olho no sininho — novos eventos aparecem aqui.
      </p>
    </div>
  } @else {
    <div class="flex flex-col gap-4">
      @for (eq of eventQuestService.activeEventQuests(); track eq.id) {
        <app-event-card [eventQuest]="eq" (onSubmit)="handleSubmit($event)"></app-event-card>
      }
    </div>
  }
</div>
```

---

## Task 10: Frontend — NotificationBellComponent

**Files:**
- Create: `src/app/layout/notification-bell/notification-bell.component.ts`
- Create: `src/app/layout/notification-bell/notification-bell.html`

- [ ] **Criar `notification-bell.component.ts`**

```typescript
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { GameLog } from '../../interfaces/interface';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [],
  templateUrl: './notification-bell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal(false);

  toggle() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.notificationService.markAllRead();
    }
  }

  navigate(log: GameLog) {
    this.isOpen.set(false);
    if (log.type === 'event_assigned') {
      this.router.navigate(['/events']);
    } else {
      this.router.navigate(['/badges']);
    }
  }

  close() {
    this.isOpen.set(false);
  }
}
```

- [ ] **Criar `notification-bell.html`**

```html
<div class="relative">

  <!-- Botão do sininho -->
  <button
    (click)="toggle()"
    class="relative flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-slate-900/60 hover:border-amber-500/40 transition-all">
    <span class="text-lg">🔔</span>
    @if (notificationService.unreadCount() > 0) {
      <span class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {{ notificationService.unreadCount() }}
      </span>
    }
  </button>

  <!-- Dropdown -->
  @if (isOpen()) {
    <!-- Overlay para fechar ao clicar fora -->
    <div class="fixed inset-0 z-[95]" (click)="close()"></div>

    <div class="absolute right-0 top-12 w-72 bg-[#0a0e14] border border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden">

      <div class="px-4 py-3 border-b border-slate-800">
        <h3 class="text-[10px] font-orbitron font-black tracking-[0.25em] text-slate-500 uppercase">
          Notificações
        </h3>
      </div>

      @if (notificationService.notifications().length === 0) {
        <div class="px-4 py-6 text-center">
          <p class="text-[11px] font-mono text-slate-600">Nenhuma notificação nova.</p>
        </div>
      } @else {
        <div class="flex flex-col divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          @for (notif of notificationService.notifications(); track notif.id) {
            <div class="px-4 py-3 flex flex-col gap-2">
              <div class="flex items-start gap-2">
                <span class="text-base mt-0.5">
                  {{ notif.type === 'event_assigned' ? '⚡' : '🏆' }}
                </span>
                <p class="text-[11px] font-mono text-slate-300 leading-relaxed flex-1">
                  {{ notif.message }}
                </p>
              </div>
              <button
                (click)="navigate(notif)"
                class="w-full py-2 rounded-lg text-[10px] font-orbitron font-bold uppercase tracking-widest transition-all"
                [class]="notif.type === 'event_assigned'
                  ? 'bg-amber-900/30 text-amber-300 border border-amber-500/30 hover:bg-amber-600 hover:text-white'
                  : 'bg-purple-900/30 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white'">
                {{ notif.type === 'event_assigned' ? 'Ver Eventos →' : 'Ver Conquistas →' }}
              </button>
            </div>
          }
        </div>
      }
    </div>
  }

</div>
```

---

## Task 11: Frontend — Integrar sininho, sidebar e rota

**Files:**
- Modify: `src/app/players/components/header/header.component.ts`
- Modify: `src/app/players/components/header/header.html`
- Modify: `src/app/players/components/sidebar/sidebar.html`
- Modify: `src/app/app.routes.ts`

- [ ] **Atualizar `header.component.ts`**

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserCardComponent } from '../user-card/user-card.component';
import { NotificationBellComponent } from '../../../layout/notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [UserCardComponent, NotificationBellComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  store = inject(UserService);
}
```

- [ ] **Atualizar `header.html`**

```html
<header
    class="fixed top-0 left-0 w-full z-[70] bg-[#020617]/80 backdrop-blur-md border-b border-white/5 p-4 pl-20 lg:pl-32">
    <div class="max-w-[1400px] mx-auto flex items-center justify-between gap-6 btn-user">
        <div class="flex-1">
            @if (store.user(); as activeUser) {
            <app-user-card [user]="activeUser"></app-user-card>
            }
        </div>
        <app-notification-bell></app-notification-bell>
    </div>
</header>
```

- [ ] **Adicionar link "Eventos" na sidebar (`sidebar.html`)**

Adicionar após a linha do link "Dashboard" e antes de "Histórico":

```html
<a routerLink="/events" (click)="close.emit()" routerLinkActive="active-link" class="nav-item">⚡ Eventos</a>
```

O bloco `<nav>` completo ficará:

```html
<nav class="flex flex-col gap-2">
    <a routerLink="/dashboard" (click)="close.emit()" routerLinkActive="active-link" class="nav-item">Dashboard</a>
    <a routerLink="/events" (click)="close.emit()" routerLinkActive="active-link" class="nav-item">⚡ Eventos</a>
    <a routerLink="/history" (click)="close.emit()" routerLinkActive="active-link" class="nav-item">Histórico</a>
    <a routerLink="/shop" (click)="close.emit()" routerLinkActive="active-link" class="nav-item">Shopping</a>
    <a routerLink="/badges" (click)="close.emit()" routerLinkActive="active-link" class="nav-item">Conquistas</a>
</nav>
```

- [ ] **Adicionar rota `/events` em `app.routes.ts`**

Adicionar dentro do bloco de rotas do player (filho de `''`), após a rota `dashboard`:

```typescript
{
    path: 'events',
    loadComponent: () =>
        import('./players/pages/events/events.component').then(m => m.EventsPage)
},
```

---

## Task 12: Frontend — Build final e commits

- [ ] **Rodar o build de validação**

```bash
cd home_guild_frontend
ng build --configuration development 2>&1
# Esperado: Application bundle generation complete. sem erros TS
```

- [ ] **Commit dos components**

```bash
cd home_guild_frontend
git add src/app/players/components/event-card/ \
        src/app/players/pages/events/ \
        src/app/layout/notification-bell/ \
        src/app/players/components/header/header.component.ts \
        src/app/players/components/header/header.html \
        src/app/players/components/sidebar/sidebar.html \
        src/app/app.routes.ts
git commit -m "feat: add events page, notification bell, and event card

- EventCardComponent: wide card with locked/unlocked badge preview
- EventsPage (/events): lists active event quests, empty state when none
- NotificationBellComponent: bell icon with unread badge + dropdown
- Dropdown links to /events (event_assigned) or /badges (badge_unlocked)
- Sidebar adds Events link, header renders notification bell
- app.routes.ts registers /events lazy route"
```

---

## Task 13: Push das branches para GitHub

- [ ] **Push backend**

```bash
cd home_guild_backend
git push origin feature/eventos-notificacoes
```

- [ ] **Push frontend**

```bash
cd home_guild_frontend
git push origin feature/eventos-notificacoes
```

---

## Checklist de verificação manual (após subir o servidor)

1. Admin cria evento em `/admin/events` → verificar no banco que log `event_assigned` foi criado
2. Player loga → sininho deve mostrar badge `1`
3. Player clica no sininho → dropdown aparece com botão "Ver Eventos →"
4. Player clica no botão → navega para `/events` → card do evento aparece com badge desfocado
5. Player clica "Concluir e Enviar" → card muda para "EM ANÁLISE", botão some
6. Admin aprova em `/admin/approvals` → badge concedido
7. Player abre app → sininho acende novamente com `1`
8. Player clica → dropdown mostra "Ver Conquistas →"
9. Player vai para `/badges` → badge aparece desbloqueado
10. Player vai para `/events` → empty state "Nenhum evento ativo"
11. `/history` mostra todos os logs sem alteração
