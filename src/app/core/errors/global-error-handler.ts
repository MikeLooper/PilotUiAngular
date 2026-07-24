import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../services/logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  public handleError(error: unknown): void {
    this.logger.error('Unhandled application error', error);
  }
}
