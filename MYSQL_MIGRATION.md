# MongoDB → MySQL (Prisma) Migration Guide

The CMS now runs on **MySQL via Prisma** instead of MongoDB/Mongoose. This guide covers:
creating the database on Hostinger, running it locally, and moving your existing Mongo data.

---

## 1. Create the MySQL database on Hostinger

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com) → select your hosting plan.
2. Sidebar → **Databases** → **Management**.
3. Under *Create a New MySQL Database and Database User*:
   - Database name: `jmt_cms` (Hostinger prefixes it → `uXXXXXXXXX_jmt_cms`)
   - Username: `jmt-cms` (→ `uXXXXXXXXX_jmt-cms`)
   - Strong password → **Create**.
4. Note the **MySQL host** shown on that page (e.g. `srv1234.hstgr.io`).

### Allow remote access (needed for local development / running migrations from your laptop)

1. Sidebar → **Databases** → **Remote MySQL**.
2. Enter your public IP (or `%` = any host, fine for testing, remove later).
3. Select the database → **Create**.

### Build the connection string

```
DATABASE_URL="mysql://uXXXXXXXXX_jmt-cms:PASSWORD@srv1234.hstgr.io:3306/uXXXXXXXXX_jmt_cms?connection_limit=5"
```

- URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, …).
- Keep `connection_limit=5` — Hostinger caps concurrent MySQL connections.
- When the app itself is deployed on the same Hostinger plan, you may be able to use
  `localhost` as host instead of the `srv…` hostname (check the Management page).

---

## 2. Set up locally

```bash
# .env in the project root
DATABASE_URL="mysql://...as above..."
JWT_SECRET=...            # unchanged, see ENV_SETUP.md
# (all other env vars unchanged — see ENV_SETUP.md)

npm install
npx prisma migrate dev --name init   # creates all tables + generates the client
npm run dev
```

For a throwaway local DB instead of Hostinger: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=dev -e MYSQL_DATABASE=jmt_cms mysql:8` and use `mysql://root:dev@localhost:3306/jmt_cms`.

---

## 3. Migrate existing MongoDB data (one-time, optional)

If you have production data in Mongo:

```bash
# .env additionally needs the OLD database:
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/jmt-cms
DB_NAME=jmt-cms

npx prisma migrate deploy      # ensure tables exist
npm run migrate:data           # copies users, posts, categories, leads, pages, menus, media…
```

- Original Mongo `_id` strings are preserved as primary keys — existing image URLs,
  slugs and relations keep working.
- Passwords are bcrypt hashes and port unchanged — all logins keep working.
- OTPs are ephemeral and intentionally not migrated.
- The script is safe to re-run (upserts by id).

---

## 4. Deploy on Hostinger (app + DB on one plan)

1. Push the repo to GitHub (`git init`, commit, push) if not already.
2. hPanel → **Websites** → **Add Website** → **Web app (Node.js)** → connect the GitHub repo.
3. Build settings: framework auto-detects Next.js; `npm run build` already runs
   `prisma generate` (and `postinstall` covers fresh installs).
4. Add all environment variables from `ENV_SETUP.md` in the app's **Environment variables**
   panel — most importantly `DATABASE_URL` (host may be `localhost` when app and DB share the plan).
5. Create the tables against the production DB (from your machine, with the remote-access
   DATABASE_URL in .env): `npx prisma migrate deploy`
6. Deploy. Check `/api/health` — it now pings MySQL (`SELECT 1`).

---

## What changed in the codebase (summary)

| Before | After |
|---|---|
| `mongoose` models in `app/lib/models/` | `prisma/schema.prisma` (single source of truth) |
| `connectDB()` + `MONGO_URI` | Prisma singleton `app/lib/config/db.ts` + `DATABASE_URL` |
| ObjectId `_id` | String cuid `id`, serialized back as `_id` in API responses (`app/lib/utils/serialize.ts`) — frontend unchanged |
| `Schema.Types.Mixed` fields | native MySQL `JSON` columns |
| `Post.category: [ObjectId]` | real many-to-many join table (implicit `_PostCategories`) |
| Mongo TTL index on OTPs | expiry checked in queries + opportunistic cleanup in request-otp |
| Aggregation pipelines | Prisma queries; `GREATEST(updatedAt, publishedAt)` sorts via `$queryRaw` |

Useful commands: `npm run db:migrate` (dev migration), `npm run db:deploy` (prod),
`npm run db:studio` (browse data), `npm run migrate:data` (Mongo → MySQL copy).
