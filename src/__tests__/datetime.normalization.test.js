const { normalizeDatetime, getHourMinuteInTZ, isOutsideBusinessHoursTZ } = require('../utils/datetime.utils');

describe('Datetime normalization (date-only inputs)', () => {
  test('start date-only normalized to 09:00 Africa/Casablanca within business hours', () => {
    const iso = normalizeDatetime('2025-01-15', true);
    expect(typeof iso).toBe('string');
    const { hour } = getHourMinuteInTZ(iso, 'Africa/Casablanca');
    expect(isNaN(hour)).toBe(false);
    expect(isOutsideBusinessHoursTZ(iso)).toBe(false);
  });

  test('end date-only normalized to 17:00 Africa/Casablanca within business hours', () => {
    const iso = normalizeDatetime('2025-01-15', false);
    expect(typeof iso).toBe('string');
    const { hour } = getHourMinuteInTZ(iso, 'Africa/Casablanca');
    expect(isNaN(hour)).toBe(false);
    expect(isOutsideBusinessHoursTZ(iso)).toBe(false);
  });

  test('preserve provided time if present', () => {
    const iso = normalizeDatetime('2025-01-15T12:30:00', true);
    const { hour } = getHourMinuteInTZ(iso, 'Africa/Casablanca');
    expect(isNaN(hour)).toBe(false);
  });
});

