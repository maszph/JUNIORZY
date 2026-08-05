// ===== POMOCNICZE =====
function formatDate(dateStr) {
    const d = parseDateOnly(dateStr);
    const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const dayName = days[d.getDay()];
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${dayName} ${day}.${month}.${d.getFullYear()}`;
}

/** Normalizuje datę YYYY-M-D → Date (tylko data, bez czasu) */
function parseDateOnly(dateStr) {
    const parts = String(dateStr || "").trim().split("-");
    if (parts.length !== 3) return new Date(NaN);
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
}

/** Zwraca pełną datę+czas wydarzenia (uwzględnia godzinę) */
function getEventDateTime(item) {
    const d = parseDateOnly(item.date);
    // czyścimy czas z ewentualnych backticków / apostrofów
    let timeStr = String(item.time || "00:00").replace(/[`'"]/g, "").trim();
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10) || 0;
    const min = parseInt(mStr, 10) || 0;
    d.setHours(h, min, 0, 0);
    return d;
}

function isPast(item) {
    return getEventDateTime(item) < new Date();
}

function getNextMatch() {
    return matches
        .filter(m => !isPast(m))
        .sort((a, b) => getEventDateTime(a) - getEventDateTime(b))[0];
}

function getNextTraining() {
    return trainings
        .filter(t => !isPast(t))
        .sort((a, b) => getEventDateTime(a) - getEventDateTime(b))[0];
}

// ===== RENDER MECZE =====
function renderMatches() {
    const content = document.getElementById("content");
    const next = getNextMatch();

    const pastMatches = matches
        .filter(m => isPast(m))
        .sort((a, b) => getEventDateTime(b) - getEventDateTime(a)); // od najnowszych

    const upcoming = matches
        .filter(m => !isPast(m) && (!next || m.id !== next.id))
        .sort((a, b) => getEventDateTime(a) - getEventDateTime(b));

    let html = "";

    // Najbliższy przyszły mecz (duży, podświetlony)
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
                    <span>${next.time.replace(/[`'"]/g, "")}</span>
                    <span class="badge ${isHome ? "home" : "away"}">${next.type}</span>
                </div>
                <p style="color:#aaa; margin-top:12px;">
                    <strong>Stadion:</strong> ${next.place}<br>
                    <strong>Adres:</strong> ${next.address}
                </p>
            </div>
        `;
    } else if (matches.length === 0 || pastMatches.length === matches.length) {
        html += `<div class="card fade-in"><p style="text-align:center;color:#888;">Brak zaplanowanych meczów</p></div>`;
    }

    // Kolejne przyszłe mecze
    if (upcoming.length > 0) {
        html += `<div class="card-title" style="margin:24px 0 12px;">Kolejne mecze</div>`;
        html += `<div class="match-list">`;
        upcoming.forEach(m => {
            const isHome = m.type === "DOM";
            html += `
                <div class="match-item fade-in">
                    <div class="info">
                        <h3>${m.opponent}</h3>
                        <p>${formatDate(m.date)} • ${m.time.replace(/[`'"]/g, "")}</p>
                    </div>
                    <span class="badge ${isHome ? "home" : "away"}">${m.type}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Mecze już odbyte – osobna sekcja
    if (pastMatches.length > 0) {
        html += `<div class="card-title past-section-title" style="margin:32px 0 12px;">Mecze już odbyte</div>`;
        html += `<div class="match-list">`;
        pastMatches.forEach(m => {
            const isHome = m.type === "DOM";
            html += `
                <div class="match-item past-match fade-in">
                    <div class="past-badge">Mecz już się odbył</div>
                    <div class="info">
                        <h3>${m.opponent}</h3>
                        <p>${formatDate(m.date)} • ${m.time.replace(/[`'"]/g, "")}</p>
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
    const next = getNextTraining();

    const pastTrainings = trainings
        .filter(t => isPast(t))
        .sort((a, b) => getEventDateTime(b) - getEventDateTime(a)); // od najnowszych

    const upcoming = trainings
        .filter(t => !isPast(t) && (!next || t.id !== next.id))
        .sort((a, b) => getEventDateTime(a) - getEventDateTime(b));

    let html = "";

    // Najbliższy przyszły trening (duży, podświetlony)
    if (next) {
        html += `
            <div class="card next-training fade-in">
                <div class="card-title">Najbliższy trening</div>
                <div class="training-big-day">${next.day}</div>
                <div class="training-big-time">${next.time.replace(/[`'"]/g, "")} • ${formatDate(next.date)}</div>
                <div class="training-big-place">${next.place}</div>
                <div class="training-big-topic"><strong>Temat:</strong> ${next.topic}</div>
            </div>
        `;
    } else if (trainings.length === 0 || pastTrainings.length === trainings.length) {
        html += `<div class="card fade-in"><p style="text-align:center;color:#888;">Brak zaplanowanych treningów</p></div>`;
    }

    // Kolejne przyszłe treningi
    if (upcoming.length > 0) {
        html += `<div class="card-title" style="margin:24px 0 12px;">Kolejne treningi</div>`;
        html += `<div class="training-grid">`;
        upcoming.forEach(t => {
            html += `
                <div class="training-card fade-in">
                    <div class="day">${t.day}</div>
                    <div class="time">${t.time.replace(/[`'"]/g, "")} • ${formatDate(t.date)}</div>
                    <div class="place">${t.place}</div>
                    <div class="topic"><strong>Temat:</strong> ${t.topic}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Treningi już odbyte – osobna sekcja z dużym napisem
    if (pastTrainings.length > 0) {
        html += `<div class="card-title past-section-title" style="margin:32px 0 12px;">Treningi już odbyte</div>`;
        html += `<div class="training-grid">`;
        pastTrainings.forEach(t => {
            html += `
                <div class="training-card past-training fade-in">
                    <div class="past-badge">Trening już się odbył</div>
                    <div class="day">${t.day}</div>
                    <div class="time">${t.time.replace(/[`'"]/g, "")} • ${formatDate(t.date)}</div>
                    <div class="place">${t.place}</div>
                    <div class="topic"><strong>Temat:</strong> ${t.topic}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    content.innerHTML = html;
}

// ===== NAWIGACJA =====
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    if (tabName === "matches") renderMatches();
    else if (tabName === "trainings") renderTrainings();
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