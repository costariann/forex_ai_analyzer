// Function to get the start of the month for a given date string
function getMonthStart(dateStr) {
  const date = new Date(dateStr);
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
}

// Function to aggregate monthly pivot points from candle data
function aggregateMonthlyPivotPoints(candles) {
  if (candles.length === 0) {
    console.error('No candles data to process');
    throw new Error('No data available for pivot calculation');
  }

  const monthlyPivots = {};
  let currentMonth = null;
  let monthHigh = -Infinity;
  let monthLow = Infinity;
  let monthClose = null;

  candles.forEach((candle) => {
    const monthStart = getMonthStart(candle.time);
    if (currentMonth !== monthStart) {
      if (
        currentMonth &&
        monthHigh !== -Infinity &&
        monthLow !== Infinity &&
        monthClose !== null
      ) {
        const pivot = (monthHigh + monthLow + monthClose) / 3;
        console.log(
          `Month ${currentMonth}: High=${monthHigh}, Low=${monthLow}, Close=${monthClose}, Pivot=${pivot}`
        );
        monthlyPivots[currentMonth] = {
          pivot: parseFloat(pivot.toFixed(5)),
          s2: parseFloat((2 * pivot - monthHigh).toFixed(5)),
          r2: parseFloat((2 * pivot - monthLow).toFixed(5)),
        };
      }
      currentMonth = monthStart;
      monthHigh = candle.high;
      monthLow = candle.low;
      monthClose = candle.close;
    } else {
      monthHigh = Math.max(monthHigh, candle.high);
      monthLow = Math.min(monthLow, candle.low);
      monthClose = candle.close;
    }
  });

  if (
    currentMonth &&
    monthHigh !== -Infinity &&
    monthLow !== Infinity &&
    monthClose !== null
  ) {
    const pivot = (monthHigh + monthLow + monthClose) / 3;
    console.log(
      `Month ${currentMonth}: High=${monthHigh}, Low=${monthLow}, Close=${monthClose}, Pivot=${pivot}`
    );
    monthlyPivots[currentMonth] = {
      pivot: parseFloat(pivot.toFixed(5)),
      s2: parseFloat((2 * pivot - monthHigh).toFixed(5)),
      r2: parseFloat((2 * pivot - monthLow).toFixed(5)),
    };
  }
  console.log('Monthly Pivots:', JSON.stringify(monthlyPivots, null, 2));
  return monthlyPivots;
}

export { getMonthStart, aggregateMonthlyPivotPoints };
