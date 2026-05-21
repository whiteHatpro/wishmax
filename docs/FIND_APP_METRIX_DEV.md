# I can’t see WishMe on **metrix-dev** — fix checklist

Your CLI is linked to **`metrix-dev.myshopify.com`** (`shopify app info`). If WishMe doesn’t appear in Admin, it usually means **install never finished**, **URLs are placeholders**, or you’re looking in the wrong Settings screen.

---

## 1. Install / open the app (fastest fix)

Run the app from **this repo** so Shopify gets a **real tunnel URL** (overrides dummy `application_url`s in Git):

```bash
cd /Users/mohak.srivastav/Projects/wishmax   # or your clone path
cp env.example .env                          # fill SHOPIFY_*, DATABASE_URL first
docker compose up -d                         # or your hosted Postgres DATABASE_URL only
npx prisma migrate deploy && npx prisma generate
npm run shopify app dev -- --store metrix-dev.myshopify.com
```

- Wait until the CLI prints **Preview URL** / **Installed** / prompts to press **Open app**.
- That flow sets `SHOPIFY_APP_URL` on the tunnel and updates Partner config (**Update URLs** = Yes in `shopify app info`).

**Stop dev** (`Ctrl+C`): some teams still see the app if tunnel URLs stayed on Partners; others need a **real production URL** plus `shopify app deploy`.

---

## 2. Direct install attempt (logged into **same** account as Partner)

Paste this **while logged into Shopify Admin** as a user with access to **metrix-dev**:

[Install WishMe on metrix-dev (OAuth)](https://admin.shopify.com/store/metrix-dev/oauth/install?client_id=88fd29f22076ef832e5a11762d014184)

If Shopify shows an error, read the message: bad **application URL** / wrong store / already installed flows are common.

---

## 3. Find it after install — **Apps** sidebar

WishMe normally appears under:

[Apps · metrix-dev](https://admin.shopify.com/store/metrix-dev/apps)

If missing, open:

[Apps and sales channels (settings)](https://admin.shopify.com/store/metrix-dev/settings/apps)

Check **WishMe** isn’t **removed/disabled**.

---

## 4. Partner / Dev Dashboard route

Signed in as the Partner account that owns WishMe (**e.g. Metrix org**):

1. Open **[Shopify Partner / Dev Dashboard](https://partners.shopify.com/)** → your org → **Apps** → **WishMe**.
2. Use **Test on development store** / pick **metrix-dev** (wording varies by Dashboard version).
3. Complete install if prompted.

---

## 5. Why deploy alone sometimes “shows nothing”

`shopify app deploy` updates **Partner app versions** (extensions + config).

If **`application_url`** in the **live** Shopify config still points at **invalid placeholders** (`https://shopify.dev/apps/default-app-home`) and **no** **working** Remix server URL is set during dev or in Partner Dashboard, the **embedded iframe** fails or installs don’t succeed.

**Remediation:** Always run **`shopify app dev --store metrix-dev…`** until you confirm the app loads, **or** set a **HTTPS production** app URL everywhere (host + Deploy + **`shopify app deploy`**).

---

## 6. Still stuck — send this to support / chat

Copy from `shopify app info`:

- Configuration file (`shopify.app.toml`)
- **Client ID**
- **Dev store**: `metrix-dev.myshopify.com`
- **Update URLs**: Yes / No
- Exact error from opening the **OAuth install** link or from `shopify app dev` logs
