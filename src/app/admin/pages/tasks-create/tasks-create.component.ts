import { Component, inject, OnInit, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../interfaces/interface';
import { EventService } from '../../../services/event.service';
import { PlayerPickerComponent } from '../../components/player-picker/player-picker.component';

@Component({
  selector: 'app-admin-tasks-create',
  standalone: true,
  imports: [ReactiveFormsModule, PlayerPickerComponent],
  templateUrl: './tasks-create.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTasksCreatePage implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  players = signal<User[]>([]);
  taskForm: FormGroup;
  isSubmitting = signal(false);

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      xp: [100, [Validators.required, Validators.min(0)]],
      bits: [10, [Validators.required, Validators.min(0)]],
      target_user_ids: [[], [(ctrl: AbstractControl) => ctrl.value?.length >= 1 ? null : { minArrayLength: true }]],
      is_recurring: [false]
    });
  }

  ngOnInit() {
    this.adminService.getPlayers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.players.set(data),
        error: () => this.eventService.addError('Erro ao carregar jogadores')
      });
  }

  onSelectionChange(ids: number[]) {
    this.taskForm.patchValue({ target_user_ids: ids });
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.adminService.createTask(this.taskForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.eventService.addLogs([{
            id: crypto.randomUUID(),
            message: res.message,
            type: 'info',
            created_at: new Date().toISOString()
          }]);
          this.taskForm.reset({ xp: 100, bits: 10, target_user_ids: [], is_recurring: false });
          this.isSubmitting.set(false);
        },
        error: () => {
          this.eventService.addError('Erro ao criar task');
          this.isSubmitting.set(false);
        }
      });
  }

  resetDaily() {
    if (confirm('Deseja recriar todas as tarefas recorrentes das planilhas para hoje?')) {
      this.adminService.resetDailyQuests()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.eventService.addLogs([{
              id: crypto.randomUUID(),
              message: res.message,
              type: 'info',
              created_at: new Date().toISOString()
            }]);
          },
          error: () => this.eventService.addError('Erro ao resetar tarefas diárias')
        });
    }
  }
}
