import { Injectable, signal, computed } from '@angular/core';
import { Badge } from '../interfaces/interface';

@Injectable({ providedIn: 'root' })
export class BadgeService {
    private readonly _badges = signal<Badge[]>([]);
    readonly badges = computed(() => this._badges());

    setBadges(badges: Badge[]) {
        this._badges.set(badges);
    }

    hydrateFromDashboard(badges: Badge[]) {
        this.setBadges(badges);
    }
}