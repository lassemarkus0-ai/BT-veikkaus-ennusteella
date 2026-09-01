document.addEventListener('DOMContentLoaded', () => {
    initTabs();

    // Ladataan data.json aina tuoreena estäen selaimen välimuistitus
    fetch('./data.json?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error('Tiedostoa data.json ei löytynyt tai verkkovirhe.');
            }
            return response.json();
        })
        .then(data => {
            initApp(data);
        })
        .catch(error => {
            console.error('Virhe:', error);
            showError('Virhe ladattaessa tietoja. Varmista, että data.json on samassa kansiossa.');
        });
});

function initApp(data) {
    // Varmistetaan pelaajalista: jos "players"-kenttää ei ole, poimitaan pelaajat ensimmäisen ottelun veikkauksista
    if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
        data.players = extractPlayersFromMatches(data.matches);
    }

    updateTopStats(data);
    renderStandings(data);
    renderPredictedStandings(data);
    renderMatches(data);
    renderOtherPredictions(data);
}

/**
 * Poimii pelaajien nimet ottelujen predictions-olioista, jos players-taulukkoa ei ole JSONissa
 */
function extractPlayersFromMatches(matches) {
    if (!matches || !Array.isArray(matches)) return [];
    const playerSet = new Set();
    matches.forEach(m => {
        if (m.predictions && typeof m.predictions === 'object') {
            Object.keys(m.predictions).forEach(player => playerSet.add(player));
        }
    });
    return Array.from(playerSet);
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetElement = document.getElementById(`tab-${targetTab}`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
}

function showError(message) {
    const containers = ['standings-container', 'predicted-standings-container', 'matches-container', 'other-predictions-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<p class="error-text" style="color: #ff6b6b; padding: 10px;">${message}</p>`;
    });
}

/**
 * Päivittää yläosan tilastolaatikot (#player-count, #match-count, #top-score)
 */
function updateTopStats(data) {
    const players = data.players || [];
    const matches = data.matches || [];

    // 1. Pelaajamäärä
    const playerEl = document.getElementById('player-count');
    if (playerEl) {
        playerEl.textContent = players.length;
    }

    // 2. Ottelutilasto (pelatut / kaikki)
    let playedCount = 0;
    matches.forEach(m => {
        if (m.result !== undefined && m.result !== null && String(m.result).trim() !== '') {
            playedCount++;
        }
    });

    const matchEl = document.getElementById('match-count');
    if (matchEl) {
        matchEl.textContent = `${playedCount} / ${matches.length}`;
    }

    // 3. Kärkipisteet
    const scores = {};
    players.forEach(p => scores[p] = 0);

    matches.forEach(m => {
        if (m.result !== undefined && m.result !== null && String(m.result).trim() !== '' && m.predictions) {
            Object.keys(m.predictions).forEach(p => {
                if (String(m.predictions[p]).trim() === String(m.result).trim()) {
                    scores[p] = (scores[p] || 0) + 1;
                }
            });
        }
    });

    const scoreValues = Object.values(scores);
    const maxPoints = scoreValues.length > 0 ? Math.max(0, ...scoreValues) : 0;
    const topEl = document.getElementById('top-score');
    if (topEl) {
        topEl.textContent = `${maxPoints.toFixed(1)} p`;
    }
}

/**
 * Sarjataulukko
 */
function renderStandings(data) {
    const container = document.getElementById('standings-container');
    if (!container) return;

    const players = data.players || [];
    const matches = data.matches || [];

    const scores = {};
    players.forEach(p => scores[p] = 0);

    let playedMatchesCount = 0;

    matches.forEach(match => {
        if (match.result !== undefined && match.result !== null && String(match.result).trim() !== '' && match.predictions) {
            playedMatchesCount++;
            Object.keys(match.predictions).forEach(p => {
                if (String(match.predictions[p]).trim() === String(match.result).trim()) {
                    scores[p] = (scores[p] || 0) + 1;
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
 * Sarjataulukko ennusteella
 */
function renderPredictedStandings(data) {
    const container = document.getElementById('predicted-standings-container');
    if (!container) return;

    const players = data.players || [];
    const matches = data.matches || [];

    const scores = {};
    players.forEach(p => scores[p] = 0);

    matches.forEach(match => {
        if (match.result !== undefined && match.result !== null && String(match.result).trim() !== '' && match.predictions) {
            Object.keys(match.predictions).forEach(p => {
                if (String(match.predictions[p]).trim() === String(match.result).trim()) {
                    scores[p] = (scores[p] || 0) + 1;
                }
            });
        } else {
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

function renderStandingsList(container, standingsList, playedMatchesCount = null) {
    let html = '';

    if (playedMatchesCount === 0) {
        html += `<p class="info-text" style="margin-bottom: 15px; opacity: 0.8;">Ei pelattuja otteluita vielä. Sarjataulukko päivittyy, kun ottelutuloksia syötetään.</p>`;
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
 * Ottelulista
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
        const isFinished = match.result !== undefined && match.result !== null && String(match.result).trim() !== '';
        const resultText = isFinished ? match.result : '-';

        html += `
            <div class="match-card ${isFinished ? 'finished' : ''}">
                <div class="match-header">
                    <span class="match-date">${match.date || ''}</span>
                    <span class="match-teams">${match.homeTeam || ''} vs ${match.awayTeam || ''}</span>
                    <span class="match-result">Tulos: <strong>${resultText}</strong></span>
                </div>
                <div class="predictions-grid">`;

        if (match.predictions) {
            Object.keys(match.predictions).forEach(player => {
                const pred = match.predictions[player];
                const isCorrect = isFinished && String(pred).trim() === String(match.result).trim();
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
 * Muut veikkaukset
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
