import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../../interfaces/interface';
import { XpBarComponent } from '../xp-bar/xp-bar.component';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [XpBarComponent],
  templateUrl: './user-card.html',
  styleUrls: ['./user-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  user = input.required<User>();
}
