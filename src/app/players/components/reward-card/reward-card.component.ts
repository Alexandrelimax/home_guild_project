import { Component, input, output, computed } from '@angular/core';
import { Reward, User } from '../../../interfaces/interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reward-card',
  standalone: true,
  imports: [],
  templateUrl: './reward-card.html',
  styleUrls: ['./reward-card.css']
})
export class RewardCardComponent {
  reward = input.required<Reward>();
  user = input.required<User | null>();
  redeem = output<Reward>();

  isMilestone = computed(() => this.reward().type === 'milestone');

  canAfford = computed(() => {
    const user = this.user();
    if (!user) return false;

    if (this.isMilestone()) {
      return user.level >= (this.reward().min_level || 0);
    }
    return user.bits >= (this.reward().cost || 0);
  });

  // Gerencia as cores de borda e sombras baseadas no nível
  themeClass = computed(() => {
    if (!this.isMilestone()) return 'border-cyan-500/30';

    const level = this.reward().min_level;
    if (level >= environment.game.milestoneLevels.gold) return 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]'; // Ouro
    if (level >= environment.game.milestoneLevels.silver) return 'border-slate-400/40 shadow-[0_0_20px_rgba(148,163,184,0.15)]'; // Prata
    return 'border-amber-800/40'; // Bronze
  });

  // Cores do texto "MASTERY" e subhead de nível
  accentTextClass = computed(() => {
    if (!this.isMilestone()) return 'text-cyan-400';

    const level = this.reward().min_level;
    if (level >= environment.game.milestoneLevels.gold) return 'text-amber-400';
    if (level >= environment.game.milestoneLevels.silver) return 'text-slate-300';
    return 'text-amber-600';
  });

  // Estilização dinâmica do botão de resgate
  buttonClass = computed(() => {
    if (!this.isMilestone()) return 'bg-cyan-900/40 hover:bg-cyan-600 text-cyan-100';

    const level = this.reward().min_level;
    if (level >= environment.game.milestoneLevels.gold) return 'bg-amber-600/20 hover:bg-amber-500 text-amber-100 border border-amber-500/50';
    if (level >= environment.game.milestoneLevels.silver) return 'bg-slate-700/40 hover:bg-slate-500 text-slate-100 border border-slate-500/50';
    return 'bg-amber-900/40 hover:bg-amber-700 text-amber-100';
  });

  rewardIcon = computed(() => {
    if (this.isMilestone()) {
      const level = this.reward().min_level ?? 0;
      if (level >= environment.game.milestoneLevels.gold) return 'assets/icons/mastery_gold.svg';
      if (level >= environment.game.milestoneLevels.silver) return 'assets/icons/mastery_silver.svg';
      return 'assets/icons/mastery_bronze.svg';
    }
    return 'assets/icons/bits.svg';
  });

  // O blur de fundo (Glow)
  glowClass = computed(() => {
    if (!this.isMilestone()) return 'bg-cyan-500';

    const level = this.reward().min_level;
    if (level >= environment.game.milestoneLevels.gold) return 'bg-amber-400';
    if (level >= environment.game.milestoneLevels.silver) return 'bg-slate-200'; // Prata polido
    return 'bg-orange-800';
  });
}