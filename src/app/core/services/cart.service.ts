import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddToCartPayload, ApiResponse, CartDto, CartItemDto } from '../models/shop.models';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/api/cart`;

  private readonly _cart = signal<CartDto | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly loading = signal<boolean>(false);
  readonly updatingItemId = signal<string | null>(null);

  readonly items = computed<CartItemDto[]>(() => this._cart()?.items ?? []);
  readonly itemCount = computed<number>(() => this._cart()?.itemCount ?? 0);
  readonly totalCost = computed<number>(() => this._cart()?.totalCost ?? 0);

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadCart();
      } else {
        this._cart.set(null);
      }
    });
  }

  loadCart(): void {
    if (!this.authService.isLoggedIn()) {
      this._cart.set(null);
      return;
    }

    this.loading.set(true);
    this.http.get<ApiResponse<CartDto>>(this.apiUrl).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('[CartService] loadCart error', err);
        return of(null);
      })
    ).subscribe(cart => {
      this._cart.set(cart);
      this.loading.set(false);
    });
  }

  addToCart(productId: string, designId?: string | null, quantity: number = 1): Observable<CartDto | null> {
    const payload: AddToCartPayload = { productId, designId, quantity };
    this.loading.set(true);

    return this.http.post<ApiResponse<CartDto>>(`${this.apiUrl}/items`, payload).pipe(
      map(res => res.data),
      tap(cart => {
        if (cart) {
          this._cart.set(cart);
        } else {
          this.loadCart();
        }
        this.loading.set(false);
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('[CartService] addToCart error', err);
        return throwError(() => err);
      })
    );
  }

  updateQuantity(cartItemId: string, quantity: number): Observable<CartDto | null> {
    this.updatingItemId.set(cartItemId);

    return this.http.put<ApiResponse<CartDto>>(`${this.apiUrl}/items/${cartItemId}`, { cartItemId, quantity }).pipe(
      map(res => res.data),
      tap(cart => {
        if (cart) {
          this._cart.set(cart);
        } else {
          this.loadCart();
        }
        this.updatingItemId.set(null);
      }),
      catchError(err => {
        this.updatingItemId.set(null);
        console.error('[CartService] updateQuantity error', err);
        const msg = err?.error?.Message || err?.error?.message || err?.message || 'Failed to update quantity.';
        this.toastService.error(msg);
        return throwError(() => err);
      })
    );
  }

  removeItem(cartItemId: string): Observable<CartDto | null> {
    this.updatingItemId.set(cartItemId);

    return this.http.delete<ApiResponse<CartDto>>(`${this.apiUrl}/items/${cartItemId}`).pipe(
      map(res => res.data),
      tap(cart => {
        if (cart) {
          this._cart.set(cart);
        } else {
          this.loadCart();
        }
        this.updatingItemId.set(null);
        this.toastService.info('Item removed from cart.');
      }),
      catchError(err => {
        this.updatingItemId.set(null);
        console.error('[CartService] removeItem error', err);
        const msg = err?.error?.Message || err?.error?.message || err?.message || 'Failed to remove item.';
        this.toastService.error(msg);
        return throwError(() => err);
      })
    );
  }

  clearCart(): Observable<boolean> {
    this.loading.set(true);

    return this.http.delete<ApiResponse<string>>(this.apiUrl).pipe(
      map(res => res.succeeded),
      tap(succeeded => {
        this.loading.set(false);
        if (succeeded) {
          if (this._cart()) {
            this._cart.set({
              ...this._cart()!,
              items: [],
              itemCount: 0,
              totalCost: 0
            });
          }
          this.toastService.info('Cart cleared successfully.');
        }
      }),
      catchError(err => {
        this.loading.set(false);
        console.error('[CartService] clearCart error', err);
        const msg = err?.error?.Message || err?.error?.message || err?.message || 'Failed to clear cart.';
        this.toastService.error(msg);
        return throwError(() => err);
      })
    );
  }
}
