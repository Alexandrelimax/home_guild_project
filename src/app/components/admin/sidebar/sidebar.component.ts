import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class AdminSidebarComponent {
  isOpen = input(false);
  close = output<void>();

  private auth = inject(AuthService);

  logout() {
    this.close.emit();
    this.auth.logout();
  }
}