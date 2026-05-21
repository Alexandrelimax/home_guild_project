import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../services/admin.service';
import { QuestWithUserDTO } from '../../../interfaces/dtos';
import { EventService } from '../../../services/event.service';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approvals.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminApprovalsPage implements OnInit {
  private adminService = inject(AdminService);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  pendingTasks = signal<QuestWithUserDTO[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadPendingTasks();
  }

  loadPendingTasks() {
    this.isLoading.set(true);
    this.adminService.getPendingTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.pendingTasks.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  reviewQuest(questId: number, status: 'approved' | 'rejected') {
    this.adminService.reviewTask(questId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.pendingTasks.update(tasks => tasks.filter(t => t.quest.id !== questId));
          this.eventService.addLogs([{
            id: crypto.randomUUID(),
            message: response.message,
            type: status === 'approved' ? 'approved' : 'rejected',
            created_at: new Date().toISOString()
          }]);
        },
        error: () => this.eventService.addError('Erro ao revisar quest')
      });
  }
}
