console.log('Client side javascript file is loaded!');

let chartInstance = null; // Store chart instance for updates

async function fetchCandles() {
  try {
    const response = await fetch('/api/forex');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
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

  console.log('Candles data:', candles);

  const ctx = document.getElementById('chart').getContext('2d');

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'candlestick',
    data: {
      datasets: [
        {
          label: 'EUR/USD Daily',
          data: candles.map((candle) => ({
            x: new Date(candle.time),
            o: candle.open,
            h: candle.high,
            l: candle.low,
            c: candle.close,
          })),
          borderColor: {
            up: 'green', // Green for upward candles
            down: 'red', // Red for downward candles
            unchanged: 'gray',
          },
          color: {
            up: 'rgba(0, 255, 0, 0.5)', // Semi-transparent green fill
            down: 'rgba(255, 0, 0, 0.5)', // Semi-transparent red fill
            unchanged: 'rgba(128, 128, 128, 0.5)',
          },
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM d',
            },
          },
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Price (USD)',
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              const candle = context.raw;
              return `Open: ${candle.o}, High: ${candle.h}, Low: ${candle.l}, Close: ${candle.c}`;
            },
          },
        },
      },
    },
  });
}

// Real-time update function
async function updateChart() {
  const candles = await fetchCandles();
  if (candles.length === 0) {
    console.warn('No new candles data found');
    return;
  }

  if (chartInstance) {
    chartInstance.data.datasets[0].data = candles.map((candle) => ({
      x: new Date(candle.time),
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
    }));
    chartInstance.update();
  }
}

// Initial chart load
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  // Update every 10 seconds for near real-time
  setInterval(updateChart, 10000);
});
