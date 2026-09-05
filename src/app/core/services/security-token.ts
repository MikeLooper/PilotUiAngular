import { HttpBackend, HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, shareReplay, tap, finalize } from 'rxjs';
import { APP_ENV, SecurityTokenSecrets } from '../config/app-config';

interface SecurityTokenResponse {
  readonly access_token: string;
  readonly expires_in: number;
}

/** Refetch this many ms before the token's reported expiry, to avoid using an expired token. */
const EXPIRY_BUFFER_MS = 5000;

/** Static asset (see public/security-token-secrets.json), replaceable without a rebuild at deploy time. */
const SECRETS_URL = '/security-token-secrets.json';

/**
 * Fetches and caches a bearer token from the configured IDP using the OAuth2
 * resource-owner-password-credentials grant. Uses HttpBackend directly so
 * token requests bypass the app's own HTTP interceptors (they target a
 * different host and must never recurse into securityTokenInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class SecurityTokenService {
  private readonly env = inject(APP_ENV);
  private readonly http = new HttpClient(inject(HttpBackend));

  private cachedToken: string | null = null;
  private expiresAtMs = 0;
  private pendingRequest$: Observable<string | null> | null = null;

  public getToken(): Observable<string | null> {
    const config = this.env.securityToken;
    if (!config.active) {
      return of(null);
    }

    if (this.cachedToken && Date.now() < this.expiresAtMs) {
      return of(this.cachedToken);
    }

    if (!this.pendingRequest$) {
      this.pendingRequest$ = this.fetchToken().pipe(
        finalize(() => (this.pendingRequest$ = null)),
        shareReplay(1)
      );
    }

    return this.pendingRequest$;
  }

  private fetchToken(): Observable<string | null> {
    const config = this.env.securityToken;
    const tokenUrl = `${config.baseUrl.replace(/\/+$/, '')}/realms/${config.realm}/protocol/openid-connect/token`;

    return this.http.get<SecurityTokenSecrets>(SECRETS_URL).pipe(
      switchMap((secrets) => {
        const body = new HttpParams()
          .set('grant_type', 'password')
          .set('client_id', config.clientId)
          .set('username', secrets.username)
          .set('password', secrets.password);
        const headers = new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        });

        return this.http.post<SecurityTokenResponse>(tokenUrl, body, { headers });
      }),
      tap((response) => {
        this.cachedToken = response.access_token;
        this.expiresAtMs = Date.now() + response.expires_in * 1000 - EXPIRY_BUFFER_MS;
      }),
      map((response) => response.access_token),
      catchError((error: unknown) => {
        console.error('Failed to retrieve security token from the IDP.', error);
        this.cachedToken = null;
        this.expiresAtMs = 0;
        return of(null);
      })
    );
  }
}
