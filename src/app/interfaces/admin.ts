export interface PlayerStatus {
    id: number;
    name: string;
    level: number;
    xp: number;
    bits: number;
    avatar: string;
    pendingQuestsCount: number; // Útil para você saber quem está trabalhando
}

