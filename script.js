const API_URL = 'https://app.astroport.fi/api/trpc/charts.prices';
const ATOM_TOKEN = "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9";
const UNTRN_TOKEN = "untrn";
// chart ref for atom price
const ctx = document.getElementById('atom-price-chart').getContext('2d');

// fetch chart data and display statistics after initial load
document.addEventListener("DOMContentLoaded", function () {
  fetchPriceData(API_URL, ATOM_TOKEN, UNTRN_TOKEN)
    .then(chartData => {
      renderPriceChart(ctx, chartData);
      displayStatistics(chartData);
    })
    .catch(error => {
      console.error('Error fetching or rendering data:', error);
    });
});

// fetch function to get price data
async function fetchPriceData(API_URL, ATOM_TOKEN, UNTRN_TOKEN) {
  const response = await fetch(API_URL + '?input=' + encodeURIComponent(JSON.stringify({
    json: {
      tokens: [ATOM_TOKEN, UNTRN_TOKEN],
      chainId: "neutron-1",
      dateRange: "D7"
    }
  })));
  if (!response.ok) {
    throw new Error('Failed to fetch price data');
  }
  return response.json();
}

// function to display information for price including Min/Max, Average
function displayStatistics(chartData) {
  const ibcData = chartData.result.data.json[ATOM_TOKEN].series;
  const untrnData = chartData.result.data.json[UNTRN_TOKEN].series;

  const ibcStats = calculateStats(ibcData);
  const untrnStats = calculateStats(untrnData);

  // Display statistics
  document.getElementById('statistics').innerHTML = `
    <h5>$ATOM Token Statistics</h5>
    <p>Max / Min Price: ${ibcStats.maxPrice} / ${ibcStats.minPrice}</p>
    <p>Average Price: ${ibcStats.averagePrice}</p>
    <h5>$NTRN Token Statistics</h5>
    <p>Max / Min Price: ${untrnStats.maxPrice} / ${untrnStats.minPrice}</p>
    <p>Average Price: ${untrnStats.averagePrice}</p>
  `;
}

function calculateStats(data) {
  let totalPrice = 0;
  let maxPrice = Number.MIN_SAFE_INTEGER;
  let minPrice = Number.MAX_SAFE_INTEGER;

  data.forEach(item => {
    totalPrice += item.value;
    maxPrice = Math.max(maxPrice, item.value);
    minPrice = Math.min(minPrice, item.value);
  });

  const averagePrice = totalPrice / data.length;
  return {
    averagePrice: averagePrice.toFixed(2),
    maxPrice: maxPrice.toFixed(2),
    minPrice: minPrice.toFixed(2)
  };
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp * 1000);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const currentTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${month} ${day} ${currentTime}`;
}

// render function to render line chart
function renderPriceChart(ctx, chartData) {
  const ibcData = chartData.result.data.json[ATOM_TOKEN].series;
  const untrnData = chartData.result.data.json[UNTRN_TOKEN].series;

  const labels = ibcData.map(item => formatDateTime(item.time));
  const ibcValues = ibcData.map(item => item.value);
  const untrnValues = untrnData.map(item => item.value);

  // Draw the bar chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '$ATOM Token',
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        data: ibcValues,
      }, {
        label: '$NTRN Token',
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        data: untrnValues,
      }]
    },
    options: {
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM DD'
            }
          },
          scaleLabel: {
            display: true,
            labelString: 'Time'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Price'
          },
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });
}
