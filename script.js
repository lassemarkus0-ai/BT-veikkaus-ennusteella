document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Verkkovirhe ladattaessa data.json');
            }
            return response.json();
        })
        .then(data => {
            updateUI(data);
        })
        .catch(error => console.error('Virhe ladattaessa dataa:', error));
});

function updateUI(data) {
    const matches = data.matches || [];
    const players = data.players || [];

    const playedMatches = matches.filter(m => {
        const res = String(m.result || '').trim().toUpperCase();
        return ['1', 'X', '2'].includes(res);
    });

    const playedElem = document.getElementById('played-count');
    if (playedElem) {
        playedElem.textContent = `${playedMatches.length} / ${matches.length}`;
    }

    const scores = {};
    players.forEach(p => {
        const name = typeof p === 'string' ? p : p.name;
        scores[name] = 0;
    });

    playedMatches.forEach(match => {
        const actualResult = String(match.result || '').trim().toUpperCase();
        const predictions = match.predictions || match.userPredictions || {};

        Object.keys(predictions).forEach(playerName => {
            const pred = String(predictions[playerName] || '').trim().toUpperCase();
            if (pred === actualResult) {
                scores[playerName] = (scores[playerName] || 0) + 1;
            }
        });
    });

    const maxScore = Math.max(...Object.values(scores), 0);
    const topPointsElem = document.getElementById('top-points');
    if (topPointsElem) {
        topPointsElem.textContent = `${maxScore.toFixed(1)} p`;
    }

    renderTable(scores);
}

function renderTable(scores) {
    const tableContainer = document.getElementById('leaderboard-body');
    if (!tableContainer) return;

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    let html = '';
    sorted.forEach(([name, points], index) => {
        html += `
            <div class="leaderboard-row" style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #222;">
                <span style="font-weight: bold; width: 40px;">#${index + 1}</span>
                <span style="flex-grow: 1; text-align: left;">${name}</span>
                <span style="font-weight: bold; color: #ffb703;">${points} p</span>
            </div>
        `;
    });

    tableContainer.innerHTML = html;
}
