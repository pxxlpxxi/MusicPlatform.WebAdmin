const languageLabels = { da: 'Dansk', en: 'English' };

const pageTitle = document.getElementById('pageTitle');
const tableSelect = document.getElementById('tableSelect');
const tableContainer = document.getElementById('tableContainer');
const languageButton = document.getElementById('languageButton');
const languageMenu = document.getElementById('languageMenu');

let apiBaseUrl = ""


async function loadConfig() {
    const response = await fetch('/api/config');

    if (!response.ok) {
        throw new Error('Could not load API configuration.');
    }

    const config = await response.json();
    apiBaseUrl = config.apiBaseUrl;
}

// Titel-komponent: renderer kun titel og toolbar-label ud fra sprog-tilstanden
function renderLanguage(state) {
    pageTitle.textContent = state.title;
    document.documentElement.lang = state.language;
    document.getElementById('currentFlag').src = `/images/flag-${state.language}.svg`;
    document.getElementById('currentLanguageText').textContent = languageLabels[state.language];
}

// Tabel-komponent ("partial view"): bygger et nyt DOM-fragment og udskifter kun #tableContainer.
// textContent bruges i stedet for innerHTML, så data fra databasen ikke kan køres som HTML (XSS).
function renderTable(table) {
    const fragment = document.createDocumentFragment();

    const heading = document.createElement('h2');
    heading.textContent = table.name;
    fragment.appendChild(heading);

    const tableElement = document.createElement('table');
    const headRow = tableElement.createTHead().insertRow();
    for (const column of table.columns) {
        const th = document.createElement('th');
        th.textContent = column;
        headRow.appendChild(th);
    }

    const body = tableElement.createTBody();
    for (const row of table.rows) {
        const tr = body.insertRow();
        for (const cell of row) {
            tr.insertCell().textContent = cell;
        }
    }
    fragment.appendChild(tableElement);

    if (table.rows.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = '(0 rows)';
        fragment.appendChild(empty);
    }

    tableContainer.replaceChildren(fragment);
}

function renderError(message) {
    const p = document.createElement('p');
    p.className = 'error';
    p.textContent = message;
    tableContainer.replaceChildren(p);
}

async function loadTableNames() {
    const response = await fetch(`${apiBaseUrl}/api/tables`);
    const names = await response.json();
    for (const name of names) {
        tableSelect.add(new Option(name, name));
    }
}

async function loadLanguage() {
    const response = await fetch('/api/language');
    renderLanguage(await response.json());
}

tableSelect.addEventListener('change', async () => {
    const name = tableSelect.value;
    if (!name) {
        tableContainer.replaceChildren();
        return;
    }

    const response = await fetch(
        `${apiBaseUrl}/api/tables/${encodeURIComponent(name)}`
    );

    if (response.ok) {
        renderTable(await response.json());
    } else {
        renderError('Error loading table');
    }
});

languageButton.addEventListener('click', () => {
    languageMenu.hidden = !languageMenu.hidden;
    languageButton.setAttribute('aria-expanded', String(!languageMenu.hidden));
});

document.addEventListener('click', (e) => {
    if (!document.getElementById('languageDropdown').contains(e.target)) {
        languageMenu.hidden = true;
        languageButton.setAttribute('aria-expanded', 'false');
    }
});

// Sprogskift: gemmes i session på serveren, og kun titel-komponenten renderes igen
languageMenu.querySelectorAll('button[data-language]').forEach(button => {
    button.addEventListener('click', async () => {
        const response = await fetch('/api/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: button.dataset.language })
        });
        if (response.ok) {
            renderLanguage(await response.json());
        }
        languageMenu.hidden = true;
        languageButton.setAttribute('aria-expanded', 'false');
    });
});

async function initialize() {
    await loadConfig();

    await loadLanguage();
    await loadTableNames();
}

initialize();

// loadLanguage();
// loadTableNames();
