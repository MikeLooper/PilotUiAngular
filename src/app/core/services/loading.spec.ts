import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('isLoading', () => {
    it('is false when no requests are active', () => {
      const isLoading = service.isLoading();

      expect(isLoading).toBe(false);
    });
  });

  describe('requestStarted', () => {
    it('marks the service as loading', () => {
      service.requestStarted();

      expect(service.isLoading()).toBe(true);
    });
  });

  describe('requestFinished', () => {
    it('clears loading once every started request has finished', () => {
      service.requestStarted();
      service.requestStarted();

      service.requestFinished();
      const afterFirst = service.isLoading();
      service.requestFinished();

      expect(afterFirst).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('never lets the active request count drop below zero', () => {
      service.requestFinished();

      service.requestStarted();

      expect(service.isLoading()).toBe(true);
    });
  });
});
