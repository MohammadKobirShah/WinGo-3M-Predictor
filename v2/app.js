const baseAPI = "https://draw.ar-lottery01.com/WinGo/";

const timeframeMap = {
  "30s": "WinGo_30S/GetHistoryIssuePage.json",
  "1m": "WinGo_1M/GetHistoryIssuePage.json",
  "5m": "WinGo_5M/GetHistoryIssuePage.json"
};

const fetchBtn = document.getElementById('fetchBtn');
const timeframeSelect = document.getElementById('timeframeSelect');
const resultsDiv = document.getElementById('results');

let numberChart, colorChart, sizeChart;

fetchBtn.addEventListener('click', fetchAndPredict);

async function fetchAndPredict() {
  fetchBtn.disabled = true;
  fetchBtn.textContent = '⏳ Loading...';
  resultsDiv.textContent = 'Fetching data...';

  const timeframe = timeframeSelect.value;
  const apiUrl = baseAPI + (timeframeMap[timeframe] || timeframeMap["1m"]);

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const draws = data.data.list;

    if (!draws || draws.length === 0) throw new Error('No data found');

    // Analyze last 50 draws if possible for better accuracy
    const recentDraws = draws.slice(0, 50);

    // Run improved prediction
    const prediction = predictNext(recentDraws);

    // Render charts
    renderCharts(recentDraws);

    // Show prediction text
    resultsDiv.innerHTML = `
      <p><strong>Predicted Size:</strong> ${prediction.size}</p>
      <p><strong>Predicted Color:</strong> ${prediction.color.charAt(0).toUpperCase() + prediction.color.slice(1)}</p>
      <p><strong>Likely Numbers (Top 3):</strong> ${prediction.likelyNumbers.join(', ')}</p>
      <p><em>Based on weighted frequency and transition analysis of last ${recentDraws.length} draws.</em></p>
    `;

  } catch (err) {
    resultsDiv.textContent = 'Error: ' + err.message;
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = '🔄 Fetch & Predict';
  }
}

// Weighted frequency for numbers
function weightedFrequency(draws, weightDecay=0.85) {
  const freq = Array(10).fill(0);
  let weight = 1;
  for (let i = 0; i < draws.length; i++) {
    const num = parseInt(draws[i].number);
    freq[num] += weight;
    weight *= weightDecay;
  }
  return freq;
}

// Weighted frequency for colors
function weightedColorFrequency(draws, weightDecay=0.85) {
  const colorCount = { green: 0, red: 0, violet: 0 };
  let weight = 1;
  for (let i = 0; i < draws.length; i++) {
    draws[i].color.split(',').forEach(c => {
      c = c.trim();
      if (colorCount[c] !== undefined) colorCount[c] += weight;
    });
    weight *= weightDecay;
  }
  return colorCount;
}

// Weighted frequency for size (Big >=5, Small <5)
function weightedSizeFrequency(draws, weightDecay=0.85) {
  let big = 0, small = 0;
  let weight = 1;
  for (let i = 0; i < draws.length; i++) {
    const num = parseInt(draws[i].number);
    if (num >= 5) big += weight;
    else small += weight;
    weight *= weightDecay;
  }
  return { big, small };
}

// Transition counts for color and size
function transitionProbabilities(draws) {
  const colorTransitions = { green: 0, red: 0, violet: 0 };
  const sizeTransitions = { big: 0, small: 0 };

  for (let i = 1; i < draws.length; i++) {
    const prevColors = draws[i-1].color.split(',').map(c => c.trim());
    const currColors = draws[i].color.split(',').map(c => c.trim());

    currColors.forEach(c => {
      if (prevColors.includes(c)) colorTransitions[c] = (colorTransitions[c] || 0) + 1;
    });

    const prevNum = parseInt(draws[i-1].number);
    const currNum = parseInt(draws[i].number);
    if (currNum >= 5) sizeTransitions.big++;
    else sizeTransitions.small++;
  }
  return { colorTransitions, sizeTransitions };
}

// Main prediction combining weighted freq and transitions
function predictNext(draws) {
  const freq = weightedFrequency(draws);
  const colorFreq = weightedColorFrequency(draws);
  const sizeFreq = weightedSizeFrequency(draws);
  const { colorTransitions, sizeTransitions } = transitionProbabilities(draws);

  // Predict size with combined weighted + transitions
  const sizeScoreBig = sizeFreq.big + (sizeTransitions.big || 0);
  const sizeScoreSmall = sizeFreq.small + (sizeTransitions.small || 0);
  const predictedSize = sizeScoreBig >= sizeScoreSmall ? 'Big' : 'Small';

  // Predict color with combined weighted + transitions
  const colors = Object.keys(colorFreq);
  const predictedColor = colors.reduce((a,b) => (colorFreq[a]+(colorTransitions[a]||0)) > (colorFreq[b]+(colorTransitions[b]||0)) ? a : b);

  // Top 3 numbers by weighted frequency
  const numsWithFreq = freq.map((f, i) => ({ num: i, freq: f }));
  numsWithFreq.sort((a,b) => b.freq - a.freq);
  const likelyNumbers = numsWithFreq.slice(0, 3).map(n => n.num);

  return { size: predictedSize, color: predictedColor, likelyNumbers };
}

// Render charts: Number frequency, Color pie, Size bar
function renderCharts(draws) {
  const numbers = draws.map(d => parseInt(d.number));
  const colorCount = weightedColorFrequency(draws, 1); // non-weighted for charts
  const sizeCount = weightedSizeFrequency(draws, 1);

  // Number frequency chart
  const ctxNum = document.getElementById('numberChart').getContext('2d');
  if (numberChart) numberChart.destroy();
  const counts = Array(10).fill(0);
  numbers.forEach(n => counts[n]++);
  numberChart = new Chart(ctxNum, {
    type: 'bar',
    data: {
      labels: Array.from(Array(10).keys()),
      datasets: [{ label: 'Number Frequency', data: counts, backgroundColor: '#2196f3' }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Number Frequency (Last 50 draws)' }},
      scales: { y: { beginAtZero: true, stepSize: 1 } }
    }
  });

  // Color distribution pie chart
  const ctxColor = document.getElementById('colorChart').getContext('2d');
  if (colorChart) colorChart.destroy();
  colorChart = new Chart(ctxColor, {
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
      plugins: { title: { display: true, text: 'Color Distribution (Last 50 draws)' }}
    }
  });

  // Size bar chart
  const ctxSize = document.getElementById('sizeChart').getContext('2d');
  if (sizeChart) sizeChart.destroy();
  sizeChart = new Chart(ctxSize, {
    type: 'bar',
    data: {
      labels: ['Big (>=5)', 'Small (<5)'],
      datasets: [{
        label: 'Count',
        data: [sizeCount.big, sizeCount.small],
        backgroundColor: ['#4caf50', '#f44336']
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Big vs Small Count (Last 50 draws)' }},
      scales: { y: { beginAtZero: true, stepSize: 1 }}
    }
  });
}
