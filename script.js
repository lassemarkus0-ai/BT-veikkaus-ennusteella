document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(r => r.json())
        .then(data => {
            updateUI(data);
            renderMatches(data.matches || []);
            renderOtherPredictions(data.other_predictions || []);
        })
        .catch(err => console.error("Virhe ladattaessa data.json:", err));
});

function updateUI(data) {
    const matches = data.matches || [];
    const players = data.players || [];

    const playedMatches = matches.filter(m =>
        ["1","X","2"].includes(String(m.result).trim().toUpperCase())
    );

    document.getElementById('player-count').textContent = players.length;
    document.getElementById('played-count').textContent = `${playedMatches.length} / ${matches.length}`;

    const scores = {};
    players.forEach(p => scores[p] = 0);

    playedMatches.forEach(match => {
        const actual = String(match.result).trim().toUpperCase();
        const predictions = match.predictions || {};

        Object.entries(predictions).forEach(([player, pred]) => {
            if (String(pred).trim().toUpperCase() === actual) {
                scores[player] = (scores[player] || 0) + 1;
            }
        });
    });

    const maxScore = Object.values(scores).length
        ? Math.max(...Object.values(scores))
        : 0;
    document.getElementById('top-points').textContent = `${maxScore} p`;

    renderTable(scores);
}

function renderTable(scores) {
    const container = document.getElementById('leaderboard-body');
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sorted.map(([name, points], i) => `
        <div class="leaderboard-row">
            <span class="rank">#${i + 1}</span>
            <span class="player-name">${name}</span>
            <span class="points">${points} p</span>
        </div>
    `).join('');
}

function renderMatches(matches) {
    const container = document.getElementById('matches-list');

    container.innerHTML = matches.map(match => {
        const isHome = match.homeTeam.toLowerCase().includes("kärp");
        const isPlayed = ["1","X","2"].includes(String(match.result).trim().toUpperCase());

        const rowClass = `
            match-row
            ${isHome ? "home" : "away"}
            ${isPlayed ? "played" : ""}
        `.trim();

        return `
            <div class="${rowClass}">
                <div class="match-info">
                    <strong>${match.date}</strong><br>
                    ${match.homeTeam} – ${match.awayTeam}
                </div>
                <div class="match-result">
                    ${match.result ? match.result : "–"}
                </div>
            </div>
        `;
    }).join('');
}

function renderOtherPredictions(predictions) {
    const container = document.getElementById('other-predictions-list');

    container.innerHTML = predictions.map(item => `
        <div class="prediction-block">
            <h3>${item.question}</h3>
            <ul>
                ${Object.entries(item.predictions).map(([player, ans]) =>
                    `<li><strong>${player}:</strong> ${ans}</li>`
                ).join('')}
            </ul>
        </div>
    `).join('');
}
