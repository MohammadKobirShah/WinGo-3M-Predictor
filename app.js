const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json";

async function fetchAndPredict() {
  const res = await fetch(API_URL);
  const data = await res.json();
  const draws = data.data.list;

  let big = 0, small = 0;
  const colorCount = { green: 0, red: 0, violet: 0 };
  const numbers = [];

  // Analyze last 10 draws
  draws.slice(0, 10).forEach(draw => {
    const num = parseInt(draw.number);
    numbers.push(num);
    if (num >= 5) big++; else small++;

    draw.color.split(',').forEach(c => {
      colorCount[c.trim()]++;
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
    <ul>${draws.slice(0, 10).map(d =>
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
}
