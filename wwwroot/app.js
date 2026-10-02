// ============================================================
// MusicPlatform WebAdmin - app.js
// ============================================================
//
// Ansvar:
// 1. Sprogskift
// 2. Hentning af API-konfiguration
// 3. Valg af tabel
// 4. Visning af valgt tabel
// 5. Insert
// 6. Update
// 7. Delete
// 8. Genindlæsning efter CRUD
// 9. Song administration
// 10. Song search
// 11. Add Song
// ============================================================


// ============================================================
// 1. DOM REFERENCES
// ============================================================

const languageLabels = {
    da: 'Dansk',
    en: 'English'
};


const pageTitle =
    document.getElementById('pageTitle');

const tableSelect =
    document.getElementById('tableSelect');

const tableContainer =
    document.getElementById('tableContainer');

const languageButton =
    document.getElementById('languageButton');

const languageMenu =
    document.getElementById('languageMenu');


// ------------------------------------------------------------
// CRUD modal
// ------------------------------------------------------------

const crudModal =
    document.getElementById('crudModal');

const crudForm =
    document.getElementById('crudForm');

const modalTitle =
    document.getElementById('modalTitle');

const formFields =
    document.getElementById('formFields');

const closeModalButton =
    document.getElementById('closeModalButton');

const cancelButton =
    document.getElementById('cancelButton');


// ------------------------------------------------------------
// Song administration
// ------------------------------------------------------------

const songSearch =
    document.getElementById('songSearch');

const loadSongsButton =
    document.getElementById('loadSongsButton');

const addSongButton =
    document.getElementById('addSongButton');

const songContainer =
    document.getElementById('songContainer');


// ------------------------------------------------------------
// Add Song modal
// ------------------------------------------------------------

const songModal =
    document.getElementById('songModal');

const songForm =
    document.getElementById('songForm');

const closeSongModalButton =
    document.getElementById(
        'closeSongModalButton'
    );

const cancelSongButton =
    document.getElementById(
        'cancelSongButton'
    );

const songTitle =
    document.getElementById('songTitle');

const songMainArtist =
    document.getElementById(
        'songMainArtist'
    );

const featuredArtistsContainer =
    document.getElementById(
        'featuredArtistsContainer'
    );

const albumsContainer =
    document.getElementById(
        'albumsContainer'
    );

const mediaContainer =
    document.getElementById(
        'mediaContainer'
    );

const addFeaturedArtistButton =
    document.getElementById(
        'addFeaturedArtistButton'
    );

const addAlbumButton =
    document.getElementById(
        'addAlbumButton'
    );

const addMediaButton =
    document.getElementById(
        'addMediaButton'
    );


// ============================================================
// 2. APPLICATION STATE
// ============================================================

let apiBaseUrl = '';

let currentTable = null;

let currentRow = null;

let currentMode = null;

let currentSong = null;

let songMode = null;


// ============================================================
// 3. API CONFIGURATION
// ============================================================

async function loadConfig() {

    const response =
        await fetch('/api/config');


    if (!response.ok) {

        throw new Error(
            'Could not load API configuration.'
        );
    }


    const config =
        await response.json();


    apiBaseUrl =
        config.apiBaseUrl;
}


// ============================================================
// 4. LANGUAGE
// ============================================================

function renderLanguage(state) {

    pageTitle.textContent =
        state.title;


    document.documentElement.lang =
        state.language;


    document.getElementById(
        'currentFlag'
    ).src =
        `/images/flag-${state.language}.svg`;


    document.getElementById(
        'currentLanguageText'
    ).textContent =
        languageLabels[state.language];
}


async function loadLanguage() {

    const response =
        await fetch('/api/language');


    if (!response.ok) {

        throw new Error(
            'Could not load language.'
        );
    }


    const state =
        await response.json();


    renderLanguage(state);
}


// ------------------------------------------------------------
// Language dropdown
// ------------------------------------------------------------

languageButton.addEventListener(
    'click',
    event => {

        event.stopPropagation();


        languageMenu.hidden =
            !languageMenu.hidden;


        languageButton.setAttribute(
            'aria-expanded',
            String(!languageMenu.hidden)
        );
    }
);


document.addEventListener(
    'click',
    event => {

        const languageDropdown =
            document.getElementById(
                'languageDropdown'
            );


        if (
            !languageDropdown.contains(
                event.target
            )
        ) {

            languageMenu.hidden =
                true;


            languageButton.setAttribute(
                'aria-expanded',
                'false'
            );
        }
    }
);


// ------------------------------------------------------------
// Language selection
// ------------------------------------------------------------

languageMenu
    .querySelectorAll(
        'button[data-language]'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            async () => {

                try {

                    const response =
                        await fetch(
                            '/api/language',
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body:
                                    JSON.stringify({
                                        language:
                                            button.dataset.language
                                    })
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            'Could not change language.'
                        );
                    }


                    const state =
                        await response.json();


                    renderLanguage(state);

                }
                catch (error) {

                    renderError(
                        error.message
                    );
                }


                languageMenu.hidden =
                    true;


                languageButton.setAttribute(
                    'aria-expanded',
                    'false'
                );
            }
        );
    });


// ============================================================
// 5. LOAD TABLE NAMES
// ============================================================

async function loadTableNames() {

    const response =
        await fetch(
            `${apiBaseUrl}/api/tables`
        );


    if (!response.ok) {

        throw new Error(
            'Error loading tables.'
        );
    }


    const names =
        await response.json();


    tableSelect.replaceChildren(
        new Option(
            '-- Select table --',
            ''
        )
    );


    for (const name of names) {

        tableSelect.add(
            new Option(
                name,
                name
            )
        );
    }
}


// ============================================================
// 6. TABLE SELECTION
// ============================================================

tableSelect.addEventListener(
    'change',
    async () => {

        const tableName =
            tableSelect.value;


        if (!tableName) {

            tableContainer.replaceChildren();

            currentTable =
                null;

            return;
        }


        try {

            await loadTable(
                tableName
            );

        }
        catch (error) {

            renderError(
                error.message
            );
        }
    }
);


// ============================================================
// 7. LOAD ONE TABLE
// ============================================================

async function loadTable(tableName) {

    const response =
        await fetch(
            `${apiBaseUrl}/api/tables/${encodeURIComponent(tableName)}`
        );


    if (!response.ok) {

        throw new Error(
            'Error loading table.'
        );
    }


    const table =
        await response.json();


    currentTable =
        table;


    renderTable(
        table
    );
}


// ============================================================
// 8. RENDER TABLE
// ============================================================

function renderTable(table) {

    const fragment =
        document.createDocumentFragment();


    const heading =
        document.createElement('h2');

    heading.textContent =
        table.name;


    fragment.appendChild(
        heading
    );


    // --------------------------------------------------------
    // Insert button
    // --------------------------------------------------------

    const actions =
        document.createElement('div');

    actions.className =
        'table-actions';


    const insertButton =
        document.createElement('button');

    insertButton.type =
        'button';

    insertButton.textContent =
        'Insert';


    insertButton.addEventListener(
        'click',
        () => {

            openCreateDialog(
                table
            );
        }
    );


    actions.appendChild(
        insertButton
    );


    fragment.appendChild(
        actions
    );


    // --------------------------------------------------------
    // Table
    // --------------------------------------------------------

    const tableElement =
        document.createElement('table');


    const headRow =
        tableElement
            .createTHead()
            .insertRow();


    for (const column of table.columns) {

        const th =
            document.createElement('th');

        th.textContent =
            column.name;


        headRow.appendChild(
            th
        );
    }


    const actionHeader =
        document.createElement('th');

    actionHeader.textContent =
        'Actions';


    headRow.appendChild(
        actionHeader
    );


    const body =
        tableElement.createTBody();


    const primaryKeyIndex =
        table.columns.findIndex(
            column =>
                column.isPrimaryKey
        );


    for (const row of table.rows) {

        const tr =
            body.insertRow();


        for (const cell of row) {

            const td =
                tr.insertCell();

            td.textContent =
                cell;
        }


        const actionCell =
            tr.insertCell();


        // ----------------------------------------------------
        // UPDATE
        // ----------------------------------------------------

        if (primaryKeyIndex >= 0) {

            const updateButton =
                document.createElement('button');

            updateButton.type =
                'button';

            updateButton.textContent =
                'Update';


            updateButton.addEventListener(
                'click',
                () => {

                    openEditDialog(
                        table,
                        row
                    );
                }
            );


            actionCell.appendChild(
                updateButton
            );
        }


        // ----------------------------------------------------
        // DELETE
        // ----------------------------------------------------

        if (primaryKeyIndex >= 0) {

            const deleteButton =
                document.createElement('button');

            deleteButton.type =
                'button';

            deleteButton.textContent =
                'Delete';


            deleteButton.addEventListener(
                'click',
                async () => {

                    const primaryKeyValue =
                        row[primaryKeyIndex];


                    await deleteRow(
                        table.name,
                        primaryKeyValue
                    );
                }
            );


            actionCell.appendChild(
                deleteButton
            );
        }
    }


    fragment.appendChild(
        tableElement
    );


    if (table.rows.length === 0) {

        const empty =
            document.createElement('p');

        empty.className =
            'muted';

        empty.textContent =
            '(0 rows)';


        fragment.appendChild(
            empty
        );
    }


    tableContainer.replaceChildren(
        fragment
    );
}


// ============================================================
// 9. CREATE / INSERT
// ============================================================

function openCreateDialog(table) {

    currentTable =
        table;

    currentRow =
        null;

    currentMode =
        'create';


    modalTitle.textContent =
        `Indsæt data i ${table.name}`;


    buildForm(
        table
    );


    crudModal.hidden =
        false;
}


// ============================================================
// 10. UPDATE / EDIT
// ============================================================

function openEditDialog(
    table,
    row
) {

    currentTable =
        table;

    currentRow =
        row;

    currentMode =
        'edit';


    modalTitle.textContent =
        `Rediger ${table.name}`;


    buildForm(
        table,
        row
    );


    crudModal.hidden =
        false;
}


// ============================================================
// 11. BUILD CRUD FORM
// ============================================================

function buildForm(
    table,
    row = null
) {

    formFields.replaceChildren();


    for (const column of table.columns) {

        if (
            column.isPrimaryKey ||
            column.isIdentity
        ) {
            continue;
        }


        const field =
            document.createElement('div');

        field.className =
            'form-field';


        const label =
            document.createElement('label');

        label.textContent =
            column.name;

        label.htmlFor =
            `crud-${column.name}`;


        const input =
            document.createElement('input');

        input.id =
            `crud-${column.name}`;

        input.name =
            column.name;

        input.type =
            getInputType(
                column.dataType
            );


        if (!column.isNullable) {

            input.required =
                true;
        }


        if (row) {

            const columnIndex =
                table.columns.findIndex(
                    c =>
                        c.name === column.name
                );


            const value =
                row[columnIndex];


            if (
                input.type === 'checkbox'
            ) {

                input.checked =
                    value === 'true';

            }
            else {

                input.value =
                    value === 'NULL'
                        ? ''
                        : value;
            }
        }


        field.appendChild(
            label
        );


        field.appendChild(
            input
        );


        formFields.appendChild(
            field
        );
    }
}


// ============================================================
// 12. INPUT TYPE
// ============================================================

function getInputType(dataType) {

    switch (dataType) {

        case 'boolean':
            return 'checkbox';

        case 'date':
            return 'date';

        case 'integer':
        case 'bigint':
        case 'smallint':
        case 'numeric':
        case 'real':
        case 'double precision':
            return 'number';

        default:
            return 'text';
    }
}


// ============================================================
// 13. CLOSE CRUD MODAL
// ============================================================

function closeModal() {

    crudModal.hidden =
        true;

    currentTable =
        null;

    currentRow =
        null;

    currentMode =
        null;

    crudForm.reset();

    formFields.replaceChildren();
}


closeModalButton.addEventListener(
    'click',
    closeModal
);


cancelButton.addEventListener(
    'click',
    closeModal
);


// ============================================================
// 14. CRUD FORM SUBMIT
// ============================================================

crudForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        if (!currentTable) {

            return;
        }


        const values = {};


        const inputs =
            crudForm.querySelectorAll(
                'input'
            );


        for (const input of inputs) {

            if (
                input.type === 'checkbox'
            ) {

                values[input.name] =
                    input.checked
                        ? 'true'
                        : 'false';

            }
            else {

                values[input.name] =
                    input.value === ''
                        ? null
                        : input.value;
            }
        }


        try {

            // ------------------------------------------------
            // INSERT
            // ------------------------------------------------

            if (
                currentMode === 'create'
            ) {

                const response =
                    await fetch(
                        `${apiBaseUrl}/api/tables/${encodeURIComponent(currentTable.name)}/rows`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    values: values
                                })
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();

                    throw new Error(
                        errorText ||
                        'Kunne ikke indsætte data.'
                    );
                }
            }


            // ------------------------------------------------
            // UPDATE
            // ------------------------------------------------

            else if (
                currentMode === 'edit'
            ) {

                const primaryKeyIndex =
                    currentTable.columns.findIndex(
                        column =>
                            column.isPrimaryKey
                    );


                if (
                    primaryKeyIndex < 0
                ) {

                    throw new Error(
                        'Tabellen har ingen primary key.'
                    );
                }


                const primaryKeyValue =
                    currentRow[
                    primaryKeyIndex
                    ];


                const response =
                    await fetch(
                        `${apiBaseUrl}/api/tables/${encodeURIComponent(currentTable.name)}/rows/${encodeURIComponent(primaryKeyValue)}`,
                        {
                            method: 'PUT',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    values: values
                                })
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();

                    throw new Error(
                        errorText ||
                        'Kunne ikke opdatere data.'
                    );
                }
            }


            const tableName =
                currentTable.name;


            closeModal();


            await loadTable(
                tableName
            );


            tableSelect.value =
                tableName;
        }

        catch (error) {

            renderError(
                error.message
            );
        }
    }
);


// ============================================================
// 15. DELETE
// ============================================================

async function deleteRow(
    tableName,
    primaryKeyValue
) {

    const confirmed =
        confirm(
            `Er du sikker på, at du vil slette række ${primaryKeyValue}?`
        );


    if (!confirmed) {

        return;
    }


    try {

        const response =
            await fetch(
                `${apiBaseUrl}/api/tables/${encodeURIComponent(tableName)}/rows/${encodeURIComponent(primaryKeyValue)}`,
                {
                    method: 'DELETE'
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                'Kunne ikke slette data.'
            );
        }


        await loadTable(
            tableName
        );


        tableSelect.value =
            tableName;

    }

    catch (error) {

        renderError(
            error.message
        );
    }
}


// ============================================================
// 16. ERROR DISPLAY
// ============================================================

function renderError(message) {

    const p =
        document.createElement('p');


    p.className =
        'error';


    p.textContent =
        message;


    tableContainer.replaceChildren(
        p
    );
}


// ============================================================
// 17. LOAD SONGS
// ============================================================

async function loadSongs() {

    try {

        const response =
            await fetch(
                `${apiBaseUrl}/api/songs`
            );


        if (!response.ok) {

            throw new Error(
                'Error loading songs.'
            );
        }


        const songs =
            await response.json();


        renderSongCards(
            songs
        );

    }

    catch (error) {

        songContainer.replaceChildren();


        const errorElement =
            document.createElement('p');


        errorElement.className =
            'error';


        errorElement.textContent =
            error.message;


        songContainer.appendChild(
            errorElement
        );
    }
}

// ============================================================
// 18. LOAD SONGS
// ============================================================

async function deleteSong(song) {

    const confirmed =
        confirm(
            `Are you sure you want to delete "${song.title}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${apiBaseUrl}/api/songs/${encodeURIComponent(song.id)}`,
                {
                    method: 'DELETE'
                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                'Error deleting song.'
            );
        }

        await searchSongs(
            songSearch.value
        );

    }
    catch (error) {

        songContainer.replaceChildren();

        const errorElement =
            document.createElement('p');

        errorElement.className =
            'error';

        errorElement.textContent =
            error.message;

        songContainer.appendChild(
            errorElement
        );
    }
}

// ============================================================
// 19. SEARCH SONGS
// ============================================================

async function searchSongs(term) {

    if (!term.trim()) {

        await loadSongs();

        return;
    }


    try {

        const response =
            await fetch(
                `${apiBaseUrl}/api/songs/search?term=${encodeURIComponent(term)}`
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                errorText ||
                'Error searching songs.'
            );
        }


        const songs =
            await response.json();


        renderSongCards(
            songs
        );

    }

    catch (error) {

        songContainer.replaceChildren();


        const errorElement =
            document.createElement('p');


        errorElement.className =
            'error';


        errorElement.textContent =
            error.message;


        songContainer.appendChild(
            errorElement
        );
    }
}


// ============================================================
// 20. RENDER SONG CARDS
// ============================================================

function renderSongCards(songs) {

    songContainer.replaceChildren();


    if (songs.length === 0) {

        const empty =
            document.createElement('p');


        empty.className =
            'muted';


        empty.textContent =
            'No songs found.';


        songContainer.appendChild(
            empty
        );


        return;
    }


    const fragment =
        document.createDocumentFragment();


    for (const song of songs) {

        const card =
            document.createElement('article');


        card.className =
            'song-card';


        // ----------------------------------------------------
        // Title
        // ----------------------------------------------------

        const title =
            document.createElement('h3');


        title.textContent =
            song.title;


        card.appendChild(
            title
        );


        // ----------------------------------------------------
        // Main artist
        // ----------------------------------------------------

        const artist =
            document.createElement('p');


        artist.className =
            'song-artist';


        artist.textContent =
            song.mainArtist;


        card.appendChild(
            artist
        );


        // ----------------------------------------------------
        // Featured artists
        // ----------------------------------------------------

        if (
            song.featuredArtists &&
            song.featuredArtists.length > 0
        ) {

            const featured =
                document.createElement('p');


            featured.textContent =
                `Featuring: ${song.featuredArtists.join(', ')}`;


            card.appendChild(
                featured
            );
        }


        // ----------------------------------------------------
        // Albums
        // ----------------------------------------------------

        if (
            song.albums &&
            song.albums.length > 0
        ) {

            const albumHeading =
                document.createElement('strong');


            albumHeading.textContent =
                'Albums';


            card.appendChild(
                albumHeading
            );


            const albumList =
                document.createElement('ul');


            for (const album of song.albums) {

                const item =
                    document.createElement('li');


                item.textContent =
                    album.releaseDate
                        ? `${album.title} (${album.releaseDate})`
                        : album.title;


                albumList.appendChild(
                    item
                );
            }


            card.appendChild(
                albumList
            );
        }


        // ----------------------------------------------------
        // Media
        // ----------------------------------------------------

        if (
            song.media &&
            song.media.length > 0
        ) {

            const mediaHeading =
                document.createElement('strong');


            mediaHeading.textContent =
                'Media';


            card.appendChild(
                mediaHeading
            );


            const mediaList =
                document.createElement('ul');


            for (const media of song.media) {

                const item =
                    document.createElement('li');


                item.textContent =
                    `${media.type}: ${media.externalId}`;


                mediaList.appendChild(
                    item
                );
            }


            card.appendChild(
                mediaList
            );
        }
        // ----------------------------------------------------
        // Actions
        // ----------------------------------------------------

        const actions =
            document.createElement('div');

        actions.className =
            'song-card-actions';


        // ----------------------------------------------------
        // Edit
        // ----------------------------------------------------

        const editButton =
            document.createElement('button');

        editButton.type =
            'button';

        editButton.textContent =
            'Edit';

        editButton.addEventListener(
            'click',
            () => {
                editSong(song);
            }
        );

        actions.appendChild(
            editButton
        );


        // ----------------------------------------------------
        // Delete
        // ----------------------------------------------------

        const deleteButton =
            document.createElement('button');

        deleteButton.type =
            'button';

        deleteButton.textContent =
            'Delete';

        deleteButton.addEventListener(
            'click',
            () => {
                deleteSong(song);
            }
        );

        actions.appendChild(
            deleteButton
        );


        card.appendChild(
            actions
        );

        fragment.appendChild(
            card
        );
    }


    songContainer.appendChild(
        fragment
    );
}


// ============================================================
// 20.5 EDIT SONG
// ============================================================

function editSong(song) {
    openSongModal(song);
}

// ============================================================
// 21. SONG SEARCH EVENT
// ============================================================

loadSongsButton.addEventListener(
    'click',
    loadSongs
);


songSearch.addEventListener(
    'input',
    async () => {

        await searchSongs(
            songSearch.value
        );
    }
);

// ============================================================
// 22. ADD / EDIT SONG MODAL
// ============================================================

function openSongModal(song = null) {

    songForm.reset();

    featuredArtistsContainer.replaceChildren();

    albumsContainer.replaceChildren();

    mediaContainer.replaceChildren();


    // --------------------------------------------------------
    // ADD
    // --------------------------------------------------------

    if (!song) {

        currentSongId =
            null;

        songModal.hidden =
            false;

        return;
    }


    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    currentSongId =
        song.id;


    songTitle.value =
        song.title || '';


    songMainArtist.value =
        song.mainArtist || '';


    // --------------------------------------------------------
    // Featured artists
    // --------------------------------------------------------

    if (
        song.featuredArtists &&
        song.featuredArtists.length > 0
    ) {

        for (
            const artist
            of song.featuredArtists
        ) {

            addFeaturedArtistField(
                artist
            );
        }
    }


    // --------------------------------------------------------
    // Albums
    // --------------------------------------------------------

    if (
        song.albums &&
        song.albums.length > 0
    ) {

        for (
            const album
            of song.albums
        ) {

            addAlbumField(
                album
            );
        }
    }


    // --------------------------------------------------------
    // Media
    // --------------------------------------------------------

    if (
        song.media &&
        song.media.length > 0
    ) {

        for (
            const media
            of song.media
        ) {

            addMediaField(
                media
            );
        }
    }


    songModal.hidden =
        false;
}


function closeSongModal() {

    songModal.hidden =
        true;

    songForm.reset();

    featuredArtistsContainer.replaceChildren();

    albumsContainer.replaceChildren();

    mediaContainer.replaceChildren();

    currentSongId =
        null;
}


// ------------------------------------------------------------
// Add Song button
// ------------------------------------------------------------

addSongButton.addEventListener(
    'click',
    () => {

        openSongModal();
    }
);


// ------------------------------------------------------------
// Close buttons
// ------------------------------------------------------------

closeSongModalButton.addEventListener(
    'click',
    closeSongModal
);


cancelSongButton.addEventListener(
    'click',
    closeSongModal
);

// // ============================================================
// // 22. ADD SONG MODAL
// // ============================================================
// function openSongModal(song = null) {

//     currentSong =
//         song;

//     songMode =
//         song
//             ? 'edit'
//             : 'create';


//     songForm.reset();

//     featuredArtistsContainer.replaceChildren();

//     albumsContainer.replaceChildren();

//     mediaContainer.replaceChildren();


//     if (song) {

//         songTitle.value =
//             song.title || '';

//         songMainArtist.value =
//             song.mainArtist || '';


//         // ----------------------------------------------------
//         // Featured artists
//         // ----------------------------------------------------

//         if (
//             song.featuredArtists &&
//             song.featuredArtists.length > 0
//         ) {

//             for (
//                 const artist
//                 of song.featuredArtists
//             ) {

//                 addFeaturedArtistField(
//                     artist
//                 );
//             }
//         }


//         // ----------------------------------------------------
//         // Albums
//         // ----------------------------------------------------

//         if (
//             song.albums &&
//             song.albums.length > 0
//         ) {

//             for (
//                 const album
//                 of song.albums
//             ) {

//                 addAlbumField(
//                     album
//                 );
//             }
//         }


//         // ----------------------------------------------------
//         // Media
//         // ----------------------------------------------------

//         if (
//             song.media &&
//             song.media.length > 0
//         ) {

//             for (
//                 const media
//                 of song.media
//             ) {

//                 addMediaField(
//                     media
//                 );
//             }
//         }
//     }


//     songModal.hidden =
//         false;
// }

// // function openSongModal() {

// //     songForm.reset();

// //     featuredArtistsContainer.replaceChildren();

// //     albumsContainer.replaceChildren();

// //     mediaContainer.replaceChildren();

// //     songModal.hidden =
// //         false;
// // }
// function closeSongModal() {

//     songModal.hidden =
//         true;


//     currentSong =
//         null;

//     songMode =
//         null;


//     songForm.reset();

//     featuredArtistsContainer.replaceChildren();

//     albumsContainer.replaceChildren();

//     mediaContainer.replaceChildren();
// }


// // function closeSongModal() {

// //     songModal.hidden =
// //         true;

// //     songForm.reset();

// //     featuredArtistsContainer.replaceChildren();

// //     albumsContainer.replaceChildren();

// //     mediaContainer.replaceChildren();
// // }


// // ------------------------------------------------------------
// // Add Song button
// // ------------------------------------------------------------

// addSongButton.addEventListener(
//     'click',
//     openSongModal
// );


// // ------------------------------------------------------------
// // Close buttons
// // ------------------------------------------------------------

// closeSongModalButton.addEventListener(
//     'click',
//     closeSongModal
// );


// cancelSongButton.addEventListener(
//     'click',
//     closeSongModal
// );


// ============================================================
// 23. FEATURED ARTISTS
// ============================================================
function addFeaturedArtistField(
    artistName = ''
) {

    const row =
        document.createElement('div');

    row.className =
        'dynamic-form-row';


    const field =
        document.createElement('div');

    field.className =
        'form-field';


    const label =
        document.createElement('label');

    label.textContent =
        'Artist';


    const input =
        document.createElement('input');

    input.type =
        'text';

    input.className =
        'featured-artist-input';

    input.value =
        artistName;


    field.appendChild(
        label
    );

    field.appendChild(
        input
    );


    const removeButton =
        document.createElement('button');

    removeButton.type =
        'button';

    removeButton.textContent =
        'Remove';


    removeButton.addEventListener(
        'click',
        () => {

            row.remove();
        }
    );


    row.appendChild(
        field
    );

    row.appendChild(
        removeButton
    );


    featuredArtistsContainer.appendChild(
        row
    );
}


addFeaturedArtistButton.addEventListener(
    'click',
    () => {

        addFeaturedArtistField();
    }
);

// function addFeaturedArtistField(artist = '') {


//     const row =
//         document.createElement('div');

//     row.className =
//         'dynamic-form-row';


//     const field =
//         document.createElement('div');

//     field.className =
//         'form-field';


//     const label =
//         document.createElement('label');

//     label.textContent =
//         'Artist';


//     const input =
//         document.createElement('input');

//     input.type =
//         'text';

//     input.className =
//         'featured-artist-input';

//     input.value =
//         artist;

//     field.appendChild(
//         label
//     );

//     field.appendChild(
//         input
//     );


//     const removeButton =
//         document.createElement('button');

//     removeButton.type =
//         'button';

//     removeButton.textContent =
//         'Remove';


//     removeButton.addEventListener(
//         'click',
//         () => {

//             row.remove();
//         }
//     );


//     row.appendChild(
//         field
//     );

//     row.appendChild(
//         removeButton
//     );


//     featuredArtistsContainer.appendChild(
//         row
//     );
// }


// addFeaturedArtistButton.addEventListener(
//     'click',
//     addFeaturedArtistField
// );


// ============================================================
// 24. ALBUMS
// ============================================================
function addAlbumField(
    album = null
) {

    const row =
        document.createElement('div');

    row.className =
        'dynamic-form-row';


    // --------------------------------------------------------
    // Title
    // --------------------------------------------------------

    const titleField =
        document.createElement('div');

    titleField.className =
        'form-field';


    const titleLabel =
        document.createElement('label');

    titleLabel.textContent =
        'Album title';


    const titleInput =
        document.createElement('input');

    titleInput.type =
        'text';

    titleInput.className =
        'album-title-input';

    titleInput.value =
        album?.title || '';


    titleField.appendChild(
        titleLabel
    );

    titleField.appendChild(
        titleInput
    );


    // --------------------------------------------------------
    // Release date
    // --------------------------------------------------------

    const dateField =
        document.createElement('div');

    dateField.className =
        'form-field';


    const dateLabel =
        document.createElement('label');

    dateLabel.textContent =
        'Release date';


    const dateInput =
        document.createElement('input');

    dateInput.type =
        'date';

    dateInput.className =
        'album-date-input';

    dateInput.value =
        album?.releaseDate || '';


    dateField.appendChild(
        dateLabel
    );

    dateField.appendChild(
        dateInput
    );


    // --------------------------------------------------------
    // Remove
    // --------------------------------------------------------

    const removeButton =
        document.createElement('button');

    removeButton.type =
        'button';

    removeButton.textContent =
        'Remove';


    removeButton.addEventListener(
        'click',
        () => {

            row.remove();
        }
    );


    row.appendChild(
        titleField
    );

    row.appendChild(
        dateField
    );

    row.appendChild(
        removeButton
    );


    albumsContainer.appendChild(
        row
    );
}


addAlbumButton.addEventListener(
    'click',
    () => {

        addAlbumField();
    }
);

// function addAlbumField(album = '') {

//     const row =
//         document.createElement('div');

//     row.className =
//         'dynamic-form-row';


//     // --------------------------------------------------------
//     // Title
//     // --------------------------------------------------------

//     const titleField =
//         document.createElement('div');

//     titleField.className =
//         'form-field';


//     const titleLabel =
//         document.createElement('label');

//     titleLabel.textContent =
//         'Album title';


//     const titleInput =
//         document.createElement('input');

//     titleInput.type =
//         'text';

//     titleInput.className =
//         'album-title-input';

//     titleInput.value =
//         album?.title || '';

//     titleField.appendChild(
//         titleLabel
//     );

//     titleField.appendChild(
//         titleInput
//     );


//     // --------------------------------------------------------
//     // Release date
//     // --------------------------------------------------------

//     const dateField =
//         document.createElement('div');

//     dateField.className =
//         'form-field';


//     const dateLabel =
//         document.createElement('label');

//     dateLabel.textContent =
//         'Release date';


//     const dateInput =
//         document.createElement('input');

//     dateInput.type =
//         'date';

//     dateInput.className =
//         'album-date-input';

//     dateInput.value =
//         album?.releaseDate || '';


//     dateField.appendChild(
//         dateLabel
//     );

//     dateField.appendChild(
//         dateInput
//     );


//     // --------------------------------------------------------
//     // Remove
//     // --------------------------------------------------------

//     const removeButton =
//         document.createElement('button');

//     removeButton.type =
//         'button';

//     removeButton.textContent =
//         'Remove';


//     removeButton.addEventListener(
//         'click',
//         () => {

//             row.remove();
//         }
//     );


//     row.appendChild(
//         titleField
//     );

//     row.appendChild(
//         dateField
//     );

//     row.appendChild(
//         removeButton
//     );


//     albumsContainer.appendChild(
//         row
//     );
// }


// addAlbumButton.addEventListener(
//     'click',
//     addAlbumField
// );


// ============================================================
// 25. MEDIA
// ============================================================
function addMediaField(
    media = null
) {

    const row =
        document.createElement('div');

    row.className =
        'dynamic-form-row';


    // --------------------------------------------------------
    // Type
    // --------------------------------------------------------

    const typeField =
        document.createElement('div');

    typeField.className =
        'form-field media-type-field';


    const typeLabel =
        document.createElement('label');

    typeLabel.textContent =
        'Type';


    const typeSelect =
        document.createElement('select');

    typeSelect.className =
        'media-type-input';


    const types = [
        'YouTube',
        'Spotify',
        'SoundCloud'
    ];


    for (const type of types) {

        typeSelect.add(
            new Option(
                type,
                type
            )
        );
    }


    if (media?.type) {

        typeSelect.value =
            media.type;
    }


    typeField.appendChild(
        typeLabel
    );

    typeField.appendChild(
        typeSelect
    );


    // --------------------------------------------------------
    // External ID
    // --------------------------------------------------------

    const externalIdField =
        document.createElement('div');

    externalIdField.className =
        'form-field';


    const externalIdLabel =
        document.createElement('label');

    externalIdLabel.textContent =
        'Link / external ID';


    const externalIdInput =
        document.createElement('input');

    externalIdInput.type =
        'text';

    externalIdInput.className =
        'media-external-id-input';

    externalIdInput.required =
        true;

    externalIdInput.value =
        media?.externalId || '';


    externalIdField.appendChild(
        externalIdLabel
    );

    externalIdField.appendChild(
        externalIdInput
    );


    // --------------------------------------------------------
    // Remove
    // --------------------------------------------------------

    const removeButton =
        document.createElement('button');

    removeButton.type =
        'button';

    removeButton.textContent =
        'Remove';


    removeButton.addEventListener(
        'click',
        () => {

            row.remove();
        }
    );


    row.appendChild(
        typeField
    );

    row.appendChild(
        externalIdField
    );

    row.appendChild(
        removeButton
    );


    mediaContainer.appendChild(
        row
    );
}


addMediaButton.addEventListener(
    'click',
    () => {

        addMediaField();
    }
);

// function addMediaField(media = '') {

//     const row =
//         document.createElement('div');

//     row.className =
//         'dynamic-form-row';


//     // --------------------------------------------------------
//     // Type
//     // --------------------------------------------------------

//     const typeField =
//         document.createElement('div');

//     typeField.className =
//         'form-field media-type-field';


//     const typeLabel =
//         document.createElement('label');

//     typeLabel.textContent =
//         'Type';


//     const typeSelect =
//         document.createElement('select');

//     typeSelect.className =
//         'media-type-input';


//     const types = [
//         'YouTube',
//         'Spotify',
//         'SoundCloud'
//     ];


//     for (const type of types) {

//         typeSelect.add(
//             new Option(
//                 type,
//                 type
//             )
//         );
//     }

//     if (media?.type) {
//         typeSelect.value = media.type;
//     }

//     typeField.appendChild(
//         typeLabel
//     );

//     typeField.appendChild(
//         typeSelect
//     );


//     // --------------------------------------------------------
//     // External ID
//     // --------------------------------------------------------

//     const externalIdField =
//         document.createElement('div');

//     externalIdField.className =
//         'form-field';


//     const externalIdLabel =
//         document.createElement('label');

//     externalIdLabel.textContent =
//         'Link / external ID';


//     const externalIdInput =
//         document.createElement('input');

//     externalIdInput.type =
//         'text';

//     externalIdInput.className =
//         'media-external-id-input';

//     externalIdInput.required =
//         true;

//     externalIdInput.value =
//         media?.externalId || '';

//     externalIdField.appendChild(
//         externalIdLabel
//     );

//     externalIdField.appendChild(
//         externalIdInput
//     );


//     // --------------------------------------------------------
//     // Remove
//     // --------------------------------------------------------

//     const removeButton =
//         document.createElement('button');

//     removeButton.type =
//         'button';

//     removeButton.textContent =
//         'Remove';


//     removeButton.addEventListener(
//         'click',
//         () => {

//             row.remove();
//         }
//     );


//     row.appendChild(
//         typeField
//     );

//     row.appendChild(
//         externalIdField
//     );

//     row.appendChild(
//         removeButton
//     );


//     mediaContainer.appendChild(
//         row
//     );
// }


// addMediaButton.addEventListener(
//     'click',
//     addMediaField
// );


// ============================================================
// 26. SAVE SONG
// ============================================================
// ============================================================
// 26. SAVE SONG
// ============================================================

songForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        const request = {

            title:
                songTitle.value.trim(),

            mainArtist:
                songMainArtist.value.trim(),

            featuredArtists: [],

            albums: [],

            media: []
        };


        // ----------------------------------------------------
        // Featured artists
        // ----------------------------------------------------

        const featuredInputs =
            featuredArtistsContainer
                .querySelectorAll(
                    '.featured-artist-input'
                );


        for (const input of featuredInputs) {

            const value =
                input.value.trim();


            if (value) {

                request.featuredArtists.push(
                    value
                );
            }
        }


        // ----------------------------------------------------
        // Albums
        // ----------------------------------------------------

        const albumRows =
            albumsContainer
                .querySelectorAll(
                    '.dynamic-form-row'
                );


        for (const row of albumRows) {

            const titleInput =
                row.querySelector(
                    '.album-title-input'
                );


            const dateInput =
                row.querySelector(
                    '.album-date-input'
                );


            const title =
                titleInput.value.trim();


            const releaseDate =
                dateInput.value;


            if (!title) {

                continue;
            }


            request.albums.push({

                title:
                    title,

                releaseDate:
                    releaseDate || null

            });
        }


        // ----------------------------------------------------
        // Media
        // ----------------------------------------------------

        const mediaRows =
            mediaContainer
                .querySelectorAll(
                    '.dynamic-form-row'
                );


        for (const row of mediaRows) {

            const typeInput =
                row.querySelector(
                    '.media-type-input'
                );


            const externalIdInput =
                row.querySelector(
                    '.media-external-id-input'
                );


            const externalId =
                externalIdInput.value.trim();


            if (!externalId) {

                continue;
            }


            request.media.push({

                type:
                    typeInput.value,

                externalId:
                    externalId

            });
        }


        // ----------------------------------------------------
        // Determine ADD or EDIT
        // ----------------------------------------------------

        const isEditing =
            currentSongId !== null;


        const url =
            isEditing

                ? `${apiBaseUrl}/api/songs/${encodeURIComponent(currentSongId)}`

                : `${apiBaseUrl}/api/songs`;


        const method =
            isEditing
                ? 'PUT'
                : 'POST';


        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------

        try {

            const response =
                await fetch(
                    url,
                    {
                        method:
                            method,

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(
                                request
                            )
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                throw new Error(
                    errorText ||
                    (
                        isEditing
                            ? 'Could not update song.'
                            : 'Could not create song.'
                    )
                );
            }


            // ------------------------------------------------
            // Success
            // ------------------------------------------------

            closeSongModal();


            await searchSongs(
                songSearch.value
            );

        }

        catch (error) {

            const errorElement =
                document.createElement('p');


            errorElement.className =
                'error';


            errorElement.textContent =
                error.message;


            songModal
                .querySelector(
                    '.modal-content'
                )
                .appendChild(
                    errorElement
                );
        }
    }
);

// songForm.addEventListener(
//     'submit',
//     async event => {

//         event.preventDefault();


//         const request = {

//             title:
//                 songTitle.value.trim(),

//             mainArtist:
//                 songMainArtist.value.trim(),

//             featuredArtists: [],

//             albums: [],

//             media: []
//         };


//         // ----------------------------------------------------
//         // Featured artists
//         // ----------------------------------------------------

//         const featuredInputs =
//             featuredArtistsContainer
//                 .querySelectorAll(
//                     '.featured-artist-input'
//                 );


//         for (const input of featuredInputs) {

//             const value =
//                 input.value.trim();


//             if (value) {

//                 request.featuredArtists.push(
//                     value
//                 );
//             }
//         }


//         // ----------------------------------------------------
//         // Albums
//         // ----------------------------------------------------

//         const albumRows =
//             albumsContainer
//                 .querySelectorAll(
//                     '.dynamic-form-row'
//                 );


//         for (const row of albumRows) {

//             const titleInput =
//                 row.querySelector(
//                     '.album-title-input'
//                 );


//             const dateInput =
//                 row.querySelector(
//                     '.album-date-input'
//                 );


//             const title =
//                 titleInput.value.trim();


//             const releaseDate =
//                 dateInput.value;


//             if (!title) {

//                 continue;
//             }


//             request.albums.push({

//                 title:
//                     title,

//                 releaseDate:
//                     releaseDate || null

//             });
//         }


//         // ----------------------------------------------------
//         // Media
//         // ----------------------------------------------------

//         const mediaRows =
//             mediaContainer
//                 .querySelectorAll(
//                     '.dynamic-form-row'
//                 );


//         for (const row of mediaRows) {

//             const typeInput =
//                 row.querySelector(
//                     '.media-type-input'
//                 );


//             const externalIdInput =
//                 row.querySelector(
//                     '.media-external-id-input'
//                 );


//             const externalId =
//                 externalIdInput.value.trim();


//             if (!externalId) {

//                 continue;
//             }


//             request.media.push({

//                 type:
//                     typeInput.value,

//                 externalId:
//                     externalId

//             });
//         }

//         // ========================================================
//         // SAVE SONG
//         // ========================================================

//         try {

//             let response;


//             // ----------------------------------------------------
//             // CREATE
//             // ----------------------------------------------------

//             if (
//                 songMode === 'create'
//             ) {

//                 response =
//                     await fetch(
//                         `${apiBaseUrl}/api/songs`,
//                         {
//                             method: 'POST',

//                             headers: {
//                                 'Content-Type':
//                                     'application/json'
//                             },

//                             body:
//                                 JSON.stringify(request)
//                         }
//                     );
//             }


//             // ----------------------------------------------------
//             // EDIT
//             // ----------------------------------------------------

//             else if (
//                 songMode === 'edit'
//             ) {

//                 if (!currentSong?.id) {

//                     throw new Error(
//                         'No song selected for editing.'
//                     );
//                 }


//                 response =
//                     await fetch(
//                         `${apiBaseUrl}/api/songs/${encodeURIComponent(currentSong.id)}`,
//                         {
//                             method: 'PUT',

//                             headers: {
//                                 'Content-Type':
//                                     'application/json'
//                             },

//                             body:
//                                 JSON.stringify(request)
//                         }
//                     );
//             }


//             else {

//                 throw new Error(
//                     'Unknown song mode.'
//                 );
//             }


//             // ----------------------------------------------------
//             // ERROR
//             // ----------------------------------------------------

//             if (!response.ok) {

//                 const errorText =
//                     await response.text();


//                 throw new Error(
//                     errorText ||
//                     'Could not save song.'
//                 );
//             }


//             // ----------------------------------------------------
//             // SUCCESS
//             // ----------------------------------------------------

//             closeSongModal();


//             await searchSongs(
//                 songSearch.value
//             );

//         }

//         catch (error) {

//             const errorElement =
//                 document.createElement('p');


//             errorElement.className =
//                 'error';


//             errorElement.textContent =
//                 error.message;


//             songModal
//                 .querySelector(
//                     '.modal-content'
//                 )
//                 .appendChild(
//                     errorElement
//                 );
//         }
//     }
// );


// // ----------------------------------------------------
// // POST /api/songs
// // ----------------------------------------------------

// try {

//     const response =
//         await fetch(
//             `${apiBaseUrl}/api/songs`,
//             {
//                 method: 'POST',

//                 headers: {
//                     'Content-Type':
//                         'application/json'
//                 },

//                 body:
//                     JSON.stringify(request)
//             }
//         );


//     if (!response.ok) {

//         const errorText =
//             await response.text();


//         throw new Error(
//             errorText ||
//             'Could not create song.'
//         );
//     }


//     // ------------------------------------------------
//     // Success
//     // ------------------------------------------------

//     closeSongModal();


//     await loadSongs();

// }

// catch (error) {

//     const errorElement =
//         document.createElement('p');


//     errorElement.className =
//         'error';


//     errorElement.textContent =
//         error.message;


//     songModal
//         .querySelector(
//             '.modal-content'
//         )
//         .appendChild(
//             errorElement
//         );
// }
//     }
// );


// ============================================================
// 27. INITIALIZATION
// ============================================================
//
// Rækkefølge:
//
// 1. Hent API URL
// 2. Hent sprog
// 3. Hent tabelnavne
// ============================================================

async function initialize() {

    try {

        await loadConfig();

        await loadLanguage();

        await loadTableNames();

    }

    catch (error) {

        renderError(
            error.message
        );
    }
}


// Start applikationen.

initialize();
// // ============================================================
// // MusicPlatform WebAdmin - app.js
// // ============================================================
// //
// // Ansvar:
// // 1. Sprogskift
// // 2. Hentning af API-konfiguration
// // 3. Valg af tabel
// // 4. Visning af valgt tabel
// // 5. Insert
// // 6. Update
// // 7. Delete
// // 8. Genindlæsning efter CRUD
// //
// // UI Design Pattern:
// // Master-Detail
// //
// // Master:
// // tableSelect
// //
// // Detail:
// // tableContainer
// //
// // Event-handling:
// // - change på tableSelect
// // - click på languageButton
// // - click på Insert
// // - click på Update
// // - click på Delete
// // - submit på CRUD-formular
// // ============================================================

// // ============================================================
// // 1. DOM REFERENCES
// // ============================================================

// const languageLabels = {
//     da: 'Dansk',
//     en: 'English'
// };

// const pageTitle =
//     document.getElementById('pageTitle');

// const tableSelect =
//     document.getElementById('tableSelect');

// const tableContainer =
//     document.getElementById('tableContainer');

// const languageButton =
//     document.getElementById('languageButton');

// const languageMenu =
//     document.getElementById('languageMenu');

// // ------------------------------------------------------------
// // CRUD modal
// // ------------------------------------------------------------

// const crudModal =
//     document.getElementById('crudModal');

// const crudForm =
//     document.getElementById('crudForm');

// const modalTitle =
//     document.getElementById('modalTitle');

// const formFields =
//     document.getElementById('formFields');

// const closeModalButton =
//     document.getElementById('closeModalButton');

// const cancelButton =
//     document.getElementById('cancelButton');

// // ============================================================
// // 2. APPLICATION STATE
// // ============================================================

// let apiBaseUrl = '';

// // Den tabel der aktuelt vises.
// let currentTable = null;

// // Den række der aktuelt redigeres.
// // null når vi laver Insert.
// let currentRow = null;

// // Mulige værdier:
// // 'create'
// // 'edit'
// // null
// let currentMode = null;

// // ============================================================
// // 3. API CONFIGURATION
// // ============================================================

// async function loadConfig() {

//     const response =
//         await fetch('/api/config');

//     if (!response.ok) {

//         throw new Error(
//             'Could not load API configuration.'
//         );
//     }

//     const config =
//         await response.json();

//     apiBaseUrl =
//         config.apiBaseUrl;

// }

// // ============================================================
// // 4. LANGUAGE
// // ============================================================

// function renderLanguage(state) {

//     pageTitle.textContent =
//         state.title;

//     document.documentElement.lang =
//         state.language;

//     document.getElementById(
//         'currentFlag'
//     ).src =
//         `/images/flag-${state.language}.svg`;

//     document.getElementById(
//         'currentLanguageText'
//     ).textContent =
//         languageLabels[state.language];

// }

// async function loadLanguage() {

//     const response =
//         await fetch('/api/language');

//     if (!response.ok) {

//         throw new Error(
//             'Could not load language.'
//         );
//     }

//     const state =
//         await response.json();

//     renderLanguage(state);

// }

// // ------------------------------------------------------------
// // Language dropdown - click event
// // ------------------------------------------------------------

// languageButton.addEventListener(
//     'click',
//     event => {

//         event.stopPropagation();

//         languageMenu.hidden =
//             !languageMenu.hidden;

//         languageButton.setAttribute(
//             'aria-expanded',
//             String(!languageMenu.hidden)
//         );
//     }

// );

// // ------------------------------------------------------------
// // Luk language dropdown ved klik udenfor
// // ------------------------------------------------------------

// document.addEventListener(
//     'click',
//     event => {

//         const languageDropdown =
//             document.getElementById(
//                 'languageDropdown'
//             );

//         if (!languageDropdown.contains(event.target)) {

//             languageMenu.hidden =
//                 true;

//             languageButton.setAttribute(
//                 'aria-expanded',
//                 'false'
//             );
//         }
//     }

// );

// // ------------------------------------------------------------
// // Language selection
// // ------------------------------------------------------------

// languageMenu
//     .querySelectorAll(
//         'button[data-language]'
//     )
//     .forEach(button => {

//         button.addEventListener(
//             'click',
//             async () => {

//                 try {

//                     const response =
//                         await fetch(
//                             '/api/language',
//                             {
//                                 method: 'POST',

//                                 headers: {
//                                     'Content-Type':
//                                         'application/json'
//                                 },

//                                 body:
//                                     JSON.stringify({
//                                         language:
//                                             button.dataset.language
//                                     })
//                             }
//                         );

//                     if (!response.ok) {

//                         throw new Error(
//                             'Could not change language.'
//                         );
//                     }

//                     const state =
//                         await response.json();

//                     renderLanguage(state);

//                 }
//                 catch (error) {

//                     renderError(
//                         error.message
//                     );
//                 }

//                 languageMenu.hidden =
//                     true;

//                 languageButton.setAttribute(
//                     'aria-expanded',
//                     'false'
//                 );
//             }
//         );
//     });

// // ============================================================
// // 5. LOAD TABLE NAMES
// // ============================================================
// //
// // Henter:
// // GET /api/tables
// //
// // Dette fylder Master-delen:
// // tableSelect
// // ============================================================

// async function loadTableNames() {

//     const response =
//         await fetch(
//             `${apiBaseUrl}/api/tables`
//         );

//     if (!response.ok) {

//         throw new Error(
//             'Error loading tables.'
//         );
//     }

//     const names =
//         await response.json();

//     // Ryd dropdown og indsæt standardvalg.
//     tableSelect.replaceChildren(
//         new Option(
//             '-- Select table --',
//             ''
//         )
//     );

//     // Tilføj alle tabeller fra API'et.
//     for (const name of names) {

//         tableSelect.add(
//             new Option(
//                 name,
//                 name
//             )
//         );
//     }

// }

// // ============================================================
// // 6. TABLE SELECTION
// // ============================================================
// //
// // UI Design Pattern:
// // Master-Detail
// //
// // Master:
// // tableSelect
// //
// // Detail:
// // tableContainer
// //
// // Event:
// // change
// // ============================================================

// tableSelect.addEventListener(
//     'change',
//     async () => {

//         const tableName =
//             tableSelect.value;

//         if (!tableName) {

//             tableContainer.replaceChildren();

//             currentTable =
//                 null;

//             return;
//         }

//         try {

//             await loadTable(
//                 tableName
//             );

//         }
//         catch (error) {

//             renderError(
//                 error.message
//             );
//         }
//     }

// );

// // ============================================================
// // 7. LOAD ONE TABLE
// // ============================================================
// //
// // GET:
// // /api/tables/{name}
// // ============================================================

// async function loadTable(tableName) {

//     const response =
//         await fetch(
//             `${apiBaseUrl}/api/tables/${encodeURIComponent(tableName)}`
//         );

//     if (!response.ok) {

//         throw new Error(
//             'Error loading table.'
//         );
//     }

//     const table =
//         await response.json();

//     currentTable =
//         table;

//     renderTable(
//         table
//     );

// }

// // ============================================================
// // 8. RENDER TABLE
// // ============================================================
// //
// // Viser:
// // - tabelnavn
// // - Insert-knap
// // - kolonner
// // - data
// // - Update-knap
// // - Delete-knap
// //
// // API'et returnerer nu:
// //
// // table.columns = TableColumn[]
// //
// // Derfor bruger vi:
// // column.name
// //
// // og ikke bare:
// // column
// // ============================================================

// function renderTable(table) {

//     const fragment =
//         document.createDocumentFragment();

//     // --------------------------------------------------------
//     // Heading
//     // --------------------------------------------------------

//     const heading =
//         document.createElement('h2');

//     heading.textContent =
//         table.name;

//     fragment.appendChild(
//         heading
//     );

//     // --------------------------------------------------------
//     // Insert button
//     // --------------------------------------------------------

//     const actions =
//         document.createElement('div');

//     actions.className =
//         'table-actions';

//     const insertButton =
//         document.createElement('button');

//     insertButton.type =
//         'button';

//     insertButton.textContent =
//         'Insert';

//     // EVENT-HANDLING:
//     // Klik på Insert.
//     insertButton.addEventListener(
//         'click',
//         () => {

//             openCreateDialog(
//                 table
//             );
//         }
//     );

//     actions.appendChild(
//         insertButton
//     );

//     fragment.appendChild(
//         actions
//     );

//     // --------------------------------------------------------
//     // Table
//     // --------------------------------------------------------

//     const tableElement =
//         document.createElement('table');

//     const headRow =
//         tableElement
//             .createTHead()
//             .insertRow();

//     // --------------------------------------------------------
//     // Column headers
//     // --------------------------------------------------------

//     for (const column of table.columns) {

//         const th =
//             document.createElement('th');

//         th.textContent =
//             column.name;

//         headRow.appendChild(
//             th
//         );
//     }

//     // Ekstra kolonne til CRUD actions.
//     const actionHeader =
//         document.createElement('th');

//     actionHeader.textContent =
//         'Actions';

//     headRow.appendChild(
//         actionHeader
//     );

//     // --------------------------------------------------------
//     // Rows
//     // --------------------------------------------------------

//     const body =
//         tableElement.createTBody();

//     // Find primary key.
//     const primaryKeyIndex =
//         table.columns.findIndex(
//             column =>
//                 column.isPrimaryKey
//         );

//     for (const row of table.rows) {

//         const tr =
//             body.insertRow();

//         // ----------------------------------------------------
//         // Data cells
//         // ----------------------------------------------------

//         for (const cell of row) {

//             const td =
//                 tr.insertCell();

//             td.textContent =
//                 cell;
//         }

//         // ----------------------------------------------------
//         // Actions cell
//         // ----------------------------------------------------

//         const actionCell =
//             tr.insertCell();

//         // ----------------------------------------------------
//         // UPDATE
//         // ----------------------------------------------------

//         if (primaryKeyIndex >= 0) {

//             const updateButton =
//                 document.createElement('button');

//             updateButton.type =
//                 'button';

//             updateButton.textContent =
//                 'Update';

//             // EVENT-HANDLING:
//             // Klik på Update.
//             updateButton.addEventListener(
//                 'click',
//                 () => {

//                     openEditDialog(
//                         table,
//                         row
//                     );
//                 }
//             );

//             actionCell.appendChild(
//                 updateButton
//             );
//         }

//         // ----------------------------------------------------
//         // DELETE
//         // ----------------------------------------------------

//         if (primaryKeyIndex >= 0) {

//             const deleteButton =
//                 document.createElement('button');

//             deleteButton.type =
//                 'button';

//             deleteButton.textContent =
//                 'Delete';

//             // EVENT-HANDLING:
//             // Klik på Delete.
//             deleteButton.addEventListener(
//                 'click',
//                 async () => {

//                     const primaryKeyValue =
//                         row[primaryKeyIndex];

//                     await deleteRow(
//                         table.name,
//                         primaryKeyValue
//                     );
//                 }
//             );

//             actionCell.appendChild(
//                 deleteButton
//             );
//         }
//     }

//     fragment.appendChild(
//         tableElement
//     );

//     // --------------------------------------------------------
//     // Empty table
//     // --------------------------------------------------------

//     if (table.rows.length === 0) {

//         const empty =
//             document.createElement('p');

//         empty.className =
//             'muted';

//         empty.textContent =
//             '(0 rows)';

//         fragment.appendChild(
//             empty
//         );
//     }

//     // Erstat kun tabelområdet.
//     tableContainer.replaceChildren(
//         fragment
//     );

// }

// // ============================================================
// // 9. CREATE / INSERT
// // ============================================================
// //
// // EVENT:
// // Insert-knappen kalder denne funktion.
// //
// // currentMode = 'create'
// // currentRow = null
// // ============================================================

// function openCreateDialog(table) {

//     currentTable =
//         table;

//     currentRow =
//         null;

//     currentMode =
//         'create';

//     modalTitle.textContent =
//         `Indsæt data i ${table.name}`;

//     buildForm(
//         table
//     );

//     crudModal.hidden =
//         false;

// }

// // ============================================================
// // 10. UPDATE / EDIT
// // ============================================================
// //
// // EVENT:
// // Update-knappen kalder denne funktion.
// //
// // currentMode = 'edit'
// // currentRow = den valgte række
// // ============================================================

// function openEditDialog(
//     table,
//     row
// ) {

//     currentTable =
//         table;

//     currentRow =
//         row;

//     currentMode =
//         'edit';

//     modalTitle.textContent =
//         `Rediger ${table.name}`;

//     buildForm(
//         table,
//         row
//     );

//     crudModal.hidden =
//         false;

// }

// // ============================================================
// // 11. BUILD CRUD FORM
// // ============================================================
// //
// // Bruger TableColumn-informationen fra API'et.
// //
// // Identity + Primary Key:
// // vises ikke i formularen
// //
// // IsEditable:
// // afgør om feltet kan redigeres.
// // ============================================================

// function buildForm(
//     table,
//     row = null
// ) {

//     formFields.replaceChildren();

//     for (const column of table.columns) {

//         // Primary key og identity genereres
//         // normalt af databasen.
//         if (
//             column.isPrimaryKey ||
//             column.isIdentity
//         ) {
//             continue;
//         }

//         const field =
//             document.createElement('div');

//         field.className =
//             'form-field';

//         // ----------------------------------------------------
//         // Label
//         // ----------------------------------------------------

//         const label =
//             document.createElement('label');

//         label.textContent =
//             column.name;

//         label.htmlFor =
//             `crud-${column.name}`;

//         // ----------------------------------------------------
//         // Input
//         // ----------------------------------------------------

//         const input =
//             document.createElement('input');

//         input.id =
//             `crud-${column.name}`;

//         input.name =
//             column.name;

//         input.type =
//             getInputType(
//                 column.dataType
//             );

//         // ----------------------------------------------------
//         // Required
//         // ----------------------------------------------------

//         if (!column.isNullable) {

//             input.required =
//                 true;
//         }

//         // ----------------------------------------------------
//         // Existing value ved UPDATE
//         // ----------------------------------------------------

//         if (row) {

//             const columnIndex =
//                 table.columns.findIndex(
//                     c =>
//                         c.name === column.name
//                 );

//             const value =
//                 row[columnIndex];

//             if (
//                 input.type === 'checkbox'
//             ) {

//                 input.checked =
//                     value === 'true';

//             }
//             else {

//                 input.value =
//                     value === 'NULL'
//                         ? ''
//                         : value;
//             }
//         }

//         field.appendChild(
//             label
//         );

//         field.appendChild(
//             input
//         );

//         formFields.appendChild(
//             field
//         );
//     }

// }

// // ============================================================
// // 12. INPUT TYPE
// // ============================================================
// //
// // Mapper PostgreSQL datatype -> HTML input type.
// // ============================================================

// function getInputType(dataType) {

//     switch (dataType) {

//         case 'boolean':
//             return 'checkbox';

//         case 'date':
//             return 'date';

//         case 'integer':
//         case 'bigint':
//         case 'smallint':
//         case 'numeric':
//         case 'real':
//         case 'double precision':
//             return 'number';

//         default:
//             return 'text';
//     }

// }

// // ============================================================
// // 13. CLOSE MODAL
// // ============================================================

// function closeModal() {

//     crudModal.hidden =
//         true;

//     currentTable =
//         null;

//     currentRow =
//         null;

//     currentMode =
//         null;

//     crudForm.reset();

//     formFields.replaceChildren();

// }

// // Luk via X.
// closeModalButton.addEventListener(
//     'click',
//     closeModal
// );

// // Luk via Annuller.
// cancelButton.addEventListener(
//     'click',
//     closeModal
// );

// // ============================================================
// // 14. CRUD FORM SUBMIT
// // ============================================================
// //
// // EVENT-HANDLING:
// //
// // Brugeren trykker "Gem".
// //
// // Hvis currentMode:
// // create -> POST
// // edit -> PUT
// // ============================================================

// crudForm.addEventListener(
//     'submit',
//     async event => {

//         event.preventDefault();

//         if (!currentTable) {

//             return;
//         }

//         // ----------------------------------------------------
//         // Collect form values
//         // ----------------------------------------------------

//         const values = {};

//         const inputs =
//             crudForm.querySelectorAll(
//                 'input'
//             );

//         for (const input of inputs) {

//             if (
//                 input.type === 'checkbox'
//             ) {

//                 values[input.name] =
//                     input.checked
//                         ? 'true'
//                         : 'false';

//             }
//             else {

//                 values[input.name] =
//                     input.value === ''
//                         ? null
//                         : input.value;
//             }
//         }

//         try {

//             // =================================================
//             // INSERT
//             // =================================================

//             if (
//                 currentMode === 'create'
//             ) {

//                 const response =
//                     await fetch(
//                         `${apiBaseUrl}/api/tables/${encodeURIComponent(currentTable.name)}/rows`,
//                         {
//                             method: 'POST',

//                             headers: {
//                                 'Content-Type':
//                                     'application/json'
//                             },

//                             body:
//                                 JSON.stringify({
//                                     values: values
//                                 })
//                         }
//                     );


//                 if (!response.ok) {

//                     const errorText =
//                         await response.text();

//                     throw new Error(
//                         errorText ||
//                         'Kunne ikke indsætte data.'
//                     );
//                 }
//             }

//             // =================================================
//             // UPDATE
//             // =================================================

//             else if (
//                 currentMode === 'edit'
//             ) {

//                 const primaryKeyIndex =
//                     currentTable.columns.findIndex(
//                         column =>
//                             column.isPrimaryKey
//                     );

//                 if (
//                     primaryKeyIndex < 0
//                 ) {

//                     throw new Error(
//                         'Tabellen har ingen primary key.'
//                     );
//                 }

//                 const primaryKeyValue =
//                     currentRow[
//                     primaryKeyIndex
//                     ];

//                 const response =
//                     await fetch(
//                         `${apiBaseUrl}/api/tables/${encodeURIComponent(currentTable.name)}/rows/${encodeURIComponent(primaryKeyValue)}`,
//                         {
//                             method: 'PUT',

//                             headers: {
//                                 'Content-Type':
//                                     'application/json'
//                             },

//                             body:
//                                 JSON.stringify({
//                                     values: values
//                                 })
//                         }
//                     );


//                 if (!response.ok) {

//                     const errorText =
//                         await response.text();

//                     throw new Error(
//                         errorText ||
//                         'Kunne ikke opdatere data.'
//                     );
//                 }
//             }

//             // ------------------------------------------------
//             // CRUD lykkedes
//             // ------------------------------------------------

//             const tableName =
//                 currentTable.name;

//             closeModal();

//             // Hent tabellen igen.
//             await loadTable(
//                 tableName
//             );

//             // Sørg for at dropdown stadig viser
//             // den aktuelle tabel.
//             tableSelect.value =
//                 tableName;
//         }

//         catch (error) {

//             renderError(
//                 error.message
//             );
//         }
//     }

// );

// // ============================================================
// // 15. DELETE
// // ============================================================
// //
// // DELETE:
// // /api/tables/{name}/rows/{id}
// // ============================================================

// async function deleteRow(
//     tableName,
//     primaryKeyValue
// ) {

//     const confirmed =
//         confirm(
//             `Er du sikker på, at du vil slette række ${primaryKeyValue}?`
//         );

//     if (!confirmed) {

//         return;
//     }

//     try {

//         const response =
//             await fetch(
//                 `${apiBaseUrl}/api/tables/${encodeURIComponent(tableName)}/rows/${encodeURIComponent(primaryKeyValue)}`,
//                 {
//                     method: 'DELETE'
//                 }
//             );

//         if (!response.ok) {

//             const errorText =
//                 await response.text();

//             throw new Error(
//                 errorText ||
//                 'Kunne ikke slette data.'
//             );
//         }

//         // Genindlæs tabellen.
//         await loadTable(
//             tableName
//         );

//         // Bevar valget i dropdown.
//         tableSelect.value =
//             tableName;
//     }

//     catch (error) {

//         renderError(
//             error.message
//         );
//     }

// }

// // ============================================================
// // 16. ERROR DISPLAY
// // ============================================================

// function renderError(message) {

//     const p =
//         document.createElement('p');

//     p.className =
//         'error';

//     p.textContent =
//         message;

//     tableContainer.replaceChildren(
//         p
//     );

// }

// // ============================================================
// // 17. SONG ADMINISTRATION
// // ============================================================

// const songSearch =
//     document.getElementById('songSearch');

// const loadSongsButton =
//     document.getElementById('loadSongsButton');

// const addSongButton =
//     document.getElementById('addSongButton');

// const songContainer =
//     document.getElementById('songContainer');


// // ------------------------------------------------------------
// // Load songs
// // ------------------------------------------------------------

// async function loadSongs() {

//     try {

//         const response =
//             await fetch(
//                 `${apiBaseUrl}/api/songs`
//             );

//         if (!response.ok) {
//             throw new Error(
//                 'Error loading songs.'
//             );
//         }

//         const songs =
//             await response.json();

//         renderSongCards(songs);
//     }
//     catch (error) {

//         songContainer.replaceChildren();

//         const errorElement =
//             document.createElement('p');

//         errorElement.className =
//             'error';

//         errorElement.textContent =
//             error.message;

//         songContainer.appendChild(
//             errorElement
//         );
//     }
// }


// // ------------------------------------------------------------
// // Search songs
// // ------------------------------------------------------------

// async function searchSongs(term) {

//     if (!term.trim()) {

//         await loadSongs();

//         return;
//     }

//     try {

//         const response =
//             await fetch(
//                 `${apiBaseUrl}/api/songs/search?term=${encodeURIComponent(term)}`
//             );

//         if (!response.ok) {

//             const errorText =
//                 await response.text();

//             throw new Error(
//                 errorText ||
//                 'Error searching songs.'
//             );
//         }

//         const songs =
//             await response.json();

//         renderSongCards(songs);
//     }
//     catch (error) {

//         songContainer.replaceChildren();

//         const errorElement =
//             document.createElement('p');

//         errorElement.className =
//             'error';

//         errorElement.textContent =
//             error.message;

//         songContainer.appendChild(
//             errorElement
//         );
//     }
// }


// // ------------------------------------------------------------
// // Render song cards
// // ------------------------------------------------------------

// function renderSongCards(songs) {

//     songContainer.replaceChildren();

//     if (songs.length === 0) {

//         const empty =
//             document.createElement('p');

//         empty.className =
//             'muted';

//         empty.textContent =
//             'No songs found.';

//         songContainer.appendChild(
//             empty
//         );

//         return;
//     }

//     const fragment =
//         document.createDocumentFragment();

//     for (const song of songs) {

//         const card =
//             document.createElement('article');

//         card.className =
//             'song-card';


//         // ----------------------------------------------------
//         // Title
//         // ----------------------------------------------------

//         const title =
//             document.createElement('h3');

//         title.textContent =
//             song.title;

//         card.appendChild(
//             title
//         );


//         // ----------------------------------------------------
//         // Main artist
//         // ----------------------------------------------------

//         const artist =
//             document.createElement('p');

//         artist.className =
//             'song-artist';

//         artist.textContent =
//             song.mainArtist;

//         card.appendChild(
//             artist
//         );


//         // ----------------------------------------------------
//         // Featured artists
//         // ----------------------------------------------------

//         if (
//             song.featuredArtists &&
//             song.featuredArtists.length > 0
//         ) {

//             const featured =
//                 document.createElement('p');

//             featured.textContent =
//                 `Featuring: ${song.featuredArtists.join(', ')}`;

//             card.appendChild(
//                 featured
//             );
//         }


//         // ----------------------------------------------------
//         // Albums
//         // ----------------------------------------------------

//         if (
//             song.albums &&
//             song.albums.length > 0
//         ) {

//             const albumHeading =
//                 document.createElement('strong');

//             albumHeading.textContent =
//                 'Albums';

//             card.appendChild(
//                 albumHeading
//             );


//             const albumList =
//                 document.createElement('ul');

//             for (const album of song.albums) {

//                 const item =
//                     document.createElement('li');

//                 item.textContent =
//                     album.releaseDate
//                         ? `${album.title} (${album.releaseDate})`
//                         : album.title;

//                 albumList.appendChild(
//                     item
//                 );
//             }

//             card.appendChild(
//                 albumList
//             );
//         }


//         // ----------------------------------------------------
//         // Media
//         // ----------------------------------------------------

//         if (
//             song.media &&
//             song.media.length > 0
//         ) {

//             const mediaHeading =
//                 document.createElement('strong');

//             mediaHeading.textContent =
//                 'Media';

//             card.appendChild(
//                 mediaHeading
//             );


//             const mediaList =
//                 document.createElement('ul');


//             for (const media of song.media) {

//                 const item =
//                     document.createElement('li');

//                 item.textContent =
//                     `${media.type}: ${media.externalId}`;

//                 mediaList.appendChild(
//                     item
//                 );
//             }

//             card.appendChild(
//                 mediaList
//             );
//         }


//         fragment.appendChild(
//             card
//         );
//     }

//     songContainer.appendChild(
//         fragment
//     );
// }


// // ------------------------------------------------------------
// // Events
// // ------------------------------------------------------------

// loadSongsButton.addEventListener(
//     'click',
//     loadSongs
// );


// songSearch.addEventListener(
//     'input',
//     async () => {

//         await searchSongs(
//             songSearch.value
//         );
//     }
// );


// // ============================================================
// // 18. INITIALIZATION
// // ============================================================
// //
// // Rækkefølge:
// //
// // 1. Hent API URL
// // 2. Hent sprog
// // 3. Hent tabelnavne
// //
// // Det er vigtigt at loadConfig() kommer først,
// // fordi loadTableNames() bruger apiBaseUrl.
// // ============================================================

// async function initialize() {

//     try {

//         await loadConfig();

//         await loadLanguage();

//         await loadTableNames();
//     }

//     catch (error) {

//         renderError(
//             error.message
//         );
//     }

// }

// // Start applikationen.
// initialize();