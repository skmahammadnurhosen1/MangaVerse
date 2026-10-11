# MangaVerse - Production-Ready Full-Stack Manga Reading & Management Platform

A complete, production-grade manga discovery, reading, and administrative publishing platform built with modern web standards, layered defense-in-depth security, and independently deployable architectures.

---

## 1. Project Overview & Architecture

MangaVerse is engineered with a strict two-tier architecture comprising two completely independent applications:
- **`frontend/`**: Single-Page Application (SPA) built with React 18, TypeScript, Vite, React Router 7, and Tailwind CSS.
- **`backend/`**: RESTful API server built with Node.js 20, TypeScript, Express, Mongoose, and MongoDB Atlas (with GridFS for image and PDF binary storage).

```
MangaVerse/
├── frontend/                     # Standalone frontend application
│   ├── src/                      # React TypeScript components, pages, contexts, services
│   ├── public/                   # Static assets, hero & banner anime illustrations
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env.example
│   └── .gitignore
├── backend/                      # Standalone backend application
│   ├── src/                      # Express controllers, models, services, middlewares
│   ├── scripts/                  # Standalone Argon2id password hasher & demo seeder
│   ├── tests/                    # Automated Vitest test suite (Auth, RateLimit, Security)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── .gitignore
└── README.md                     # Comprehensive technical documentation
```

### Architectural Isolation Principles
1. **Completely Separate Dependency Trees**: Both applications have independent `package.json` files, lockfiles, and `node_modules` trees.
2. **Zero Code Sharing across Filesystems**: The frontend never imports backend models, controllers, or configurations. The backend never imports frontend code or relies on frontend builds.
3. **HTTP/REST Runtime Interface**: All communication occurs exclusively over authenticated HTTP/REST endpoints with JSON data payloads or streaming binary responses.
4. **Independent Deployment**: Either application can be hosted on different infrastructure providers (e.g., Render, Railway, Fly.io, AWS for backend; Vercel, Netlify, Cloudflare Pages for frontend).

---

## 2. Visual References & UI Design

The platform replicates three distinct visual experiences:
1. **Admin Login**: Full-screen dark cinematic background, large rounded split-panel layout, left panel displaying MangaVerse branding and anime artwork with "Manage the World of Manga" heading, right panel featuring email and password inputs with visibility toggles and gradient "Login to Dashboard" button.
2. **Admin Dashboard & Management**: Modern dark administrative dashboard with responsive sidebar, violet active navigation highlights, overview statistic cards, data tables, modal forms for manga/chapter/genre management, and audit logs.
3. **Public Homepage & Reader**: Midnight navy background (`#07080d`, `#0b0d16`), violet/purple accents (`#8b5cf6`, `#7c3aed`), cinematic hero banner with instant search and popular tags, Trending Now ranked cards, Browse by Genre cards, and Latest Chapter Updates.
4. **Manga Reader**: Mobile-optimized reading engine with:
   - **Continuous Webtoon Mode** (vertical smooth scroll)
   - **Single Page Mode** and **Double Page Mode**
   - **Reading Direction**: Left-to-Right (Webtoon) and Right-to-Left (Manga)
   - Zoom controls, fullscreen mode (`F`), keyboard navigation
   - Automatic reading progress synchronization
   - Downloadable chapter PDF integration

---

## 3. Security Architecture & Threat Mitigation

### 3.1 Argon2id Password Hashing
Both regular user and administrator passwords are encrypted using **Argon2id** (RFC 9106 recommended configuration):
- **Memory Cost (`m`)**: 19 MiB (`19456` KiB)
- **Time Cost (`t`)**: 2 iterations
- **Parallelism (`p`)**: 1 thread
- Full encoded hash stored in `passwordHash` field.
- **Timing Attack Mitigation**: When authentication is attempted for a nonexistent email or suspended account, the server runs a dummy verification pass (`dummyVerify()`) using identical work factors to prevent response timing side-channel leaks.

### 3.2 Login Rate Limiting & Cooldown Engine
- **Failed Login Threshold**: After **5 failed attempts** from an IP address within a rolling 10-minute window, further login attempts are blocked at the application level for **10 minutes** (600 seconds).
- **Dual Throttle Keying**: Rate limiting tracks both the client IP address (`login:ip:<ip>`) and the normalized account email (`login:acc:<email>`) to prevent distributed credential stuffing attacks.
- **HTTP 429 Response**: Returns standard `Retry-After: <seconds>` header with generic error: `{ "error": "Too many requests. Please try again later." }`.
- **Automatic Reset**: Counter resets automatically upon successful authentication.
- **Persistent Distributed Store**: Backed by MongoDB with TTL index (`RateLimitRecord`) so rate limits are cluster-safe across multiple instances.

### 3.3 Server-Side Sessions & Cookie Security
- **Isolated Session Contexts**:
  - Regular Users: session cookie `mv_user` (or `__Host-mv_user` in production HTTPS). Max age: 7 days.
  - Administrators: session cookie `mv_admin` (or `__Host-mv_admin` in production HTTPS). Max age: 24 hours (stricter timeout).
- **Session Storage**: Stored server-side in MongoDB via `connect-mongo` in separate collections (`sessions_user` and `sessions_admin`).
- **Session Fixation Prevention**: Session ID is regenerated on login and password update; destroyed on logout.
- **Cookie Flags**: `httpOnly: true`, `secure: true` (in production), `sameSite: 'lax'`. Credentials/tokens are never placed in browser `localStorage`.

### 3.4 CSRF Protection & Origin Validation
- **Double-Token & Origin Check**: State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require Origin/Referer matching against `FRONTEND_ORIGINS`.
- **CSRF Token**: Fetched via `GET /api/auth/csrf-token` and passed in `X-CSRF-Token` header.
- **Constant-Time Verification**: Compares tokens using `crypto.timingSafeEqual` to eliminate timing attacks.

### 3.5 Input Sanitization & Web Application Firewalling
- **Strict Zod DTOs**: Strips and rejects unexpected input fields; prevents NoSQL query injection (`$gt`, `$where`) and mass-assignment privilege escalation.
- **Helmet Middleware**: Restricts Content Security Policy (CSP), frame protection (`frameAncestors: ["'none'"]`), XSS protections.
- **CORS Allowlist**: Explicitly allows only configured `FRONTEND_ORIGINS`. Never allows wildcard (`*`) with credentials.
- **Safe Proxy Handling**: Configured via `TRUST_PROXY` environment variable; never blindly trusts spoofed client `X-Forwarded-For` headers.

---

## 4. Manga File & Image Storage (GridFS)

- **MongoDB Atlas GridFS**: Manga cover images, chapter page images, and downloadable PDF assets are stored in the GridFS bucket `mangaFiles`.
- **Magic Bytes Validation**: File uploads are verified by inspecting binary magic headers (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WEBP `RIFF....WEBP`, PDF `%PDF-`). Disallowed file types (SVG, HTML, EXE, scripts) are rejected before reaching storage.
- **PDF Generation**: Generates compiled PDFs from chapter images on-demand or pre-compiled via Admin panel using `pdfkit`. Streams directly to client with `Content-Disposition: attachment`.
- **Orphan Cleanup**: Deleting chapters or manga automatically purges all referenced files and chunks from GridFS.

---

## 5. Manual Administrator Creation in MongoDB Atlas

Per project requirements, **there is NO public admin registration page, admin seeding script, or public endpoint capable of creating an admin**. Administrators are created manually inside MongoDB Atlas.

### Step 1: Run the Standalone Password Hashing Utility Locally
Open your terminal in `backend/` and run:
```bash
npm run hash-password
```
*(You will be prompted to enter and confirm your password securely).*

Alternatively, you can provide the password directly as an argument:
```bash
npm run hash-password -- "YourStrongAdminPassword2026!"
```

The utility will output:
```
----------------- GENERATED ARGON2ID HASH -----------------
$argon2id$v=19$m=19456,t=2,p=1$Kh4n/cqx1As4b53lkykttA$yPwKSPCJ8I7FJ9cGGlf/xQ0vzpv+mN4+/dAW/8arbyw
-----------------------------------------------------------
```

### Step 2: Insert the Admin Document in MongoDB Atlas
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Databases** > click **Browse Collections**.
3. Select your database (e.g., `mangaverse`) and click the **`users`** collection.
4. Click **Insert Document**, switch to **`{}`** (JSON view), and paste the following structure:

```json
{
  "username": "site-admin",
  "email": "admin@example.com",
  "passwordHash": "<PASTE_THE_LOCALLY_GENERATED_ARGON2ID_HASH_HERE>",
  "role": "admin",
  "status": "active",
  "createdAt": {
    "$date": "2026-10-10T12:00:00.000Z"
  },
  "updatedAt": {
    "$date": "2026-10-10T12:00:00.000Z"
  }
}
```
5. Click **Insert**.
6. You can now log in at `/admin/login` using `admin@example.com` and your password.

---

## 6. Local Development Setup

### Prerequisites
- Node.js `v20.x` LTS or later
- npm `10.x` or later
- MongoDB Atlas connection string (or local MongoDB)

### Step 1: Set Up Backend
```bash
cd MangaVerse/backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and session secrets

# 3. Seed demo manga titles, chapters, and categories
npm run seed

# 4. Start backend in development mode
npm run dev
# Backend will listen on http://localhost:5000
```

### Step 2: Set Up Frontend
```bash
cd MangaVerse/frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Verify VITE_API_BASE_URL=http://localhost:5000

# 3. Start frontend dev server
npm run dev
# Frontend will be live on http://localhost:5173
```

---

## 7. Environment Variables Reference

### Frontend (`frontend/.env.example`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Public URL of the backend API server | `http://localhost:5000` or `https://api.yourdomain.com` |

### Backend (`backend/.env.example`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `PORT` | HTTP server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas SRV connection string | `mongodb+srv://user:pass@cluster.mongodb.net/mangaverse` |
| `FRONTEND_ORIGINS` | Comma-separated list of allowed frontend origins for CORS and CSRF | `http://localhost:5173,https://app.yourdomain.com` |
| `USER_SESSION_SECRET` | Secret key for signing user sessions (min 32 chars) | Random 64-character hex |
| `ADMIN_SESSION_SECRET` | Secret key for signing admin sessions (min 32 chars) | Random 64-character hex |
| `GRIDFS_BUCKET_NAME` | MongoDB GridFS bucket name for file storage | `mangaFiles` |
| `TRUST_PROXY` | Set `true` if behind a reverse proxy (e.g. Render, Railway, Nginx) | `false` |
| `USER_SESSION_MAX_AGE_MS`| User session lifetime in milliseconds | `604800000` (7 days) |
| `ADMIN_SESSION_MAX_AGE_MS`| Admin session lifetime in milliseconds | `86400000` (24 hours) |
| `MAX_UPLOAD_FILE_SIZE_MB`| Maximum upload file size in megabytes | `25` |
| `MAX_CHAPTER_PAGES` | Maximum chapter page images per upload | `150` |

---

## 8. Database Collections & Schemas

| Collection | Schema Description & Purpose | Primary Indexes |
| :--- | :--- | :--- |
| **`users`** | Registered readers and administrators. | `email` (unique), `username` (unique), `role`, `status` |
| **`mangas`** | Manga series metadata, authors, synopsis, cover/banner GridFS refs. | `slug` (unique), `isPublished`, `viewCount`, `genres` |
| **`chapters`** | Ordered chapters containing page image IDs and compiled PDF ID. | `{ mangaId: 1, chapterNumber: 1 }` (unique), `publishedAt` |
| **`genres`** | Thematic category taxonomy. | `slug` (unique), `name` (unique) |
| **`readingprogresses`** | Synchronized reading bookmark per user per title. | `{ userId: 1, mangaId: 1 }` (unique), `updatedAt` |
| **`bookmarks`** | Categorized personal library items (`reading`, `plan_to_read`, etc.). | `{ userId: 1, mangaId: 1 }` (unique), `status` |
| **`comments`** | Moderated user reviews and chapter discussions. | `mangaId`, `status`, `reportCount`, `createdAt` |
| **`sitesettings`** | Public branding settings, announcements, and featured banner slots. | Singleton document |
| **`auditlogs`** | Administrative audit trail recording IP, timestamp, action, and target. | `adminId`, `createdAt` |
| **`ratelimitrecords`** | Rolling-window login throttling counters with TTL expiration. | `key` (unique), `windowExpiresAt` (TTL 3600s) |
| **`sessions_user`** | Server-side user session records managed by `connect-mongo`. | Auto TTL |
| **`sessions_admin`** | Isolated administrative session records. | Auto TTL |
| **`mangaFiles.files`** / **`chunks`** | GridFS binary store for cover artwork, page images, and chapter PDFs. | `_id`, `filename` |

---

## 9. API Reference Overview

### Public & Reader Endpoints
- `GET /api/health` - Sanitized server health check.
- `GET /api/health/ready` - Database readiness probe.
- `GET /api/manga` - Paginated manga catalog with genre, status, and sorting filters.
- `GET /api/manga/home` - Homepage featured banners, trending cards, and latest updates.
- `GET /api/manga/search?q=:query` - Live debounced search.
- `GET /api/manga/genres` - Category list with title counts.
- `GET /api/manga/:slug` - Manga details and chapter index.
- `GET /api/manga/:slug/chapters/:chapterNumber` - Chapter reader metadata and image URLs.
- `GET /api/manga/:slug/chapters/:chapterNumber/download` - Stream chapter PDF download.
- `GET /api/files/:fileId` - Stream cached image asset from GridFS.
- `GET /api/comments/:mangaId` - Approved public comments.

### User Authentication & Library (Session-Protected)
- `POST /api/auth/register` - Create account (auto-activates, rate-limited).
- `POST /api/auth/login` - Sign in (5-attempt rolling throttle).
- `POST /api/auth/logout` - Destroy session and clear cookie.
- `GET /api/auth/me` - Authenticated user profile.
- `POST /api/auth/change-password` - Change password with current password verification.
- `GET /api/auth/csrf-token` - Issue CSRF protection token.
- `POST /api/manga/progress` - Save reading progress.
- `GET /api/library/bookmarks` - User's saved library.
- `POST /api/library/bookmarks` - Add/update bookmark category.
- `DELETE /api/library/bookmarks/:mangaId` - Remove bookmark.
- `GET /api/library/history` - User reading history.
- `POST /api/comments` - Submit review/comment.
- `POST /api/comments/:commentId/report` - Report offensive comment.

### Administrative Endpoints (Admin Session & Role Protected)
- `POST /api/admin/auth/login` - Administrator login.
- `POST /api/admin/auth/logout` - Administrator logout.
- `GET /api/admin/auth/me` - Current administrator profile.
- `POST /api/admin/auth/change-password` - Admin password change.
- `GET /api/admin/stats` - Real system statistics & audit activity.
- `GET /api/admin/manga` - Complete manga catalog management list.
- `POST /api/admin/manga` - Create manga.
- `PUT /api/admin/manga/:id` - Edit manga.
- `DELETE /api/admin/manga/:id` - Delete manga and associated GridFS assets.
- `POST /api/admin/manga/:id/cover` - Upload cover image to GridFS.
- `PATCH /api/admin/manga/:id/publish` - Toggle publication status.
- `GET /api/admin/manga/:mangaId/chapters` - List manga chapters.
- `POST /api/admin/chapters` - Create chapter.
- `POST /api/admin/chapters/:chapterId/pages` - Bulk upload chapter page images.
- `POST /api/admin/chapters/:chapterId/generate-pdf` - Compile chapter PDF into GridFS.
- `DELETE /api/admin/chapters/:chapterId` - Delete chapter and GridFS files.
- `GET /api/admin/genres` - Manage genres.
- `GET /api/admin/users` - Moderate user accounts.
- `PATCH /api/admin/users/:userId/status` - Suspend or activate user.
- `GET /api/admin/comments` - Moderate comments.
- `PATCH /api/admin/comments/:id/status` - Approve or hide comment.
- `GET /api/admin/settings` - View site branding settings.
- `PUT /api/admin/settings` - Update site branding and banners.

---

## 10. Independent Production Deployment Guide

### Recommended Topology
Deploy frontend and backend on the same apex domain using subdomains to ensure first-party cookie compatibility across all web browsers:
- Frontend: `https://app.yourdomain.com` (or `https://yourdomain.com`)
- Backend: `https://api.yourdomain.com`

### Step 1: MongoDB Atlas Configuration
1. In MongoDB Atlas, go to **Database Access** and create a dedicated database user with `readWrite` permissions on your application database (e.g. `mangaverse`). **Never use your Atlas account owner credentials.**
2. In **Network Access**, add the IP addresses of your backend hosting provider.

### Step 2: Deploy Backend First
1. Deploy from the `backend/` directory to your chosen hosting provider (e.g., Render, Railway, Fly.io, AWS EC2/ECS).
2. Set the build command: `npm install && npm run build`.
3. Set the start command: `npm start`.
4. Configure production environment variables in your host's secret manager:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=<your-atlas-connection-string>`
   - `FRONTEND_ORIGINS=https://app.yourdomain.com`
   - `USER_SESSION_SECRET=<64-char-random-hex>`
   - `ADMIN_SESSION_SECRET=<64-char-random-hex>`
   - `TRUST_PROXY=true`
5. Deploy backend and note its public HTTPS URL (e.g., `https://api.yourdomain.com`).
6. Verify deployment by visiting `https://api.yourdomain.com/api/health`.

### Step 3: Deploy Frontend Independently
1. Deploy from the `frontend/` directory to your frontend host (e.g., Vercel, Netlify, Cloudflare Pages).
2. Set the build command: `npm install && npm run build`.
3. Set the output directory: `dist`.
4. Configure frontend environment variable:
   - `VITE_API_BASE_URL=https://api.yourdomain.com`
5. Deploy the frontend.

### Step 4: Verification
1. Access `https://app.yourdomain.com` and confirm manga list and artwork load.
2. Register a new user account at `/register` and verify reading progress auto-saves.
3. Access `/admin/login` and verify administrative authentication with your Atlas-created admin document.

---

## 11. Testing & Verification Record

Run automated tests from the `backend/` directory:
```bash
cd MangaVerse/backend
npm test
```

### Verified Test Suites:
- `tests/argon.test.ts`: Verifies Argon2id work factors (19 MiB, 2 iterations, 1 parallelism), hash formatting, verification, and dummy timing protection.
- `tests/rateLimit.test.ts`: Verifies exact 5-failed-attempts threshold, 10-minute cooldown trigger, account-based throttling, and counter reset on success.
- `tests/validation.test.ts`: Verifies Zod schema validation, rejection of unauthorized extra keys (mass assignment), NoSQL injection rejection, password length rules, and slug formatting.
- `tests/security.test.ts`: Verifies magic bytes verification (JPEG, PNG, WEBP, PDF accepted; SVG, HTML, EXE rejected), CSRF token enforcement, and Origin header allowlisting.
- `tests/api.test.ts`: Verifies RBAC route boundaries (admin and user protected endpoints return 401 when unauthenticated), 404 sanitization, and health check output without secrets.
- `tests/featureEnhancements.test.ts`: Verifies WebP image transformation for PDF compilation via sharp, and reading progress stale request protection.
