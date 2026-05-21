import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { BadgeService } from '../../../services/badge.service';
import { BadgeCardComponent } from '../../components/badge-card/badge-card.component';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-badges',
  standalone: true,
  imports: [BadgeCardComponent, PageHeaderComponent],
  templateUrl: './badges.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgesPage {
  public badgeService = inject(BadgeService);
  readonly totalBadgeCount = environment.game.totalBadgeCount;

  activeCardId = signal<number | null>(null);

  toggleCard(badgeId: number) {
    this.activeCardId.update(current =>
      current === badgeId ? null : badgeId
    );
  }
}