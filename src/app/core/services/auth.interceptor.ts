import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const shouldAttach = this.shouldAttachToken(req);
    const authRequest = shouldAttach
      ? req.clone({ setHeaders: { Authorization: `Bearer ${this.auth.accessToken()}` } })
      : req;

    return next.handle(authRequest).pipe(
      catchError((error) => {
        if (error?.status === 401 && !this.isAuthEndpoint(req) && this.auth.refreshToken().trim()) {
          return this.auth.refreshTokenRequest().pipe(
            switchMap((refreshResult) => {
              if (refreshResult.ok && this.auth.accessToken()) {
                const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${this.auth.accessToken()}` } });
                return next.handle(retryReq);
              }

              this.auth.logout();
              this.router.navigate(['/auth']);
              return throwError(() => error);
            }),
            catchError(() => {
              this.auth.logout();
              this.router.navigate(['/auth']);
              return throwError(() => error);
            }),
          );
        }

        return throwError(() => error);
      }),
    );
  }

  private shouldAttachToken(req: HttpRequest<unknown>): boolean {
    return !!this.auth.accessToken() && !this.isAuthEndpoint(req);
  }

  private isAuthEndpoint(req: HttpRequest<unknown>): boolean {
    const url = req.url;
    return url.includes('/api/Identity/login') || url.includes('/api/Identity/RefreshToken');
  }
}
