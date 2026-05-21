import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../services/admin.service';
import { AdminAnalyticsResponse } from '../../../interfaces/dtos';
import { XpBarComponent } from '../../../components/xp-bar/xp-bar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [XpBarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardPage implements OnInit {
  private adminService = inject(AdminService);
  private destroyRef = inject(DestroyRef);

  analytics = signal<AdminAnalyticsResponse | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.adminService.getAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.analytics.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }
}
