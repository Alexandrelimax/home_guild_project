import { Component, input, output, computed } from '@angular/core';
import { Badge } from '../../../interfaces/interface';

@Component({
  selector: 'app-badge-card',
  standalone: true,
  imports: [],
  templateUrl: './badge-card.html',
  styleUrls: ['./badge-card.css']
})
export class BadgeCardComponent {
  badge = input.required<Badge>();
  owned = input<boolean>(true);
  isActive = input<boolean>(false); // Controlado pelo pai para mobile expansion

  toggle = output<number>();

  handleCardClick() {
    this.toggle.emit(this.badge().id);
  }
}