## Del 3 Noter: Avanceret GUI-programmering

### Database status som custom control

I Del 3 er der tilføjet en database-status som en selvstændig del af WebAdmin-GUI'en.

Den findes i `index.html`:
```
<section id="databaseStatus"
         class="database-status"
         aria-label="Database status">
</section>
```

Sektionen er tom i HTML'en. Indholdet bliver oprettet dynamisk af JavaScript.

I `app.js` findes funktionerne:
```
loadDatabaseStatus()
```
og:
```
renderDatabaseStatus(status)
```
`loadDatabaseStatus()` henter den aktuelle status fra:
```
GET /api/tables/status
```
og sender resultatet videre til `renderDatabaseStatus()`.

`renderDatabaseStatus()` bygger derefter selve visningen med DOM-elementer.

Den viser:

* antal tabeller
* tabelnavn
* antal rækker i hver tabel

Eksempel:
```
Database status    Tables: 8

Album: 21 rows    AlbumSong: 25 rows    Artist: 24 rows
Media: 30 rows    MediaType: 1 rows     Song: 30 rows
SongArtist: 31 rows    User: 2 rows
```
Asynkron hentning
Database-statussen hentes asynkront med `fetch()`:
```
async function loadDatabaseStatus() { const response = await fetch(`${apiBaseUrl}/api/tables/status`);

    const status = await response.json();
    renderDatabaseStatus(status);
}
```
`async` og `await` bruges, fordi der skal foretages et HTTP-kald til WebApi'et.

WebAdmin venter dermed på resultatet uden at blokere browserens øvrige arbejde.

### Live opdatering
Statusen er ikke kun hentet én gang for derefter at være statisk.

Når databaseindhold ændres gennem WebAdmin, kaldes database-statusen igen.

Det gælder også Song-administrationen.

Det er relevant, fordi en ændring af en Song kan påvirke flere databaseområder. Hvis man eksempelvis tilføjer en Song eller tilknytter nye Media-kilder, kan antallet af rækker i databasen ændres.

Derfor hentes den aktuelle database-status igen efter relevante ændringer i data.

Det betyder, at visningen afspejler databasen og ikke bare den tabel, brugeren aktuelt står på.

### Application lifetime
Ved opstart af WebAdmin kaldes den eksisterende:
```
initialize();
```
`initialize()` står for den indledende indlæsning af applikationen.

Database-statussen indgår i denne opstart og bliver derefter opdateret igen, når data ændres.

Der er derfor ikke lavet en separat Application-klasse. I denne HTML/JavaScript-løsning håndteres applikationens livscyklus gennem den eksisterende initialisering og de events, der allerede styrer WebAdmin.

### API og databaseadgang
WebAdmin henter ikke databaseinformationen direkte fra databasen.

Flowet er:
```
MusicPlatform.WebAdmin
        ↓
     HTTP / JSON
        ↓
MusicPlatform.WebApi
        ↓
TablesController
        ↓
DatabaseTableService
        ↓
Database
```

Endpointet til status ligger i WebApi'et under `TablesController`, mens `DatabaseTableService` står for selve databaseopslaget.

Det passer derfor med den eksisterende arkitektur, hvor WebAdmin er GUI-laget og WebApi står mellem GUI'en og databasen.

### Styling
Stylingen til control'en er tilføjet i app.css under:
```
/* *********************************************************
   DEL 3 - DATABASE STATUS CUSTOM CONTROL
   ********************************************************* */
```

Statussen er bevidst holdt lille, så den ikke optager meget plads i GUI'en.

Tabellerne vises vandret i stedet for som en lang liste, så database-statussen kan være synlig uden at fylde en stor del af skærmen.

### Refleksion

#### Hvor er den asynkrone kørsel?

Den ligger i `loadDatabaseStatus()`, hvor `async/await` bruges sammen med `fetch()` til at hente data fra WebApi'et.

#### Hvor håndteres application lifetime?

WebAdmin bruger den eksisterende `initialize()` ved opstart. Database-statussen indlæses som en del af applikationens initialisering og kan efterfølgende indlæses igen, når data ændres.

#### Hvorfor er database-statussen lavet som en custom control?

Den har sit eget formål og sin egen rendering: at vise en samlet status for databasen. Den er derfor adskilt fra både tabelvisningen og Song-administrationen.

#### Hvordan bliver den live?

Når data ændres, kaldes `loadDatabaseStatus()` igen. Der hentes dermed en ny status fra API'et i stedet for kun at ændre et lokalt tal i JavaScript.

#### Hvordan kan man se, at data kommer fra den rigtige database?

Statussen hentes fra WebApi'ets `/api/tables/status`, som bruger `DatabaseTableService` til at hente informationen fra databasen.

#### Hvordan påvirker CRUD og Song-administration statusvisningen?

Efter ændringer i data opdateres database-statussen. Det er vigtigt, fordi en ændring ikke nødvendigvis kun påvirker den tabel, som brugeren arbejder direkte med. En Song kan eksempelvis medføre ændringer i andre tabeller eller relationer.

#### Hvor findes Del 3 i projektet?

* Custom control	
index.html – #databaseStatus
* Hentning af status
app.js – loadDatabaseStatus()
* Rendering
app.js – renderDatabaseStatus()
* Opdatering efter dataændringer
app.js – eksisterende CRUD/Song-flow
* Styling	
app.css – DEL 3 - DATABASE STATUS CUSTOM CONTROL
* API-endpoint	
MusicPlatform.WebApi – /api/tables/status
* Databaseopslag	
DatabaseTableService

Samlet flow
```
WebAdmin starter
       ↓
initialize()
       ↓
loadDatabaseStatus()
       ↓
GET /api/tables/status
       ↓
WebApi
       ↓
DatabaseTableService
       ↓
Database
       ↓
JSON tilbage til WebAdmin
       ↓
renderDatabaseStatus()
       ↓
Database status vises
```
Ved ændringer i data gentages hentningen, så visningen afspejler den aktuelle database.