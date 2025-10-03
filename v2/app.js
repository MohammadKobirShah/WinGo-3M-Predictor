const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

const fetchBtn = document.getElementById('fetchBtn');
const historyEl = document.getElementById('history');
const predSizeEl = document.getElementById('predSize');
const predColorEl = document.getElementById('predColor');
const predNumbersEl = document.getElementById('predNumbers');

let bigSmallChart, colorChart, numberChart;

fetchBtn.addEventListener('click', fetchAndPredict);

async function fetchAndPredict() {
  fetchBtn.disabled = true;
  fetchBtn.textContent = '⏳ Loading...';

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const draws = data.data.list;

    let big = 0, small = 0;
    const colorCount = { green: 0, red: 0, violet: 0 };
    const numbers = [];

    // Analyze last 10 draws
    const recentDraws = draws.slice(0, 10);
    recentDraws.forEach(draw => {
      const num = parseInt(draw.number);
      numbers.push(num);
      if (num >= 5) big++; else small++;

      draw.color.split(',').forEach(c => {
        const color = c.trim();
        if (colorCount[color] !== undefined) colorCount[color]++;
      });
    });

    // Determine trend
    const prediction = {
      size: big >= small ? "Big" : "Small",
      color: Object.keys(colorCount).reduce((a, b) => colorCount[a] > colorCount[b] ? a : b),
      likelyNumbers: numbers.sort((a,b) =>
        numbers.filter(v => v===a).length - numbers.filter(v => v===b).length
      ).reverse().slice(0, 3)
    };

    // Render history list
    historyEl.innerHTML = '';
    recentDraws.forEach(d => {
      const num = parseInt(d.number);
      const sizeClass = num >= 5 ? 'big' : 'small';

      const colorBadges = d.color.split(',').map(c => {
        c = c.trim();
        return `<span class="badge ${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</span>`;
      }).join(' ');

      const li = document.createElement('li');
      li.innerHTML = `
        <span class="number">${num}</span> ${colorBadges}
        <span>Issue: #${d.issueNumber}</span>
      `;
      historyEl.appendChild(li);
    });

    // Render prediction
    predSizeEl.textContent = prediction.size;
    predColorEl.textContent = prediction.color;
    predColorEl.className = `color-box ${prediction.color}`;
    predNumbersEl.textContent = prediction.likelyNumbers.join(', ');

    // Draw charts
    drawBigSmallChart(big, small);
    drawColorChart(colorCount);
    drawNumberChart(numbers);

  } catch(err) {
    alert('Failed to fetch or process data: ' + err.message);
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = '🔄 Fetch & Predict';
  }
}

function drawBigSmallChart(big, small) {
  const ctx = document.getElementById('bigSmallChart').getContext('2d');
  if (bigSmallChart) bigSmallChart.destroy();

  bigSmallChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Big', 'Small'],
      datasets: [{
        label: 'Count',
        data: [big, small],
        backgroundColor: ['#4caf50', '#f44336']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Big vs Small Count (Last 10 draws)' }
      },
      scales: {
        y: { beginAtZero: true, stepSize: 1 }
      }
    }
  });
}

function drawColorChart(colorCount) {
  const ctx = document.getElementById('colorChart').getContext('2d');
  if (colorChart) colorChart.destroy();

  colorChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(colorCount).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
      datasets: [{
        label: 'Color Frequency',
        data: Object.values(colorCount),
        backgroundColor: ['#4caf50', '#f44336', '#9c27b0']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Color Distribution (Last 10 draws)' }
      }
    }
  });
}

function drawNumberChart(numbers) {
  const ctx = document.getElementById('numberChart').getContext('2d');
  if (numberChart) numberChart.destroy();

  // Count frequencies of each number 0-9
  const counts = Array(10).fill(0);
  numbers.forEach(n => counts[n]++);

  numberChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from(Array(10).keys()),
      datasets: [{
        label: 'Number Frequency',
        data: counts,
        backgroundColor: '#2196f3'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Number Frequency (Last 10 draws)' }
      },
      scales: {
        y: { beginAtZero: true, stepSize: 1 }
      }
    }
  });
}
