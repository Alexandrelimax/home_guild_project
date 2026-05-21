import { User, Quest, GameLog, Badge, Reward } from './interface';

// O que o backend retorna no login
export interface Token {
    access_token: string;
    token_type: string;
}

// O que enviamos para logar
export interface LoginRequest {
    email: string;
    password: string;
}

// O que enviamos para cadastrar (Character Creation)
export interface UserCreate {
    name: string;
    email: string;
    password: string;
    avatar: string;
}

// Para o /auth/me e outros lugares, usamos sua interface User já existente
export type UserDTO = User;


// =========================================
// QUEST
// =========================================

export interface QuestSubmitResponse {
    message: string;
    quest: Quest;
    new_logs: GameLog[];
}

export interface QuestReviewResponse {
    message: string;
    leveled_up: boolean;
    user: User;
    quest: Quest;
    new_logs: GameLog[];
}

// =========================================
// REWARD
// =========================================

export interface RewardRedeemResponse {
    message: string;
    user?: User;
    reward?: Reward;
    new_logs: GameLog[];
}

// =========================================
// ADMIN
// =========================================

export interface QuestWithUserDTO {
    quest: Quest;
    user: User;
}

export interface QuestCreateRequest {
    title: string;
    description?: string;
    xp: number;
    bits: number;
    is_recurring: boolean;
    target_user_ids: number[];
}

export interface EventCreateRequest {
    title: string;
    description: string;
    xp: number;
    bits: number;
    badge_title: string;
    badge_description: string;
    badge_rarity: 'comum' | 'raro' | 'lendario';
    badge_icon: string;
    badge_card_image: string;
    target_user_ids: number[];
}

export interface UserMetricsDTO {
    user: User;
    total_completed: number;
    active_quests: number;
}

export interface AdminAnalyticsResponse {
    users_metrics: UserMetricsDTO[];
    system_metrics: {
        pending_analysis: number;
        total_approved: number;
        total_rejected: number;
        total_players: number;
    };
}