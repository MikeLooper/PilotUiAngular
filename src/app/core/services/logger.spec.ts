import { TestBed } from '@angular/core/testing';

import { LoggerService } from './logger';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('info', () => {
    it('writes the message and details to console.info', () => {
      const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);

      service.info('Loaded', { count: 3 });

      expect(consoleInfo).toHaveBeenCalledExactlyOnceWith('Loaded', { count: 3 });
    });

    it('passes undefined details when none are given', () => {
      const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);

      service.info('Loaded');

      expect(consoleInfo).toHaveBeenCalledExactlyOnceWith('Loaded', undefined);
    });
  });

  describe('warn', () => {
    it('writes the message and details to console.warn', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      service.warn('Slow response', 1200);

      expect(consoleWarn).toHaveBeenCalledExactlyOnceWith('Slow response', 1200);
    });
  });

  describe('error', () => {
    it('writes the message and details to console.error', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const failure = new Error('boom');

      service.error('Request failed', failure);

      expect(consoleError).toHaveBeenCalledExactlyOnceWith('Request failed', failure);
    });
  });
});
