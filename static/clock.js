const DEFAULT_TIMEZONES = [
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Asia/Dubai'
];

const STORAGE_KEY = 'weather_dashboard_timezones';

let selectedTimezones = [];

window.addEventListener('DOMContentLoaded', () => {
    selectedTimezones = loadTimezones();
    bindEvents();
    renderClocks();
    updateClocks();
    setInterval(updateClocks, 1000);
});

function bindEvents() {
    const addBtn = document.getElementById('addBtn');
    const resetBtn = document.getElementById('resetBtn');
    const timezoneInput = document.getElementById('timezoneInput');

    addBtn.addEventListener('click', addTimezoneFromInput);
    resetBtn.addEventListener('click', resetToDefaults);
    timezoneInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addTimezoneFromInput();
        }
    });
}

function loadTimezones() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length) {
                return parsed;
            }
        } catch (error) {
            console.warn('Bad timezone storage:', error);
        }
    }
    return DEFAULT_TIMEZONES.slice();
}

function saveTimezones() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTimezones));
}

function addTimezoneFromInput() {
    const input = document.getElementById('timezoneInput');
    const raw = input.value.trim();
    if (!raw) {
        return;
    }

    const normalized = normalizeTimezone(raw);
    if (!normalized) {
        alert('Timezone not found. Try formats like "America/New_York" or "Europe/London".');
        return;
    }

    if (selectedTimezones.includes(normalized)) {
        alert('That timezone is already on the page.');
        input.value = '';
        return;
    }

    selectedTimezones.push(normalized);
    saveTimezones();
    renderClocks();
    input.value = '';
}

function normalizeTimezone(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const possible = trimmed.replace(/\\s+/g, '/');
    const exact = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];

    if (exact.includes(trimmed)) {
        return trimmed;
    }

    const match = exact.find((tz) => tz.toLowerCase() === trimmed.toLowerCase() || tz.toLowerCase().endsWith('/' + trimmed.toLowerCase()));
    if (match) return match;

    const alias = exact.find((tz) => tz.toLowerCase().includes(trimmed.toLowerCase()));
    return alias || null;
}

function resetToDefaults() {
    selectedTimezones = DEFAULT_TIMEZONES.slice();
    saveTimezones();
    renderClocks();
    updateClocks();
}

function renderClocks() {
    const clockGrid = document.getElementById('clockGrid');
    clockGrid.innerHTML = '';

    if (!selectedTimezones.length) {
        clockGrid.innerHTML = '<div class="empty">No timezones selected. Add one above.</div>';
        return;
    }

    selectedTimezones.forEach((timezone) => {
        const card = document.createElement('div');
        card.className = 'clock-card new';
        const [region, city] = timezone.split('/');

        card.innerHTML = `
            <button class="remove-btn" aria-label="Remove timezone" data-timezone="${timezone}">×</button>
            <div class="timezone-label">${(city || region).replace(/_/g, ' ')}</div>
            <div class="timezone-region">${region}</div>
            <div class="time" id="time-${timezone}">--:--:--</div>
            <div class="date" id="date-${timezone}">--</div>
            <div class="offset" id="offset-${timezone}">UTC +00:00</div>
        `;

        clockGrid.appendChild(card);
    });

    document.querySelectorAll('.remove-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const timezone = button.dataset.timezone;
            selectedTimezones = selectedTimezones.filter((tz) => tz !== timezone);
            saveTimezones();
            renderClocks();
            updateClocks();
        });
    });
}

function updateClocks() {
    selectedTimezones.forEach((timezone) => {
        const date = new Date();
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const time = timeFormatter.format(date);
        const fullDate = dateFormatter.format(date);
        const offset = getUtcOffset(timezone, date);

        const timeElement = document.getElementById(`time-${timezone}`);
        const dateElement = document.getElementById(`date-${timezone}`);
        const offsetElement = document.getElementById(`offset-${timezone}`);

        if (timeElement) timeElement.textContent = time;
        if (dateElement) dateElement.textContent = fullDate;
        if (offsetElement) offsetElement.textContent = `UTC ${offset}`;
    });
}

function getUtcOffset(timezone, date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset'
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((part) => part.type === 'timeZoneName');
    const value = offsetPart ? offsetPart.value : 'GMT+0';
    return value.replace('GMT', '').replace('UTC', '');
}
