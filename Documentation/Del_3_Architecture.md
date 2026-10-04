## Del 3 Architecture
Del 3 tilføjer en database-status til den eksisterende WebAdmin-arkitektur.

Den nye funktion ligger primært i WebAdmin:
```
MusicPlatform.WebAdmin
│
├── index.html
│      └── #databaseStatus
│
├── app.js
│      ├── loadDatabaseStatus()
│      └── renderDatabaseStatus()
│
└── app.css
       └── database status styling
```
Database-statussen følger den eksisterende opdeling mellem GUI og API:
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

### Dataflow
```
loadDatabaseStatus()
        ↓
GET /api/tables/status
        ↓
TablesController
        ↓
DatabaseTableService
        ↓
database status
        ↓
JSON
        ↓
renderDatabaseStatus()
        ↓
#databaseStatus
```
### Ansvar

`WebAdmin` står for GUI'en og rendering af database-statussen.

`WebApi` står for HTTP-endpointet og kommunikationen mellem WebAdmin og databasen.

`DatabaseTableService` står for at hente oplysninger om tabeller og antal rækker.

`Database` er kilden til de viste data.

### Del 3's nye element
Det nye i arkitekturen er, at WebAdmin nu har en separat statusfunktion, som løbende henter den aktuelle databaseinformation.

Den er ikke koblet direkte til databaseadgangen. Den følger samme API-arkitektur som resten af WebAdmin.

Statussen kan derfor opdateres uafhængigt af den tabel, brugeren aktuelt har valgt.