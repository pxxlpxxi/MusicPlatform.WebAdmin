let databaseStatusInterval = null;

// ************************************************************
// 5.1 DATABASE STATUS CUSTOM CONTROL
// ************************************************************

export async function loadDatabaseStatus(apiBaseUrl) {

    try {

        const response = await fetch(`${apiBaseUrl}/api/tables/status`);

        if (!response.ok) {

            throw new Error('Error loading database status.');
        }

        const status = await response.json();
        renderDatabaseStatus(status);
    }
    catch (error) {

        throw new Error(error);
        // renderError(databaseStatus, error.message);
    }
}

//tag imod status-objektet fra API'et og opret DOM-elementer til at vise database-status. /overtæt til html
// databaseStatus
//        │
//        ├── henter data
//        ├── modtager database - status
//        ├── renderer status
//        └── kan opdateres igen


function renderDatabaseStatus(status) {

    const databaseStatus = document.getElementById('databaseStatus');
    databaseStatus.replaceChildren();

    const heading = document.createElement('span');
    heading.className = 'database-status-heading';
    heading.textContent = 'Database status';

    databaseStatus.appendChild(heading);


    const tableCount = document.createElement('span');
    tableCount.className = 'database-status-count';
    tableCount.textContent = `Tables: ${status.tableCount}`;

    databaseStatus.appendChild(tableCount);


    for (const table of status.tables) {

        const item = document.createElement('span');
        item.className = 'database-status-table';

        item.textContent =
            `${table.name}: ${table.rowCount} rows`;

        databaseStatus.appendChild(item);
    }
}
// ************************************************************
// RENDER ERROR
// ************************************************************

function renderDatabaseStatusError(databaseStatus, message) {

    const errorElement = document.createElement('p');
    errorElement.className = 'error';
    errorElement.textContent = message;

    databaseStatus.replaceChildren(errorElement);
}


// ************************************************************
// AUTOMATIC UPDATES
// ************************************************************


//hvert 5. sekund opdateres database-status via
//loadDatabaseStatus - funktionen. bruger ser altid den nyeste status for databasen uden at skulle opdatere siden manuelt.
//loadDatabaseStatus() -> GET /api/tables/status -> renderDatabaseStatus(status)
export function startDatabaseStatusUpdates(apiBaseUrl) {

    databaseStatusInterval = setInterval(() => loadDatabaseStatus(apiBaseUrl), 5000);

}

// ************************************************************
// STOP AUTOMATIC UPDATES
// ************************************************************
export function stopDatabaseStatusUpdates() {
    if (databaseStatusInterval !== null) {

        clearInterval(databaseStatusInterval);
        databaseStatusInterval = null;
    }
}

// // application/page lukkes -> before unload event -> clearInterval(databaseStatusInterval) for at stoppe opdateringen af database-status.
// window.addEventListener('beforeunload', () => {

//     if (databaseStatusInterval !== null) {

//         clearInterval(databaseStatusInterval);
//         databaseStatusInterval = null;
//     }
// });