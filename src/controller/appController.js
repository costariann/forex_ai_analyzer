// src/controller/appController.js
import fetch from 'node-fetch';
import config from '../config/config.js';
import {
  getMonthStart,
  aggregateMonthlyPivotPoints,
} from '../utils/helpers.js';

async function getForexData(req, res) {
  try {
    const symbol = 'EUR/USD';
    const apiKey = config.twelvedataApiKey;
    console.log('API Key:', apiKey);

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=365&apikey=${apiKey}`;
    console.log('API URL:', url);

    const response = await fetch(url);
    console.log('Raw API Response Status:', response.status);
    console.log('Raw API Response Headers:', response.headers);
    const data = await response.json();
    console.log('Raw API Response Data:', JSON.stringify(data, null, 2));
    if (!response.ok) {
      throw new Error(`Twelve Data API request failed: ${response.statusText}`);
    }

    if (data.status !== 'ok' || !data.values || data.values.length === 0) {
      throw new Error(
        'No time series data in response or invalid API response'
      );
    }

    const rawCandles = data.values
      .map((candle) => ({
        time: candle.datetime,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }))
      .reverse();

    if (rawCandles.length === 0) {
      throw new Error('No raw candles after mapping');
    }

    const adjustedCandles = rawCandles.map((candle, index, array) => {
      const openRaw = candle.open;
      const high = candle.high;
      const low = candle.low;
      const closeRaw = candle.close;
      const diffRaw = Math.abs(openRaw - closeRaw);
      let adjustedOpen = openRaw;
      let adjustedClose = closeRaw;

      if (diffRaw <= 0.0001) {
        const adjustment = 0.00005;
        if (closeRaw >= openRaw) {
          adjustedOpen = openRaw - adjustment;
          adjustedClose = closeRaw + adjustment;
        } else {
          adjustedOpen = openRaw + adjustment;
          adjustedClose = closeRaw - adjustment;
        }
        adjustedOpen = Math.max(low, Math.min(high, adjustedOpen));
        adjustedClose = Math.max(low, Math.min(high, adjustedClose));
      }
      return {
        ...candle,
        open: parseFloat(adjustedOpen.toFixed(5)),
        close: parseFloat(adjustedClose.toFixed(5)),
      };
    });

    console.log(
      'Adjusted Candles Sample:',
      JSON.stringify(adjustedCandles.slice(0, 5), null, 2)
    );

    const monthlyPivots = aggregateMonthlyPivotPoints(adjustedCandles);

    // Get the previous month (February 2025)
    const currentDate = new Date();
    currentDate.setUTCDate(1); // Start of current month (March 2025)
    currentDate.setUTCMonth(currentDate.getUTCMonth() - 1); // Previous month (February 2025)
    const previousMonthStart = getMonthStart(currentDate.toISOString());
    const previousMonthPivot = monthlyPivots[previousMonthStart] || {
      pivot: null,
      s2: null,
      r2: null,
    };
    if (!previousMonthPivot.pivot) {
      throw new Error('No pivot data available for previous month');
    }

    const fixedPivot = previousMonthPivot.pivot;
    const fixedS2 = previousMonthPivot.s2;
    const fixedR2 = previousMonthPivot.r2;

    const candlesWithPivots = adjustedCandles
      .map((candle) => {
        const monthStart = getMonthStart(candle.time);
        const isCurrentMonth =
          monthStart === getMonthStart(new Date().toISOString());

        if (!isCurrentMonth) {
          return {
            ...candle,
            monthlyPivot: null,
            m1: null,
            m2: null,
            m3: null,
            m4: null,
            s1: null,
            s2: null,
            r1: null,
            r2: null,
            entryBullishTrending: null,
            targetBullishTrending1: null,
            targetBullishTrending2: null,
            entryBearishTrending: null,
            targetBearishTrending1: null,
            targetBearishTrending2: null,
            entryBullishRanging: null,
            targetBullishRanging: null,
            entryBearishRanging: null,
            targetBearishRanging: null,
          };
        }

        const s1 = (fixedS2 + fixedPivot) / 2;
        const r1 = (fixedPivot + fixedR2) / 2;
        const m1 = (s1 + fixedS2) / 2;
        const m2 = (fixedPivot + s1) / 2;
        const m3 = (r1 + fixedR2) / 2;
        const m4 = (fixedPivot + r1) / 2;

        const entryBullishTrending = fixedPivot - m2;
        const targetBullishTrending1 = m4;
        const targetBullishTrending2 = fixedR2;
        const entryBearishTrending = fixedPivot - m3;
        const targetBearishTrending1 = m1;
        const targetBearishTrending2 = fixedS2;
        const entryBullishRanging = s1;
        const targetBullishRanging = r1;
        const entryBearishRanging = r1;
        const targetBearishRanging = s1;

        return {
          ...candle,
          monthlyPivot: fixedPivot,
          s1: parseFloat(s1.toFixed(5)),
          s2: parseFloat(fixedS2.toFixed(5)),
          r1: parseFloat(r1.toFixed(5)),
          r2: parseFloat(fixedR2.toFixed(5)),
          m1: parseFloat(m1.toFixed(5)),
          m2: parseFloat(m2.toFixed(5)),
          m3: parseFloat(m3.toFixed(5)),
          m4: parseFloat(m4.toFixed(5)),
          entryBullishTrending: parseFloat(entryBullishTrending.toFixed(5)),
          targetBullishTrending1: parseFloat(targetBullishTrending1.toFixed(5)),
          targetBullishTrending2: parseFloat(targetBullishTrending2.toFixed(5)),
          entryBearishTrending: parseFloat(entryBearishTrending.toFixed(5)),
          targetBearishTrending1: parseFloat(targetBearishTrending1.toFixed(5)),
          targetBearishTrending2: parseFloat(targetBearishTrending2.toFixed(5)),
          entryBullishRanging: parseFloat(entryBullishRanging.toFixed(5)),
          targetBullishRanging: parseFloat(targetBullishRanging.toFixed(5)),
          entryBearishRanging: parseFloat(entryBearishRanging.toFixed(5)),
          targetBearishRanging: parseFloat(targetBearishRanging.toFixed(5)),
        };
      })
      .slice(-200);

    candlesWithPivots.forEach((candle, index) => {
      const diff = Math.abs(candle.open - candle.close);
      const direction =
        candle.close > candle.open
          ? 'Bullish'
          : candle.close < candle.open
          ? 'Bearish'
          : 'Neutral';
      console.log(
        `Candle ${index + 1} (${candle.time}): Open=${candle.open}, Close=${
          candle.close
        }, Diff=${diff.toFixed(5)}, Direction=${direction}, Monthly Pivot=${
          candle.monthlyPivot
        }, S1=${candle.s1}, S2=${candle.s2}, R1=${candle.r1}, R2=${
          candle.r2
        }, M1=${candle.m1}, M2=${candle.m2}, M3=${candle.m3}, M4=${candle.m4}`
      );
    });

    console.log(
      'Sorted Candles with Monthly Pivots Sample:',
      JSON.stringify(candlesWithPivots.slice(0, 5), null, 2)
    );
    console.log('First Candle Date:', candlesWithPivots[0].time);
    console.log(
      'Last Candle Date:',
      candlesWithPivots[candlesWithPivots.length - 1].time
    );
    res.json(candlesWithPivots);
  } catch (error) {
    console.error('API error:', error.message);
    if (
      error.message.includes('rate limit') ||
      error.message.includes('invalid key')
    ) {
      res.status(429).json({
        error:
          'Twelve Data API rate limit reached or invalid key. Please check your API key or wait.',
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

export { getForexData };
