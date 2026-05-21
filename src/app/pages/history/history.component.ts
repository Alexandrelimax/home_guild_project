import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { EventLogComponent } from '../../components/log-terminal/event-log.component';
import { EventService } from '../../services/event.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-history',
  imports: [CommonModule, EventLogComponent, PageHeaderComponent],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class HistoryPage {
  public store = inject(UserService);
  public eventService = inject(EventService);

}
