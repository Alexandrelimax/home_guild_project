import { Component, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { QuestService } from '../../../services/quest.service';
import { GameService } from '../../../services/game.service';
import { EventService } from '../../../services/event.service';

import { QuestCardComponent } from '../../components/quest-card/quest-card.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [QuestCardComponent, PageHeaderComponent],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
  public questService = inject(QuestService);

  private gameService = inject(GameService);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.gameService.loadDashboard()
      .pipe(
        // Agora passamos o destroyRef corretamente para evitar o erro TS2554
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: (err) => console.error('Erro ao carregar dashboard', err)
      });
  }

  handleSubmit(questId: number) {
    this.questService.submitForAnalysis(questId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.eventService.addError('Erro ao enviar quest')
      });
  }


}