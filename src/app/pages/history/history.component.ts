import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { EventLogComponent } from '../../components/log-terminal/event-log.component';
import { EventService } from '../../services/event.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [EventLogComponent, PageHeaderComponent],
  templateUrl: './history.html',
  styleUrl: './history.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryPage {
  public eventService = inject(EventService);
}
