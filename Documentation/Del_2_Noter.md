## Del 2 Noter: Event-handling og UI Design Patterns

### GUI-programmering og event-handling

En grafisk brugergrænseflade er interaktiv. Brugeren kan f.eks. klikke på knapper, vælge værdier i dropdowns, skrive i tekstfelter eller ændre indstillinger.

I WebAdmin bruges JavaScript til at registrere disse handlinger og reagere på dem.

Det grundlæggende flow er:
```
Brugerhandling
      ↓
Event
      ↓
Event handler
      ↓
Ændring i programmet / API-request
      ↓
UI opdateres
```

I `app.js` bruges blandt andet:

```javascript
addEventListener()
```

til at registrere events.

Eksempel:
```javascript
tableSelect.addEventListener(
    'change',
    async () => {
        const tableName = tableSelect.value;

        if (!tableName) {
            tableContainer.replaceChildren();
            currentTable = null;
            return;
        }

        await loadTable(tableName);
    }
);
```

Her er `change` eventet, og funktionen er event handleren.

Når brugeren vælger en tabel, bliver `loadTable()` kaldt, som henter data fra WebApi og 
derefter kalder `renderTable()`.

### Event-handling i CRUD

Del 2 kræver, at tabellerne kan:

* indsætte ny data
* opdatere eksisterende data
* slette eksisterende data

Disse funktioner er implementeret i `app.js`.

CRUD-løsningen anvender events til at starte de forskellige handlinger.

#### Insert

I `renderTable()` oprettes en Insert-knap:

```javascript
const insertButton =
    document.createElement('button');

insertButton.addEventListener(
    'click',
    () => {
        openCreateDialog(table);
    }
);
```

Når brugeren klikker på knappen, kaldes:
```javascript
openCreateDialog(table);
```

Funktionen åbner CRUD-modalvinduet og bygger formularen ud fra den valgte tabel.

Flowet er:
```
Klik på Insert
      ↓
click event
      ↓
openCreateDialog()
      ↓
buildForm()
      ↓
CRUD modal vises
      ↓
Bruger udfylder formular
      ↓
submit event
      ↓
POST /api/tables/{name}/rows
      ↓
loadTable()
      ↓
Tabel opdateres
```

#### Update

Update fungerer på samme måde.

I `renderTable()` oprettes en Update-knap for hver række:
```javascript
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

Når brugeren klikker på Update, sendes både tabellen og den valgte række til:
```
openEditDialog(table, row);
```

`openEditDialog()` gemmer den aktuelle tabel og række i application state:

```javascript
currentTable = table;
currentRow = row;
currentMode = 'edit';
```

Derefter bygges formularen med de eksisterende værdier:
```javascript
buildForm(table, row);
```

Når formularen sendes:
```javascript
crudForm.addEventListener(
    'submit',
    async event => {
        event.preventDefault();
        ...
    }
);
```

undersøges `currentMode`.

Ved update bruges:
```javascript
currentMode === 'edit'
```

og der sendes et `PUT` request:
```csharp
PUT /api/tables/{name}/rows/{primaryKey}
```

Efter en succesfuld opdatering lukkes modalvinduet, og tabellen hentes igen:
```javascript
closeModal();

await loadTable(
    tableName
);
```

Det betyder, at brugeren ikke behøver at genindlæse hele siden.

#### Delete
Delete håndteres også gennem event-handling.

For hver række oprettes en Delete-knap:
```javascript
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

Når brugeren klikker på Delete:
```
Klik på Delete
      ↓
click event
      ↓
deleteRow()
      ↓
confirm()
      ↓
DELETE request
      ↓
loadTable()
      ↓
Tabel opdateres
```

Før data slettes, spørger programmet brugeren:
```javascript
const confirmed =
    confirm(
        `Er du sikker på, at du vil slette række ${primaryKeyValue}?`
    );
```

Hvis brugeren annullerer, bliver rækken ikke slettet.

Hvis brugeren accepterer, sendes:
```csharp
DELETE /api/tables/{tableName}/rows/{primaryKeyValue}
```

Efterfølgende genindlæses tabellen.

#### Formularens submit-event

Insert og Update bruger samme formular:
```javascript
crudForm.addEventListener(
    'submit',
    async event => {
        event.preventDefault();
        ...
    }
);
```

Det er en vigtig del af løsningen.

I stedet for at have én separat formular til Insert og én til Update bruges den samme UI-struktur.

Programmet afgør ud fra:
```javascript
currentMode
```

om operationen er:
```javascript
create
```

eller:
```javascript
edit
```

Ved oprettelse:
```javascript
currentMode === 'create'
```

sendes et `POST` request.

Ved opdatering:
```javascript
currentMode === 'edit'
```

sendes et `PUT` request.

Det giver en ensartet proces:
```
Samme modal
       ↓
Samme formular
       ↓
Samme submit-event
       ↓
currentMode bestemmer operation
       ↓
POST eller PUT
```

Dette er med til at gøre løsningen genbrugelig på tværs af tabeller.

### UI Design Pattern: Modal Dialog

Et af de UI Design Patterns, der bruges i løsningen, er **Modal Dialog**.

En modal dialog viser ekstra brugergrænseflade oven på den aktuelle side.

I WebAdmin bruges modal-dialogen til Insert og Update.

HTML'en indeholder en modal:
```html
<div id="crudModal">
```

JavaScript viser og skjuler den ved hjælp af:
```javascript
crudModal.hidden = false;
```

og:
```
crudModal.hidden = true;
```

Når brugeren vælger Insert:
```
Tabel
  ↓
Insert
  ↓
Modal Dialog
  ↓
Formular
```

Når brugeren vælger Update:
```
Tabelrække
  ↓
Update
  ↓
Modal Dialog
  ↓
Formular med eksisterende data
```

Fordelen ved patternet er, at brugeren bliver på den samme side og stadig kan se den kontekst, som handlingen hører til.

### UI Design Pattern: Master-Detail

Løsningen bruger også **Master-Detail**.

Master-Detail betyder, at brugeren først vælger et overordnet element og derefter får vist detaljer for dette element.

I WebAdmin er:
```
Tabel-dropdown
```
master-delen.

Den valgte tabel:
```
tableContainer
```
er detail-delen.

Flowet er:
```
Vælg tabel
    ↓
GET /api/tables/{name}
    ↓
TableData
    ↓
renderTable()
    ↓
Vis den valgte tabel
```

Det svarer til:
```
Master
  ↓
Valgt tabel
  ↓
Detail
  ↓
Rækker + Insert/Update/Delete
```

Dette pattern gør det muligt at bruge den samme brugergrænseflade til mange forskellige tabeller.

### Ensartet CRUD på tværs af tabeller

Et centralt krav i opgaven er, at Insert, Update og Delete skal fungere ensartet for alle viste tabeller.

Dette er løst ved, at `renderTable()` ikke er skrevet specifikt til én bestemt tabel.

Funktionen modtager:
```javascript
table
```

som indeholder:

* tabelnavn
* kolonner
* rækker
* information om primary key
* information om identity
* information om nullable felter
* datatyper

Derefter bygger JavaScript UI'et dynamisk.

Eksempel:
```javascript
for (const column of table.columns) {
    ...
}
```

og:
```javascript
for (const row of table.rows) {
    ...
}
```

Det betyder, at den samme kode kan vise forskellige tabeller.

CRUD-formularen bygges også dynamisk:
```
buildForm(table);
```

og ved Update:
```
buildForm(table, row);
```

Der er derfor ikke behov for at skrive en separat Insert-, Update- og Delete-implementation for hver tabel.

### Primary key og ensartet Update/Delete

For Update og Delete skal programmet kunne identificere den række, der skal ændres eller slettes.

Det gøres ved at finde den kolonne, der er markeret som primary key:
```
const primaryKeyIndex =
    table.columns.findIndex(
        column =>
            column.isPrimaryKey
    );
```

Ved Update bruges værdien fra den valgte række:
```
const primaryKeyValue =
    currentRow[
        primaryKeyIndex
    ];
```

Ved Delete bruges samme princip:
```
const primaryKeyValue =
    row[primaryKeyIndex];
```

Det gør CRUD-funktionerne generelle og uafhængige af det konkrete navn på primary key-kolonnen.

### Event-handling i Song Administration

Event-handling bruges ikke kun til tabel-CRUD.

Song administrationen bruger også events.

Eksempler er:
```javascript
loadSongsButton.addEventListener(
    'click',
    loadSongs
);
```

Søgning bruger:
```javascript
songSearch.addEventListener(
    'input',
    async () => {
        await searchSongs(
            songSearch.value
        );
    }
);
```

Sortering bruger:
```javascript
songSort.addEventListener(
    'change',
    async () => {
        await searchSongs(
            songSearch.value
        );
    }
);
```

Filterknapper bruger:
```javascript
button.addEventListener(
    'click',
    async () => {
        ...
    }
);
```

Add Song bruger også et click-event:
```javascript
addSongButton.addEventListener(
    'click',
    () => {
        openSongModal();
    }
);
```

Dermed anvendes samme grundlæggende event-model flere steder i GUI'en.

### Search/Filter UI Pattern

Song-administrationen anvender også et **Search/Filter** UI Design Pattern.

Brugeren kan skrive et søgeord i:
```javascript
songSearch
```

og kan vælge filtre for:

* Title
* Artist
* Album
* YouTube
* Spotify
* SoundCloud

Search og filter behandles samlet i:
```javascript
applySongSearchAndFilters()
```

Funktionen:
```
Henter songs
    ↓
Søgeterm
    ↓
Filter
    ↓
Sortering
    ↓
renderSongCards()
```

Det er et eksempel på, hvordan et UI pattern ikke kun handler om udseendet, men også om hvordan brugeren 
interagerer med informationen.

### Card Layout

Songs bliver vist som individuelle cards.

I `renderSongCards()` oprettes:
```javascript
const card =
    document.createElement('article');

card.className =
    'song-card';
```

Hvert song-card kan indeholde:

* titel
* main artist
* featured artists
* albums
* media
* Edit-knap
* Delete-knap

Det er et `Card Layout` pattern.

I stedet for at vise alle songs som én stor tabel bliver hver song præsenteret som en selvstændig informationsenhed.

### Delvis rendering efter CRUD

CRUD-operationerne genindlæser ikke hele HTML-siden.

Efter Insert eller Update:
```javascript
await loadTable(
    tableName
);
```

Efter Delete:
```javascript
await loadTable(
    tableName
);
```

`loadTable()` henter den aktuelle tabel fra API'et og kalder:
```javascript
renderTable(table);
```

`renderTable()` erstatter kun:
```javascript
tableContainer
```

Dermed bevares resten af GUI'en.

### Sproget bliver ikke forstyrret

Et krav i opgaven er, at CRUD-implementationen ikke må forstyrre det valgte sprog.

CRUD-koden ændrer ikke sessionens sprog.

Når CRUD er færdig, kaldes:
```
loadTable(tableName);
```

Det ændrer kun tabelområdet.

Sproget håndteres separat af:
```
renderLanguage()
```

Derfor er der en adskillelse mellem:
```
Sprog-state
    ↓
renderLanguage()

Tabel-state
    ↓
renderTable()
```

CRUD-operationerne ændrer ikke sprogtilstanden.

### Samlet event-flow

Den overordnede CRUD-struktur kan beskrives sådan:
```
Bruger
   │
   ├── klikker Insert
   │       ↓
   │   click event
   │       ↓
   │   openCreateDialog()
   │       ↓
   │   modal + formular
   │
   ├── klikker Update
   │       ↓
   │   click event
   │       ↓
   │   openEditDialog()
   │       ↓
   │   modal + formular
   │
   └── klikker Delete
           ↓
       click event
           ↓
       deleteRow()
           ↓
       DELETE request

Formular
   │
   ↓
submit event
   │
   ├── create → POST
   │
   └── edit   → PUT
            ↓
       loadTable()
            ↓
       renderTable()
            ↓
       DOM opdateres
```       
### Refleksion
#### Hvor er event-handling implementeret?

Event-handling findes flere steder i app.js.

Eksempler:

* `tableSelect.addEventListener('change', ...)`
* `insertButton.addEventListener('click', ...)`
* `updateButton.addEventListener('click', ...)`
* `deleteButton.addEventListener('click', ...)`
* `crudForm.addEventListener('submit', ...)`
* `songSearch.addEventListener('input', ...)`
* `songSort.addEventListener('change', ...)`

Events fungerer som forbindelsen mellem brugerens handling og programmets logik.

### UI Design Pattern

Der anvendes flere patterns.

* **Master-Detail**:

*Tabel-dropdownen fungerer som master, mens den valgte tabel vises som detail.*

* **Modal Dialog**:
 
*Insert og Update åbnes i en modal-dialog.*

* **Search/Filter**:

*Song administrationen bruger søgning og filtre til at begrænse den viste information.*

* **Card Layout**:
 
*Songs præsenteres som individuelle cards.*

#### Hvorfor er Modal Dialog relevant?

Modal-dialogen gør det muligt at udføre Insert og Update uden at forlade den valgte tabel.

Den samme modal kan bruges til flere tabeller, fordi formularen bygges dynamisk ud fra metadata om den aktuelle tabel.

#### Hvorfor er Master-Detail relevant?

Master-Detail gør det muligt at bruge én generel tabelvisning til flere databaserelaterede tabeller.

Brugeren vælger først, hvilken tabel der skal arbejdes med, og får derefter vist dens indhold.

### Hvordan opnås en ensartet CRUD-proces?

Den samme `renderTable()` bruges til alle tabeller.

Den samme `openCreateDialog()` bruges til Insert.

Den samme `openEditDialog()` bruges til Update.

Og den samme `deleteRow()` bruges til Delete.

Formularen bygges dynamisk med:
```
buildForm()
```

og operationen bestemmes af:
```
currentMode
```

Det betyder, at CRUD-logikken ikke er bundet til én bestemt tabel.

### Sammenhæng mellem event-handling og UI Design Pattern

Event-handling beskriver, hvordan programmet reagerer på brugerens handlinger.

Et UI Design Pattern beskriver en måde at organisere interaktion og information i brugergrænsefladen.

Eksempel:
```
Modal Dialog = UI Design Pattern

Klik på Update = Event

openEditDialog() = Event handler

CRUD modal bliver vist = UI-ændring
```

De to begreber arbejder derfor sammen, men betyder ikke det samme.

Brugerens handling udløser et event, event handleren ændrer applicationens state eller åbner 
en UI-komponent, og UI'et opdateres derefter.

Brugeren kan arbejde med tabeller gennem:
```
Vælg tabel
    ↓
Se tabel
    ↓
Insert / Update / Delete
    ↓
Event handling
    ↓
API request
    ↓
Ny data
    ↓
Partial rendering
```

Det kan også illustreres mere tydeligt sådan her:
```
Bruger klikker på Update
        ↓
click-event
        ↓
openEditDialog()
        ↓
currentTable og currentRow sættes
        ↓
buildForm()
        ↓
Modal-dialog vises
        ↓
Bruger ændrer data
        ↓
submit-event
        ↓
PUT til WebApi
        ↓
Tabellen genindlæses
```

På den måde bruges event-handling til at styre interaktionen, mens 
Modal Dialog-patternet giver en ensartet måde at præsentere Insert og Update på.

Samtidig kan den eksisterende sprogtilstand fortsætte uafhængigt af CRUD-operationerne.
