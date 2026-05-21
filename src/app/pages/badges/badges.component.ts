import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeService } from '../../services/badge.service';
import { BadgeCardComponent } from '../../components/badge-card/badge-card.component';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-badges',
  standalone: true,
  imports: [CommonModule, BadgeCardComponent, PageHeaderComponent],
  templateUrl: './badges.html'
})
export class BadgesPage {
  public badgeService = inject(BadgeService);
  readonly totalBadgeCount = environment.game.totalBadgeCount;

  activeCardId = signal<number | null>(null);

  activeBadge = computed(() =>
    this.badgeService.badges().find(b => b.id === this.activeCardId())
  );

  toggleCard(badgeId: number) {
    this.activeCardId.update(current =>
      current === badgeId ? null : badgeId
    );
  }
}