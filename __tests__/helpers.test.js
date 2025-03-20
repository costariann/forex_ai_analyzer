import {
  getMonthStart,
  aggregateMonthlyPivotPoints,
} from '../src/utils/helpers.js';

describe('getMonthStart', () => {
  test('should return the start of the month for a given date string', () => {
    const dateStr = '2023-10-15T12:00:00Z';
    const result = getMonthStart(dateStr);
    expect(result).toBe('2023-10-01');
  });
});

describe('aggregateMonthlyPivotPoints', () => {
  test('should aggregate monthly pivot points correctly', () => {
    const candles = [
      { time: '2023-10-01T00:00:00Z', high: 1.2, low: 1.1, close: 1.15 },
      { time: '2023-10-02T00:00:00Z', high: 1.25, low: 1.05, close: 1.2 },
    ];

    const result = aggregateMonthlyPivotPoints(candles);
    expect(result).toEqual({
      '2023-10-01': {
        pivot: expect.any(Number),
        s2: expect.any(Number),
        r2: expect.any(Number),
      },
    });
  });
});
