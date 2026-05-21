import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class AdminHeaderComponent {
  // O segredo é garantir que o 'auth' esteja aqui
  public auth = inject(AuthService);
}