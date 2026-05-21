import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Dados do formulário
  name = signal('');
  email = signal('');
  password = signal('');
  avatar = signal(environment.ui.defaultAvatarUrl);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly avatars = environment.ui.avatarOptions;

  selectAvatar(img: string) {
    this.avatar.set(img);
  }

  onRegister() {
    if (!this.name() || !this.email() || !this.password()) {
      this.errorMessage.set('Preencha todos os campos para forjar seu perfil!');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const newUser = {
      name: this.name(),
      email: this.email(),
      password: this.password(),
      avatar: this.avatar()
    };

    this.auth.register(newUser).subscribe({
      next: () => {
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Erro ao criar conta. Tente outro e-mail.');
      }
    });
  }
}
