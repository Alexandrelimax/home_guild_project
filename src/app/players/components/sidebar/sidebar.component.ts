import { Component, input, output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  isOpen = input.required<boolean>();
  close = output<void>();

  readonly appVersion = environment.ui.appVersion;

  private auth = inject(AuthService);

  logout() {
    this.close.emit();
    this.auth.logout();
  }
}
