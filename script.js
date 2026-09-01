document.addEventListener("DOMContentLoaded", () => {
    console.log("Ladataan data.json...");
    
    fetch('data.json?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP-virhe: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Data ladattu onnistuneesti:", data);
            
            // 1. Piilotetaan "Ladataan..." -ilmoitus
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            
            // 2. Suoritetaan renderöinnit turvallisesti
            try { renderStats(data); } catch (e) { console.error("Virhe renderStats:", e); }
            try { renderStandings(data); } catch (e) { console.error("Virhe renderStandings:", e); }
            try { renderPredictedStandings(data); } catch (e) { console.error("Virhe renderPredictedStandings:", e); }
            try { renderMatches(data); } catch (e) { console.error("Virhe renderMatches:", e); }
            try { renderOtherPredictions(data); } catch (e) { console.error("Virhe renderOtherPredictions:", e); }
        })
        .catch(error => {
            console.error("Virhe ladattaessa dataa:", error);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.innerHTML = '<p style="color: red;">Datan lataus epäonnistui! Varmista että data.json löytyy ja on oikeassa muodossa.</p>';
            }
        });
});

function switchTab(tabName, evt) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    if (evt && evt.target) {
        evt.target.classList.add('active');
    }
}

function renderStats(data) {
    if (data.players) {
        const el = document.getElementById('stat-players');
        if (el) el.textContent = data.players.length;
    }
    if (data.matches) {
        const played = data.matches.filter(m => m.result && m.result !== "").length;
        const el = document.getElementById('stat-matches');
        if (el) el.textContent = `${played} / ${data.matches.length}`;
    }
    if (data.predicted_standings && data.predicted_standings.length > 0) {
        const first = data.predicted_standings[0];
        const pts = (first && typeof first.points === 'number') ? first.points.toFixed(1) : "0.0";
        const el = document.getElementById('stat-top-points');
        if (el) el.textContent = `${pts} p`;
    }
}

function renderStandings(data) {
    const container = document.getElementById('standings-container');
    if (!container) return;

    if (!data.standings || data.standings.length === 0) {
        container.innerHTML = "<p>Ei sarjataulukkotietoja saatavilla.</p>";
        return;
    }

    let html = '';
    data.standings.forEach((item, index) => {
        const pts = typeof item.points === 'number' ? item.points.toFixed(1) : "0.0";
        html += `
            <div class="standing-row">
                <div class="standing-player">#${index + 1} ${item.player || '-'}</div>
                <div class="standing-points">${pts} p</div>
            </div>`;
    });
    container.innerHTML = html;
}

function renderPredictedStandings(data) {
    const container = document.getElementById('predicted-standings-container');
    if (!container) return;

    const list = data.predicted_standings || data.standings;
    if (!list || list.length === 0) {
        container.innerHTML = "<p>Ei ennustetaulukkotietoja saatavilla.</p>";
        return;
    }

    let html = '';
    list.forEach((item, index) => {
        const pts = typeof item.points === 'number' ? item.points.toFixed(1) : "0.0";
        html += `
            <div class="standing-row">
                <div class="standing-player">#${index + 1} ${item.player || '-'}</div>
                <div class="standing-points">${pts} p</div>
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
    
    (data.players || []).forEach(p => { html += `<th>${p}</th>`; });
    html += `</tr></thead><tbody>`;

    data.matches.forEach(m => {
        const resultBadge = (m.result && m.result !== "") 
            ? `<span class="badge badge-played">${m.result}</span>` 
            : `<span class="badge badge-upcoming">-</span>`;
            
        html += `
            <tr>
                <td>${m.date || '-'}</td>
                <td>${m.homeTeam || ''} - ${m.awayTeam || ''}</td>
                <td>${resultBadge}</td>`;

        (data.players || []).forEach(p => {
            const pred = (m.predictions && m.predictions[p]) ? m.predictions[p] : "-";
            const isCorrect = m.result && m.result !== "" && pred === m.result;
            const predClass = isCorrect ? 'style="color: var(--accent-gold, #ffd700); font-weight: bold;"' : '';
            html += `<td ${predClass}>${pred}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

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

    (data.players || []).forEach(p => { html += `<th>${p}</th>`; });
    html += `</tr></thead><tbody>`;

    data.other_predictions.forEach(item => {
        const leader = item.current_leader ? item.current_leader : "-";
        html += `
            <tr>
                <td><strong>${item.question || ''}</strong></td>
                <td><span class="badge badge-played">${leader}</span></td>`;

        (data.players || []).forEach(p => {
            const pred = (item.predictions && item.predictions[p]) ? item.predictions[p] : "-";
            html += `<td>${pred}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}
