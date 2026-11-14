# Cache Revalidation

How content saved in the JMT admin reaches the two websites, what the
**Revalidate Cache** and **Reset all cache** buttons do, and what to check when
a change doesn't appear.

---

## 1. Why there is a cache

Both websites cache CMS content so pages load instantly:

| Site | Env var in jmt-admin | Cache lifetime |
|---|---|---|
| Main website | `PRODUCTION_URL` | set by that site (not in this repo) |
| Joy Maa Tara site (jmt-frontend) | `JMT_FRONTEND_URL` | **10 minutes** (`revalidate: 600`) |

The admin keeps its own cached reads as well (`server/homepage.ts`, also 10 minutes).
Without revalidation, an edit could take up to 10 minutes to appear.

## 2. Cache tags

Every cached fetch carries **tags**. Clearing a tag refreshes only the content that carries it.

| Tag | What it covers |
|---|---|
| `homepage` | JMT homepage content |
| `homepage-media` | Homepage images (Media library) |
| `header-menu`, `footer-menu` | Menus, shown on **every** page |
| `jmt-service-list` | JMT service list and navbar "Services" dropdown |
| `jmt-service-<slug>` | One JMT service page (`/service/<slug>`) |
| `jmt-page-<key>` | JMT About, Contact, Join our crew (`about`, `contact`, `join-our-crew`) |
| `post-list`, `post-<slug>` | Blog list and one article (main site) |
| `service-list`, `service-<slug>` | Main-site division pages |
| `package-list`, `packages-<page>` | Package blocks and the pages they're injected into |
| `about-page`, `contact-page`, `terms-policy` | Main-site pages |

Tag builders: `app/lib/utils/cacheTags.ts`. The frontend side must use the same
names (`jmt-frontend/server/*.ts`, `lib/homepage/buildHomepage.ts`,
`lib/sitePages/registry.ts`).

## 3. Automatic revalidation (the normal path)

**You usually don't need a button.** Every save, publish and delete calls
`revalidateFrontendTags(tags)` (`app/lib/utils/revalidateFrontend.ts`), which:

1. expires the tags in the admin's own cache, then
2. sends `POST /api/revalidate` to **both** websites at once, with the
   `x-revalidate-secret` header and a 10 s timeout.

jmt-frontend checks the secret, then runs `revalidateTag(tag, { expire: 0 })`
for each tag and `revalidatePath("/", "layout")`. With `expire: 0` the next
visitor gets fresh content straight away, instead of one more stale page.

A failed refresh **never fails the save**. The content is in the database
either way, and the cache expires on its own within 10 minutes.

## 4. Revalidate Cache (any CMS user)

Every content screen has a **Revalidate Cache** button. Published rows in a
list have a small ↻ icon. It clears that screen's tags on both sites.

| Screen | Tags |
|---|---|
| Homepage | `homepage`, `homepage-media`, `header-menu`, `footer-menu`, `service-list`, `jmt-service-list` |
| Media | `homepage-media` |
| Services (list header) | `jmt-service-list` + every published page (up to 49) |
| Services (row / editor) | `jmt-service-list`, `jmt-service-<slug>` |
| Site pages | `jmt-page-<key>` |
| Header / Footer menu | `header-menu` / `footer-menu` |
| Blog (row) | `post-list`, `post-<slug>` |
| Blog categories | `post-list` |
| Packages (row) | `package-list`, `packages-<page>`… |
| About / Contact / Terms (main site) | `about-page` / `contact-page` / `terms-policy` |

When to use it:
- an automatic refresh failed, because a site was down or redeploying when you saved;
- data was changed outside the admin (directly in MySQL, or by a script);
- you want to check that the pipeline works end to end.

It doesn't publish drafts, change content or start a deployment. It is always
safe to click.

### Reading the toast

The toast reports **each site separately**:

| Toast | Meaning |
|---|---|
| ✅ Cache cleared on the main site and the JMT site | Both sites responded 200 |
| ⚠️ Cache only partly cleared: Main site ✓ · JMT site ✗ secret mismatch | One site failed (see §7) |
| ❌ Cache not cleared | Every site failed |

## 5. Reset all cache (admins only)

**Reset all cache** at the bottom of the sidebar clears **every** cached page
on both sites, after you confirm.

`POST /api/revalidate/all` builds the full tag list from the database: the
fixed tags, plus one tag per post, main-site service, package target page, JMT
service page and JMT site page. It sends them in chunks of 50, the most each
site accepts per request. The toast shows the tag count and the result for each site.

Use it after changing env vars or secrets, after a site was down for a while,
or after bulk database edits. Each page's first visit afterwards is a little slower.

Superadmins and admins see the button. Everyone else gets 403 from the API.

## 6. Security

- **Browser → admin**: session cookie. `/api/revalidate` needs any CMS role;
  `/api/revalidate/all` needs admin.
- **Admin → websites**: `REVALIDATE_SECRET` in `x-revalidate-secret`. The
  secret never reaches the browser.
- Tags must match `/^[a-z0-9_-]{1,100}$/i`, with at most 50 per request. Both
  sides strip quotes and spaces from the secret (`normalizeSecret`), so values
  pasted into hPanel with quotes still work.

### Status codes (`/api/revalidate` and `/api/revalidate/all`)

| Code | Meaning |
|---|---|
| 200 | Every site cleared |
| 400 | Bad tags |
| 401 / 403 | Not signed in / role not allowed |
| 502 | At least one site failed (details in `sites`) |
| 504 | Every failing site timed out |
| 500 | Unexpected admin error |

## 7. Troubleshooting

| Toast says | Cause | Fix |
|---|---|---|
| `secret mismatch` | `REVALIDATE_SECRET` differs between jmt-admin and that site | Compare the values in hPanel. Look for spaces and quotes |
| `timed out` | Site didn't respond within 10 s | Check the site is up, then retry |
| `unreachable` | DNS, wrong URL or site stopped | Check `PRODUCTION_URL` / `JMT_FRONTEND_URL` |
| `HTTP 5xx` | The site errored | Check that site's logs |

**Nothing ever updates**: check `PRODUCTION_URL` and `JMT_FRONTEND_URL` in
jmt-admin. Unset, they fall back to `http://localhost:3001` and
`http://localhost:3002`, so production refreshes go nowhere and edits only
appear after the 10-minute expiry. If both are set to the same origin, that
site is notified once and reported as "Main site".

**Still stale after a success toast**: check the page is published (drafts
never show), then hard-reload (Ctrl+F5). Your browser cache is separate.

### Checking the pipeline by hand

```bash
curl -X POST "$JMT_FRONTEND_URL/api/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"tags":["homepage"]}'
# → {"success":true,"revalidated":["homepage"]}   (401 = secrets differ)
```

## 8. Files

| File | Role |
|---|---|
| `app/lib/utils/cacheTags.ts` | Tag builders and static tag list (safe to import in client code) |
| `app/lib/utils/revalidateFrontend.ts` | `revalidateFrontendTags`, per-site `SiteResult`s |
| `app/api/revalidate/route.ts` | Manual button endpoint |
| `app/api/revalidate/all/route.ts` | Reset-all endpoint |
| `lib/revalidateClient.ts` | Dashboard helper: calls the API and shows the toast |
| `components/common/RevalidateButton.tsx` | The button (page and row styles) |
| `components/common/ResetCacheButton.tsx` | Sidebar reset with confirm dialog |
| `jmt-frontend/app/api/revalidate/route.ts` | Receives, checks the secret, clears tags and layout |
