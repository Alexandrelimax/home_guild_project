import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../players/components/sidebar/sidebar.component';
import { HeaderComponent } from '../players/components/header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './layout.html'
})
export class LayoutComponent {
  isMenuOpen = signal(false);
}