## Dag 1 Noter: GUI-platforme og UI-opbygning
### 1. Statisk/dynamisk rendering i GUI
#### 1.1 Rendering, delvis rendering, render tree og DOM

**Rendering** er processen, hvor programmets aktuelle state og data omsættes til den brugergrænseflade, som brugeren ser.

**Delvis rendering** betyder, at kun en del af brugergrænsefladen opdateres i stedet for at genindlæse hele siden.

I løsningen sker det med JavaScript og `fetch()` i `MusicPlatform.WebAdmin`. 
Når brugeren vælger en tabel, hentes tabeldata fra `MusicPlatform.WebApi`:
```
const response = await fetch(
    `${apiBaseUrl}/api/tables/${encodeURIComponent(name)}`
);
```

Den returnerede JSON bruges derefter af `renderTable()`.

**DOM (Document Object Model)** er browserens repræsentation af HTML-dokumentet. JavaScript kan ændre DOM'en efter siden er indlæst.

**Render tree** er browserens struktur over de elementer og styles, der skal tegnes på skærmen. Når DOM'en ændres, kan browseren opdatere den visuelle fremstilling.

I `renderTable()` oprettes tabel-elementerne dynamisk:
```
const tableElement = document.createElement('table');
```

og indsættes i DOM'en:
```
tableContainer.replaceChildren(fragment);
```

Det er derfor kun `#tableContainer`, der ændres. Toolbar, sprogmenu og tabel-dropdown bliver ikke genrenderet.

### Valg af teknologi til delvis rendering

Opgaven nævner `fetch()`, `$.ajax()`, HTMX og frameworks med indbygget partial rendering.

Der er valgt almindelig JavaScript med `fetch()`.

Det er valgt, fordi WebAdmin består af ren HTML, CSS og JavaScript, og fetch() allerede er indbygget i browseren. Der er derfor ikke behov for at tilføje et ekstra framework eller bibliotek.

#### 1.2 Tabel-dropdown og partial view

Tabel-dropdown'en findes i `index.html`:
```
<select id="tableSelect">
    <option value="">-- Select table --</option>
</select>
```

Tabellernes navne hentes fra WebApi i `loadTableNames()`:
```
const response = await fetch(`${apiBaseUrl}/api/tables`);
const names = await response.json();

for (const name of names) {
    tableSelect.add(new Option(name, name));
}
```

WebApi-endpointet findes i `TablesController`:
```
[HttpGet]
public ActionResult GetTables()
{
    return Ok(_databaseTableService.GetTableNames());
}
```

Når brugeren vælger en tabel, håndteres `change`-eventet i `app.js`:
```
tableSelect.addEventListener('change', async () => {
    ...
});
```

Den valgte tabel hentes derefter fra:
```
GET /api/tables/{name}
```

WebApi returnerer et `TableData`-objekt. `renderTable()` bruger objektet til at bygge tabelvisningen.

Hvorfor er det en partial view?

Den valgte tabel vises i:
```
<section id="tableContainer"></section>
```

`renderTable()` opbygger et nyt DOM-fragment og erstatter kun indholdet i dette element:
```
tableContainer.replaceChildren(fragment);
```

Hele HTML-siden bliver derfor ikke hentet eller genindlæst.

#### 1.3 Refleksion over delvis rendering

**Hvordan er partial rendering implementeret?**

Den er implementeret med `fetch()` og DOM-manipulation i `app.js`.

Flowet er:
```
Bruger vælger tabel
        ↓
change-event
        ↓
fetch() til WebApi
        ↓
JSON med TableData
        ↓
renderTable()
        ↓
#tableContainer udskiftes
```

**Hvad gør komponentens rendering?**

`renderTable()` tager data fra API'et og omsætter dem til DOM-elementer. 
Funktionen bestemmer dermed, hvordan `TableData` skal præsenteres visuelt.

**Hvad gør DOM-ændringen?**

`replaceChildren()` udskifter kun childrens i `#tableContainer`. Resten af DOM'en forbliver uændret.

**Hvorfor er dette mere end bare at hente data?**

API-kaldet henter data, men det er først JavaScript-renderingen, der omsætter dataene til den visuelle tabel. Fetch og rendering er derfor to forskellige dele af processen.

### 2. Rendering med Session
#### 2.1 Sprog-dropdown i toolbar

Sprogmenuen er implementeret i `index.html` som en dropdown i toolbaren.

Den indeholder billeder af flagene:
```
<img src="/images/flag-da.svg" alt="" />
```

og:
```
<img src="/images/flag-en.svg" alt="" />
```

Dropdown-menuen indeholder knapper for dansk og engelsk:
```
<button type="button" data-language="da">
```
```
<button type="button" data-language="en">
```

CSS'en i `app.css` styrer toolbarens layout og dropdown-menuens placering.

JavaScript håndterer åbning/lukning af dropdown-menuen og bruger `click`-events til sprogvalget.

#### 2.2 Session/state og delvis rendering

Session konfigureres i `WebAdmin/Program.cs`:
```
builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
```

Session aktiveres med:
```
app.UseSession();
```

Det valgte sprog gemmes på serveren i `/api/language`:
```
context.Session.SetString(
    Language.SessionKey,
    language);
```

Når sproget hentes:
```
context.Session.GetString(Language.SessionKey)
```

normaliseres det gennem `Language.Normalize()`.

Titlen bestemmes af:
```
Language.GetTitle(language)
```
#### Delvis rendering ved sprogskift

Når brugeren vælger et sprog, sendes et `POST`-request:
```
const response = await fetch('/api/language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: button.dataset.language })
});
```

Efterfølgende kaldes:
```
renderLanguage(await response.json());
```

`renderLanguage()` ændrer kun:

* sidens titel
* HTML-dokumentets `lang`
* flaget
* teksten for det valgte sprog

Tabelområdet bliver ikke ændret.

Det opfylder kravet om, at sprogskiftet ikke må forstyrre den valgte tabel.

#### Hvorfor huskes sproget ved valg af ny tabel?

Sproget ligger i serverens Session og er derfor ikke kun en lokal JavaScript-variabel.

Når en ny tabel vælges, sendes et separat request til WebApi:
```
GET /api/tables/{name}
```

Dette request ændrer ikke Sessionens sprogstate.

Derfor kan en ny tabel hentes og renderes uden at sproget nulstilles.

#### 2.3 Refleksion: delvis rendering og Session

**Hvad er forskellen på delvis rendering og delvis rendering med Session?**

Delvis rendering beskriver selve opdateringen af UI'et: kun en bestemt del af DOM'en ændres.

Session handler om at bevare state mellem HTTP-requests.

I denne løsning bruges de sammen:
```
Session
  ↓
Gemmer valgt sprog

fetch()
  ↓
Henter ny state/data

renderLanguage() / renderTable()
  ↓
Opdaterer kun den relevante del af DOM'en
```

Session er altså ikke det, der laver partial rendering. Session sørger for, at den valgte state kan bevares, når der kommer nye requests.

#### Kommunikation mellem WebAdmin og WebApi

`WebAdmin` henter *ikke* tabeldata direkte fra databasen.

`WebAdmin` henter API-adressen fra `/api/config`:
```
const response = await fetch('/api/config');
```

`Program.cs` returnerer:
```
return new
{
    apiBaseUrl = configuration["ApiBaseUrl"]
};
```

Derefter bruges adressen i JavaScript:
```
apiBaseUrl = config.apiBaseUrl;
```

Tabeldata går derfor gennem WebApi:
```
WebAdmin
   │
   │ HTTP / JSON
   ▼
TablesController
   │
   ▼
DatabaseTableService
   │
   ▼
Database
```

WebApi er konfigureret med CORS, fordi WebAdmin og WebApi kører på forskellige origins under udvikling.
```
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebAdmin", policy =>
    {
        var webAdminUrl = builder.Configuration["WebAdminUrl"];

        policy
            .WithOrigins(webAdminUrl!)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
```

Policy'en aktiveres med:
```
app.UseCors("WebAdmin");
```

På den måde må WebAdmin kommunikere med API'et, uden at API'et generelt åbnes for alle origins.