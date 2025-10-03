const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json";

let bigSmallChart, colorChart, numberChart;

async function fetchAndPredict() {
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

  // Display history
  document.getElementById("history").innerHTML = `
    <h2>🔢 Last 10 Results</h2>
    <ul>${recentDraws.map(d =>
      `<li>#${d.issueNumber} — <strong>${d.number}</strong> (${d.color})</li>`).join('')
    }</ul>
  `;

  // Display prediction
  document.getElementById("prediction").innerHTML = `
    <h2>🔮 Next Prediction</h2>
    <p><strong>Size:</strong> ${prediction.size}</p>
    <p><strong>Color:</strong> <span class="color-box ${prediction.color}">${prediction.color}</span></p>
    <p><strong>Likely Numbers:</strong> ${prediction.likelyNumbers.join(', ')}</p>
  `;

  // Draw Charts
  drawBigSmallChart(big, small);
  drawColorChart(colorCount);
  drawNumberChart(numbers);
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
