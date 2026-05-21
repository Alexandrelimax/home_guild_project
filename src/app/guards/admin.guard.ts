// services/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
    }

    if (auth.currentUser()?.role !== 'admin') {
        router.navigate(['/dashboard']);
        return false;
    }

    return true;
};