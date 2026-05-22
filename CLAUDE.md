# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
ng serve                              # dev server at localhost:4200
ng build --configuration development  # dev build (fast, no optimizations)
ng build --configuration production   # prod build (uses environment.prod.ts)
ng test                               # unit tests — requires a browser (Karma)
```

> `ng test` cannot run headlessly in this environment. Use `ng build` to validate correctness.

## Architecture

### Domain structure

```
src/app/
  admin/      components/ + pages/   — admin panel (adms)
  players/    components/ + pages/   — player interface
  auth/       login/ + register/     — role-neutral auth pages
  guards/     authGuard, adminGuard
  interceptors/  authInterceptor (attaches Bearer token, handles 401)
  interfaces/    domain types + DTOs
  services/      global reactive state + API calls
  layout/        player shell (sidebar + router-outlet)
```

### Angular patterns used throughout

- **All components are standalone** with `ChangeDetectionStrategy.OnPush`
- **Zoneless** — `provideZonelessChangeDetection()` in `app.config.ts`; never use `NgZone`
- **Signals** — component state uses `signal()`, derived values use `computed()`, inputs use `input()` / `input.required()`
- **No `CommonModule`** — use `@if`/`@for` control flow syntax; import `DatePipe` individually when needed
- **`inject()`** over constructor injection everywhere
- **Subscriptions** always piped with `.pipe(takeUntilDestroyed(this.destroyRef))`

### State management

Services hold the single source of truth as signals. There are no NgRx stores.

- `AuthService` — JWT token + current user; exposes `currentUser()`, `isAuthenticated`, `isAdmin`
- `UserService`, `QuestService`, `RewardService`, `EventService` — domain state cleared on logout by `AuthService.logout()`
- `ApiService` — thin wrapper over `HttpClient`; all requests go through `api.get<T>()` / `api.post<T>()`; base URL comes from `environment.apiBaseUrl`

### Routing and guards

- `/login`, `/register` → `auth/` (no guard)
- `/**` → player layout, protected by `authGuard` (checks `isAuthenticated`)
- `/admin/**` → admin layout, protected by `adminGuard` (checks `role === 'admin'`)
- All routes use `loadComponent` (lazy-loaded)

### Environment constants

All magic numbers live in `src/environments/environment.ts`. Reference them instead of hardcoding:

```ts
environment.apiBaseUrl
environment.authTokenKey
environment.game.xpPerLevel        // 1000
environment.game.maxLevel          // 15
environment.game.milestoneLevels   // { gold: 15, silver: 10 }
environment.ui.successMessageTimeoutMs
```

Production build automatically swaps in `environment.prod.ts` via `fileReplacements`.

### Adding a new component

1. Place it under the correct domain (`admin/components/`, `players/components/`)
2. Standalone, `OnPush`, use `input()` / `output()` — no `@Input()`/`@Output()` decorators
3. For shared UI used by both domains, place in `players/components/` (e.g. `auth-card-layout`, `xp-bar`)
