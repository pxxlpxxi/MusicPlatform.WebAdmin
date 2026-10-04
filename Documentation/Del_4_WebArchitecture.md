## MusicPlatform Web – Architecture – Del 4

### Overordnet struktur
Del 4 bygger videre på arkitekturen fra Del 1, Del 2 og Del 3.

Den overordnede arkitektur er fortsat:
```
MusicPlatform.WebAdmin
        │
        │ HTTP / JSON
        ▼
MusicPlatform.WebApi
        │
        ▼
MusicPlatform
        │
        ▼
Database
```
Den vigtigste ændring i Del 4 er struktureringen af GUI-komponenterne.

`WebAdmin` indeholder nu separate områder for:
```
Pages
│
├── CustomControls
│
└── PartialView
```

Dette gør forskellen mellem forskellige typer UI-komponenter tydeligere.

### MusicPlatform.WebAdmin
`WebAdmin` er klientlaget.

Det håndterer:

* GUI
* brugerinteraktion
* event-handling
* application state
* DOM rendering
* CRUD
* Song administration
* language selector
* database status
* HTTP-kommunikation med `WebApi`

Del 4 ændrer ikke denne rolle. I stedet opdeles dele af GUI'ens kode yderligere.

### Pages
Pages fungerer som container for de mere selvstændige GUI-komponenter.

Strukturen er:
```
Pages
│
├── CustomControls
│
└── PartialView
```
De to mapper repræsenterer forskellige typer komponenter.

### CustomControls
Database-statussen er placeret i:
```
Pages/CustomControls/databaseStatus.js
```
Custom control'en har ansvar for database-statusfunktionaliteten.

Den håndterer:
```
API request
    ↓
Database status
    ↓
Rendering
    ↓
DOM
```
Den kan også starte og stoppe periodiske opdateringer.

### Database Status architecture
Database-statussen består af et HTML-container-element og JavaScript-logik.
```
index.html
    │
    ▼
#databaseStatus
    │
    ▼
databaseStatus.js
    │
    ├── loadDatabaseStatus()
    │
    ├── renderDatabaseStatus()
    │
    ├── startDatabaseStatusUpdates()
    │
    └── stopDatabaseStatusUpdates()
```
API-kommunikationen er:
```
databaseStatus.js
       │
       │ GET /api/tables/status
       ▼
TablesController
       │
       ▼
DatabaseTableService
       │
       ▼
Database
```

Resultatet går tilbage:
```
Database
   ↓
DatabaseTableService
   ↓
TablesController
   ↓
JSON
   ↓
loadDatabaseStatus()
   ↓
renderDatabaseStatus()
   ↓
#databaseStatus
```

### Database Status lifecycle
Database-statusen har sin egen opdaterings-livscyklus.
```
Start
  ↓
startDatabaseStatusUpdates()
  ↓
setInterval()
  ↓
loadDatabaseStatus()
  ↓
GET /api/tables/status
  ↓
renderDatabaseStatus()
  ↓
Vent 5 sekunder
  ↓
loadDatabaseStatus()
  ↓
...
```

Opdateringen kan stoppes:
```
stopDatabaseStatusUpdates()
        ↓
clearInterval()
        ↓
databaseStatusInterval = null
```

Det betyder, at intervallet ikke ligger som ukontrolleret logik i resten af applikationen.

### PartialView
Language Selector er placeret i:
```
Pages/PartialView
```
Den består af en separat HTML-del:
```
languageSelector.html
```
og tilhørende JavaScript:
```
languageSelector.js
```
Strukturen er:
```
Pages/PartialView
│
├── languageSelector.html
└── languageSelector.js
```

### Language Selector architecture
Language Selector indlæses fra hovedapplikationen.

Flowet er:
```
initializeLanguageSelector()
        ↓
fetch(languageSelector.html)
        ↓
HTML response
        ↓
#languageSelector
        ↓
innerHTML
        ↓
Language Selector vises
```

Efter HTML'en er indlæst, findes DOM-elementerne, og event handlers registreres.
```
languageSelector.html
        ↓
DOM
        ↓
languageSelector.js
        ↓
event handling
```

### Language state
Language Selector arbejder sammen med WebAdmin's language state.

Flowet er:
```
User
 ↓
Language button
 ↓
click event
 ↓
POST /api/language
 ↓
Session
 ↓
language state
 ↓
JSON response
 ↓
renderLanguage()
 ↓
DOM
```

`renderLanguage()` ændrer kun de relevante UI-elementer, og tabelområdet påvirkes ikke.

### Partial View versus Custom Control
Arkitekturen skelner mellem de to komponenttyper.
```
Pages
│
├── PartialView
│   └── Language Selector
│
└── CustomControls
    └── Database Status
```
Language Selector er struktureret som en Partial View, fordi den primært 
repræsenterer en afgrænset UI-struktur.

Database Status er en Custom Control, fordi den har sin egen funktionalitet:
```
Database Status
│
├── API communication
├── error handling
├── rendering
└── periodic updates
```
Dette giver en tydelig ansvarsfordeling.

### Sammenhæng med app.js
Del 4 betyder ikke, at hele WebAdmin's logik flyttes væk fra `app.js`.

`app.js` fungerer fortsat som den centrale applikationslogik for blandt andet:

* Table administration
* CRUD
* Song administration
* Application state
* API configuration
* Rendering

De mere selvstændige GUI-komponenter kan derimod have deres egen JavaScript-fil.

Det giver:
```
app.js
   │
   ├── Main application logic
   │
   ├── CRUD
   │
   └── Song administration
   │
   ├───────────────┐
   ▼               ▼
PartialView     CustomControl
   │               │
Language        Database
Selector         Status
```

### GUI component architecture
Den samlede WebAdmin GUI kan derfor beskrives som:
```
WebAdmin
│
├── Main GUI
│
├── Language Selector
│     ├── Partial HTML
│     └── Language JavaScript
│
├── Table Administration
│     ├── Master-Detail
│     └── CRUD
│
├── Song Administration
│     ├── Search
│     ├── Filter
│     ├── Sort
│     └── Cards
│
└── Database Status
      ├── Custom Control
      ├── API communication
      └── Periodic updates
```

Dette giver en opdeling efter funktionalitet.

### WebApi architecture
WebApi'ets rolle ændres ikke i Del 4.

WebAdmin har fortsat ikke direkte adgang til databasen.

Database-statussen følger samme arkitektur:
```
WebAdmin
   │
   │ HTTP / JSON
   ▼
WebApi
   │
   ▼
TablesController
   │
   ▼
DatabaseTableService
   │
   ▼
Database
```
Dette betyder, at Custom Control'en ikke bryder den eksisterende lagdeling.

### Ansvarsfordeling
#### WebAdmin
WebAdmin står for:

* GUI
* DOM
* events
* rendering
* state
* Partial Views
* Custom Controls
* HTTP requests

#### Partial Views
Partial Views står for afgrænsede UI-strukturer.

Eksempel: `Language Selector`

#### Custom Controls
Custom Controls står for mere selvstændige GUI-komponenter med egen funktionalitet.

Eksempel: `Database Status`

### WebApi
WebApi står for:

* HTTP endpoints
* request/response
* API models
* controller-logik
* kommunikation med services

### MusicPlatform
MusicPlatform står for:

* application logic
* database-relateret logik

### Samlet Del 4 architecture
Den samlede arkitektur kan illustreres:
```

                              USER
                                │
                                │ interaction
                                ▼
                       ┌─────────────────┐
                       │   WebAdmin GUI  │
                       └────────┬────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
       Partial View        Main Application   Custom Control
             │                  │                  │
             ▼                  ▼                  ▼
       Language Selector    CRUD / Songs      Database Status
                                │                  │
                                └────────┬─────────┘
                                         │
                                    HTTP / JSON
                                         │
                                         ▼
                                ┌─────────────────┐
                                │     WebApi      │
                                │                 │
                                │   Controllers   │
                                │    Services     │
                                └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │  MusicPlatform  │
                                │  + Database     │
                                └─────────────────┘
```
### Del 4's arkitektoniske ændring
Del 4 ændrer ikke den grundlæggende lagdeling mellem `WebAdmin`, `WebApi` og `MusicPlatform`.

Ændringen ligger primært i organiseringen af `WebAdmin`.

Tidligere kunne GUI-komponenterne betragtes som dele af den samlede applikation.

Efter struktureringen er de mere tydeligt opdelt:
```
WebAdmin
│
├── Main application
│
├── Partial Views
│   └── Language Selector
│
└── Custom Controls
    └── Database Status
```

Det gør komponenternes ansvar tydeligere og gør projektet lettere at navigere i og vedligeholde.

### Usability og architecture
Projektstruktureringen har også betydning for udvikling og vedligeholdelse af GUI'en.

Når en funktion er isoleret i en komponent, bliver det lettere at ændre funktionen uden at ændre hele applikationen.

Eksempel:
```
Database Status
      ↓
databaseStatus.js
```
ændringer i database-status kan primært foretages i custom control'en.

Tilsvarende kan language selector ændres gennem:
```
languageSelector.html
languageSelector.js
```
uden at hele CRUD-implementationen behøver at blive ændret.

Arkitekturen understøtter dermed en mere modulær GUI.