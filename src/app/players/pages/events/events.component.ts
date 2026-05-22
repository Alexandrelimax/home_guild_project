import { Component, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventQuestService } from '../../../services/event-quest.service';
import { QuestService } from '../../../services/quest.service';
import { EventService } from '../../../services/event.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [EventCardComponent, PageHeaderComponent],
  templateUrl: './events.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  eventQuestService = inject(EventQuestService);
  private questService = inject(QuestService);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  handleSubmit(questId: number) {
    this.questService.submitForAnalysis(questId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.eventQuestService.updateStatus(questId, 'analyzing'),
        error: () => this.eventService.addError('Erro ao enviar evento para análise'),
      });
  }
}
