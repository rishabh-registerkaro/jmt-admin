# jmt-admin

CMS admin panel and backend API for JMT. Built with Next.js 16 (App Router), Prisma and MySQL.

This app is the backend for everything:

- the admin dashboard (`/login`, `/dashboard/*`)
- every API route (`app/api/*`)
- the MySQL database (through Prisma)
- auth (JWT in an `authToken` cookie), email (SMTP) and media uploads (FTP)

Two public sites read content from it:

| Site | Repo / location | How it talks to this API |
|---|---|---|
| Joy Maa Tara homepage | [`jmt-frontend`](../jmt-frontend), port 3002 | `GET /api/homepage/client`, `GET /api/homepage/version`, `POST /api/lead/homepage` |
| Global Elite website | `PRODUCTION_URL` | `/api/*/client/*` routes (CORS allows `PRODUCTION_URL`) |

After every content save, `app/lib/utils/revalidateFrontend.ts` calls `POST /api/revalidate` on **both** sites, so edits show up right away.

---

## Requirements

- **Node.js 20.9 or newer** (Next.js 16 needs it) and npm
- **MySQL 8** (local, Docker or Hostinger)
- Optional: a Gmail account with an App Password (password-reset codes and new-lead emails)
- Optional: Hostinger FTP access (image uploads in the dashboard)

## Quick start

```bash
git clone https://github.com/rishabh-registerkaro/jmt-admin.git
cd jmt-admin
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill it in (see "Environment variables" below)
```

### Database

**If you're using the existing (shared) database**, put its `DATABASE_URL` in `.env` and skip to `npm run dev`. Don't push schema changes to it unless you mean to.

**If you're starting with a new, empty database:**

```bash
# Throwaway local MySQL, if you don't have one:
docker run -d --name jmt-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=dev -e MYSQL_DATABASE=jmt_cms mysql:8
# .env → DATABASE_URL="mysql://root:dev@localhost:3306/jmt_cms"

npm run db:push             # creates every table from prisma/schema.prisma
npm run seed:admin -- --email you@example.com --username admin --password "a-strong-password"
npm run seed:homepage       # fills the homepage editor with the default content
```

Public signup is disabled, so `seed:admin` is how you get the first login. After that, create more users from **Dashboard → Users**.

### Run

```bash
npm run dev                 # http://localhost:3000 → redirects to /login
```

To see the public homepage too, run [`jmt-frontend`](../jmt-frontend) on port 3002. Give it the same `REVALIDATE_SECRET`.

---

## Environment variables

`.env.example` is the template, and each value is explained there. Never commit `.env`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **yes** | MySQL connection string: `mysql://USER:PASSWORD@HOST:3306/DB?connection_limit=5`. URL-encode special characters in the password (`@` → `%40`, `#` → `%23`). |
| `JWT_SECRET` | **yes** | Signs login tokens. Use a long random string (`openssl rand -hex 32`). |
| `REVALIDATE_SECRET` | for the frontends | Shared secret. It must be the **same value** in `jmt-frontend/.env`. It guards cache refreshes, and it lets the homepage lead form's per-visitor rate limit see real visitor IPs. |
| `PRODUCTION_URL` | for Global Elite | Origin of the Global Elite website. Used for CORS and cache refreshes. |
| `JMT_FRONTEND_URL` | for jmt-frontend | Origin of jmt-frontend (default `http://localhost:3002`). Cache-refresh calls go here. |
| `NEXT_PUBLIC_JMT_FRONTEND_URL` | for jmt-frontend | The same URL, for the homepage editor's "View live" link. It's baked in at **build** time. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | for email | SMTP settings. Gmail: use `smtp.gmail.com:587` and an [App Password](https://myaccount.google.com/apppasswords), not the normal password. |
| `ADMIN_NOTIFY_EMAIL`, `NOTIFY_CC_EMAIL` | for lead alerts | Where new-lead emails go. The CC is optional. |
| `HOSTINGER_FTP_HOST`, `HOSTINGER_FTP_USER`, `HOSTINGER_FTP_PASS`, `HOSTINGER_FTP_PORT` | for uploads | FTP account from Hostinger → Files → FTP Accounts. The host has no `ftp://` prefix. |
| `HOSTINGER_MEDIA_PATH`, `HOSTINGER_MEDIA_URL` | for uploads | Server folder for uploaded files, and the public URL of that folder. |

Without the optional groups the app still runs. Only the matching feature fails: password reset and lead emails without SMTP, image uploads without FTP.

**Hostinger MySQL from your laptop:** add your IP under hPanel → Databases → **Remote MySQL** first. Keep `connection_limit=5`, because Hostinger caps concurrent connections.

Check the SMTP settings before deploying with `npm run test:smtp` (auth only) or `npm run test:smtp -- you@gmail.com` (sends a test email).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serves the production build on port 3000 |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:push` | Syncs `prisma/schema.prisma` to the database. It refuses changes that would lose data unless you confirm. |
| `npm run db:studio` | Prisma Studio, a GUI to browse the data |
| `npm run seed:admin -- --email … --username … --password …` | Creates the first superadmin. It never overwrites an existing user. |
| `npm run seed:homepage` | Fills the homepage editor with default content. Add `-- --force` to overwrite. |
| `npm run test:smtp` | Checks the SMTP credentials |

Other one-off seeders live in `prisma/` (`seed-menus.ts`, `seed-about.ts`, `seed-service-pages.ts`, `seed-blog-posts.ts`). They **overwrite** live Global Elite content. Only run them (`npx tsx prisma/<file>.ts`) against an empty database.

### Schema changes

There's no `prisma/migrations` folder. The database is managed with `prisma db push`. To preview a change before applying it:

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```

Don't run `prisma migrate dev` against the shared database. It would try to reset it.

---

## Project structure

```
app/
  api/                 REST API (route handlers)
    */client/*         public read endpoints used by the websites (CORS)
    homepage/          homepage CMS: admin CRUD, /client bundle, /version
    lead/homepage/     lead form endpoint for jmt-frontend
  dashboard/           admin UI pages (one folder per section)
  login/ forgot-password/ signup/
  lib/
    config/            Prisma client (db.ts), email (SMTP)
    constants/         roles
    content/           default content and templates for each CMS section
    utils/             auth, CORS, revalidation, serialization, media helpers
  types/               dashboard types
components/
  ui/                  shadcn/ui primitives
  common/              shared dashboard components (sidebar, editor, media picker, …)
  homepage-editor/     section editors for /dashboard/homepage
hooks/                 React hooks (route permissions, mobile)
lib/                   axios API clients used by the dashboard
lib/homepage/          homepage view-model builder (shared with jmt-frontend)
server/homepage.ts     cached homepage reads for GET /api/homepage/client
types/ data/ utils/    homepage types, fallback content, lead-form rules (shared with jmt-frontend)
prisma/                schema.prisma and seed scripts
scripts/               maintenance scripts (SMTP test)
public/homepage/       bundled homepage images (for the editor previews)
proxy.ts               auth gate: redirects to /login when not signed in
```

### Files shared with jmt-frontend

These files have **identical copies** in both repos (marked `SHARED FILE`). When you change one, copy it to the other repo:

- `lib/homepage/buildHomepage.ts`
- `app/lib/content/home-content.ts`
- `types/homepage.ts`
- `data/homepageFallback.ts`
- `data/homepageTranslations.ts`
- `utils/leadForm.ts`
- `public/homepage/*`

---

## Deployment

### Pre-deploy checklist

1. **Checks pass locally.** Run `npm run typecheck` and `npm run build`. `next build` doesn't run ESLint, and the existing `no-explicit-any` lint errors don't block a deploy.
2. **Production `.env` values are set on the host** (see [Environment variables](#environment-variables)):
   - `DATABASE_URL`: the production MySQL, with `?connection_limit=5`.
   - `JWT_SECRET`: a new random value. Don't reuse the dev one. Changing it signs everyone out.
   - `REVALIDATE_SECRET`: the same value as in jmt-frontend's production env.
   - `PRODUCTION_URL` and `JMT_FRONTEND_URL`: the real `https://` origins, with no trailing slash.
   - `NEXT_PUBLIC_JMT_FRONTEND_URL`: set **before the build**.
   - The SMTP and FTP groups. Test SMTP with `npm run test:smtp -- you@gmail.com`.
3. **Serve the admin over HTTPS.** In production the `authToken` cookie is `Secure`. Over plain `http://` the browser drops it, and login looks like it succeeds but sends you straight back to `/login`.
4. **The database is ready.** On the shared production database, apply schema changes only after you preview them (see [Schema changes](#schema-changes)). On a new database, run `db:push`, `seed:admin` and `seed:homepage` once.
5. **Deploy jmt-frontend after this app.** It reads `/api/homepage/client` from here, so the API has to be up first.
6. **Run the smoke tests after deploying:**
   - `/login` signs in.
   - Saving in **Dashboard → Homepage** shows up on jmt-frontend within a few seconds.
   - An image upload in **Dashboard → Media** works.
   - A test lead from the homepage form appears in **Dashboard → Leads** and sends the alert email.

### Node host (e.g. Hostinger Node.js app)

```bash
npm ci
npm run build      # prisma generate + next build
npm start          # listens on port 3000
```

- Set the environment variables in the host's dashboard before you run the build, because `NEXT_PUBLIC_JMT_FRONTEND_URL` is baked in at build time.
- Use Node 20.9 or newer.
- `next.config.ts` pins `experimental.cpus: 2`. Hostinger containers report the host's full CPU count, and without the pin the build crashes while spawning workers.
- If the host gives you a different port, change `-p 3000` in the `start` script, or put a reverse proxy in front.

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_JMT_FRONTEND_URL=https://jmt.example.com \
  -t jmt-admin .

docker run -d --name jmt-admin -p 3000:3000 --env-file .env --restart unless-stopped jmt-admin
```

`.env` is excluded by `.dockerignore`, so secrets are never baked into the image; pass them at runtime with `--env-file`. `NEXT_PUBLIC_JMT_FRONTEND_URL` is the only build-time value, so it goes in as a `--build-arg`. The container runs as the unprivileged `node` user.

Put a TLS-terminating reverse proxy in front of it (Nginx, Caddy, Traefik, or the host's own proxy). The proxy is what gives you HTTPS, which the login cookie needs (checklist step 3).

### Updating a running deployment

```bash
git pull
npm ci
npm run build
# restart the process (pm2 restart jmt-admin / host's "Restart" button / docker rebuild + run)
```

If `prisma/schema.prisma` changed, preview the change and apply it with `npm run db:push` **before** restarting.

## Troubleshooting

- **`EPERM … query_engine-windows.dll.node` during `npm install` / `prisma generate`.** On Windows, a running `npm run dev` locks the Prisma engine. Stop the dev server and run `npx prisma generate` again.
- **npm 11 asks to approve install scripts.** `package.json` → `allowScripts` already approves the ones this project needs (Prisma, bcrypt, esbuild). If you upgrade one of those packages, approve the new version with `npm install-scripts approve <pkg>`.
- **Login says "Invalid credentials" on a new database.** No user exists yet. Run `npm run seed:admin`.
- **Login works locally but loops back to `/login` in production.** The site is served over plain HTTP, so the browser drops the `Secure` auth cookie. Serve it over HTTPS.
- **The "View live" button opens localhost in production.** `NEXT_PUBLIC_JMT_FRONTEND_URL` wasn't set at build time. Set it and rebuild.
- **Homepage edits don't show on jmt-frontend.** Check that `JMT_FRONTEND_URL` points at it and that `REVALIDATE_SECRET` matches in both `.env` files.
