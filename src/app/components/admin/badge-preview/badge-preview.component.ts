import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

type Rarity = 'comum' | 'raro' | 'lendario';

@Component({
  selector: 'app-admin-badge-preview',
  standalone: true,
  templateUrl: './badge-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminBadgePreviewComponent {
  title = input<string>('');
  description = input<string>('');
  rarity = input<Rarity>('comum');
  cardImage = input<string>('');

  bgGradientClass = computed(() => {
    const map: Record<Rarity, string> = {
      comum: 'from-slate-800 to-[#020617]',
      raro: 'from-blue-900 to-[#020617]',
      lendario: 'from-amber-700 to-amber-950',
    };
    return map[this.rarity()];
  });

  rarityTextClass = computed(() => {
    const map: Record<Rarity, string> = {
      comum: 'text-slate-400 border-slate-400',
      raro: 'text-blue-400 border-blue-400',
      lendario: 'text-amber-400 border-amber-400',
    };
    return map[this.rarity()];
  });
}
