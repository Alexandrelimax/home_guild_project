# Spec: Sistema de Eventos e Notificações para Players

**Data:** 2026-05-22
**Repositórios afetados:** `home_guild_frontend` · `home_guild_backend`
**Status:** Aprovado — aguardando implementação

---

## 1. Contexto e Problema

O admin já consegue criar eventos especiais (quests com badge exclusivo). Porém, os players não têm forma de saber que receberam um evento. Além disso, ao ter um evento aprovado e o badge concedido, não há nenhum aviso ativo. O fluxo de eventos precisa ser visível para o player do início ao fim.

---

## 2. Fluxo Completo

```
Admin cria evento
  └→ Backend distribui Quest (event_badge_id preenchido)
       + cria Log tipo "event_assigned" para cada player
            └→ Player abre o app
                 └→ NotificationService busca /users/notifications
                      └→ Sininho 🔔 acende com badge vermelho (ex: "1")
                           └→ Player clica no sininho
                                └→ Dropdown mobile-friendly exibe:
                                   "⚡ Novo Evento! — Lavar o Banheiro"
                                   [Botão largo: Ver Eventos →]
                                        └→ Player navega para /events
                                             └→ Card do evento aparece (badge desfocado/bloqueado)
                                                  └→ Player faz a tarefa → clica "Enviar"
                                                       └→ Quest vai para status "analyzing"
                                                            └→ Admin aprova
                                                                 └→ Badge concedido
                                                                      + Log tipo "badge_unlocked"
                                                                           └→ Sininho acende novamente
                                                                                └→ Dropdown exibe:
                                                                                   "🏆 Badge Desbloqueado! — Nome do Badge"
                                                                                   [Botão largo: Ver Conquistas →]
                                                                                        └→ Player vai para /badges
                                                                                             └→ Badge aparece desbloqueado
                                                                                                  └→ /events exibe empty state
                                                                                                       └→ /history registra tudo (sem mudanças)
```

---

## 3. Regras de Negócio

| Regra | Detalhe |
|---|---|
| Evento no sininho | Apenas logs dos tipos `event_assigned` e `badge_unlocked` alimentam o dropdown |
| Aprovação de quest normal | **Não** gera notificação no sininho (apenas vai para /history) |
| Contagem de não lidos | `created_at > lastSeenTimestamp` armazenado em `localStorage` |
| Marcar como lido | Ao abrir o dropdown, `lastSeenTimestamp` é atualizado — badge some |
| Empty state em /events | Quando não há quests de evento com status `pending` ou `analyzing` |
| Histórico | `/history` continua exibindo todos os logs sem mudança |
| Badge bloqueado | Preview do badge aparece desfocado/semi-opaco enquanto status ≠ `approved` |
| Badge desbloqueado | Revelado na aba Conquistas após aprovação — não aparece mais em /events |

---

## 4. Backend

### 4.1 Novos endpoints

#### `GET /users/notifications`
Retorna os logs de notificação do player autenticado.

```python
# Filtra por tipos: ["event_assigned", "badge_unlocked"]
# Limite: 20 mais recentes
# Response: List[LogDTO]
```

#### `GET /users/events`
Retorna todas as quests de evento do player (todos os status), com o badge embutido.

```python
# Filtra: Quest.event_badge_id IS NOT NULL AND Quest.user_id == current_user.id
# Response: List[EventQuestDTO]
```

### 4.2 Novos schemas (`app/models/schema.py`)

```python
class BadgeDTO(BaseModel):         # já existe — sem mudança
    ...

class EventQuestDTO(BaseModel):
    id: int
    title: str
    description: Optional[str]
    xp: int
    bits: int
    status: str                    # pending | analyzing | approved
    badge: BadgeDTO                # badge embutido (nunca None em event quests)
    updated_at: Optional[datetime]
    model_config = base_config
```

### 4.3 Mudanças em serviços existentes

**`app/services/admin_service.py` — `_distribute_quests()`**

Ao criar cada quest de evento, criar um log do tipo `event_assigned`:

```python
# Após self.quest_repo.save(quest) dentro do loop de _distribute_quests,
# quando event_badge_id não for None:
self.log_repo.create_log(
    user_id=uid,
    message=f"⚡ Novo Evento: {title}!",
    log_type="event_assigned"
)
```

**`app/services/gamification_service.py` — `review_quest()` (branch `approved`)**

Trocar o tipo do log de badge concedido de `"info"` para `"badge_unlocked"`:

```python
# Antes:
logs.append(self.log_repo.create_log(user.id, f"🏆 Conquista Desbloqueada: {badge.title}!", "info"))

# Depois:
logs.append(self.log_repo.create_log(user.id, f"🏆 Conquista Desbloqueada: {badge.title}!", "badge_unlocked"))
```

### 4.4 Novos repositórios / queries

**`QuestRepository`** — novo método:

```python
def get_event_quests_by_user(self, user_id: int) -> list[Quest]:
    return self.session.exec(
        select(Quest)
        .where(Quest.user_id == user_id)
        .where(Quest.event_badge_id.is_not(None))
        .order_by(Quest.updated_at.desc())
    ).all()
```

**`LogRepository`** — novo método:

```python
def get_notifications_by_user(self, user_id: int, limit: int = 20) -> list[Log]:
    return self.session.exec(
        select(Log)
        .where(Log.user_id == user_id)
        .where(Log.type.in_(["event_assigned", "badge_unlocked"]))
        .order_by(Log.created_at.desc())
        .limit(limit)
    ).all()
```

### 4.5 Novas rotas (`app/routes/dashboard_route.py` ou arquivo próprio)

```python
@router_users.get("/users/notifications", response_model=List[LogDTO])
def get_notifications(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return LogRepository(session).get_notifications_by_user(current_user.id)

@router_users.get("/users/events", response_model=List[EventQuestDTO])
def get_event_quests(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    quests = QuestRepository(session).get_event_quests_by_user(current_user.id)
    result = []
    for q in quests:
        badge = BadgeRepository(session).get_by_id(q.event_badge_id)
        result.append(EventQuestDTO(
            id=q.id, title=q.title, description=q.description,
            xp=q.xp, bits=q.bits, status=q.status,
            badge=BadgeDTO.model_validate(badge),
            updated_at=q.updated_at,
        ))
    return result
```

---

## 5. Frontend

### 5.1 Novas interfaces (`src/app/interfaces/`)

**`interface.ts`** — adicionar:

```ts
export interface EventQuest {
  id: number;
  title: string;
  description?: string;
  xp: number;
  bits: number;
  status: 'pending' | 'analyzing' | 'approved';
  badge: Badge;
  updated_at?: string;
}
```

`NotificationItem` não é criada. O `NotificationService` usa `GameLog` (já existe) — o filtro por tipo `event_assigned` / `badge_unlocked` é feito dentro do service, não no tipo.

### 5.2 Novos serviços (`src/app/services/`)

#### `NotificationService`

```ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly STORAGE_KEY = 'hg_notifications_last_seen';

  private _notifications = signal<NotificationItem[]>([]);
  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() => {
    const lastSeen = localStorage.getItem(this.STORAGE_KEY);
    if (!lastSeen) return this._notifications().length;
    return this._notifications().filter(n => n.created_at > lastSeen).length;
  });

  load() {
    return this.api.get<GameLog[]>('users/notifications').pipe(
      tap(items => this._notifications.set(items))
    );
  }

  markAllRead() {
    localStorage.setItem(this.STORAGE_KEY, new Date().toISOString());
  }

  clear() { this._notifications.set([]); }
}
```

#### `EventQuestService`

```ts
@Injectable({ providedIn: 'root' })
export class EventQuestService {
  private _eventQuests = signal<EventQuest[]>([]);
  readonly eventQuests = this._eventQuests.asReadonly();

  readonly activeEventQuests = computed(() =>
    this._eventQuests().filter(q => q.status !== 'approved')
  );

  load() {
    return this.api.get<EventQuest[]>('users/events').pipe(
      tap(quests => this._eventQuests.set(quests))
    );
  }

  updateEventQuestStatus(questId: number, status: EventQuest['status']) {
    this._eventQuests.update(qs =>
      qs.map(q => q.id === questId ? { ...q, status } : q)
    );
  }

  clear() { this._eventQuests.set([]); }
}
```

### 5.3 Novos componentes

#### `NotificationBellComponent` — `src/app/layout/notification-bell/`

- Renderiza ícone 🔔 com badge vermelho quando `unreadCount() > 0`
- Abre/fecha o `NotificationDropdownComponent` ao clicar
- Ao abrir: chama `notificationService.markAllRead()`

#### `NotificationDropdownComponent` — `src/app/layout/notification-dropdown/`

Visual: dropdown mobile-friendly com botões largos (design C aprovado).

Dois tipos de item:
- `event_assigned` → título "⚡ Novo Evento!", botão `[Ver Eventos →]` navega para `/events`
- `badge_unlocked` → título "🏆 Badge Desbloqueado!", botão `[Ver Conquistas →]` navega para `/badges`

Empty state quando `notifications().length === 0`: "Nenhuma notificação nova."

#### `EventCardComponent` — `src/app/players/components/event-card/`

Card estilo A (layout largo) com:
- Borda dourada (`#f59e0b`) e fundo degradê escuro
- Label "⚡ EVENTO ESPECIAL" no topo
- Título, descrição, XP e Bits
- Badge preview à direita:
  - `status !== 'approved'` → imagem/ícone desfocado + "Badge bloqueado"
  - `status === 'approved'` → badge revelado (não aparece nessa página, mas cobre o caso)
- Botão "Enviar ✓" visível apenas quando `status === 'pending'` — ao clicar chama `QuestService.submitForAnalysis()` (já existente) e depois `EventQuestService.updateEventQuestStatus(id, 'analyzing')`
- Label de status quando `status === 'analyzing'`: "🔍 Em análise..."

#### `EventsPage` — `src/app/players/pages/events/`

- Busca dados via `EventQuestService.load()` no `ngOnInit`
- Exibe `activeEventQuests()` usando `EventCardComponent`
- Empty state quando lista vazia: ícone + "Nenhum evento ativo no momento. Fique de olho no sininho! 🔔"

### 5.4 Mudanças em arquivos existentes

| Arquivo | Mudança |
|---|---|
| `src/app/layout/layout.component` | Adiciona `NotificationBellComponent` no header do player (admin layout **não** recebe o sininho — admins não são alvo de eventos) |
| `src/app/players/components/sidebar/` | Adiciona item "Eventos" com ícone ⚡ e link `/events` |
| `src/app/app.routes.ts` | Nova rota `/events` → `EventsPage` (lazy-loaded) |
| `src/app/services/auth.service.ts` | `logout()` chama `notificationService.clear()` e `eventQuestService.clear()` |
| `src/app/services/auth.service.ts` | `refreshProfile()` dispara `notificationService.load()` |

---

## 6. O que NÃO muda

- Endpoint `POST /quests/{id}/submit` — o mesmo fluxo de submissão já funciona para event quests
- Endpoint `POST /admin/quests/{id}/status` — aprovação já concede badge via `gamification_service`
- Página `/badges` (Conquistas) — exibe badges do player sem mudança; o badge aparece lá automaticamente após aprovação
- Página `/history` — exibe todos os logs sem mudança
- Fluxo de quests normais — sem alteração

---

## 7. Arquivos a criar/modificar — resumo

### Backend (`home_guild_backend`)

| Ação | Arquivo |
|---|---|
| Modificar | `app/services/admin_service.py` |
| Modificar | `app/services/gamification_service.py` |
| Modificar | `app/repositories/quest_repository.py` |
| Modificar | `app/repositories/log_repository.py` |
| Modificar | `app/models/schema.py` |
| Modificar | `app/routes/dashboard_route.py` |

### Frontend (`home_guild_frontend`)

| Ação | Arquivo |
|---|---|
| Criar | `src/app/services/notification.service.ts` |
| Criar | `src/app/services/event-quest.service.ts` |
| Criar | `src/app/layout/notification-bell/notification-bell.component.ts` |
| Criar | `src/app/layout/notification-dropdown/notification-dropdown.component.ts` |
| Criar | `src/app/players/components/event-card/event-card.component.ts` |
| Criar | `src/app/players/pages/events/events.component.ts` |
| Modificar | `src/app/layout/layout.component.ts` |
| Modificar | `src/app/players/components/sidebar/sidebar.component.ts` |
| Modificar | `src/app/app.routes.ts` |
| Modificar | `src/app/services/auth.service.ts` |
| Modificar | `src/app/interfaces/interface.ts` |
