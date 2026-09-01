document.addEventListener('DOMContentLoaded', () => {
    // Ladataan data.json-tiedosto
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Verkkovirhe ladattaessa data.json-tiedostoa');
            }
            return response.json();
        })
        .then(data => {
            initApp(data);
        })
        .catch(error => {
            console.error('Virhe datan latauksessa:', error);
            showError('Virhe ladattaessa tietoja. Tarkista data.json-tiedosto.');
        });
});

function initApp(data) {
    updateTopStats(data);
    renderStandings(data);
    renderPredictedStandings(data);
    renderMatches(data);
    renderOtherPredictions(data);
}

function showError(message) {
    const containers = ['standings-container', 'matches-container', 'other-predictions-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<p class="error-text">${message}</p>`;
    });
}

/**
 * Päivittää sivun yläosan tilastolaatikot (Pelaajat, Ottelut, Kärkipisteet)
 */
function updateTopStats(data) {
    const players = data.players || [];
    const matches = data.matches || [];

    // 1. Pelaajamäärä
    const playerStatEl = document.querySelector('.stat-card:nth-child(1) .stat-value, #player-count');
    if (playerStatEl) {
        playerStatEl.textContent = players.length;
    }

    // 2. Ottelutilasto (pelatut / kaikki)
    let playedCount = 0;
    matches.forEach(m => {
        if (m.result && m.result.trim() !== '') {
            playedCount++;
        }
    });

    const matchStatEl = document.querySelector('.stat-card:nth-child(2) .stat-value, #match-count');
    if (matchStatEl) {
        matchStatEl.textContent = `${playedCount} / ${matches.length}`;
    }

    // 3. Kärkipisteet
    const scores = {};
    players.forEach(p => scores[p] = 0);

    matches.forEach(m => {
        if (m.result && m.result.trim() !== '' && m.predictions) {
            Object.keys(m.predictions).forEach(p => {
                if (m.predictions[p] === m.result) {
                    scores[p] = (scores[p] || 0) + 1;
                }
            });
        }
    });

    const maxPoints = Math.max(0, ...Object.values(scores));
    const topStatEl = document.querySelector('.stat-card:nth-child(3) .stat-value, #top-score');
    if (topStatEl) {
        topStatEl.textContent = `${maxPoints.toFixed(1)} p`;
    }
}

/**
 * Laskee ja renderöi sarjataulukon automaattisesti ottelutuloksista
 */
function renderStandings(data) {
    const container = document.getElementById('standings-container');
    if (!container) return;

    const players = data.players || [];
    const matches = data.matches || [];

    if (data.standings && Array.isArray(data.standings) && data.standings.length > 0) {
        renderStandingsList(container, data.standings);
        return;
    }

    const scores = {};
    players.forEach(player => scores[player] = 0);

    let playedMatchesCount = 0;

    matches.forEach(match => {
        if (match.result && match.result.trim() !== '' && match.predictions) {
            playedMatchesCount++;
            Object.keys(match.predictions).forEach(player => {
                if (match.predictions[player] === match.result) {
                    scores[player] = (scores[player] || 0) + 1;
                }
            });
        }
    });

    const standingsList = players
        .map(player => ({
            player: player,
            points: scores[player] || 0
        }))
        .sort((a, b) => b.points - a.points);

    renderStandingsList(container, standingsList, playedMatchesCount);
}

/**
 * Renderöi Sarjataulukko ennusteella -osion
 */
function renderPredictedStandings(data) {
    const container = document.getElementById('predicted-standings-container');
    if (!container) return;

    const players = data.players || [];
    const matches = data.matches || [];

    // Jos ennusteet lasketaan maksimipisteiden perusteella (nykyiset pisteet + jäljellä olevat ottelut)
    const scores = {};
    players.forEach(p => scores[p] = 0);

    matches.forEach(match => {
        if (match.result && match.result.trim() !== '' && match.predictions) {
            Object.keys(match.predictions).forEach(p => {
                if (match.predictions[p] === match.result) {
                    scores[p] = (scores[p] || 0) + 1;
                }
            });
        } else {
            // Otteluita ei vielä pelattu -> lasketaan maksimipisteet
            players.forEach(p => {
                scores[p] = (scores[p] || 0) + 1;
            });
        }
    });

    const predictedList = players
        .map(player => ({
            player: player,
            points: scores[player] || 0
        }))
        .sort((a, b) => b.points - a.points);

    renderStandingsList(container, predictedList);
}

/**
 * Apufunktio sarjataulukon HTML-muodostukseen
 */
function renderStandingsList(container, standingsList, playedMatchesCount = null) {
    let html = '';

    if (playedMatchesCount === 0) {
        html += `<p class="info-text">Ei pelattuja otteluita vielä. Sarjataulukko päivittyy, kun ottelutuloksia syötetään.</p>`;
    }

    html += '<div class="standings-table">';
    standingsList.forEach((item, index) => {
        const pts = typeof item.points === 'number' ? item.points : 0;
        html += `
            <div class="standing-row">
                <span class="standing-rank">#${index + 1}</span>
                <span class="standing-player">${item.player}</span>
                <span class="standing-points">${pts} p</span>
            </div>`;
    });
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Renderöi ottelulistan ja veikkaukset
 */
function renderMatches(data) {
    const container = document.getElementById('matches-container');
    if (!container) return;

    const matches = data.matches || [];
    if (matches.length === 0) {
        container.innerHTML = '<p>Ei otteluita saatavilla.</p>';
        return;
    }

    let html = '';
    matches.forEach(match => {
        const isFinished = match.result && match.result.trim() !== '';
        const resultText = isFinished ? match.result : '-';

        html += `
            <div class="match-card ${isFinished ? 'finished' : ''}">
                <div class="match-header">
                    <span class="match-date">${match.date || ''}</span>
                    <span class="match-teams">${match.homeTeam} vs ${match.awayTeam}</span>
                    <span class="match-result">Tulos: <strong>${resultText}</strong></span>
                </div>
                <div class="predictions-grid">`;

        if (match.predictions) {
            Object.keys(match.predictions).forEach(player => {
                const pred = match.predictions[player];
                const isCorrect = isFinished && pred === match.result;
                const statusClass = isFinished ? (isCorrect ? 'correct' : 'incorrect') : '';

                html += `
                    <div class="prediction-item ${statusClass}">
                        <span class="player-name">${player}:</span>
                        <span class="prediction-value">${pred}</span>
                    </div>`;
            });
        }

        html += `
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

/**
 * Renderöi Muut veikkaukset -osion
 */
function renderOtherPredictions(data) {
    const container = document.getElementById('other-predictions-container');
    if (!container) return;

    const otherPreds = data.other_predictions || [];

    if (!otherPreds || otherPreds.length === 0) {
        container.innerHTML = '<p class="info-text">Ei muita veikkauksia määriteltynä.</p>';
        return;
    }

    let html = '<div class="other-predictions-list">';
    otherPreds.forEach(item => {
        html += `
            <div class="other-prediction-card">
                <h4>${item.title || 'Veikkaus'}</h4>
                <div class="predictions-grid">`;
        
        if (item.predictions) {
            Object.keys(item.predictions).forEach(player => {
                html += `
                    <div class="prediction-item">
                        <span class="player-name">${player}:</span>
                        <span class="prediction-value">${item.predictions[player]}</span>
                    </div>`;
            });
        }

        html += `
                </div>
            </div>`;
    });
    html += '</div>';

    container.innerHTML = html;
}
