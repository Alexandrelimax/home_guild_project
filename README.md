# HomeGuild

Sistema de gamificação doméstica para tarefas do dia a dia. Os administradores (o casal) criam missões e eventos; os jogadores (os enteados) completam tarefas, sobem de nível, acumulam moedas e desbloqueiam recompensas.

---

## Stack

- **Angular 20** — standalone components, signals API, zoneless change detection
- **Tailwind CSS v3 + DaisyUI** — estilização utilitária
- **RxJS** — comunicação com a API via `HttpClient`
- **Backend** — API REST separada (FastAPI), consumida via `ApiService`

---

## Arquitetura

O projeto está organizado em três domínios de produto mais uma camada de infraestrutura compartilhada:

```
src/app/
├── admin/               # Painel dos administradores
│   ├── components/      # badge-preview, header, player-card,
│   │                    # player-picker, sidebar, stat-card
│   └── pages/           # dashboard, approvals, tasks-create,
│                        # events-create, layout
│
├── players/             # Interface dos jogadores
│   ├── components/      # badge-card, header, log-terminal, page-header,
│   │                    # quest-card, reward-card, sidebar, user-card,
│   │                    # xp-bar, auth-card-layout
│   └── pages/           # dashboard, shop, badges, history
│
├── auth/                # Autenticação (neutro de papel)
│   ├── login/
│   └── register/
│
├── guards/              # authGuard, adminGuard
├── interceptors/        # auth.interceptor (injeta Bearer token)
├── interfaces/          # Tipos e DTOs
├── services/            # ApiService, AuthService, UserService,
│                        # QuestService, BadgeService, RewardService,
│                        # GameService, EventService, AdminService
└── layout/              # Shell do player (sidebar + router-outlet)
```

### Separação de responsabilidades

| Camada | Responsabilidade |
|---|---|
| `admin/` | Criação e gestão de quests/eventos, aprovações, analytics |
| `players/` | Visualização de progresso, loja, histórico, badges |
| `auth/` | Login e registro, sem restrição de papel |
| `services/` | Estado global reativo via `signal()`, comunicação com a API |
| `guards/` | Controle de acesso por papel antes de carregar cada rota |

---

## Modelo de Domínio

### Entidades principais

**User**
- `role: 'user' | 'admin'` — determina qual interface é carregada
- `xp`, `level`, `bits` — métricas de progresso em tempo real

**Quest**
- `status: 'pending' | 'analyzing' | 'approved'`
- Contém a recompensa prometida (`xp` + `bits`) definida na criação pelo admin

**Badge**
- `rarity: 'comum' | 'raro' | 'lendario'`
- Concedidas por eventos especiais criados pelos admins

**Reward**
- `type: 'bits' | 'milestone'`
- Recompensas de bits exigem saldo mínimo; recompensas de milestone exigem nível mínimo

**GameLog**
- Registro imutável de todos os eventos do jogo (aprovações, level-ups, resgates)
- `type: 'info' | 'approved' | 'rejected' | 'analyzing' | 'levelup' | 'downgrade' | 'error'`

---

## Regras de Negócio

### Progressão

| Constante | Valor |
|---|---|
| XP por nível | 1.000 |
| Nível máximo | 15 |
| Total de badges disponíveis | 24 |
| Milestone ouro | Nível 15 |
| Milestone prata | Nível ≥ 10 |

### Quests

- Quests são criadas pelos admins e atribuídas a jogadores específicos (ou todos)
- Podem ser recorrentes (`is_recurring: true`), reaparecendo após aprovação
- O jogador submete a conclusão → status vai para `analyzing`
- O admin aprova ou rejeita; em caso de aprovação, o backend credita XP e bits e pode disparar level-up
- Rejeições não penalizam — a quest volta para `pending`

### Eventos

- Eventos são quests especiais que carregam um badge embutido
- O admin define título, raridade e imagem do badge no momento da criação
- Ao aprovar um evento, o backend concede o badge ao jogador além do XP e bits

### Loja (Rewards)

- Recompensas do tipo `bits` exigem saldo suficiente na conta do jogador
- Recompensas do tipo `milestone` são desbloqueadas automaticamente ao atingir o nível mínimo
- Uma vez resgatada, a recompensa não pode ser resgatada novamente (`redeemed: true`)

---

## Jornada do Player

```mermaid
flowchart TD
    LOGIN([Login]) --> DASH

    DASH["Dashboard\n─────────────\nVer card de perfil\nXP · Nível · Bits\nVer quests ativas\nVer log de eventos"]

    DASH --> SUBMIT["Submeter quest concluída\n→ status vai para analyzing\n→ aguarda revisão do admin"]

    DASH --> SHOP["Shop\n─────────────\nVer catálogo de recompensas"]
    SHOP --> REDEEM_BITS["Resgatar reward por Bits\n(exige saldo suficiente)"]
    SHOP --> REDEEM_MILE["Resgatar reward por Milestone\n(exige nível mínimo)"]

    DASH --> BADGES["Badges\n─────────────\nVer coleção de badges\ncomum · raro · lendário"]

    DASH --> HISTORY["Histórico\n─────────────\nVer todos os logs do jogo\naprovações · level-ups · resgates"]
```

---

## Jornada do Admin

```mermaid
flowchart TD
    LOGIN([Login]) --> DASH

    DASH["Dashboard\n─────────────\nTotal de players\nQuests aprovadas · reprovadas\nPendentes de análise\nMétricas individuais por jogador"]

    DASH --> APPROVALS["Approvals\n─────────────\nVer fila de quests\nem análise"]
    APPROVALS --> APPROVE["Aprovar quest\n→ credita XP + Bits ao jogador\n→ verifica level-up\n→ quest recorrente volta para pending"]
    APPROVALS --> REJECT["Rejeitar quest\n→ quest volta para pending\n→ sem penalidade ao jogador"]

    DASH --> TASKS["Criar Task\n─────────────\nDefinir título e descrição\nDefinir XP e Bits da recompensa\nMarcar como recorrente ou não\nSelecionar jogadores-alvo"]
    TASKS --> PUBLISH_TASK["Publicar quest\n→ aparece como pending\npara cada jogador selecionado"]

    DASH --> EVENTS["Criar Evento\n─────────────\nDefinir quest do evento\nDefinir badge (nome · raridade · imagem)\nSelecionar jogadores-alvo"]
    EVENTS --> PUBLISH_EVENT["Publicar evento\n→ aparece como pending\n→ aprovação concede badge\naém de XP e Bits"]
```

---

## Papéis

### Admin
Acessa `/admin/**`, protegido por `adminGuard` (verifica `role === 'admin'`).

- **Dashboard**: visão geral do sistema — total de players, quests aprovadas/reprovadas/pendentes e métricas individuais de cada jogador
- **Approvals**: fila de quests aguardando análise — aprova ou rejeita com um clique
- **Tasks Create**: cria quests para um ou mais jogadores, define XP, bits e se é recorrente
- **Events**: cria quests especiais com badge embutido (título, raridade, imagem)

### Player
Acessa `/**`, protegido por `authGuard` (verifica autenticação).

- **Dashboard**: quests ativas, card de perfil com XP/nível/bits e log de eventos em tempo real
- **Shop**: catálogo de recompensas; o jogador resgata com bits ou por milestone de nível
- **Badges**: coleção de badges conquistados, com visualização de raridade
- **History**: histórico completo de logs do jogo (aprovações, level-ups, resgates)
