// Erikoisveikkaukset (pääteveikkaukset)
const otherPredictionsData = {
    players: ["Asko", "Markus", "Ilpo", "Absolut", "Kari", "Pasi"],
    rows: [
        { label: "KULTA (max 3 p.)", picks: ["KalPa", "Tappara", "Kärpät", "Tappara", "JYP", "Tappara"] },
        { label: "HOPEA (max 3 p.)", picks: ["Tappara", "Kärpät", "Ilves", "Lukko", "Tappara", "Ilves"] },
        { label: "PRONSSI (max 3 p.)", picks: ["HIFK", "Kalpa", "Tappara", "Kärpät", "Ilves", "HIFK"] },
        { label: "RUNKOSARJA 1. (max 3 p.)", picks: ["KalPa", "Kärpät", "Ilves", "Tappara", "JYP", "Tappara"] },
        { label: "RUNKOSARJA 2. (max 3 p.)", picks: ["Lukko", "Kalpa", "Tappara", "Lukko", "Ilves", "Ilves"] },
        { label: "RUNKOSARJA 3. (max 3 p.)", picks: ["HIFK", "HIFK", "Lukko", "Ilves", "Tappara", "HIFK"] },
        { label: "Liigasta 1. putoava (max 3 p)", picks: ["Sport", "Sport", "Ässät", "Jukurit", "HPK", "TPS"] },
        { label: "Liigasta 2. putoava (max 3 p)", picks: ["Jukurit", "KooKoo", "Kiekko-Espoo", "K-Espoo", "SPORT", "Sport"] },
        { label: "Liigasta 3. putoava (max 3 p)", picks: ["HPK", "Jukurit", "Jukurit", "Sport", "Jukurit", "Jukurit"] },
        { label: "Runkosarjan viimeinen", picks: ["Sport", "Jukurit", "Jukurit", "Jukurit", "Jukurit", "Jukurit"] },
        { label: "Kärppien liigasijoitus", picks: ["8", "3", "1", "3", "8", "6"] },
        { label: "Liigan paras pistepörssissä", picks: ["Benjamin Rautiainen", "Kantner", "Kantner", "Blichfeldt", "Blicfelt", "Aapeli Räsänen"] },
        { label: "Kärppien paras pistepörssissä", picks: ["Roni Hirvonen", "Kantner", "Kantner", "Ratinen", "Hirvonen", "Kantner"] },
        { label: "Liigan paras maalintekijä", picks: ["Joachim Blichfeld", "Kantner", "Patrick Curry", "Fabre", "Tukiainen", "Blichfeld"] },
        { label: "Kärppien paras maalintekijä", picks: ["Matyas Kantner", "Kantner", "Eetu Päkkilä", "Okany", "Kantner", "Kantner"] },
        { label: "Liigan jäähykuningas", picks: ["Zack Hayes", "Tikka", "Cameron Hillis", "Lauridsen", "Rafkin", "Tommi Tikka"] },
        { label: "Kärppien jäähykuningas", picks: ["Tommi Tikka", "Tikka", "Tommi Tikka", "Salmela", "Tikka", "Tommi Tikka"] },
        { label: "Liigan paras veskari (% perusteella)", picks: ["Christoffer Rifalk", "Rubin", "Niklas Rubin", "Heljanko", "Heljanko", "Heljanko"] },
        { label: "Liigan parhaan veskarin torjuntaprosentti", picks: ["93.09", "93.15", "92.77", "93.20", "92.11", "94.21"] },
        { label: "Liigan paras +/- tilastossa", picks: ["Jesper Mattila", "Blichfeld", "Harri Pesonen", "Blichfeldt", "Jasek", "Matinmikko"] },
        { label: "Kärppien paras +/- tilastossa", picks: ["Emil Erholz", "Erholz", "Roni Hirvonen", "Matinmikko", "Matinmikko", "Matinmikko"] },
        { label: "Liigan huonoin +/- tilastossa", picks: ["Zack Hayes", "Addamo", "Justin Addamo", "Tiihonen", "Sandvik", "Kalle Miketinac"] },
        { label: "Kärppien paras +/- tilastossa (2)", picks: ["Tuukka Tieksola", "Matinmikko", "Nooa Viuhkola", "Matinmikko", "Matinmikko", "Tommi Tikka"] },
        { label: "Kärppien kotiotteluiden yleisökeskiarvo", picks: ["4700", "5314", "5217", "5197", "4612", "4913"] }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('data.json-lataus epäonnistui');
            return response.json();
        })
        .then(data => {
            updateStats(data.players, data.matches);
            renderStandings(data.players, data.matches);
            renderMatchesTable(data.matches);
            renderOtherPredictions();
        })
        .catch(error => {
            console.error('Virhe data.json-tiedoston latauksessa:', error);
            renderOtherPredictions();
        });
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'standings') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-standings').classList.add('active');
    } else if (tabName === 'matches') {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-matches').classList.add('active');
    } else if (tabName === 'other') {
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
        document.getElementById('tab-other').classList.add('active');
    }
}

function updateStats(players, matches) {
    const totalPlayers = players ? players.length : 6;
    const playedMatches = matches ? matches.filter(m => m.result && m.result.toString().trim() !== "").length : 0;
    const totalMatches = matches ? matches.length : 0;

    const elPlayers = document.getElementById('stat-players');
    const elMatches = document.getElementById('stat-matches');

    if (elPlayers) elPlayers.innerText = totalPlayers;
    if (elMatches) elMatches.innerText = `${playedMatches} / ${totalMatches}`;
}

function renderStandings(players, matches) {
    const container = document.getElementById('standings-container');
    if (!container || !players) return;

    const stats = {};
    players.forEach(p => stats[p] = { name: p, points: 0, correct: 0 });

    if (matches) {
        matches.forEach(match => {
            if (match.result && match.result.toString().trim() !== "") {
                const res = match.result.toString().trim();
                const counts = { "1": 0, "X": 0, "2": 0 };
                
                Object.values(match.predictions || {}).forEach(pick => {
                    const pStr = pick.toString().trim();
                    if (counts[pStr] !== undefined) counts[pStr]++;
                });

                Object.entries(match.predictions || {}).forEach(([player, pick]) => {
                    const pStr = pick.toString().trim();
                    if (stats[player] && pStr === res) {
                        stats[player].correct++;
                        const pickCount = counts[pStr];
                        const otherCounts = Object.keys(counts).filter(k => k !== pStr && counts[k] > 0).map(k => counts[k]);

                        if (otherCounts.length === 0 || otherCounts.every(c => c === pickCount)) {
                            stats[player].points += 1.5;
                        } else if (otherCounts.every(c => pickCount < c)) {
                            stats[player].points += 2.0;
                        } else {
                            stats[player].points += 1.0;
                        }
                    }
                });
            }
        });
    }

    const sorted = Object.values(stats).sort((a, b) => b.points - a.points || b.correct - a.correct);

    const topPointsEl = document.getElementById('stat-top-points');
    if (topPointsEl && sorted.length > 0) {
        topPointsEl.innerText = `${sorted[0].points.toFixed(1).replace('.', ',')} p`;
    }

    const medalIcons = ['🥇', '🥈', '🥉'];

    container.innerHTML = sorted.map((p, index) => {
        const medal = index < 3 ? medalIcons[index] : `${index + 1}.`;
        return `
            <div class="standing-row">
                <div class="standing-player">${medal} ${p.name}</div>
                <div class="standing-points">${p.points.toFixed(1).replace('.', ',')} p</div>
            </div>
        `;
    }).join('');
}

function renderMatchesTable(matches) {
    const container = document.getElementById('matches-container');
    if (!container || !matches) return;

    let html = `
        <div class="table-wrapper">
            <table class="matches-table">
                <thead>
                    <tr>
                        <th>Pvm</th>
                        <th>Ottelu</th>
                        <th>Tulos</th>
                        <th>Veikkaukset</th>
                    </tr>
                </thead>
                <tbody>
    `;

    matches.forEach(match => {
        // Luetaan ottelupari kaikista mahdollisista JSON-muodoista
        let matchName = "";

        if (match.match) {
            matchName = match.match;
        } else if (match.homeTeam && match.awayTeam) {
            matchName = `${match.homeTeam} – ${match.awayTeam}`;
        } else if (match.koti && match.vieras) {
            matchName = `${match.koti} – ${match.vieras}`;
        } else if (match.home_team && match.away_team) {
            matchName = `${match.home_team} – ${match.away_team}`;
        } else {
            matchName = "Ottelu";
        }

        const date = match.date || match.pvm || match.aika || "-";
        const isPlayed = match.result !== undefined && match.result !== null && match.result.toString().trim() !== "";

        let predictionsHtml = '<div class="table-predictions">';
        for (const [player, pick] of Object.entries(match.predictions || {})) {
            const isCorrect = isPlayed && pick.toString().trim() === match.result.toString().trim();
            predictionsHtml += `
                <span class="pred-tag ${isCorrect ? 'correct' : ''}">
                    <small>${player}:</small> <strong>${pick}</strong>
                </span>
            `;
        }
        predictionsHtml += '</div>';

        html += `
            <tr>
                <td class="col-date">${date}</td>
                <td class="col-match"><strong>${matchName}</strong></td>
                <td class="col-status">
                    <span class="badge ${isPlayed ? 'badge-played' : 'badge-upcoming'}">
                        ${isPlayed ? match.result : 'Tuleva'}
                    </span>
                </td>
                <td class="col-preds">${predictionsHtml}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function renderOtherPredictions() {
    const container = document.getElementById('other-container');
    if (!container) return;

    let html = `
        <div class="table-wrapper">
            <table class="other-table">
                <thead>
                    <tr>
                        <th>Veikkauskohde</th>
                        ${otherPredictionsData.players.map(p => `<th>${p}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    otherPredictionsData.rows.forEach(row => {
        html += `
            <tr>
                <td>${row.label}</td>
                ${row.picks.map(val => `<td>${val}</td>`).join('')}
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}
