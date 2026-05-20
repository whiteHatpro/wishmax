# Deploy WishMe (Remix app + Shopify extensions)

Deploying has **two** parts: (1) host the **web app** somewhere public, (2) register config + extensions with **Shopify** (`shopify app deploy`).  
Pushing to **GitHub does not** deploy the app by itself unless you add CI.

## 1. Production database

Use **PostgreSQL** (Neon, Supabase, RDS, etc.). Set on the host:

```bash
DATABASE_URL="postgresql://..."
```

Run migrations on deploy (already in `npm run setup`):

```bash
prisma generate && prisma migrate deploy
```

## 2. Host the Remix server

Choose a Node host (Fly.io, Railway, Render, Google Cloud Run, etc.) that can run:

- **Build:** `npm run build` (install devDependencies for build or use a multi-stage Dockerfile).  
- **Start:** `npm run start` (runs `remix-serve ./build/server/index.js`).  
- **Env vars** (minimum):

| Variable | Source |
|----------|--------|
| `SHOPIFY_API_KEY` | Partner Dashboard → WishMe → Settings → Client ID |
| `SHOPIFY_API_SECRET` | Same → Client secret |
| `SCOPES` | Must match `shopify.app.toml` |
| `SHOPIFY_APP_URL` | **Public URL** of this app (e.g. `https://wishme.fly.dev`) — **required** |
| `DATABASE_URL` | Postgres connection string |
| `NODE_ENV` | `production` |

Optional: `SHOP_CUSTOM_DOMAIN` if you use a custom dev shop domain in CLI docs.

### Dockerfile note

The repo’s `Dockerfile` uses `npm ci`; if `package-lock.json` is absent, switch to `npm install` in the Dockerfile or commit a lockfile. Align **Node** with `package.json` `engines` (Node 20+).

## 3. Point Shopify at your URL

After the app is live:

1. **Partner Dashboard → App → Configuration**  
   Set **App URL** and **Allowed redirection URL(s)** to your production URLs (often updated automatically when you run `shopify app deploy` if the CLI rewrites `shopify.app.toml`).

2. From a machine logged into Shopify CLI and linked to this app:

```bash
shopify app deploy
```

This uploads **theme extension**, **Flow extension**, and app configuration. Your **web** app must already be reachable at `SHOPIFY_APP_URL`.

## 4. Continuous deployment (optional)

- **GitHub Actions**: on push to `main`, build, run tests, deploy to host, then `shopify app deploy` using an **[App deployment token](https://shopify.dev/docs/apps/tools/cli/ci-cd)** (Partners → App → Settings → App automation token).  
- Store the token as a **GitHub Actions secret** (never in the repo).

## 5. Store testing

In the development store: **Online Store → Themes → Customize → App embeds** — enable the WishMe embed; add the wishlist page section if you use it.

## 6. `shopify app deploy` + Protected Customer Data

From the repo (CLI logged into the right Partner org):

```bash
npm exec --yes -- @shopify/cli app deploy --allow-updates
```

**`orders/paid` webhook:** Shopify rejects app versions that subscribe to **`orders/paid`** until your app meets [Protected Customer Data](https://shopify.dev/docs/apps/launch/protected-customer-data) requirements for that bundle. Until then, **`shopify.app.toml`** ships with that webhook **commented out** (wishlist/order attribution webhook handler remains in code for when you uncomment + redeploy).

---

Production deploy remains your hosting + env vars above; **`shopify app deploy`** only pushes **Partner app versions** (CLI extensions + declarative webhook config tied to those versions).
