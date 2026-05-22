import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserCardComponent } from '../user-card/user-card.component';
import { NotificationBellComponent } from '../../../layout/notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [UserCardComponent, NotificationBellComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  store = inject(UserService);
}
