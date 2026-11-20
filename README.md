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
| Joy Maa Tara website | [`jmt-frontend`](../jmt-frontend), port 3002 | `GET /api/homepage/client`, `/api/homepage/version`, `/api/jmt-services/client/*`, `/api/site-pages/client/*`, and `POST /api/lead/{homepage,contact,join}` |
| Main website | `PRODUCTION_URL` | `/api/*/client/*` routes (CORS allows `PRODUCTION_URL`) |

After every content save, `app/lib/utils/revalidateFrontend.ts` calls `POST /api/revalidate` on **both** sites, so edits show up right away.

### Where each Joy Maa Tara page is edited

| Page on jmt-frontend | Dashboard | Table | API (dashboard / public) |
|---|---|---|---|
| `/` homepage, plus the contact details on every page | **Homepage** | `home_pages` | `/api/homepage` / `/api/homepage/client` |
| The navbar and footer on every page | **Menus → Header Menu / Footer Menu** (`/dashboard/site-menus/header`, `/dashboard/site-menus/footer`) | `home_pages` (`content.site`) | `/api/homepage` with `part: "header" \| "footer"` / `/api/homepage/client` |
| `/service/<slug>` | **Services** (`/dashboard/services`, one editor per page at `/dashboard/services/<id>`) | `jmt_service_pages` | `/api/jmt-services` / `/api/jmt-services/client/<slug>` |
| `/about` | **About Us** | `jmt_site_pages` (key `about`) | `/api/site-pages/about` / `/api/site-pages/client/about` |
| `/contact` | **Contact** | `jmt_site_pages` (key `contact`) | `/api/site-pages/contact` / `/api/site-pages/client/contact` |
| `/join-our-crew` | **Join Our Crew** | `jmt_site_pages` (key `join-our-crew`) | `/api/site-pages/join-our-crew` / `/api/site-pages/client/join-our-crew` |
| `/thank-you` (after each form) | **Thank You** | `jmt_site_pages` (key `thank-you`) | `/api/site-pages/thank-you` / `/api/site-pages/client/thank-you` |

About Us, Contact, Join Our Crew and Thank You are top-level sidebar items, next to Menus. The Thank You page also shows each form's own success title and message (Homepage → Contact, Contact, Join Our Crew).

> **Changes to the dashboard URLs**
> - **Services** (`/dashboard/services`) now lists the Joy Maa Tara service pages: create a page, import a built-in one, edit, delete. "Add New Service" opens the same list with the new-page form open. The old `/dashboard/jmt-services` pages and the main website service editor (`/dashboard/services/update-service`) were removed. The main website service API routes are unchanged.
> - The sidebar's **About Us** and **Contact** items used to open the **main website** editors (`/dashboard/about`, `/dashboard/contact`, tables `about_pages` and `contact_pages`). They now open the Joy Maa Tara pages. The main website editors and their data are unchanged and still reachable by URL.
> - Likewise **Menus → Header Menu / Footer Menu** now open the Joy Maa Tara navbar and footer editors (`/dashboard/site-menus/*`). The main website menu editors (`/dashboard/header-menu`, `/dashboard/footer-menu`, tables `header_menus` and `footer_menus`) are unchanged and still reachable by URL. The navbar and footer fields left the Homepage editor; a homepage save keeps whatever the Menus pages saved.

### Preview (unsaved edits)

The Homepage, Services and site page editors have a **Preview** button. It opens the real jmt-frontend page in a new tab with your **unsaved** changes, and that tab follows your edits as you type (within a couple of seconds). Only **Save changes** publishes to the live site.

1. The editor sends the draft to `POST /api/preview` (`hooks/useDraftPreview.ts`). It goes through the same normalizers as Save and is kept **in this server's memory** for 2 hours (`app/lib/server/previewStore.ts`). Nothing is written to the database.
2. The tab opens `{NEXT_PUBLIC_JMT_FRONTEND_URL}/api/preview?token=…&path=…`, which turns on Next.js Draft Mode for that browser only.
3. jmt-frontend reads the draft server-to-server from `GET /api/preview/<token>`, guarded by `REVALIDATE_SECRET`, so drafts can't be read from a browser.

Because drafts live in memory, they're lost on restart, and with several jmt-admin instances (including serverless hosts such as Vercel) a preview can hit an instance that doesn't have the draft. The preview tab then shows the live page with a "preview expired" bar. Click Preview again.

### Leads

Leads from every Joy Maa Tara form (homepage, service pages, Contact, Join our crew) land in **Dashboard → Leads**.

- **Source** says which form and page a lead came from, for example `Request workers — Site labour supply (/service/site-service-supply)`. The list has a **Source** filter with a count per source.
- Leads from a service page also list the roles the visitor ticked, under **Services requested**.
- **Spam limits** (`app/lib/utils/leadThrottle.ts`): at most 5 submissions per IP per 10 minutes (in memory, per server instance) and 3 per email or phone number per 10 minutes (checked in MySQL, so it holds across instances). Over the limit the API answers `429`. A signed-in admin using **Add Lead** is exempt. This doesn't stop a botnet that rotates both IPs and identities; that would need a shared store or a CAPTCHA.

### How the site page editor works

About, Contact, Join our crew and Thank you share one generic editor (`components/site-page-editor/ContentEditor.tsx`). It has no hand-written form. Instead, it builds the form from each page's **bundled copy** (`data/about.ts`, `data/contactPage.ts`, `data/joinPage.ts`, `data/thankYouPage.ts`, which are copies of jmt-frontend's `data/` files):

- one card per section, with fields for text, the shorter phone versions, orange-accent headings, images (Media Library or upload, with the size read automatically), icon dropdowns, switches and lists you can add to, remove from and reorder;
- **Reset section to default** per card, and **Reset page to default**, which deletes the saved document so the page goes back to the bundled copy.

The saved document is one JSON column. On every save and read it's merged over the bundled copy (`lib/sitePages/mergeContent.ts`, an identical copy of the jmt-frontend file). Unknown keys are dropped, and values of the wrong type or unsafe image URLs fall back to the default. Adding a field to the bundled copy therefore makes it editable without a schema change.

Per-page settings (section titles and hints, icon choices, and **locked** fields that the editor hides and the merge never changes) live in `app/lib/content/site-pages.ts`. Locked fields must match `SITE_PAGE_LOCKED` in jmt-frontend's `lib/sitePages/registry.ts`. To make another jmt-frontend page editable, see "Making another page editable" in the jmt-frontend README.

---

## Requirements

- **Node.js 20.9 or newer** (Next.js 16 needs it) and npm
- **MySQL 8** (local or Hostinger)
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
# .env → DATABASE_URL="mysql://user:password@localhost:3306/jmt_cms"

npm run db:push             # creates every table from prisma/schema.prisma
npm run seed:admin -- --email you@example.com --username admin --password "a-strong-password"
npm run seed:homepage       # fills the homepage editor with the default content
```

The About, Contact and Join our crew pages need no seeding. Until they're saved from the dashboard, the website shows their bundled copy, and the editor opens pre-filled with it.

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
| `REVALIDATE_SECRET` | for the frontends | Shared secret. It must be the **same value** in `jmt-frontend/.env`. It guards cache refreshes and draft previews, and it lets the homepage lead form's per-visitor rate limit see real visitor IPs. |
| `PRODUCTION_URL` | for main website | Origin of the main website. Used for CORS and cache refreshes. |
| `JMT_FRONTEND_URL` | for jmt-frontend | Origin of jmt-frontend (default `http://localhost:3002`). Cache-refresh calls go here. |
| `NEXT_PUBLIC_JMT_FRONTEND_URL` | for jmt-frontend | The same URL, for the editors' "View live" and **Preview** links. It's baked in at **build** time. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | for email | SMTP settings. Gmail: use `smtp.gmail.com:587` and an [App Password](https://myaccount.google.com/apppasswords), not the normal password. |
| `ADMIN_NOTIFY_EMAIL`, `NOTIFY_CC_EMAIL` | for lead alerts | Where new-lead emails go. The CC is optional. |
| `HOSTINGER_FTP_HOST`, `HOSTINGER_FTP_USER`, `HOSTINGER_FTP_PASS`, `HOSTINGER_FTP_PORT` | for uploads | FTP account from Hostinger → Files → FTP Accounts. The host has no `ftp://` prefix. |
| `HOSTINGER_MEDIA_PATH`, `HOSTINGER_MEDIA_URL` | for uploads | Server folder for uploaded files, and the public URL of that folder. |
| `HOSTINGER_APPLICATIONS_PATH` | optional | Private folder (outside `public_html`, default `/applications`) for CVs sent with Join our crew applications. |
| `HOSTINGER_FTP_SECURE`, `HOSTINGER_FTP_TLS_HOSTNAME`, `HOSTINGER_FTP_TLS_INSECURE` | optional | FTPS settings. An IP host is verified against `hstgr.io` by default; `TLS_INSECURE=true` disables verification (see `.env.example`). |

Without the optional groups the app still runs. Only the matching feature fails: password reset and lead emails without SMTP, image uploads without FTP.

**Hostinger MySQL from your laptop:** add your IP under hPanel → Databases → **Remote MySQL** first. Keep `connection_limit=5`, because Hostinger caps concurrent connections.

Check the SMTP settings before deploying with `npm run test:smtp` (auth only) or `npm run test:smtp -- you@gmail.com` (sends a test email).

---

## Roles and permissions

Access depends on the user's **role**. A role is a named set of **permissions**. Permissions are listed in `app/lib/constants/permissions.ts`, and roles are stored in the `jmt_admin_roles` table. A Super Admin manages roles at **Administration → Roles** and assigns them at **Administration → Users**.

| Permission | Allows |
|---|---|
| `content.edit` | Homepage, About / Contact / Join Our Crew pages, header and footer menus, Terms & Policy |
| `posts.manage` | Posts and categories |
| `services.manage` | Service pages |
| `packages.manage` | Packages |
| `media.manage` | Media library (anyone with a content permission can still upload images from inside an editor) |
| `leads.view` / `leads.manage` | See client enquiries / change status, edit, add and delete them |
| `applications.view` / `applications.manage` | See Join Our Crew worker applications / change status and delete them |
| `users.manage` | Users: create, change role, reset password, delete |
| `cache.reset` | The "Reset all cache" button |
| `roles.manage` | The Roles page. Only the Super Admin role has it, and it can't be given to any other role. |

The built-in roles are created by `npm run seed:roles`:

| Role | Permissions | Notes |
|---|---|---|
| **Super Admin** | everything | Locked. Can't be edited or deleted. |
| **Admin** | everything except `roles.manage` | Permissions can be edited; can't be deleted |
| **Editor** | content, posts, services, packages, media | Contributors were merged into this role |
| **Leads Manager** | leads and applications (view and manage) | |

You can add your own roles, such as "Recruiter" with only the applications permissions.

**Rules enforced by the API** (`app/lib/server/rbac.ts`):
- There is exactly one Super Admin account. Nobody can give someone the Super Admin role.
- Only the Super Admin can give someone a role that includes `users.manage` (such as Admin). So only the Super Admin can create admins.
- Anyone else can only assign roles whose permissions they hold themselves.
- You can only change the role or password of, or delete, users whose role you could assign yourself.
- Nobody can change their own role.
- The Super Admin account can't be deleted or demoted, and only its owner can change its password.
- A built-in role can't be deleted. A custom role can be deleted only once no users have it.

**Legacy `users.role` column.** The `users` table is shared with the Global Elite site, so its `role` enum column stays. It is kept in sync: `superadmin`, `admin`, or `editor` for every other role. If a user has no `roleId` (for example, an account created by the Global Elite site), their access comes from that column: superadmin → Super Admin, admin → Admin, editor or contributor → Editor.

### Admin site map

Each page is listed in `app/lib/constants/routeAccess.ts` and each sidebar item in `components/common/AppSidebar.tsx`. Sidebar items, and the items inside each menu, only appear for users with the permission. The API behind each page checks the permission again on the server.

```
Dashboard                      /dashboard                               signed in (cards filtered per permission)
CONTENT
├─ Homepage                    /dashboard/homepage                      content.edit
├─ Services ▸ All / Add        /dashboard/services[/create-service]     services.manage
├─ Media Library               /dashboard/media                         media.manage
├─ Menus ▸ Header / Footer     /dashboard/site-menus/{header|footer}    content.edit
├─ About Us                    /dashboard/site-pages/about              content.edit
├─ Contact                     /dashboard/site-pages/contact            content.edit
├─ Join Our Crew               /dashboard/site-pages/join-our-crew      content.edit
├─ Thank You                   /dashboard/site-pages/thank-you          content.edit
└─ Terms & Policy              /dashboard/terms-policy                  content.edit
LEADS
├─ Leads                       /dashboard/leads                         leads.view
└─ Applications                /dashboard/applications                  applications.view
ADMINISTRATION
├─ Users                       /dashboard/users                         users.manage
└─ Roles                       /dashboard/roles                         roles.manage
ACCOUNT
└─ Profile                     /dashboard/profile                       signed in
Sidebar footer: Reset all cache                                         cache.reset
```

These pages work by URL but have no sidebar link. Posts and Packages only feed the main website, not Joy Maa Tara, so they are left out of the sidebar, the dashboard home and the Roles screen. Their pages and APIs still exist because the main website reads its blog and package blocks from this backend.

| Page | Permission |
|---|---|
| `/dashboard/blog/*` (Posts and categories, main website only) | `posts.manage` |
| `/dashboard/services/[id]` | `services.manage` |
| `/dashboard/packages/*` (package blocks, main website only) | `packages.manage` |
| `/dashboard/site-pages/[key]` | `content.edit` |
| `/dashboard/header-menu`, `/dashboard/footer-menu`, `/dashboard/about`, `/dashboard/contact` (older main-website editors) | `content.edit` |

A dashboard page not listed in `routeAccess.ts` is open to any signed-in user.

**API permissions.** Admin APIs use `requirePermission(req, …)` from `app/lib/utils/authorization.ts`. A GET on a content API (used by pickers in other editors) accepts any content permission. Writes need the specific permission. Public endpoints are unaffected: `*/client/*`, sitemaps, `/api/lead/{homepage,contact,join}`, public `POST /api/lead`, `/api/preview/[token]`, login, forgot-password, and the public GETs of header-menu, footer-menu, about and contact.

**Applications.** Join Our Crew applications are stored as leads with `leadSource = JOIN_LEAD_SOURCE` (`utils/joinForm.ts`). `/api/applications` lists them; `/api/lead` and the Leads page leave them out. On the Applications page, the statuses `converted` and `lost` are shown as **Hired** and **Rejected**.

### Turning RBAC on (first deploy)

1. `npx prisma db push` adds the `jmt_admin_roles` table and a nullable `users.roleId` column, and changes nothing else. Run it **before** starting the new code. The old code ignores the new column, but the new code needs it.
2. `npm run seed:roles` creates the four built-in roles and links every existing user to the one matching their old role (contributors become Editors). You can run it again safely.
3. Deploy or restart the admin.

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
| `npm run seed:admin -- --email … --username … --password …` | Creates the Super Admin, and the built-in roles if they're missing. It does nothing if a Super Admin already exists, and never overwrites an existing user. |
| `npm run seed:roles` | Creates the built-in roles and links existing users to them. Safe to run again. |
| `npm run seed:homepage` | Fills the homepage editor with default content. Add `-- --force` to overwrite. |
| `npm run test:smtp` | Checks the SMTP credentials |

Other one-off seeders live in `prisma/` (`seed-menus.ts`, `seed-about.ts`, `seed-service-pages.ts`, `seed-blog-posts.ts`). They **overwrite** live main website content. Only run them (`npx tsx prisma/<file>.ts`) against an empty database.

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
    jmt-services/      JMT service pages: admin CRUD, /client/<slug>
    site-pages/        JMT About / Contact / Join our crew: [key] (GET, PUT, DELETE = reset), /client/[key]
    lead/              form endpoints for jmt-frontend (homepage, contact, join); admin list of enquiries
    applications/      Join Our Crew worker applications (list, status, delete)
    roles/             roles CRUD (Super Admin)
    users/             users CRUD
    preview/           POST: store an unsaved draft; [token]: draft read by jmt-frontend (shared secret)
  dashboard/           admin UI pages (one folder per section)
    services/          JMT service pages: list (services-list.tsx) and editor ([id])
    site-pages/[key]/  About / Contact / Join Our Crew editor
  robots.ts            Disallow: / (the admin is never indexed)
  login/ forgot-password/ signup/
  lib/
    config/            Prisma client (db.ts), email (SMTP)
    constants/         permissions.ts (permissions + built-in roles), routeAccess.ts (page → permission)
    content/           default content and templates for each CMS section
                       (site-pages.ts: registry of the About / Contact / Join pages)
    server/            shared helpers for the JMT service and site page routes, previewStore.ts (drafts), rbac.ts (roles)
    utils/             auth, CORS, revalidation, serialization, media helpers, leadThrottle.ts (spam limits)
  types/               dashboard types
components/
  ui/                  shadcn/ui primitives
  common/              shared dashboard components (sidebar, editor, media picker, …)
  homepage-editor/     section editors for /dashboard/homepage (their field components are reused)
  jmt-service-editor/  section editors for the service pages
  site-page-editor/    generic editor for About Us, Contact and Join Our Crew
hooks/                 React hooks (route permissions via PermissionsProvider, mobile, useDraftPreview for the Preview button)
lib/                   axios API clients used by the dashboard
lib/homepage/          homepage view-model builder (shared with jmt-frontend)
lib/service/           service page normalizer (shared with jmt-frontend)
lib/sitePages/         mergeContent.ts: saved site page over bundled copy (shared with jmt-frontend)
server/homepage.ts     cached homepage reads for GET /api/homepage/client
types/ data/ utils/    types, bundled default content, form rules (shared with jmt-frontend)
prisma/                schema.prisma and seed scripts
scripts/               maintenance scripts (SMTP test)
public/                bundled default images for the editor previews (homepage/, service/, about/, join/, contact/);
                       proxy.ts lets them through without a login
proxy.ts               auth gate: redirects to /login when not signed in
next.config.ts         security headers (noindex, HSTS, no framing), Vercel production env check
```

### Files shared with jmt-frontend

These files have **identical copies** in both repos (marked `SHARED FILE`). When you change one, copy it to the other repo:

- `lib/homepage/buildHomepage.ts`
- `app/lib/content/home-content.ts`
- `types/homepage.ts`
- `data/homepageFallback.ts`
- `utils/leadForm.ts` (also defines the lead form's hidden page and services fields), `utils/contactForm.ts`, `utils/joinForm.ts`
- `lib/service/normalizeServicePage.ts`, `data/services/*`, `types/service.ts`
- `lib/sitePages/mergeContent.ts`
- `data/about.ts`, `data/contactPage.ts`, `data/joinPage.ts`, `data/thankYouPage.ts`, `types/about.ts`, which come **from** jmt-frontend (edit them there first)
- `TOKEN_PATTERN` in `app/lib/server/previewStore.ts` must match `PREVIEW_TOKEN_PATTERN` in jmt-frontend's `lib/preview.ts`
- `public/homepage/*`, plus the photos in `public/about/` and `public/join/` and `public/contact/chip-*.svg`

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
   - Saving **About Us**, **Contact** or **Join Our Crew** in the dashboard shows up on its page.
   - **Preview** in an editor opens the site with the unsaved change and a preview bar.
   - An image upload in **Dashboard → Media** works.
   - A test lead from the homepage form appears in **Dashboard → Leads** with its page in **Source**, and sends the alert email.
   - `/robots.txt` answers `Disallow: /`.

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

### Vercel

- Import the repo and add the environment variables in **Project → Settings → Environment Variables** before the first build.
- A **production** build fails on purpose if `DATABASE_URL`, `JWT_SECRET`, `REVALIDATE_SECRET`, `JMT_FRONTEND_URL` or `NEXT_PUBLIC_JMT_FRONTEND_URL` is missing, or if any of them except `DATABASE_URL` points at localhost (`next.config.ts`). Preview builds aren't checked.
- Vercel rejects request bodies over 4.5 MB, so uploads are capped at **4 MB** there (25 MB elsewhere). Compress large images first.
- The database must accept connections from outside (Hostinger → **Remote MySQL**). Vercel's IPs change, so that usually means allowing any host (`%`). Keep `connection_limit=5`.
- The lead IP limit and draft previews are in memory, so on Vercel they are per function instance (best effort). The per-email/phone lead limit is in MySQL and always applies.

### Updating a running deployment

```bash
git pull
npm ci
npm run build
# restart the process (pm2 restart jmt-admin / host's "Restart" button)
```

If `prisma/schema.prisma` changed, preview the change and apply it with `npm run db:push` **before** restarting.

## Troubleshooting

- **`EPERM … query_engine-windows.dll.node` during `npm install` / `prisma generate`.** On Windows, a running `npm run dev` locks the Prisma engine. Stop the dev server and run `npx prisma generate` again.
- **npm 11 asks to approve install scripts.** `package.json` → `allowScripts` already approves the ones this project needs (Prisma, bcrypt, esbuild). If you upgrade one of those packages, approve the new version with `npm install-scripts approve <pkg>`.
- **Login says "Invalid credentials" on a new database.** No user exists yet. Run `npm run seed:admin`.
- **Login works locally but loops back to `/login` in production.** The site is served over plain HTTP, so the browser drops the `Secure` auth cookie. Serve it over HTTPS.
- **The "View live" button opens localhost in production.** `NEXT_PUBLIC_JMT_FRONTEND_URL` wasn't set at build time. Set it and rebuild.
- **Homepage edits don't show on jmt-frontend.** Check that `JMT_FRONTEND_URL` points at it and that `REVALIDATE_SECRET` matches in both `.env` files.
- **About Us / Contact / Join Our Crew says "out-of-date database client", or `/api/site-pages/*` returns 500.** The `jmt_site_pages` table or the Prisma client is missing. Run `npm run db:push` (it only adds that table), stop the dev server, run `npx prisma generate`, and start it again.
- **The preview tab says the preview expired.** The draft is older than 2 hours, the server restarted, or the request reached another instance. Click **Preview** again. If it never works, check that `REVALIDATE_SECRET` matches in both apps.
- **A form says "Too many submissions".** The spam limit was hit (see [Leads](#leads)). It clears after 10 minutes.
- **An upload fails with "File too large" on Vercel.** The limit there is 4 MB. Resize the image first.
- **`npm run typecheck` reports missing `app/dashboard/jmt-services/...` modules.** Those are stale generated types in `.next/` from removed pages. Delete the `.next` folder and run it again.
