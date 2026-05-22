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

// Resposta do Dashboard (Pacotão Inicial)
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
    loading: boolean; // Útil para spinners
}