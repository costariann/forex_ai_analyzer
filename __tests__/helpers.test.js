import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateMonthlyPivotPoints } from '../src/utils/helpers.js';

describe('Helpers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should calculate monthly pivot points correctly', () => {
    const candles = [
      {
        time: '2025-02-01',
        open: 1.0,
        high: 1.1,
        low: 0.9,
        close: 1.05,
      },
      {
        time: '2025-02-02',
        open: 1.05,
        high: 1.15,
        low: 1.0,
        close: 1.1,
      },
      {
        time: '2025-03-01',
        open: 1.1,
        high: 1.2,
        low: 1.0,
        close: 1.15,
      },
    ];

    const result = aggregateMonthlyPivotPoints(candles);

    const febHigh = 1.15;
    const febLow = 0.9;
    const febClose = 1.1;
    const febPivot = (febHigh + febLow + febClose) / 3;
    expect(result['2025-02-01'].pivot).toBeCloseTo(febPivot, 5);
    const febS2 = 2 * febPivot - 1.15;
    const febR2 = 2 * febPivot - 0.9;
    expect(result['2025-02-01'].s2).toBeCloseTo(febS2, 5);
    expect(result['2025-02-01'].r2).toBeCloseTo(febR2, 5);

    const marchPivot = (1.2 + 1.0 + 1.15) / 3;
    expect(result['2025-03-01'].pivot).toBeCloseTo(marchPivot, 5);
    const marchS2 = 2 * marchPivot - 1.2;
    const marchR2 = 2 * marchPivot - 1.0;
    expect(result['2025-03-01'].s2).toBeCloseTo(marchS2, 5);
    expect(result['2025-03-01'].r2).toBeCloseTo(marchR2, 5);
  });

  test('should throw an error if no candles are provided', () => {
    const candles = [];

    expect(() => aggregateMonthlyPivotPoints(candles)).toThrow(
      'No data available for pivot calculation'
    );
  });
});
