import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../services/admin.service';
import { AdminAnalyticsResponse } from '../../../interfaces/dtos';
import { AdminStatCardComponent } from '../../components/stat-card/stat-card.component';
import { AdminPlayerCardComponent } from '../../components/player-card/player-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminStatCardComponent, AdminPlayerCardComponent],
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
