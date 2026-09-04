import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAppEnvironment } from './core/config/app-config';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorHandlingInterceptor } from './core/interceptors/error-handling-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { securityTokenInterceptor } from './core/interceptors/security-token-interceptor';
import { provideApiClient } from './api/providers/api-client.provider';
import { routes } from './app.routes';
import { environment } from '../environments/environment.development';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        securityTokenInterceptor,
        loadingInterceptor,
        errorHandlingInterceptor,
      ])
    ),
    provideAppEnvironment(environment),
    provideApiClient(),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
};
