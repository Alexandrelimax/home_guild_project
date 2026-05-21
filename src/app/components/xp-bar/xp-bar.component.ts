import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-xp-bar',
  standalone: true,
  templateUrl: './xp-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XpBarComponent {
  xp = input.required<number>();
  level = input.required<number>();
  accentClass = input<string>('from-violet-600 to-fuchsia-500');

  protected readonly xpPerLevel = environment.game.xpPerLevel;
  protected readonly maxLevel = environment.game.maxLevel;

  percentage = computed(() => {
    if (this.level() >= this.maxLevel) return 100;
    return (this.xp() / this.xpPerLevel) * 100;
  });
}
