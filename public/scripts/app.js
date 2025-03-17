console.log('Client side javascript file is loaded!');

let chartInstance = null;

async function fetchCandles() {
  try {
    const response = await fetch('/api/forex');
    console.log('Fetch response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Raw fetched data:', JSON.stringify(data, null, 2));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching candles:', error);
    return [];
  }
}

async function initChart() {
  const candles = await fetchCandles();
  if (candles.length === 0) {
    console.warn('No candles data found');
    return;
  }

  const processedCandles = candles.map((candle) => ({
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));

  console.log(
    'Processed candles for chart:',
    JSON.stringify(processedCandles, null, 2)
  );
  console.log('First Processed Candle Date:', processedCandles[0]?.time);
  console.log(
    'Last Processed Candle Date:',
    processedCandles[processedCandles.length - 1]?.time
  );

  const ctx = document.getElementById('chart');
  if (chartInstance) {
    chartInstance.remove();
  }

  chartInstance = LightweightCharts.createChart(ctx, {
    width: ctx.clientWidth,
    height: 600,
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333',
    },
    grid: {
      vertLines: { color: '#e1e1e1' },
      horzLines: { color: '#e1e1e1' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
  });

  const candlestickSeries = chartInstance.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  candlestickSeries.setData(processedCandles);
  chartInstance.timeScale().fitContent();

  console.log('Chart initialized with', processedCandles.length, 'candles');
}

async function updateChart() {
  const candles = await fetchCandles();
  if (candles.length === 0) {
    console.warn('No new candles data found');
    return;
  }

  const processedCandles = candles.map((candle) => ({
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));

  if (chartInstance) {
    const candlestickSeries = chartInstance.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(processedCandles);
    chartInstance.timeScale().fitContent();
    console.log('Chart updated with', processedCandles.length, 'candles');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  setInterval(updateChart, 3600000); // 1 hour
});

window.addEventListener('resize', () => {
  if (chartInstance) {
    chartInstance.resize(document.getElementById('chart').clientWidth, 600);
  }
});
