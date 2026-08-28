import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ApiClient, ApiFnOptional, ApiFnRequired } from '../generated/api-client';
import { StrictHttpResponse } from '../generated/strict-http-response';

const DOMAIN_API_VERSION_SEGMENT = 'v1';

/**
 * Invokes domain resource endpoints (categories, customers, etc.) under a
 * versioned `v1/` path segment, while sharing the same root URL that
 * DataSourceService keeps in sync on the underlying ApiClient. System
 * endpoints (about, healthcheck) go through ApiClient directly and stay
 * unversioned.
 */
@Injectable({ providedIn: 'root' })
export class DomainApiClient {
  private readonly apiClient = inject(ApiClient);
  private readonly http = inject(HttpClient);

  private get rootUrl(): string {
    return `${this.apiClient.rootUrl.replace(/\/+$/, '')}/${DOMAIN_API_VERSION_SEGMENT}`;
  }

  invoke<P, R>(fn: ApiFnRequired<P, R>, params: P, context?: HttpContext): Observable<R>;
  invoke<P, R>(fn: ApiFnOptional<P, R>, params?: P, context?: HttpContext): Observable<R>;
  invoke<P, R>(fn: ApiFnRequired<P, R> | ApiFnOptional<P, R>, params: P, context?: HttpContext): Observable<R> {
    return this.invoke$Response(fn, params, context).pipe(map((r) => r.body));
  }

  invoke$Response<P, R>(fn: ApiFnRequired<P, R>, params: P, context?: HttpContext): Observable<StrictHttpResponse<R>>;
  invoke$Response<P, R>(fn: ApiFnOptional<P, R>, params?: P, context?: HttpContext): Observable<StrictHttpResponse<R>>;
  invoke$Response<P, R>(fn: ApiFnRequired<P, R> | ApiFnOptional<P, R>, params: P, context?: HttpContext): Observable<StrictHttpResponse<R>> {
    return fn(this.http, this.rootUrl, params, context).pipe(
      filter((r): r is HttpResponse<any> => r instanceof HttpResponse),
      map((r) => r as StrictHttpResponse<R>)
    );
  }
}
