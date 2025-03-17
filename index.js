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
    const [fromSymbol, toSymbol] = symbol.split('/');

    const apiKey = config.alphaVantageApiKey;
    console.log('API Key:', apiKey);
    const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&apikey=${apiKey}&outputsize=compact`;

    console.log('API URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Alpha Vantage API request failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    const timeSeries = data['Time Series FX (Daily)'];
    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      throw new Error('No time series data in response');
    }

    const candles = Object.entries(timeSeries)
      .map(([time, values]) => ({
        time,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
      }))
      .sort((a, b) => new Date(a.time) - new Date(b.time)) // Sort ascending for chart
      .slice(0, 50);

    res.json(candles);
  } catch (error) {
    console.error('API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log('Server is running on port 3005');
});

export default app;
