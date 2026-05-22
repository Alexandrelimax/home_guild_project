import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { EventQuest } from '../../../interfaces/interface';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [],
  templateUrl: './event-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent {
  eventQuest = input.required<EventQuest>();
  onSubmit = output<number>();

  statusConfig = computed(() => {
    switch (this.eventQuest().status) {
      case 'analyzing':
        return { label: 'EM ANÁLISE', color: 'text-amber-400', border: 'border-amber-500/40' };
      case 'approved':
        return { label: 'CONCLUÍDA', color: 'text-emerald-400', border: 'border-emerald-500/40' };
      default:
        return { label: 'PENDENTE', color: 'text-amber-300', border: 'border-amber-500/60' };
    }
  });

  badgeLocked = computed(() => this.eventQuest().status !== 'approved');
}
