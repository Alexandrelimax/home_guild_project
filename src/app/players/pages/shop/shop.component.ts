import { Component, inject, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RewardService } from '../../../services/reward.service';
import { UserService } from '../../../services/user.service';
import { EventService } from '../../../services/event.service';

import { RewardCardComponent } from '../../components/reward-card/reward-card.component';
import { Reward } from '../../../interfaces/interface';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RewardCardComponent, PageHeaderComponent],
  templateUrl: './shop.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopPage implements OnInit {
  public rewardService = inject(RewardService);
  public userService = inject(UserService);

  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.rewardService.getShop()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  handleRedeem(reward: Reward) {
    this.rewardService.redeem(reward.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          this.eventService.addError(
            err.error?.detail || err.message || 'Erro no resgate'
          );
        }
      });
  }
}