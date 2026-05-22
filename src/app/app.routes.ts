import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard'; // O novo que você vai criar

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./auth/login/login.component').then(m => m.LoginPage)
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./auth/register/register.component').then(m => m.RegisterPage)
    },

    // --- ROTAS DO ADMINISTRADOR (ALEXANDRE E KATE) ---
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
            import('./admin/pages/layout/layout.component').then(m => m.AdminLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./admin/pages/dashboard/dashboard.component').then(m => m.AdminDashboardPage)
            },
            {
                path: 'tasks/create',
                loadComponent: () =>
                    import('./admin/pages/tasks-create/tasks-create.component').then(m => m.AdminTasksCreatePage)
            },
            {
                path: 'approvals',
                loadComponent: () =>
                    import('./admin/pages/approvals/approvals.component').then(m => m.AdminApprovalsPage)
            },
            {
                path: 'events',
                loadComponent: () =>
                    import('./admin/pages/events-create/events-create.component').then(m => m.AdminEventsCreatePage)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },

    // --- ROTAS DO USUÁRIO (KAIQUE E MANU) ---
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layout/layout.component').then(m => m.LayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./players/pages/dashboard/dashboard.component').then(m => m.DashboardPage)
            },
            {
                path: 'events',
                loadComponent: () =>
                    import('./players/pages/events/events.component').then(m => m.EventsPage)
            },
            {
                path: 'history',
                loadComponent: () =>
                    import('./players/pages/history/history.component').then(m => m.HistoryPage)
            },
            {
                path: 'shop',
                loadComponent: () =>
                    import('./players/pages/shop/shop.component').then(m => m.ShopPage)
            },
            {
                path: 'badges',
                loadComponent: () =>
                    import('./players/pages/badges/badges.component').then(m => m.BadgesPage)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },

    // Wildcard
    {
        path: '**',
        redirectTo: 'login'
    }
];