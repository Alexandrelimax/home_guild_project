import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../services/admin.service';
import { EventCreateRequest } from '../../../interfaces/dtos';
import { User } from '../../../interfaces/interface';
import { environment } from '../../../../environments/environment';
import { PlayerPickerComponent } from '../../../components/player-picker/player-picker.component';

@Component({
  selector: 'app-admin-events-create',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerPickerComponent],
  templateUrl: './events-create.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEventsCreatePage implements OnInit {
  private adminService = inject(AdminService);
  private destroyRef = inject(DestroyRef);

  players = signal<User[]>([]);

  // Quest properties
  title = signal('');
  description = signal('');
  xp = signal<number>(1000);
  bits = signal<number>(200);

  // Badge properties
  badgeTitle = signal('');
  badgeDescription = signal('');
  badgeRarity = signal<'comum' | 'raro' | 'lendario'>('comum');
  badgeIcon = signal('');
  badgeCardImage = signal('');

  targetUserIds = signal<number[]>([]);

  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.adminService.getPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.players.set(data);
          this.targetUserIds.set(data.map(p => p.id));
        },
        error: () => this.errorMessage.set('Erro ao carregar jogadores. Recarregue a página.')
      });
  }

  onSelectionChange(ids: number[]) {
    this.targetUserIds.set(ids);
  }

  onSubmit() {
    if (!this.title() || !this.badgeTitle() || !this.targetUserIds().length) {
      this.errorMessage.set('Preencha os dados da quest, nome do badge e selecione ao menos 1 alvo.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: EventCreateRequest = {
      title: this.title(),
      description: this.description(),
      xp: this.xp(),
      bits: this.bits(),
      badge_title: this.badgeTitle(),
      badge_description: this.badgeDescription(),
      badge_rarity: this.badgeRarity(),
      badge_icon: this.badgeIcon(),
      badge_card_image: this.badgeCardImage(),
      target_user_ids: this.targetUserIds()
    };

    this.adminService.createEvent(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.title.set('');
          this.description.set('');
          this.badgeTitle.set('');
          this.badgeDescription.set('');
          this.badgeIcon.set('');
          this.badgeCardImage.set('');
          this.xp.set(1000);
          this.bits.set(200);
          this.badgeRarity.set('comum');
          this.targetUserIds.set(this.players().map(p => p.id));
          this.isSubmitting.set(false);

          const timeoutId = setTimeout(() => this.successMessage.set(null), environment.ui.successMessageTimeoutMs);
          this.destroyRef.onDestroy(() => clearTimeout(timeoutId));
        },
        error: (err) => {
          this.errorMessage.set('Erro ao criar evento: ' + (err.error?.detail || err.message));
          this.isSubmitting.set(false);
        }
      });
  }
}
