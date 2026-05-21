import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-admin-stat-card',
  standalone: true,
  templateUrl: './stat-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminStatCardComponent {
  label = input.required<string>();
  value = input.required<number | null | undefined>();
  accentClass = input<string>('');
  pulse = input<boolean>(false);
}
