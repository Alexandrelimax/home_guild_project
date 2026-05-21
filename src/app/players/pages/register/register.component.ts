import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { AuthCardLayoutComponent } from '../../components/auth-card-layout/auth-card-layout.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthCardLayoutComponent],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
