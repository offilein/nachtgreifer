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
- [ ] Cloudinary-Account anlegen → cloudinary.com
- [ ] Hosting einrichten (Railway oder Render)
- [ ] PostgreSQL-Instanz provisionieren + `npm run db:migrate`
- [ ] Repo auf GitHub gepusht → https://github.com/offilein/nachtgreifer
