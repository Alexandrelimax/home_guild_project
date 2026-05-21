import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { EventCreateRequest } from '../../../interfaces/dtos';
import { User } from '../../../interfaces/interface';

@Component({
  selector: 'app-admin-events-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events-create.html',
})
export class AdminEventsCreatePage implements OnInit {
  private adminService = inject(AdminService);
  
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
    this.adminService.getPlayers().subscribe({
      next: (data) => {
        this.players.set(data);
        this.targetUserIds.set(data.map(p => p.id));
      },
      error: () => this.errorMessage.set('Erro ao carregar jogadores. Recarregue a página.')
    });
  }

  toggleTarget(userId: number) {
    const current = this.targetUserIds();
    if (current.includes(userId)) {
      this.targetUserIds.set(current.filter(id => id !== userId));
    } else {
      this.targetUserIds.set([...current, userId]);
    }
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

    this.adminService.createEvent(payload).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.title.set('');
        this.description.set('');
        this.badgeTitle.set('');
        this.badgeDescription.set('');
        this.badgeIcon.set('');
        this.badgeCardImage.set('');
        this.isSubmitting.set(false);
        
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.errorMessage.set('Erro ao criar evento: ' + (err.error?.detail || err.message));
        this.isSubmitting.set(false);
      }
    });
  }
}
