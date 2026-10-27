import { TestBed } from '@angular/core/testing';

import { LoggerService } from '../services/logger';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let logger: Pick<LoggerService, 'error'>;

  beforeEach(() => {
    logger = { error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler, { provide: LoggerService, useValue: logger }],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  it('creates the handler', () => {
    expect(handler).toBeTruthy();
  });

  describe('handleError', () => {
    it('logs the error through the logger', () => {
      const error = new Error('boom');

      handler.handleError(error);

      expect(logger.error).toHaveBeenCalledExactlyOnceWith('Unhandled application error', error);
    });

    it('logs non-Error values unchanged', () => {
      const error = { reason: 'unknown' };

      handler.handleError(error);

      expect(logger.error).toHaveBeenCalledExactlyOnceWith('Unhandled application error', error);
    });
  });
});
