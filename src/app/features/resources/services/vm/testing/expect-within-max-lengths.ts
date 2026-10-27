/**
 * Asserts that each string field named in `maxLengths` fits the length limit declared for it
 * in the OpenAPI spec (PilotApi_v1.yaml). Fields that are absent or not strings are skipped.
 */
export function expectWithinMaxLengths(
  dto: object,
  maxLengths: Readonly<Record<string, number>>,
): void {
  const fields = dto as Record<string, unknown>;
  for (const [field, maxLength] of Object.entries(maxLengths)) {
    const value = fields[field];
    if (typeof value === 'string') {
      expect(value.length, `${field} length`).toBeLessThanOrEqual(maxLength);
    }
  }
}
