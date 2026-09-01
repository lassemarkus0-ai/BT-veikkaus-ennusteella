document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderDashboard(data);
        })
        .catch(error => console.error('Virhe ladattaessa dataa:', error));
});

function renderDashboard(data) {
    const matches = data.matches || [];
    const players = data.players || [];

    // Lasketut ottelut (tunnistaa pelatuksi jos result on 1, X, 2 tai jos maalit on syötetty)
    const playedMatches = matches.filter(m => {
        const res = String(m.result || '').trim().toUpperCase();
        return ['1', 'X', '2'].includes(res) || (m.homeGoals !== undefined && m.homeGoals !== null);
    });

    // Päivitetään yläpalkin tilastot
    const playedCountElem = document.getElementById('played-count');
    if (playedCountElem) {
        playedCountElem.textContent = `${playedMatches.length} / ${matches.length}`;
    }

    // Alustetaan pisteet pelaajille
    const playerScores = {};
    players.forEach(p => {
        playerScores[p.name] = 0;
    });

    // Lasketan pisteet jokaisesta pelatusta ottelusta
    playedMatches.forEach(match => {
        const correctResult = String(match.result || '').trim().toUpperCase();
        
        if (match.userPredictions) {
            Object.keys(match.userPredictions).forEach(player => {
                const pred = String(match.userPredictions[player] || '').trim().toUpperCase();
                if (pred === correctResult && playerScores.hasOwnProperty(player)) {
                    playerScores[player] += 1; // 1 piste oikeasta merkistä (1, X, 2)
                }
            });
        }
    });

    // Päivitetään kärkipisteet yläpalkkiin
    const maxPoints = Math.max(...Object.values(playerScores), 0);
    const topPointsElem = document.getElementById('top-points');
    if (topPointsElem) {
        topPointsElem.textContent = `${maxPoints.toFixed(1)} p`;
    }

    // Renderöidään sarjataulukko
    renderLeaderboard(players, playerScores);
}

function renderLeaderboard(players, playerScores) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    // Järjestetään pelaajat pisteiden mukaan
    const sortedPlayers = [...players].sort((a, b) => (playerScores[b.name] || 0) - (playerScores[a.name] || 0));

    leaderboardBody.innerHTML = sortedPlayers.map((player, index) => `
        <div class="leaderboard-row">
            <span class="rank">#${index + 1}</span>
            <span class="player-name">${player.name}</span>
            <span class="points">${playerScores[player.name] || 0} p</span>
        </div>
    `).join('');
}
