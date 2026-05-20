# Testing WishmaX locally

Use this when you are a **developer** cloning the repo and need to run the app, theme extension, **Flow trigger**, and smoke-test **wishlist APIs**, **sharing** (logged-in + guest), **cart injection**, and **analytics events** on a **development store**.

For **structured manual QA** (step-by-step checks before release or for PR review), use **[MANUAL_QA.md](MANUAL_QA.md)**.

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | `>=20.19 <22 \|\| >=22.12` (see `package.json` → `engines`) |
| **Shopify Partner** account + **dev store** | [Dev stores](https://help.shopify.com/partners/dashboard/development-stores) |
| **Shopify CLI** | `npm install -g @shopify/cli@latest` |
| **Git** | Clone this repository |

## 1. Install dependencies

```bash
git clone https://github.com/whiteHatpro/wishme.git
cd wishme
npm install
```

## 2. Environment (local only)

Copy the template and fill in values from **Partner Dashboard → WishMe → Settings** (Client ID + secret):

```bash
cp env.example .env
```

Edit **`.env`**. **Do not commit secrets.** Variables are documented in **[`env.example`](../env.example)** (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, and `SHOPIFY_APP_URL` when not using only CLI defaults).

**Database:** SQLite at `prisma/dev.sqlite` (gitignored). See **[README — Database (Prisma)](../README.md#database-prisma)** for full setup; first time or after pulling migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

## 3. Link the Partner app

```bash
shopify auth login
shopify app config link
```

## 4. Automated verification (run after big changes)

From the repo root:

```bash
npm run verify
```

This runs **build**, **eslint**, **`npx prisma validate`**, and **`npx shopify app config validate`**. Use it before every PR or after touching `app/`, `prisma/`, or `shopify.app.toml`.

If `shopify` / `npx` is missing or errors on your machine, use the CLI via **`npm exec`** (same checks):

```bash
npm exec --yes -- @shopify/cli app config validate
npm exec --yes -- @shopify/cli theme check --path extensions/wishmax-widget -C theme-check:theme-app-extension
```

Optional (recommended after editing `extensions/wishmax-widget/`):

```bash
npx shopify theme check --path extensions/wishmax-widget -C theme-check:theme-app-extension
```

## 5. Run the app

```bash
npm run shopify app dev
# or: shopify app dev
```

Use the CLI URLs to **install** the app, then:

1. **Online Store → Themes → Customize → App embeds** → enable **WishmaX**.
2. **Pages** → create a page (handle e.g. `wishlist`) → **Customize** → add section block **WishmaX wishlist page** (empty message + heading can be edited in the block).

### Flow trigger (Shopify Flow)

The extension lives in **`extensions/wishmax-flow/`**. With **`shopify app dev`** running, open **Apps → Flow** on a eligible store, create a workflow, and choose trigger **Wishlist activity** (handle `wishmax-wishlist-activity`).  
Configure **Configure → Send events to Shopify Flow** in the embedded app so the backend can call `flowTriggerReceive` when shoppers add/remove/share.

## 6. Feature smoke tests

| Area | What to verify |
|------|----------------|
| **Admin** | Home, **Configure** (save), **Analytics** (date range + tiles), **API Details** (generate key once), **Subscription**, **FAQs** |
| **Configure — Advanced theme** | Optional Google Font + custom CSS; PLP icon corner; full-width PDP wishlist button when icon style is **button** |
| **PDP / PLP** | Heart toggles; variant change on PDP updates state; optional hover colour if set |
| **Cart** | On `/cart`, wishlist buttons appear per line (theme-dependent row markup; uses `/cart.js`) |
| **Wishlist page** | Empty copy from block; **Copy share link**; multiselect + **Add selected to cart**; guest + logged-in |
| **Share** | Open `/share/<token>` (items load); JSON **`GET /api/wishlist/share/<token>`** |
| **PDF-style REST** | `POST /api/wishlist/add`, `/remove`, `/merge`, `/share` with same JSON body shapes as `/api/wishlist` |
| **APIs** | `GET /api/config?shop=…`, `GET/POST /api/wishlist`, `POST /api/wishlist/event` (analytics guest events) |

## 7. Docs

- Manual QA (reviewers): **[MANUAL_QA.md](MANUAL_QA.md)**  
- Requirements dry-run vs PDF: **[REQUIREMENTS_DRY_RUN.md](REQUIREMENTS_DRY_RUN.md)**  
- Product PDF: `docs/beede188-8c19-4738-b105-08b85dafe3cf_WishmaX.pdf`

## 8. Typical issues

| Symptom | What to try |
|---------|-------------|
| Empty **`APP_URL`** in Liquid | Set shop metafield `wishmax.app_url` or open embedded app so the server can sync; tunnel must match |
| Flow trigger errors | App must be installed; offline session present; trigger deployed / app dev preview; check server logs for `flowTriggerReceive` errors |
| Cart buttons missing | Theme markup may differ; check browser console; `showOnCart` in Configure must be on |
