import { isGuid, newGuid } from './guid';

const GUID = '7ea2c7f7-8b46-475d-86f8-7aaaa9e4a35b';

describe('guid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('isGuid', () => {
    it.each([GUID, GUID.toUpperCase()])('returns true for the GUID "%s"', (value) => {
      const result = isGuid(value);

      expect(result).toBe(true);
    });

    it.each(['not-a-guid', '', `${GUID}0`, null, undefined])(
      'returns false for the value %s',
      (value) => {
        const result = isGuid(value);

        expect(result).toBe(false);
      },
    );
  });

  describe('newGuid', () => {
    it('returns the value from crypto.randomUUID when it is available', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(GUID);

      const result = newGuid();

      expect(result).toBe(GUID);
    });

    it('builds a v4 GUID from random bytes when crypto.randomUUID is unavailable', () => {
      const getRandomValues = vi.fn(<T extends ArrayBufferView | null>(array: T): T => {
        (array as unknown as Uint8Array).fill(0xff);
        return array;
      });
      vi.stubGlobal('crypto', { getRandomValues });

      const result = newGuid();

      expect(result).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    });
  });
});
