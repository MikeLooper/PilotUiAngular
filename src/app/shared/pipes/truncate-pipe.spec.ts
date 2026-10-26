import { TruncatePipe } from './truncate-pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  describe('transform', () => {
    it.each([
      { label: 'null', value: null },
      { label: 'undefined', value: undefined },
      { label: 'an empty string', value: '' },
    ])('returns an empty string for $label', ({ value }) => {
      const result = pipe.transform(value, 10);

      expect(result).toBe('');
    });

    it('returns the value unchanged when it is shorter than the maximum length', () => {
      const result = pipe.transform('Pilot', 10);

      expect(result).toBe('Pilot');
    });

    it('returns the value unchanged when it is exactly the maximum length', () => {
      const result = pipe.transform('0123456789', 10);

      expect(result).toBe('0123456789');
    });

    it('cuts the value at the maximum length and appends an ellipsis', () => {
      const result = pipe.transform('abcdefghijkl', 5);

      expect(result).toBe('abcde...');
    });

    it('trims trailing whitespace before appending the ellipsis', () => {
      const result = pipe.transform('This is a very long value', 8);

      expect(result).toBe('This is...');
    });

    it('defaults the maximum length to 80 characters', () => {
      const value = 'x'.repeat(81);

      const result = pipe.transform(value);

      expect(result).toBe(`${'x'.repeat(80)}...`);
    });
  });
});
