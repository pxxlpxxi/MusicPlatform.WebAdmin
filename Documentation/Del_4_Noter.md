## Del 4 Noter: GUI-Usability og evaluering

### Projektstrukturering
I forbindelse med oprydningen af WebAdmin er GUI-relaterede komponenter blevet 
placeret mere struktureret under `Pages`.

Database-statussen er placeret i:
```
Pages/
└── CustomControls/
    └── databaseStatus.js
```

Den fungerer som en custom control, fordi den har sit eget formål og sin egen 
funktionalitet til at hente, vise og opdatere database-statusen.

Language selector'en er placeret under:
```
Pages/
└── PartialView/
    ├── languageSelector.html
    └── languageSelector.js
```
Language selector'en er en partial view, fordi den udgør en selvstændig del af 
GUI'en, som kan indlæses i den eksisterende side.

### GUI-usability
Den største usability-fordel ved WebAdmin er måden, songs bliver præsenteret på.

I stedet for kun at vise song-data som rå databasefelter i en tabel, bliver 
hver song vist som et card, der samler de oplysninger, som hører til den samme 
song i én visuel enhed.

Et song-card kan eksempelvis indeholde:
```
Song
├── Title
├── Main artist
├── Featured artists
├── Albums
└── Media
```
Det gør det lettere at forstå sammenhængen mellem dataene. Brugeren kan tydeligt
se, at en bestemt artist, et bestemt album og forskellige media-links hører til 
den samme song.

Det er især relevant i en admin-klient, fordi data ellers hurtigt kan blive 
svært at forstå, når man kun ser databasefelter og rækker, og skal kigge på
relationstabeller for at forstå, hvilke oplysninger der hører sammen, ud fra
hvert sit id i hver sin databasekolonne.

Cards gør derfor ikke kun GUI'en pænere, men **gør data mere forståelig** i en 
større sammenhæng i relation til hinanden.

Det er også en fordel, at hver song har sine egne Edit- og Delete-handlinger 
direkte på cardet. Brugeren kan dermed se data'en og de handlinger, der kan 
udføres på den samme sted.

### Tabelvisning og CRUD
Tabelvisningen bruges stadig til de mere generelle database-tabeller, hvor en 
klassisk tabelstruktur giver mening.

CRUD-handlingerne er placeret direkte i forbindelse med den valgte tabel. 
Insert ligger over tabellen, mens Update og Delete ligger på den enkelte række.

Insert og Update åbnes i en modal, så brugeren kan arbejde med data uden at 
forlade den aktuelle visning.

Den samme grundlæggende CRUD-struktur bruges på tværs af tabeller. Det gør 
handlingerne mere genkendelige, når brugeren skifter mellem forskellige 
tabeller.

### Song Administration
Song Administration er adskilt fra den generelle tabelvisning, fordi songs 
har en mere kompleks datastruktur.

En song kan blandt andet have flere featured artists, albums og media. 
Derfor giver det bedre mening at vise den som en samlet enhed frem for 
blot at vise alle relationerne som separate databasefelter.

Search, filter og sortering gør det samtidig muligt at finde en bestemt song 
uden først at skulle gennemgå hele listen.

### Refleksion over GUI'en
En vigtig del af GUI-designet er derfor **forskellen mellem at vise data 
og at gøre data forståelig og brugervenlig**.

En database-tabel er god til at vise mange rækker og kolonner, men den viser 
ikke nødvendigvis den semantiske sammenhæng mellem de forskellige oplysninger.

Song-cardet forsøger i stedet at præsentere dataene ud fra den måde, brugeren 
tænker på en song:
```
Dette er en sang. Den har denne titel, denne artist, disse featured artists, disse albums og disse media.
```
Det gør det lettere at forstå, hvad man faktisk arbejder med.

GUI'en kunne stadig forbedres yderligere gennem feedback fra rigtige brugere, 
men cards er den del af WebAdmin, der i gør administrationen af song-data mere 
overskuelig end en ren databaseorienteret visning.

### Usability-test
Den beskrevne usability-test med fem personer er ikke gennemført, og der er 
derfor ikke angivet opdigtede resultater eller et gennemsnit for testen.

De fem områder kan i stedet bruges som refleksion over den eksisterende GUI:

* **Læsbarhed**: Cards gør det lettere at forstå, hvilke oplysninger der hører 
sammen, uden at brugeren behøver kende database-strukturen.

* **Effektivitet**: Search, filter og sortering gør det muligt hurtigt at 
finde relevante songs. Funktionerne er opdelt efter deres formål, og 
CRUD-handlinger er placeret sammen med de relevante data


* **Fejl**: Edit og Delete er placeret direkte på det card, som handlingen 
vedrører, og Delete kræver bekræftelse. Man er altså ikke i tvivl om, 
hvilken song man arbejder med, og man kan ikke uden videre slette en den 
ved et uheld.

* **Hukommelse**: CRUD-handlingerne fungerer ens på tværs af tabeller, 
så brugeren ikke skal lære forskellige workflows.

* **Tilfredshed**: Data bliver præsenteret på en måde, der er mere overskuelig 
og meningsfuld end en ren liste af databasefelter.

### Videre oprydning af app.js
`app.js` indeholder stadig mange forskellige dele af WebAdmin. En naturlig 
videre oprydning vil derfor være at dele eksisterende funktioner op i mindre 
JavaScript-filer.

Song Administration er allerede en tydelig samlet del af filen. 
Funktioner til blandt andet søgning, filtrering, sortering og rendering af 
song-cards kunne derfor flyttes ud, så de ikke ligger blandet sammen med 
tabeladministrationen.

Det samme gælder CRUD-delen, hvor funktioner til formularopbygning, 
modalhåndtering og CRUD-operationer kunne samles mere overskueligt.

Det handler ikke om at ændre funktionaliteten, men om at separere de dele, 
der allerede har forskellige ansvarsområder.

På den måde kan app.js gradvist blive mindre, mens den eksisterende 
funktionalitet bliver lettere at finde og arbejde videre med.