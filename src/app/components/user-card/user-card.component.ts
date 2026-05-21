import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../interfaces/interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.html',
  styleUrls: ['./user-card.css'] // Para as animações de scanline e neon
})
export class UserCardComponent {
  // Input reativo do Angular 19/20
  user = input.required<User>();

  // Cálculo da porcentagem da barra de XP (assumindo 1000 XP por nível)
  xpPercentage = computed(() => {
    if (this.user().level >= environment.game.maxLevel) return 100;
    return (this.user().xp / environment.game.xpPerLevel) * 100;
  });
}