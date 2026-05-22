import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { GameLog } from '../../../interfaces/interface';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [],
  templateUrl: './notification-bell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal(false);

  toggle() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.notificationService.markAllRead();
    }
  }

  navigate(log: GameLog) {
    this.isOpen.set(false);
    if (log.type === 'event_assigned') {
      this.router.navigate(['/events']);
    } else {
      this.router.navigate(['/badges']);
    }
  }

  close() {
    this.isOpen.set(false);
  }
}
