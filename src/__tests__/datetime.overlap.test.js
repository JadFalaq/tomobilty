const { validateBookingDates, datesOverlap } = require('../utils/booking.utils');
const { InvalidBookingDatesError } = require('../errors/booking.errors');

describe('Datetime validation and strict overlap', () => {
  test('end == start should be rejected', () => {
    const start = new Date('2025-01-10T12:00:00');
    const end = new Date('2025-01-10T12:00:00');
    expect(() => validateBookingDates(start, end)).toThrow(InvalidBookingDatesError);
  });

  test('Overlap strict: B starts at A end -> overlap (blocked)', () => {
    const aStart = new Date('2025-01-10T10:00:00');
    const aEnd = new Date('2025-01-10T12:00:00');
    const bStart = new Date('2025-01-10T12:00:00');
    const bEnd = new Date('2025-01-10T13:00:00');
    expect(datesOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
  });

  test('Overlap strict: B starts after A end -> no overlap (allowed)', () => {
    const aStart = new Date('2025-01-10T10:00:00');
    const aEnd = new Date('2025-01-10T12:00:00');
    const bStart = new Date('2025-01-10T12:01:00');
    const bEnd = new Date('2025-01-10T13:00:00');
    expect(datesOverlap(aStart, aEnd, bStart, bEnd)).toBe(false);
  });
});

