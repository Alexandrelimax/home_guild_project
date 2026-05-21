import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../../interfaces/interface';

@Component({
  selector: 'app-player-picker',
  standalone: true,
  templateUrl: './player-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerPickerComponent {
  players = input.required<User[]>();
  selectedIds = input.required<number[]>();
  selectionChange = output<number[]>();

  toggle(userId: number) {
    const current = this.selectedIds();
    const next = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    this.selectionChange.emit(next);
  }

  selectAll() {
    this.selectionChange.emit(this.players().map(p => p.id));
  }
}
