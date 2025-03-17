console.log('Client side javascript file is loaded!');

// Debug library loading
console.log('LightweightCharts:', typeof LightweightCharts);
if (typeof LightweightCharts !== 'undefined') {
  console.log('LightweightCharts version:', LightweightCharts.version());
  console.log(
    'LightweightCharts.createChart:',
    typeof LightweightCharts.createChart
  );
} else {
  console.error('LightweightCharts not loaded!');
}

let chartInstance = null;
let candlestickSeries = null;

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

  console.log('Processed candles for chart:', JSON.stringify(candles, null, 2));
  console.log('First Processed Candle Date:', candles[0]?.time);
  console.log('Last Processed Candle Date:', candles[candles.length - 1]?.time);

  const chartElement = document.getElementById('chart');
  if (!chartElement) {
    console.error('Chart element not found!');
    return;
  }

  if (typeof LightweightCharts === 'undefined') {
    console.error('LightweightCharts library not loaded!');
    return;
  }

  if (chartInstance) {
    chartInstance.remove();
  }

  chartInstance = LightweightCharts.createChart(chartElement, {
    width: chartElement.clientWidth,
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
      borderColor: '#d1d4dc',
    },
    rightPriceScale: {
      borderColor: '#d1d4dc',
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
  });

  console.log('chartInstance:', chartInstance);
  console.log('chartInstance methods:', Object.keys(chartInstance));
  console.log(
    'chartInstance.addCandlestickSeries:',
    typeof chartInstance.addCandlestickSeries
  );

  if (typeof chartInstance.addCandlestickSeries !== 'function') {
    console.error('addCandlestickSeries is not available on chartInstance!');
    return;
  }

  candlestickSeries = chartInstance.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  });

  candlestickSeries.setData(candles);
  chartInstance.timeScale().fitContent();

  console.log('Chart initialized with', candles.length, 'candles');
}

async function updateChart() {
  const candles = await fetchCandles();
  if (candles.length === 0) {
    console.warn('No new candles data found');
    return;
  }

  if (candlestickSeries) {
    candlestickSeries.setData(candles);
    chartInstance.timeScale().fitContent();
    console.log('Chart updated with', candles.length, 'candles');
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
