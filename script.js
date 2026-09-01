document.addEventListener("DOMContentLoaded", () => {
    fetch('data.json?v=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            renderStats(data);
            renderStandings(data);
            renderPredictedStandings(data);
            renderMatches(data);
            renderOtherPredictions(data);
        })
        .catch(error => console.error("Virhe ladattaessa dataa:", error));
});

function switchTab(tabName, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function renderStats(data) {
    if (data.players) {
        document.getElementById('stat-players').textContent = data.players.length;
    }
    if (data.matches) {
        const played = data.matches.filter(m => m.result).length;
        document.getElementById('stat-matches').textContent = `${played} / ${data.matches.length}`;
    }
    if (data.predicted_standings && data.predicted_standings.length > 0) {
        document.getElementById('stat-top-points').textContent = `${data.predicted_standings[0].points.toFixed(1)} p`;
    }
}

// 1. Pelkät ottelupisteet
function renderStandings(data) {
    const container = document.getElementById('standings-container');
    if (!container || !data.standings) return;

    let html = '';
    data.standings.forEach((item, index) => {
        html += `
            <div class="standing-row">
                <div class="standing-player">#${index + 1} ${item.player}</div>
                <div class="standing-points">${item.points.toFixed(1)} p</div>
            </div>`;
    });
    container.innerHTML = html;
}

// 2. Sarjataulukko ennusteella (Ottelut + Muut veikkaukset)
function renderPredictedStandings(data) {
    const container = document.getElementById('predicted-standings-container');
    if (!container || !data.predicted_standings) return;

    let html = '';
    data.predicted_standings.forEach((item, index) => {
        html += `
            <div class="standing-row">
                <div class="standing-player">#${index + 1} ${item.player}</div>
                <div class="standing-points">${item.points.toFixed(1)} p</div>
            </div>`;
    });
    container.innerHTML = html;
}

function renderMatches(data) {
    const container = document.getElementById('matches-container');
    if (!container || !data.matches) return;

    let html = `
        <div class="table-wrapper">
            <table class="matches-table">
                <thead>
                    <tr>
                        <th>Pvm</th>
                        <th>Ottelu</th>
                        <th>Tulos</th>`;
    
    data.players.forEach(p => { html += `<th>${p}</th>`; });
    html += `</tr></thead><tbody>`;

    data.matches.forEach(m => {
        const resultBadge = m.result ? `<span class="badge badge-played">${m.result}</span>` : `<span class="badge badge-upcoming">-</span>`;
        html += `
            <tr>
                <td class="col-date">${m.date}</td>
                <td class="col-match">${m.homeTeam} - ${m.awayTeam}</td>
                <td>${resultBadge}</td>`;

        data.players.forEach(p => {
            const pred = (m.predictions && m.predictions[p]) ? m.predictions[p] : "-";
            const isCorrect = m.result && pred === m.result;
            const predClass = isCorrect ? 'style="color: var(--accent-gold); font-weight: bold;"' : '';
            html += `<td ${predClass}>${pred}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// 3. Muut veikkaukset (Oikea vastaus / Tilanne 2. sarakkeessa)
function renderOtherPredictions(data) {
    const container = document.getElementById('other-container');
    if (!container || !data.other_predictions) return;

    let html = `
        <div class="table-wrapper">
            <table class="other-table">
                <thead>
                    <tr>
                        <th>Veikkauskohde</th>
                        <th>Oikea vastaus / Tilanne</th>`;

    // Pelaajasarakkeet (Asko jne.) Oikea vastaus -sarakkeen jälkeen
    data.players.forEach(p => { html += `<th>${p}</th>`; });
    html += `</tr></thead><tbody>`;

    data.other_predictions.forEach(item => {
        const leader = item.current_leader ? item.current_leader : "-";
        html += `
            <tr>
                <td><strong>${item.question}</strong></td>
                <td><span class="badge badge-played">${leader}</span></td>`;

        data.players.forEach(p => {
            const pred = (item.predictions && item.predictions[p]) ? item.predictions[p] : "-";
            html += `<td>${pred}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}
