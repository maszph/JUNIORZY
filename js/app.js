// ===== POMOCNICZE =====
function calculateAge(day, month, year) {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
        age--;
    }
    return age;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const dayName = days[d.getDay()];
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${dayName} ${day}.${month}.${d.getFullYear()}`;
}

function getNextMatch() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return matches
        .filter(m => new Date(m.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
}

// ===== NORMALIZACJA POZYCJI =====
function normalizePosition(pos) {
    const p = (pos || "").toString().trim().toLowerCase();

    // Skrzydłowy = Napastnik
    if (p === "skrzydłowy" || p === "skrzydlowy") {
        return "napastnik";
    }
    return p;
}

const POSITION_ORDER = [
    "bramkarz",
    "obrońca",
    "pomocnik",
    "napastnik"
];

function getPositionRank(pos) {
    const norm = normalizePosition(pos);
    const idx = POSITION_ORDER.indexOf(norm);
    return idx === -1 ? 99 : idx;
}

function getUniquePositions() {
    const set = new Set();
    players.forEach(p => {
        const norm = normalizePosition(p.position);
        if (norm) set.add(norm);
    });
    return Array.from(set).sort((a, b) => getPositionRank(a) - getPositionRank(b));
}

function getDisplayName(normPos) {
    const names = {
        "bramkarz": "Bramkarz",
        "obrońca": "Obrońca",
        "pomocnik": "Pomocnik",
        "napastnik": "Napastnik"
    };
    return names[normPos] || (normPos.charAt(0).toUpperCase() + normPos.slice(1));
}

// ===== RENDER MECZE =====
function renderMatches() {
    const content = document.getElementById("content");
    const next = getNextMatch();

    let html = "";

    if (next) {
        const isHome = next.type === "DOM";
        html += `
            <div class="card next-match fade-in">
                <div class="card-title">Najbliższy mecz</div>
                <div class="team-name">Czarni Kozłowa Góra</div>
                <div class="vs">vs</div>
                <div class="opponent">${next.opponent}</div>
                <div class="match-meta">
                    <span>${formatDate(next.date)}</span>
                    <span>${next.time}</span>
                    <span class="badge ${isHome ? "home" : "away"}">${next.type}</span>
                </div>
                <p style="color:#aaa; margin-top:12px;">
                    <strong>Stadion:</strong> ${next.place}<br>
                    <strong>Adres:</strong> ${next.address}
                </p>
            </div>
        `;
    } else {
        html += `<div class="card fade-in"><p style="text-align:center;color:#888;">Brak zaplanowanych meczów</p></div>`;
    }

    const upcoming = matches
        .filter(m => !next || m.id !== next.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length > 0) {
        html += `<div class="card-title" style="margin:24px 0 12px;">Kolejne mecze</div>`;
        html += `<div class="match-list">`;
        upcoming.forEach(m => {
            const isHome = m.type === "DOM";
            html += `
                <div class="match-item fade-in">
                    <div class="info">
                        <h3>${m.opponent}</h3>
                        <p>${formatDate(m.date)} • ${m.time}</p>
                    </div>
                    <span class="badge ${isHome ? "home" : "away"}">${m.type}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    content.innerHTML = html;
}

// ===== RENDER TRENINGI =====
function renderTrainings() {
    const content = document.getElementById("content");
    const sorted = [...trainings].sort((a, b) => new Date(a.date) - new Date(b.date));

    let html = `<div class="card-title" style="margin-bottom:16px;">Plan treningów</div>`;
    html += `<div class="training-grid">`;

    sorted.forEach(t => {
        html += `
            <div class="training-card fade-in">
                <div class="day">${t.day}</div>
                <div class="time">${t.time} • ${formatDate(t.date)}</div>
                <div class="place">${t.place}</div>
                <div class="topic"><strong>Temat:</strong> ${t.topic}</div>
            </div>
        `;
    });

    html += `</div>`;
    content.innerHTML = html;
}

// ===== FILTRY POZYCJI =====
let activeFilters = new Set();

// ===== RENDER ZAWODNICY =====
function renderPlayers() {
    const content = document.getElementById("content");

    if (activeFilters.size === 0) {
        getUniquePositions().forEach(pos => activeFilters.add(pos));
    }

    const uniquePositions = getUniquePositions();

    let html = `
        <div class="filters-bar fade-in">
            <div class="filters-title">Filtruj pozycje:</div>
            <div class="filters-list">
    `;

    uniquePositions.forEach(pos => {
        const checked = activeFilters.has(pos) ? "checked" : "";
        html += `
            <label class="filter-item">
                <input type="checkbox" value="${pos}" ${checked}>
                <span>${getDisplayName(pos)}</span>
            </label>
        `;
    });

    html += `
            </div>
        </div>
    `;

    const filtered = players
        .filter(p => activeFilters.has(normalizePosition(p.position)))
        .sort((a, b) => {
            const rankA = getPositionRank(a.position);
            const rankB = getPositionRank(b.position);
            if (rankA !== rankB) return rankA - rankB;
            return (a.lastName || "").localeCompare(b.lastName || "");
        });

    html += `<div class="card-title" style="margin: 20px 0 16px;">Kadra (${filtered.length})</div>`;
    html += `<div class="players-grid">`;

    if (filtered.length === 0) {
        html += `<p style="color:#888; grid-column: 1 / -1; text-align:center;">Brak zawodników spełniających wybrane filtry</p>`;
    } else {
        filtered.forEach(p => {
            const initials = ((p.firstName?.[0] || "") + (p.lastName?.[0] || "")).toUpperCase() || "?";
            html += `
                <div class="player-card fade-in" data-id="${p.id}">
                    <div class="player-photo">${initials}</div>
                    <div class="player-info">
                        <h3>${p.firstName || ""} ${p.lastName || ""}</h3>
                        <div class="pos">${p.position || ""}</div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    content.innerHTML = html;

    document.querySelectorAll(".filters-list input[type=checkbox]").forEach(cb => {
        cb.addEventListener("change", (e) => {
            const pos = e.target.value;
            if (e.target.checked) {
                activeFilters.add(pos);
            } else {
                activeFilters.delete(pos);
            }
            renderPlayers();
        });
    });

    document.querySelectorAll(".player-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = parseInt(card.dataset.id);
            renderPlayerDetail(id);
        });
    });
}

// ===== KARTA ZAWODNIKA =====
function renderPlayerDetail(id) {
    const p = players.find(pl => pl.id === id);
    if (!p) return;

    const age = calculateAge(p.birthDay, p.birthMonth, p.birthYear);
    const initials = ((p.firstName?.[0] || "") + (p.lastName?.[0] || "")).toUpperCase() || "?";
    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="player-detail fade-in">
            <button class="back-btn" id="backToPlayers">← Powrót do listy</button>

            <div class="player-header">
                <div class="photo">${initials}</div>
                <div class="main-info">
                    <h2>${p.firstName || ""} ${p.lastName || ""}</h2>
                    <div class="pos">${p.position || ""}</div>
                    <p style="color:#aaa; margin-top:6px;">
                        ${p.birthDay}.${String(p.birthMonth).padStart(2,"0")}.${p.birthYear}
                        (${age} lat)
                    </p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    <div class="label">Lepsza noga</div>
                    <div class="value">${p.preferredFoot || "—"}</div>
                </div>
                <div class="stat-box">
                    <div class="label">Wiek</div>
                    <div class="value">${age}</div>
                </div>
            </div>

            <div class="section">
                <h3>Notatki</h3>
                <p>${p.notes || "Brak notatek"}</p>
            </div>
        </div>
    `;

    document.getElementById("backToPlayers").addEventListener("click", renderPlayers);
}

// ===== NAWIGACJA =====
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    if (tabName === "matches") renderMatches();
    else if (tabName === "trainings") renderTrainings();
    else if (tabName === "players") renderPlayers();
}

// ===== START =====
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.dataset.tab);
        });
    });

    switchTab("matches");
});