import { TruncatePipe } from './truncate-pipe';

describe('TruncatePipe', () => {
  it('returns original value when below max length', () => {
    const pipe = new TruncatePipe();
    expect(pipe.transform('Pilot', 10)).toBe('Pilot');
  });

  it('truncates values above max length', () => {
    const pipe = new TruncatePipe();
    expect(pipe.transform('This is a very long value', 8)).toBe('This is...');
  });
});
