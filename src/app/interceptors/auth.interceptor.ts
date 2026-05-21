import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem(environment.authTokenKey);
    const auth = inject(AuthService); // Injetando o service dentro da função

    let clonedReq = req;
    if (token) {
        clonedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(clonedReq).pipe(
        catchError(err => {
            if (err.status === 401) {
                auth.logout(); // Se o token mofou, manda pro login
            }
            return throwError(() => err);
        })
    );
};