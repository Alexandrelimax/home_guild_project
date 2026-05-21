import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Reward } from '../interfaces/interface';
import { RewardRedeemResponse } from '../interfaces/dtos';
import { tap, finalize, throwError } from 'rxjs';
import { UserService } from './user.service';
import { EventService } from './event.service';

@Injectable({ providedIn: 'root' })
export class RewardService {
    private api = inject(ApiService);
    private userService = inject(UserService);
    private eventService = inject(EventService);
    private readonly _rewards = signal<Reward[]>([]);

    readonly rewards = computed(() => {
        return [...this._rewards()].sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'bits' ? -1 : 1;
            }
            const valA = a.type === 'milestone' ? (a.min_level || 0) : (a.cost || 0);
            const valB = b.type === 'milestone' ? (b.min_level || 0) : (b.cost || 0);

            return valA - valB;
        });
    });

    setRewards(rewards: Reward[]) {
        this._rewards.set(rewards);
    }

    markAsRedeemed(id: number) {
        this._rewards.update(rs =>
            rs.map(r => r.id === id ? { ...r, redeemed: true } : r)
        );
    }

    getShop() { // Removido o parâmetro userId
        this.userService.setLoading(true);

        // Endpoint limpo: o back sabe quem é você pelo Token
        return this.api.get<Reward[]>('rewards/shop').pipe(
            tap(rewards => this.setRewards(rewards)),
            finalize(() => this.userService.setLoading(false))
        );
    }

    redeem(rewardId: number) {
        // Não precisamos mais buscar o userId no Auth para montar a URL!
        return this.api.post<RewardRedeemResponse>(
            `rewards/${rewardId}/redeem`, // Removido o ?user_id=${userId}
            {}
        ).pipe(
            tap(res => {
                if (res.user) this.userService.setUser(res.user);
                if (res.new_logs) this.eventService.addLogs(res.new_logs);
                this.markAsRedeemed(rewardId);
            })
        );
    }
}