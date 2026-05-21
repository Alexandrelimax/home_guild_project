import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserCardComponent } from '../user-card/user-card.component';

@Component({
  selector: 'app-header',
  imports: [UserCardComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  store = inject(UserService);

}