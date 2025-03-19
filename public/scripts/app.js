console.log('Client side javascript file is loaded!');

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

function getMonthStart(dateStr) {
  const date = new Date(dateStr);
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

const currentMonthStart = getMonthStart(new Date().toISOString());

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
      barSpacing: 12,
      minBarSpacing: 6,
    },
    rightPriceScale: {
      borderColor: '#d1d4dc',
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
      minimumPriceStep: 0.00001,
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
    },
  });

  if (typeof chartInstance.addCandlestickSeries === 'function') {
    candlestickSeries = chartInstance.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });
  } else if (typeof chartInstance.addSeries === 'function') {
    console.warn('Falling back to addSeries for candlestick');
    candlestickSeries = chartInstance.addSeries({
      type: 'Candlestick',
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });
  } else {
    console.error('Neither addCandlestickSeries nor addSeries is available!');
    return;
  }

  candlestickSeries.setData(candles);
  updatePivotText(candles);
  chartInstance.timeScale().fitContent();

  console.log('Chart initialized with', candles.length, 'candles');
}

function updatePivotText(candles) {
  const currentMonthCandle = candles.find(
    (c) => getMonthStart(c.time) === currentMonthStart
  );
  if (!currentMonthCandle || currentMonthCandle.monthlyPivot === null) {
    console.warn('No valid candle for current month or pivot data missing');
    return;
  }

  // Create or update a container for pivot text below the chart
  let pivotTextContainer = document.getElementById('pivot-text');
  if (!pivotTextContainer) {
    pivotTextContainer = document.createElement('div');
    pivotTextContainer.id = 'pivot-text';
    pivotTextContainer.style.position = 'absolute';
    pivotTextContainer.style.bottom = '10px'; // Position below the chart
    pivotTextContainer.style.left = '50%'; // Center horizontally
    pivotTextContainer.style.transform = 'translateX(-50%)'; // Adjust for centering
    pivotTextContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    pivotTextContainer.style.color = 'white';
    pivotTextContainer.style.padding = '10px';
    pivotTextContainer.style.borderRadius = '5px';
    pivotTextContainer.style.fontSize = '12px'; // Adjust font size for readability
    pivotTextContainer.style.whiteSpace = 'nowrap'; // Prevent text wrapping
    document.body.appendChild(pivotTextContainer);
  } else {
    pivotTextContainer.innerHTML = '';
  }

  // Append pivot levels as text
  const levels = [
    { key: 'monthlyPivot', label: 'Pivot Point (PP)' },
    { key: 's1', label: 'Support 1 (S1)' },
    { key: 's2', label: 'Support 2 (S2)' },
    { key: 'm1', label: 'Midpoint 1 (M1)' },
    { key: 'm2', label: 'Midpoint 2 (M2)' },
    { key: 'r1', label: 'Resistance 1 (R1)' },
    { key: 'r2', label: 'Resistance 2 (R2)' },
    { key: 'm3', label: 'Midpoint 3 (M3)' },
    { key: 'm4', label: 'Midpoint 4 (M4)' },
  ];

  levels.forEach((level) => {
    const value = currentMonthCandle[level.key];
    if (value !== null) {
      const p = document.createElement('p');
      p.textContent = `${level.label}: ${value}`;
      p.style.margin = '2px 0'; // Add spacing between lines
      pivotTextContainer.appendChild(p);
    }
  });

  // Add entry and target indicators
  const prevCandle = candles[candles.length - 2];
  if (currentMonthCandle.monthlyPivot && prevCandle) {
    const bullishEntry = currentMonthCandle.entryBullishTrending;
    const bullishTarget1 = currentMonthCandle.targetBullishTrending1;
    const bullishTarget2 = currentMonthCandle.targetBullishTrending2;
    const bearishEntry = currentMonthCandle.entryBearishTrending;
    const bearishTarget1 = currentMonthCandle.targetBearishTrending1;
    const bearishTarget2 = currentMonthCandle.targetBearishTrending2;

    if (
      currentMonthCandle.close > bullishEntry &&
      prevCandle.close <= bullishEntry
    ) {
      const p = document.createElement('p');
      p.textContent = `Bullish Entry: ${bullishEntry}`;
      p.style.color = '#00FF00';
      p.style.margin = '2px 0';
      pivotTextContainer.appendChild(p);
      const t1 = document.createElement('p');
      t1.textContent = `Bullish Target 1: ${bullishTarget1}`;
      t1.style.color = '#00FF00';
      t1.style.margin = '2px 0';
      pivotTextContainer.appendChild(t1);
      const t2 = document.createElement('p');
      t2.textContent = `Bullish Target 2: ${bullishTarget2}`;
      t2.style.color = '#00FF00';
      t2.style.margin = '2px 0';
      pivotTextContainer.appendChild(t2);
    }

    if (
      currentMonthCandle.close < bearishEntry &&
      prevCandle.close >= bearishEntry
    ) {
      const p = document.createElement('p');
      p.textContent = `Bearish Entry: ${bearishEntry}`;
      p.style.color = '#FF0000';
      p.style.margin = '2px 0';
      pivotTextContainer.appendChild(p);
      const t1 = document.createElement('p');
      t1.textContent = `Bearish Target 1: ${bearishTarget1}`;
      t1.style.color = '#FF0000';
      t1.style.margin = '2px 0';
      pivotTextContainer.appendChild(t1);
      const t2 = document.createElement('p');
      t2.textContent = `Bearish Target 2: ${bearishTarget2}`;
      t2.style.color = '#FF0000';
      t2.style.margin = '2px 0';
      pivotTextContainer.appendChild(t2);
    }

    // Ranging market signals
    const bullishRangingEntry = currentMonthCandle.entryBullishRanging;
    const bullishRangingTarget = currentMonthCandle.targetBullishRanging;
    const bearishRangingEntry = currentMonthCandle.entryBearishRanging;
    const bearishRangingTarget = currentMonthCandle.targetBearishRanging;

    if (
      currentMonthCandle.close > bullishRangingEntry &&
      prevCandle.close <= bullishRangingEntry
    ) {
      const p = document.createElement('p');
      p.textContent = `Bullish Ranging Entry: ${bullishRangingEntry}`;
      p.style.color = '#00FF00';
      p.style.margin = '2px 0';
      pivotTextContainer.appendChild(p);
      const t = document.createElement('p');
      t.textContent = `Bullish Ranging Target: ${bullishRangingTarget}`;
      t.style.color = '#00FF00';
      t.style.margin = '2px 0';
      pivotTextContainer.appendChild(t);
    }

    if (
      currentMonthCandle.close < bearishRangingEntry &&
      prevCandle.close >= bearishRangingEntry
    ) {
      const p = document.createElement('p');
      p.textContent = `Bearish Ranging Entry: ${bearishRangingEntry}`;
      p.style.color = '#FF0000';
      p.style.margin = '2px 0';
      pivotTextContainer.appendChild(p);
      const t = document.createElement('p');
      t.textContent = `Bearish Ranging Target: ${bearishRangingTarget}`;
      t.style.color = '#FF0000';
      t.style.margin = '2px 0';
      pivotTextContainer.appendChild(t);
    }
  }
}

async function updateChart() {
  const candles = await fetchCandles();
  if (candles.length === 0) {
    console.warn('No new candles data found');
    return;
  }

  if (candlestickSeries) {
    candlestickSeries.setData(candles);
    updatePivotText(candles);
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
