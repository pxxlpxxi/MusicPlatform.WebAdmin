## MusicPlatform Web – Architecture – Del 2

Overordnet struktur
Del 2 bygger videre på arkitekturen fra Del 1.

Projektet består fortsat af:
```
MusicPlatform.WebAdmin
        │
        │ HTTP / JSON
        ▼
MusicPlatform.WebApi
        │
        ▼
MusicPlatform
```
I Del 2 er der især tilføjet interaktion i WebAdmin.

WebAdmin håndterer:

* brugerens events
* CRUD-dialoger
* formularer
* Search/Filter
* Song administration
* DOM-opdateringer

WebApi håndterer fortsat HTTP endpoints og kommunikation med MusicPlatform.

## MusicPlatform.WebAdmin
WebAdmin fungerer som klientlaget.

MusicPlatform.WebAdmin
│
├── wwwroot/
│   ├── images/
│   │    ├── flag-da.svg
│   │    └── flag-en.svg
│   │
│   ├── app.css
│   ├── app.js
│   ├── favicon.ico
│   └── index.html
│
├── Documentation/
│   ├── Architecture.md
│   ├── Dag_1_Noter.md
│   ├── Del_2_Notes.md
│   └── Del_2_Architecture.md
│
├── Models/
│   └── Language.cs
│
├── .gitattributes.json
├── .gitignore.json
├── appSettings.json
└── Program.cs

Den vigtigste ændring i Del 2 ligger i `app.js`.

app.js fungerer som klient-side controller/logik og håndterer forbindelsen mellem:
```
Bruger
  ↓
DOM events
  ↓
JavaScript
  ↓
WebApi
  ↓
DOM rendering
```

### app.js
app.js indeholder application state, event-handling, API-kald og rendering.

Den kan opdeles i følgende hovedområder:
```
DOM references
      ↓
Application state
      ↓
API configuration
      ↓
Language
      ↓
Table administration
      ↓
CRUD
      ↓
Song administration
      ↓
Search / Filter / Sort
      ↓
Rendering
```

### Application state
WebAdmin gemmer blandt andet følgende state:

* `let currentTable = null;`
*Fortæller, hvilken tabel brugeren arbejder med.*

* `let currentRow = null;`
*Bruges ved Update til at holde den valgte række.*

* `let currentMode = null;`
*Fortæller, om CRUD-formularen bruges til `create` eller `edit`.*

* `let currentSongId = null;`
*Bruges tilsvarende til at afgøre, om Song-modal bruges til `Add` eller `Edit`.*

* `let activeSongFilters = [];`
*Indeholder de aktive filtre i Song administrationen.*


### Event-driven GUI
WebAdmin er event-driven.

Det betyder, at programmet ikke blot udfører én fast sekvens, men reagerer på events fra brugeren.

Eksempler:
```javascript
tableSelect.addEventListener(
    'change',
    async () => {
        ...
    }
);
```

```
button.addEventListener(
    'click',
    async () => {
        ...
    }
);
```

```
crudForm.addEventListener(
    'submit',
    async event => {
        ...
    }
);
```

```
songSearch.addEventListener(
    'input',
    async () => {
        ...
    }
);
```

Den generelle arkitektur er derfor:
```
DOM element
    │
    │ event
    ▼
event handler
    │
    ▼
application logic
    │
    ├── state
    ├── API request
    └── rendering
```

### Tabelvisning
Tabelvisningen starter med tabel-dropdown.

Når brugeren vælger en tabel:
```
tableSelect.addEventListener(
    'change',
    async () => {
        ...
        await loadTable(tableName);
    }
);
```

`loadTable()` henter data:
```
GET /api/tables/{name}
```
og kalder derefter:
```
renderTable(table);
```
Arkitekturen bliver:
```
Dropdown
   │
   │ change
   ▼
loadTable()
   │
   │ GET
   ▼
TablesController
   │
   ▼
DatabaseTableService
   │
   ▼
Database
   │
   ▼
TableData
   │
   ▼
renderTable()
   │
   ▼
#tableContainer
```

### CRUD architecture
CRUD er implementeret som et generelt flow, der kan anvendes på alle tabeller, som WebApi'et returnerer.

#### Insert
Insert starter med en event handler på Insert-knappen:
```
insertButton.addEventListener(
    'click',
    () => {
        openCreateDialog(table);
    }
);
```
Flowet er:
```
Insert button
      │
      │ click
      ▼
openCreateDialog()
      │
      ▼
currentTable = table
currentRow = null
currentMode = 'create'
      │
      ▼
buildForm()
      │
      ▼
CRUD modal
      │
      ▼
submit
      │
      ▼
POST /api/tables/{name}/rows
      │
      ▼
loadTable()
      │
      ▼
renderTable()
```

#### Update
Update starter med en knap på den enkelte tabelrække.
```
updateButton.addEventListener(
    'click',
    () => {
        openEditDialog(
            table,
            row
        );
    }
);
```
Herefter gemmes den aktuelle tabel og række:
```
currentTable = table;
currentRow = row;
currentMode = 'edit';
```
Formularen bygges med eksisterende værdier.

Ved submit bruges primary key til at identificere rækken:
```
Tabelrække
    │
    │ click
    ▼
openEditDialog()
    │
    ▼
currentTable
currentRow
currentMode
    │
    ▼
buildForm()
    │
    ▼
submit
    │
    ▼
PUT /api/tables/{name}/rows/{primaryKey}
    │
    ▼
loadTable()
    │
    ▼
renderTable()
```

#### Delete
Delete kræver ikke en modal-formular.

I stedet bruges en event handler direkte på Delete-knappen:
```
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
```
Arkitekturen er:
```
Delete button
      │
      │ click
      ▼
deleteRow()
      │
      ▼
confirm()
      │
      ├── Cancel → stop
      │
      └── OK
           │
           ▼
       DELETE request
           │
           ▼
       loadTable()
           │
           ▼
       renderTable()
```

### Genbrugelig CRUD
En vigtig del af arkitekturen er, at CRUD ikke er implementeret specifikt for én tabel.

`renderTable()` modtager en generisk table:
```
function renderTable(table)
```
Tabellens metadata bruges til at bestemme:

* kolonnenavne
* datatyper
* primary key
* identity-kolonner
* nullable-felter
* rækker

CRUD-formularen bygges dynamisk:
```
buildForm(table);
```
eller:
```
buildForm(table, row);
```
Det betyder:
```
Table A ─┐
Table B ─┤
Table C ─┼──→ samme CRUD-logik
Table D ─┘
```
i stedet for:
```
Table A → egen CRUD-kode
Table B → egen CRUD-kode
Table C → egen CRUD-kode
```
### Modal Dialog architecture
CRUD bruger et Modal Dialog UI Design Pattern.

Modalens rolle er at indeholde den formular, som brugeren arbejder med, uden at forlade den aktuelle tabelvisning.
```
#tableContainer
      │
      ├── Insert
      │      ↓
      │   CRUD Modal
      │
      └── Update
             ↓
          CRUD Modal
```
Modalens formular bygges dynamisk.

Ved Insert:
```
openCreateDialog(table);
```
Ved Update:
```
openEditDialog(table, row);
```
Begge funktioner bruger derefter:
```
buildForm();
```
Det giver en fælles UI-struktur for begge operationer.

### currentMode
`currentMode` bruges som state til at skelne mellem Insert og Update.

Ved Insert:
```
currentMode = 'create';
```
Ved Update:
```
currentMode = 'edit';
```
Ved submit undersøges state:
```
if (
    currentMode === 'create'
) {
    ...
}
else if (
    currentMode === 'edit'
) {
    ...
}
```
Dermed kan samme formular bruges til to forskellige operationer.

Arkitekturen er:
```
              CRUD Modal
                  │
                  ▼
              crudForm
                  │
                submit
                  │
                  ▼
            currentMode
             /       \
            /         \
        create       edit
          │             │
         POST           PUT
          │             │
          └──────┬──────┘
                 ▼
             loadTable()
                 │
                 ▼
            renderTable()
```

### Master-Detail
Master-Detail bruges fortsat fra Del 1.

Master-delen er tabel-dropdownen:
```
tableSelect
```
Detail-delen er:
```
tableContainer
```
Arkitekturen er:
```
Master
Tabel-dropdown
      │
      │ change
      ▼
Detail
Valgt tabel
      │
      ├── rows
      ├── Insert
      ├── Update
      └── Delete
```
Master-Detail gør CRUD-koden mere generel, fordi detailområdet altid viser den aktuelt valgte tabel.

### Song Administration
Song administrationen er en separat del af WebAdmin.

Den bruger også event-driven JavaScript.
```
Song Administration
│
├── Load songs
├── Search
├── Filter
├── Sort
├── Add
├── Edit
└── Delete
```

Songs hentes fra:
```
GET /api/songs
```
og vises gennem:
```
renderSongCards()
```

### Search / Filter / Sort architecture
Song administrationen kombinerer tre former for klient-side behandling:
```
Songs
  │
  ▼
Search
  │
  ▼
Filter
  │
  ▼
Sort
  │
  ▼
renderSongCards()
```

Den centrale funktion er:
```
applySongSearchAndFilters()
```

Search håndteres via:
```
songSearch.addEventListener(
    'input',
    async () => {
        await searchSongs(
            songSearch.value
        );
    }
);
```

Filterknapperne ændrer:
```
activeSongFilters
```
og sortering bruger:
```
songSort.value
```
Til sidst renderes resultatet:
```
renderSongCards(filteredSongs);
```

### Card Layout
Songs vises som cards.

I:
```
renderSongCards()
```
oprettes:
```
const card = document.createElement('article');

card.className = 'song-card';
```

Et card samler information om én song:
```
Song Card
│
├── Title
├── Main artist
├── Featured artists
├── Albums
├── Media
└── Actions
    ├── Edit
    └── Delete
```

Card Layout er derfor et UI Design Pattern i Song administrationen.

### Event architecture for Song administration
Song administrationen har flere typer events.

#### Click
Eksempel:
```
addSongButton.addEventListener(
    'click',
    () => {
        openSongModal();
    }
);
```

#### Input
Eksempel:
```
songSearch.addEventListener(
    'input',
    async () => {
        await searchSongs(
            songSearch.value
        );
    }
);
```
#### Change
Eksempel:
```
songSort.addEventListener(
    'change',
    async () => {
        await searchSongs(
            songSearch.value
        );
    }
);
```

#### Submit
Song-formularen bruger:
```
songForm.addEventListener(
    'submit',
    async event => {
        ...
    }
);
```

Her afgøres Add/Edit ud fra:
```
currentSongId !== null
```

Ved Add:
```
POST /api/songs
```

Ved Edit:
```
PUT /api/songs/{id}
```

### Partial rendering efter CRUD
CRUD ændrer ikke hele siden.

Efter Insert:
```
await loadTable(
    tableName
);
```

Efter Update:
```
await loadTable(
    tableName
);
```

Efter Delete:
```
await loadTable(
    tableName
);
```

`loadTable()` henter nye data, og renderTable() ændrer kun:
```
#tableContainer
```


Arkitekturen er derfor:
```
CRUD event
    │
    ▼
API request
    │
    ▼
Database ændres
    │
    ▼
loadTable()
    │
    ▼
renderTable()
    │
    ▼
#tableContainer
```

Der sker ikke en fuld browser-refresh.

### Sprog og CRUD
Sprogstate er fortsat adskilt fra CRUD-state.

Sprog håndteres gennem:
```
renderLanguage()
```
mens tabeldata håndteres gennem:
```
renderTable()
```
CRUD ændrer:
```
currentTable
currentRow
currentMode
```
men ændrer ikke:
```
language session
```
Det betyder, at en CRUD-operation ikke nulstiller brugerens valgte sprog.

Strukturen er:
```
WebAdmin state
│
├── Language
│     └── Session
│
├── Table
│     ├── currentTable
│     ├── currentRow
│     └── currentMode
│
└── Song
      ├── currentSongId
      └── activeSongFilters
```
De forskellige stateområder håndteres separat.



## WebApi
WebApi'ets rolle ændres ikke grundlæggende i Del 2.

Det fungerer stadig som kommunikationslag mellem WebAdmin og MusicPlatform.

CRUD requests går fra WebAdmin til WebApi.

For tabeller:
```
POST /api/tables/{name}/rows
PUT /api/tables/{name}/rows/{primaryKey}
DELETE /api/tables/{name}/rows/{primaryKey}
```

Song administration bruger:
```
GET /api/songs
POST /api/songs
PUT /api/songs/{id}
DELETE /api/songs/{id}
```
WebAdmin har derfor fortsat ikke direkte databaseadgang.

Samlet arkitektur
Den samlede arkitektur for Del 2 kan illustreres således:
```
                         USER
                           │
                           │ interaction
                           ▼
                  ┌─────────────────┐
                  │   WebAdmin GUI  │
                  │ HTML / CSS / JS │
                  └────────┬────────┘
                           │
                    DOM Events
                           │
                           ▼
                  ┌─────────────────┐
                  │    app.js       │
                  │                 │
                  │ Event handling  │
                  │ State           │
                  │ Rendering       │
                  │ CRUD logic      │
                  └────────┬────────┘
                           │
                     HTTP / JSON
                           │
                           ▼
                  ┌─────────────────┐
                  │    WebApi       │
                  │                 │
                  │ Controllers     │
                  │ API models      │
                  │ Mappers         │
                  │ Services        │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ MusicPlatform   │
                  │ Application     │
                  │ + Database      │
                  └─────────────────┘
```

### CRUD flow
Den vigtigste Del 2-flow kan beskrives som:
```
USER
 │
 │ click
 ▼
CRUD button
 │
 ▼
Event handler
 │
 ├── Insert → openCreateDialog()
 │
 ├── Update → openEditDialog()
 │
 └── Delete → deleteRow()
 │
 ▼
API request
 │
 ▼
WebApi
 │
 ▼
MusicPlatform / Database
 │
 ▼
Response
 │
 ▼
loadTable()
 │
 ▼
renderTable()
 │
 ▼
DOM
```

### UI Design Patterns i arkitekturen
Der anvendes flere UI Design Patterns.

#### Master-Detail
```
Tabel-dropdown
      ↓
Valgt tabel
```
*Brugeren vælger et element og ser detaljer om det valgte element.*

#### Modal Dialog
```
Insert / Update
      ↓
CRUD modal
```
*Brugeren udfører en handling i en dialog oven på den aktuelle side.*

#### Search/Filter
```
Søgeterm + filtre
        ↓
Reduceret song-liste
```
*Brugeren kan begrænse den information, der vises.*

#### Card Layout
```
Song
 ↓
Song Card
```
*Information om hver song samles i et separat visuelt element.*

### Ansvarsfordeling
Del 2 følger samme ansvarsfordeling som Del 1:
```
WebAdmin
    │
    ├── HTML/CSS
    ├── brugerinteraktion
    ├── event-handling
    ├── UI Design Patterns
    ├── application state
    ├── DOM rendering
    └── HTTP requests
             │
             │ JSON
             ▼
WebApi
    │
    ├── HTTP endpoints
    ├── request/response
    ├── API models
    ├── mapping
    └── MusicPlatform services
             │
             ▼
MusicPlatform
    │
    ├── application logic
    └── database logic
```

WebAdmin bestemmer dermed, hvordan brugeren interagerer med systemet, mens WebApi og MusicPlatform håndterer backend-delen.