import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  title = input.required<string>();
  titleHighlight = input.required<string>();
  subtitle = input.required<string>();
  subtitlePrefix = input.required<string>();
  accentColor = input.required<string>();
}
