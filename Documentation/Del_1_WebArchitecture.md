## MusicPlatform Web – Architecture
### Overordnet struktur

Denne del af projektet består af to separate webprojekter:
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

`WebAdmin` er den grafiske webklient og indeholder HTML, CSS og JavaScript.

`WebApi` er et separat API-lag, som modtager HTTP requests fra WebAdmin og 
bruger den eksisterende MusicPlatform-funktionalitet til at hente og behandle data.

WebAdmin har derfor ikke direkte adgang til databasen eller MusicPlatform's services. 
Kommunikation mellem de to webprojekter foregår gennem WebApi'et.

### MusicPlatform.WebAdmin
```
MusicPlatform.WebAdmin/
│
├── Properties/
│   └── launchSettings.json
│
├── wwwroot/
│   ├── images/
│   │   ├── flag-da.svg
│   │   └── flag-en.svg
│   ├── app.css
│   ├── app.js
│   ├── favicon.ico
│   └── index.html
│
├── Documentation/
│   ├── Architecture.md
│   └── Dag_1_Noter.md
│
├── Models/
│   └── Language.cs
│
├── appSettings.json
└── Program.cs
```
### wwwroot

`wwwroot` indeholder selve GUI'en.

`index.html` definerer den statiske HTML-struktur.

`app.css` står for layout og visuel styling.

`app.js` står for klient-side logik, event handling, kommunikation med WebApi 
og rendering af dynamisk indhold.

Billederne af flagene ligger i `wwwroot/images`.

### Models

`Language.cs` indeholder den logik, der bruges til at håndtere dansk og engelsk samt 
generere den korrekte sidetitel.

WebAdmin har ikke en egen `TableData`-model. Tabeldata modtages som JSON fra 
WebApi'et og behandles direkte i JavaScript.

### Program.cs

WebAdmin's `Program.cs` konfigurerer ASP.NET Core-applikationen.

Den håndterer blandt andet:

*Session
*statiske filer
*API-endpointet `/api/config`
*API-endpoints til sprogskift

`/api/config` returnerer API-adressen fra konfigurationen, så API-URL'en ikke er 
hardcoded i JavaScript.

Session bruges til at gemme brugerens valgte sprog.

### MusicPlatform.WebApi
```
MusicPlatform.WebApi/
│
├── Properties/
│   └── launchSettings.json
│
├── Controllers/
│   ├── SongsController.cs
│   └── TablesController.cs
│
├── Mappers/
│   ├── SongRequestMapper.cs
│   └── SongResponseMapper.cs
│
├── Models/
│   ├── SongRequest.cs
│   ├── SongResponse.cs
│   └── TableData.cs
│
├── Services/
│   └── DatabaseTableService.cs
│
├── appSettings.json
├── database.log
├── MusicPlatform.WebApi.http
└── Program.cs
```
### Controllers

Controllerne udgør WebApi'ets HTTP-interface.

`SongsController` eksponerer endpoints til arbejde med songs og videresender kald 
til de eksisterende services i MusicPlatform.

`TablesController` eksponerer endpoints til tabelvisningen:

```
GET /api/tables
GET /api/tables/{name}
```

Controllerne modtager requests og returnerer HTTP responses/JSON. De indeholder 
ikke selve GUI-logikken.

### Services

`DatabaseTableService` håndterer hentning af tabelnavne og tabeldata fra databasen.

Servicen modtager connection stringen gennem ASP.NET Core's configuration-system. 
Connection stringen hentes fra User Secrets-konfigurationen og ligger derfor ikke 
hardcoded i source code.

### Models

WebApi har sine egne modeller, som definerer API'ets dataformat.

`SongRequest` beskriver det format, API'et accepterer ved oprettelse af en song.

`SongResponse` beskriver det format, API'et returnerer til klienten.

Disse modeller er API-kontrakter og er derfor adskilt fra modellerne i MusicPlatform.

MusicPlatform har både databaseorienterede modeller i MusicPlatform.Models og 
application-modeller i MusicPlatform.Application.Models.

De databaseorienterede modeller repræsenterer blandt andet tabeller og relationer 
som `Song`, `Artist`, `SongArtist`, `Album`, `AlbumSong` og `Media`.

Application-modellerne samler derimod den information, som application-laget har 
brug for. Eksempelvis indeholder `SongInfo` information om song, artists, albums 
og media i én samlet model.

WebApi arbejder med application-laget frem for direkte med de databaseorienterede 
modeller.

### Mappers

Mappers'ne fungerer som overgang mellem WebApi'ets request/response-modeller og 
MusicPlatform's application-modeller.

`SongRequestMapper` konverterer:

```
SongRequest
    ↓
SongInfo
```

Når en klient sender en request til WebApi'et, bliver requestens API-model derfor 
konverteret til den `SongInfo`, som f.eks. `SongCreationApplicationService` forventer.

`SongResponseMapper` konverterer den modsatte vej:

```
SongInfo
    ↓
SongResponse
```

Det betyder, at WebApi'et ikke eksponerer MusicPlatform's interne 
application-modeller direkte som sin API-kontrakt.

Samtidig holdes WebApi'et adskilt fra MusicPlatform's databaseorienterede modeller. 
WebApi'et behøver eksempelvis ikke selv håndtere relationerne mellem `Song`, `SongArtist` og `Artist`. Det arbejde hører til i den eksisterende MusicPlatform/application-logik.

Strukturen kan derfor illustreres på den her måde:
```
MusicPlatform.Models
(databaseorienterede modeller)
        │
        ▼
MusicPlatform.Application
(application services + application models)
        │
        ▼
SongInfo
        │
        │ SongResponseMapper
        ▼
SongResponse
        │
        │ JSON / HTTP
        ▼
WebAdmin
```

Ved en request går data den modsatte vej:
```
WebAdmin
   │
   │ JSON
   ▼
SongRequest
   │
   │ SongRequestMapper
   ▼
SongInfo
   │
   ▼
Application service
```

Denne opdeling gør, at API'ets offentlige dataformat kan holdes adskilt fra både 
application-lagets modeller og de databaseorienterede modeller.

### Program.cs

WebApi's `Program.cs` konfigurerer blandt andet:

* Controllers
* Dependency Injection
* de eksisterende MusicPlatform-services
* `DatabaseTableService`
* CORS
* HTTPS
* OpenAPI i Development

CORS er konfigureret til at tillade requests fra WebAdmin, da WebAdmin og 
WebApi kører på forskellige origins.

### Kommunikation

Tabelvisningen følger denne struktur:
```
Bruger
  │
  │ vælger tabel
  ▼
WebAdmin / app.js
  │
  │ GET /api/tables/{name}
  ▼
WebApi / TablesController
  │
  ▼
DatabaseTableService
  │
  ▼
Database
  │
  │ TableData
  ▼
TablesController
  │
  │ JSON
  ▼
WebAdmin / app.js
  │
  ▼
renderTable()
  │
  ▼
DOM
```

WebAdmin har dermed kun ansvar for at hente data og vise dem. Databaseadgangen 
foregår i WebApi'et.

### Rendering og DOM

`app.js` bruger `fetch()` til at hente data asynkront fra WebApi'et.

Når en tabel vælges, kaldes `renderTable()`. Funktionen opbygger et nyt 
DOM-fragment og erstatter kun indholdet i:
```
<section id="tableContainer"></section>
```

Resten af siden bliver derfor ikke genindlæst.

Tilsvarende håndteres sproget separat gennem `renderLanguage()`. Her opdateres kun 
titel, flag og sprognavn.

Det betyder, at tabelvisningen og sprogvisningen fungerer som separate dele af 
brugergrænsefladen.

### Session

Session håndteres af WebAdmin og bruges til at gemme det valgte sprog.

Når brugeren vælger et sprog:
```
POST /api/language
```

gemmes sproget i sessionen.

Når siden henter den aktuelle sprogtilstand:
```
GET /api/language
```

returneres det gemte sprog og den tilhørende titel.

Sprogskiftet ændrer derfor ikke den valgte tabel. Tabelvisningen og sprogtilstanden 
renderes separat.

### Ansvarsfordeling
```
WebAdmin
    │
    ├── HTML/CSS/JavaScript
    ├── brugerinteraktion
    ├── rendering og DOM-opdateringer
    └── session til valgt sprog
             │
             │ HTTP / JSON
             ▼
WebApi
    │
    ├── HTTP endpoints
    ├── JSON request/response
    ├── API-modeller
    ├── mapping
    └── kommunikation med MusicPlatform
             │
             ▼
MusicPlatform
    └── eksisterende application- og databaselogik
```

WebAdmin og WebApi har dermed hver sit tydelige ansvar: WebAdmin står for 
brugergrænsefladen, mens WebApi fungerer som kommunikationslaget mellem GUI'en 
og den eksisterende MusicPlatform-backend.