import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { UserMetricsDTO } from '../../../interfaces/dtos';
import { XpBarComponent } from '../../../components/xp-bar/xp-bar.component';

@Component({
  selector: 'app-admin-player-card',
  standalone: true,
  imports: [XpBarComponent],
  templateUrl: './player-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPlayerCardComponent {
  item = input.required<UserMetricsDTO>();
}
