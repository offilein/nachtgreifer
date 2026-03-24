# Nachtgreifer – Entwicklungslog

---

## 2026-03-24

### Projektinitialisierung & Grundgerüst

**Entscheidungen:**
- Stack festgelegt: Node.js + Express, PostgreSQL, Cloudinary, JWT + bcrypt, Tailwind CDN, Vanilla JS
- Cloudinary als Bildspeicher gewählt (einfaches Setup, guter Free-Tier)
- User-Accounts mit Avataren (keine anonymen Posts)
- Gäste können nur lesen — kein Kommentieren, Bewerten oder Hochladen

**Erstellte Dateien:**

| Datei | Beschreibung |
|---|---|
| `package.json` | Abhängigkeiten: express, pg, cloudinary, multer, bcrypt, jsonwebtoken, express-validator, cors, dotenv |
| `.env.example` | Template für Umgebungsvariablen (PORT, DATABASE_URL, JWT_SECRET, Cloudinary) |
| `.gitignore` | node_modules, .env, Logs |
| `src/app.js` | Express-Einstiegspunkt, alle Routen, Static-File-Serving, Fehler-Middleware |
| `src/config/db.js` | PostgreSQL Pool (mit SSL-Support für Production) |
| `src/config/cloudinary.js` | Cloudinary-Config + Helper: `uploadToCloudinary`, `deleteFromCloudinary` |
| `src/db/schema.sql` | Tabellen: users, posts, comments, ratings + Indizes |
| `src/db/migrate.js` | Node-Script zum Ausführen der Migration |
| `src/middleware/auth.js` | JWT-Middleware: `authenticate` (Pflicht) + `optionalAuth` (optional) |
| `src/middleware/upload.js` | Multer memoryStorage, max 10 MB, nur Bilddateien |
| `src/routes/auth.js` | POST /register, POST /login, GET /me |
| `src/routes/posts.js` | GET /, GET /:id, POST /, DELETE /:id |
| `src/routes/comments.js` | GET /:postId/comments, POST /:postId/comments, DELETE /comments/:id |
| `src/routes/ratings.js` | POST /:postId/rate, DELETE /:postId/rate |
| `src/routes/users.js` | GET /:id, PUT /me/avatar |
| `src/controllers/authController.js` | register, login, me |
| `src/controllers/postsController.js` | getPosts (paginiert), getPost, createPost, deletePost |
| `src/controllers/commentsController.js` | getComments, createComment, deleteComment |
| `src/controllers/ratingsController.js` | ratePost (Upsert +1/-1), removeRating |
| `src/controllers/usersController.js` | getUser (mit Posts), updateAvatar |
| `public/js/api.js` | Geteilte Fetch-Wrapper für alle API-Endpunkte, Auth-Helpers, Hilfsfunktionen |
| `public/index.html` | Startseite: Bildraster (5 Spalten), Pagination, Navbar |
| `public/post.html` | Einzelansicht: Bild, Upvote/Downvote, Kommentare, Owner-Löschung |
| `public/login.html` | Login-Formular |
| `public/register.html` | Registrierungsformular |
| `public/upload.html` | Drag & Drop Upload mit Fortschrittsanzeige |
| `public/profile.html` | Profilseite mit Avatar-Änderung und eigenen Posts |

**Datenbankschema:**
```
users       → id, username, email, password_hash, avatar_url, avatar_public_id, created_at
posts       → id, user_id, title, description, image_url, image_public_id, created_at
comments    → id, post_id, user_id, content, created_at
ratings     → id, post_id, user_id, value (1/-1), created_at | UNIQUE(post_id, user_id)
```

**API-Endpunkte:**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/posts?page=1
GET    /api/posts/:id
POST   /api/posts              (auth, multipart/form-data)
DELETE /api/posts/:id          (auth, owner only)

GET    /api/posts/:id/comments
POST   /api/posts/:id/comments (auth)
DELETE /api/posts/comments/:id (auth, owner only)

POST   /api/posts/:id/rate     (auth, body: { value: 1 | -1 })
DELETE /api/posts/:id/rate     (auth)

GET    /api/users/:id
PUT    /api/users/me/avatar    (auth, multipart/form-data)
```

**Offene Punkte / Nächste Schritte:**
- [ ] `.env` befüllen und lokal testen
- [ ] Cloudinary-Account anlegen
- [ ] Hosting einrichten (Railway oder Render)
- [ ] PostgreSQL-Instanz provisionieren
- [ ] `npm run db:migrate` ausführen

---

## 2026-03-24 (Fortsetzung)

### Suche, Sortierung, Rate Limiting, Bugfixes, Deployment

**Bugfixes:**
- `profile.html`: Avatar-Overlay-Bug behoben — Tailwinds `hidden`-Klasse setzt `display:none !important` und überschrieb `group-hover:flex`. Gelöst durch reines JS-Hover-Handling (`mouseenter`/`mouseleave`) statt CSS-Klassen.
- `api.js`: 401-Antworten (abgelaufenes Token) löschen jetzt automatisch die Auth-Daten und leiten zur Login-Seite weiter.

**Neue Features:**

| Datei | Änderung |
|---|---|
| `src/middleware/rateLimit.js` | Neu: `authLimiter` (20/15min), `uploadLimiter` (30/h), `apiLimiter` (120/min) |
| `src/app.js` | `apiLimiter` global auf alle `/api`-Routen |
| `src/routes/auth.js` | `authLimiter` auf `/register` und `/login` |
| `src/routes/posts.js` | `uploadLimiter` auf `POST /` |
| `src/controllers/postsController.js` | Suche (`?q=`) per `ILIKE` auf Titel; Sortierung (`?sort=newest\|top\|discussed\|oldest`) |
| `public/js/api.js` | `getPosts()` nimmt jetzt `sort` und `q` Parameter; 401-Auto-Logout |
| `public/index.html` | Suchleiste (debounced, 350ms) + Sortier-Dropdown in der Toolbar |
| `railway.json` | Railway-Deployment-Config |
| `render.yaml` | Render-Deployment-Config inkl. PostgreSQL-Datenbank |
| `package.json` | `express-rate-limit` hinzugefügt |

**Offene Punkte:**
- [x] `.env` befüllen — erstellt mit Kommentaren zu jeder Variable
- [x] Repo auf GitHub gepusht → https://github.com/offilein/nachtgreifer
- [ ] Cloudinary-Account anlegen → cloudinary.com
- [ ] Hosting einrichten (Railway oder Render)
- [ ] PostgreSQL-Instanz provisionieren + `npm run db:migrate`

---

## 2026-03-24 (Fortsetzung 2)

### Aufräumen & Clone/Pull-Anleitung

**Bugfix:**
- `src/app.js`: API-404-Handler vor dem Catch-All ergänzt — unbekannte `/api/*`-Routen geben jetzt JSON zurück statt `index.html`

---

## 2026-03-24 (Fortsetzung 3)

### Lokales Setup auf neuem PC (Docker)

**Durchgeführte Schritte:**
- PostgreSQL läuft als Docker-Container (kein natives Install nötig)
- `.env` befüllt: `DATABASE_URL`, `JWT_SECRET`, Cloudinary-Credentials
- `npm run db:migrate` erfolgreich — alle Tabellen angelegt
- App startet mit `npm run dev` auf Port 3000

**Docker-Container:**
```
Name:     nachtgreifer-db
Image:    postgres:17
Port:     5432
User:     nachtgreifer
DB:       nachtgreifer
```

**Startbefehl (einmaliges Erstellen des Containers, nur beim ersten Mal):**
```powershell
docker run -d --name nachtgreifer-db -e POSTGRES_USER=nachtgreifer -e POSTGRES_PASSWORD=nachtgreifer123 -e POSTGRES_DB=nachtgreifer -p 5432:5432 postgres:17
```

**Ab dem zweiten Mal:** Einfach `start.bat` doppelklicken — startet Docker-Container und App automatisch.

**Offene Punkte:**
- [ ] Hosting einrichten (Railway oder Render)
- [ ] PostgreSQL-Instanz für Production provisionieren

---

## Projekt an einem anderen PC weiterbearbeiten

### Erstmalig (neuer PC, kein lokaler Klon vorhanden)
```bash
git clone https://github.com/offilein/nachtgreifer
cd nachtgreifer
npm install
cp .env.example .env
# .env mit echten Werten befüllen (Cloudinary, DB, JWT)
npm run db:migrate
npm run dev
```

### Weiterarbeiten (Repo bereits geklont, Updates holen)
```bash
cd nachtgreifer
git pull
npm install        # nur nötig wenn sich package.json geändert hat
npm run dev
```

### Änderungen pushen
```bash
git add .
git commit -m "Beschreibung der Änderung"
git push
```

### Mit Claude nahtlos weiterarbeiten
Claude Code im Projektordner starten:
```bash
claude
```
Claude liest automatisch den `LOG.md` und kennt den gesamten Projektstand.

---

## 2026-03-24 (Fortsetzung 4)

### UI-Design in Pencil.dev + Components Sheet

**Design-Datei:** `pencil-new.pen` (Pencil VSCode Extension)

**Farbpalette (warm, orientiert an nachtgreifer.jpg):**
| Variable | Hex | Verwendung |
|---|---|---|
| bg-main | `#0d0a12` | Seitenhintergrund |
| bg-sidebar | `#120a1a` | Sidebar |
| bg-surface | `#1c1025` | Karten, Inputs |
| accent | `#ff5522` | Primäre Akzentfarbe (Orange-Rot) |
| accent-purple | `#c44dff` | Sekundäre Akzentfarbe |
| accent-green | `#39ff14` | Online-Status, .fun-Suffix |
| text-primary | `#e8d4ff` | Haupttext |
| text-muted | `#7a5a99` | Labels, Untertitel |

**Font:** `Geist Mono` durchgehend

**Feed-Seite (1440×900):**
- Header: Logo links (absoluter Pfad nötig für Pencil, s.u.), 60px hoch
- Toolbar: Suchleiste + Sort-Dropdown, 36px
- Tag-Bar: Kategorie-Pills (Alle, Kunst, Foto, …), 30px
- Feed-Grid: 5 Zeilen à 3 Spalten, Höhen 188 → 110px (neueste = größte)
  - Keine Lücken zwischen Bildern, Zeile für Zeile links→rechts
  - Nur Like-Overlay unten-links pro Thumbnail (kein Metadaten-Balken)
  - NEU-Badge oben-links bei neuen Posts
- Sidebar (275px): Logout-Bar → Profil-Karte (lila Border) → Upload-Button (orange Border, hollow) → Navigation → Kommentare → Online-User → Site-Stats

**Components Sheet (1440×1200, darunter):**
Reusable Components dokumentiert:
- Logo, Image Card (large + small), Upload Button, Nav Item (active/inactive), Tag Pills, Badges (NEU/TOP), Profile Card, Comment Item, User Avatar (mit Online-Dot), Search Bar, Color Palette, Typography Scale

**Logo-Hinweis (Pencil):**
Pencil kann nur **absolute Pfade** für Bilder auflösen (relative Pfade schlagen fehl).
- Logo-Datei liegt unter: `public/images/logo.png` (für die Web-App) und `logo.png` (Projektwurzel, für Pencil)
- Im `.pen`-File ist der Pfad hartcodiert auf `c:/Users/patri/Documents/Projects/nachtgreifer/logo.png`
- Auf einem anderen PC muss der Pfad im Pencil-File manuell aktualisiert werden (Frame `oWEss` im Header und `2Aq8v` im Components Sheet)

**Neue Dateien:**
| Datei | Beschreibung |
|---|---|
| `pencil-new.pen` | Pencil-Design-Datei: Feed-Seite + Components Sheet |
| `public/images/logo.png` | Nachtgreifer-Logo (für Web-App) |
| `logo.png` | Kopie des Logos in Projektwurzel (für Pencil-Absolut-Pfad) |
| `start.bat` | Startet Docker-DB + App per Doppelklick |

**Offene Punkte:**
- [ ] HTML/CSS aus dem Design implementieren (`public/index.html`, `public/post.html`, etc.)
- [ ] Hosting einrichten (Railway oder Render)
- [ ] PostgreSQL-Instanz für Production provisionieren
