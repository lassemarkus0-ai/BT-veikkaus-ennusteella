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
            const standingsContainer = document.getElementById('standings-container');
            if (standingsContainer) {
                standingsContainer.innerHTML = '<p>Virhe ladattaessa tietoja. Tarkista data.json-tiedosto.</p>';
            }
        });
});

function initApp(data) {
    renderStandings(data);
    renderMatches(data);
}

/**
 * Laskee ja renderöi sarjataulukon automaattisesti
 */
function renderStandings(data) {
    const container = document.getElementById('standings-container');
    if (!container) return;

    const players = data.players || [];
    const matches = data.matches || [];

    // Jos JSON sisältää valmiin standings-taulukon, käytetään sitä
    if (data.standings && Array.isArray(data.standings) && data.standings.length > 0) {
        renderStandingsList(container, data.standings);
        return;
    }

    // Muussa tapauksessa lasketaan pisteet automaattisesti tuloksista
    const scores = {};
    players.forEach(player => {
        scores[player] = 0;
    });

    let playedMatchesCount = 0;

    matches.forEach(match => {
        // Ottelu katsotaan pelatuksi, jos result-kenttä ei ole tyhjä
        if (match.result && match.result.trim() !== '' && match.predictions) {
            playedMatchesCount++;
            Object.keys(match.predictions).forEach(player => {
                if (match.predictions[player] === match.result) {
                    scores[player] = (scores[player] || 0) + 1;
                }
            });
        }
    });

    // Luodaan järjestetty lista pisteiden mukaan (eniten pisteitä ensin)
    const standingsList = players
        .map(player => ({
            player: player,
            points: scores[player] || 0
        }))
        .sort((a, b) => b.points - a.points);

    renderStandingsList(container, standingsList, playedMatchesCount);
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
