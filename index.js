import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import appRoutes from './src/routes/appRoutes.js';
import fetch from 'node-fetch';
import config from './src/config/config.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Serving static files from:', path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));

app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/', appRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/forex', async (req, res) => {
  try {
    const symbol = 'EUR/USD';
    const apiKey = config.twelvedataApiKey;
    console.log('API Key:', apiKey);

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=50&apikey=${apiKey}`;
    console.log('API URL:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.status !== 'ok' || !data.values || data.values.length === 0) {
      throw new Error(
        'No time series data in response or invalid API response'
      );
    }

    // Twelve Data returns data in descending order (newest first), so reverse to get ascending order
    const candles = data.values
      .map((candle) => {
        const openRaw = parseFloat(candle.open);
        const high = parseFloat(candle.high);
        const low = parseFloat(candle.low);
        const closeRaw = parseFloat(candle.close);
        const diffRaw = Math.abs(openRaw - closeRaw);
        let adjustedOpen = openRaw;
        let adjustedClose = closeRaw;

        // Adjust only if the difference is negligible
        if (diffRaw <= 0.0001) {
          const adjustment = 0.00005; // Small adjustment for visible body
          if (closeRaw >= openRaw) {
            // Bullish or neutral, ensure close > open
            adjustedOpen = openRaw - adjustment;
            adjustedClose = closeRaw + adjustment;
          } else {
            // Bearish, ensure close < open
            adjustedOpen = openRaw + adjustment;
            adjustedClose = closeRaw - adjustment;
          }
          // Ensure adjusted values stay within high/low range
          adjustedOpen = Math.max(low, Math.min(high, adjustedOpen));
          adjustedClose = Math.max(low, Math.min(high, adjustedClose));
        }

        return {
          time: candle.datetime,
          open: parseFloat(adjustedOpen.toFixed(5)),
          high: parseFloat(high.toFixed(5)),
          low: parseFloat(low.toFixed(5)),
          close: parseFloat(adjustedClose.toFixed(5)),
        };
      })
      .reverse() // Reverse to get oldest to newest
      .slice(0, 200); // Take the 50 most recent candles

    // Log the open-close difference and direction for debugging
    candles.forEach((candle, index) => {
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
        }, Diff=${diff.toFixed(5)}, Direction=${direction}, High-Low Range=${(
          candle.high - candle.low
        ).toFixed(5)}`
      );
    });

    console.log('Sorted Candles:', JSON.stringify(candles, null, 2));
    console.log('First Candle Date:', candles[0].time);
    console.log('Last Candle Date:', candles[candles.length - 1].time);
    res.json(candles);
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
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log('Server is running on port 3005');
});

export default app;
