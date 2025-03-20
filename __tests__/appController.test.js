// __tests__/appController.test.js
import { getForexData } from '../src/controller/appController.js';
import fetch from 'node-fetch';

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('getForexData', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should fetch and process forex data correctly', async () => {
    const mockResponse = {
      status: 'ok',
      values: [
        {
          datetime: '2025-02-01',
          open: '1.0',
          high: '1.1',
          low: '0.9',
          close: '1.05',
        }, // Previous month
        {
          datetime: '2025-02-02',
          open: '1.05',
          high: '1.15',
          low: '1.0',
          close: '1.1',
        }, // Previous month
        {
          datetime: '2025-03-01',
          open: '1.1',
          high: '1.2',
          low: '1.0',
          close: '1.15',
        }, // Current month
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await getForexData(req, res);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.twelvedata.com/time_series')
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          time: expect.any(String),
          open: expect.any(Number),
          high: expect.any(Number),
          low: expect.any(Number),
          close: expect.any(Number),
        }),
      ])
    );
  });
});
