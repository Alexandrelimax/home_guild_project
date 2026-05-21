import { Component, input, output, computed } from '@angular/core';
import { Quest } from '../../../interfaces/interface';

@Component({
  selector: 'app-quest-card',
  standalone: true,
  imports: [],
  templateUrl: './quest-card.html',
  styleUrls: ['./quest-card.css']
})
export class QuestCardComponent {
  quest = input.required<Quest>();

  onSubmit = output<number>(); // Output para enviá-la para análise

  statusConfig = computed(() => {
    const s = this.quest().status;
    switch (s) {
      case 'approved':
        return { label: 'COMPLETA', color: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'analyzing':
        return { label: 'ANALISANDO', color: 'text-amber-400', border: 'border-amber-500/30' };
      default:
        return { label: 'PENDENTE', color: 'text-slate-500', border: 'border-slate-800' };
    }
  });
}