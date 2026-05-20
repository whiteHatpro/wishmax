# WishmaX — Manual QA guidelines

Use this for **human testing** before a release or when reviewing a PR that touches behaviour merchants or shoppers see. Pair it with **[TESTING.md](TESTING.md)** (local setup + automated commands) and **[REQUIREMENTS_DRY_RUN.md](REQUIREMENTS_DRY_RUN.md)** (PDF vs implementation map).

---

## Preconditions

| Check | Notes |
|--------|--------|
| Dev store + Partner app | App installed; tunnel URL valid if using `shopify app dev` |
| Theme | **Online Store → Themes → Customize → App embeds** → **WishmaX** enabled |
| Wishlist page | A **page** with the **WishmaX wishlist page** section block (handle e.g. `wishlist`) |
| Test customer (optional) | Log in as a customer for logged-in wishlist paths; use incognito for guest |

---

## 1. Automated checks (required before manual QA)

From repo root:

```bash
npm run verify
```

If you changed `extensions/wishmax-widget/`, also run Theme Check (see [TESTING.md §4](TESTING.md)).

---

## 2. Embedded admin — navigation & persistence

Walk the app in order; after **Configure** changes, reload the storefront or wait for config fetch.

| # | Action | Pass when |
|---|--------|-----------|
| 2.1 | **Home** loads | No error banner |
| 2.2 | **Configure** — change a visible setting (e.g. icon colour) → **Save** | Success; reload page — value persists |
| 2.3 | **Configure → Advanced theme** (if exercising theme) | Google Font field, custom CSS, PLP corner, full-width PDP toggle save and persist |
| 2.4 | **Analytics** | Date range changes; tiles load without error |
| 2.5 | **API Details** | Can generate a headless key (once); docs text readable |
| 2.6 | **Subscription**, **FAQs** | Pages render |

---

## 3. Storefront — PDP & PLP

| # | Action | Pass when |
|---|--------|-----------|
| 3.1 | Open a **product** page | Wishlist control appears (heart or button per config) |
| 3.2 | Toggle wishlist **on/off** | State updates; duplicate clicks do not corrupt UI |
| 3.3 | Change **variant** (if multiple) | Wishlist reflects selected variant where applicable |
| 3.4 | If **button** style + **full-width PDP** on | Button spans intended width |
| 3.5 | **Collection / PLP** | Icon appears in chosen **corner** (Advanced theme placement) |
| 3.6 | Optional: **custom CSS** in Configure | Visible scoped change (e.g. `.wishmax-btn`) without breaking layout |

---

## 4. Cart & wishlist page

| # | Action | Pass when |
|---|--------|-----------|
| 4.1 | Add items from wishlist to cart (if enabled) | Cart receives line(s) |
| 4.2 | **`/cart`** | Wishlist controls show per line when **show on cart** is on (theme-dependent) |
| 4.3 | **Wishlist page** (`/pages/wishlist` or your handle) | List shows; empty state matches block copy when empty |
| 4.4 | **Multiselect + Add selected to cart** | Works for logged-in (and guest if applicable) |
| 4.5 | **Copy share link** | Link copies; opens shared view for another browser/session |

---

## 5. Guest vs logged-in & share URLs

| # | Action | Pass when |
|---|--------|-----------|
| 5.1 | **Guest** (incognito): add items | Items persist in session; no server crash |
| 5.2 | **Login** (if merge implemented): items reconcile without loss | Acceptable UX per product |
| 5.3 | Open **`/share/<token>`** | Shared items render |
| 5.4 | **`GET /api/wishlist/share/<token>`** (JSON) | Returns expected payload for tooling |

---

## 6. Advanced theme (focused pass)

Do this when PR touches `app.configure`, `/api/config`, or `extensions/wishmax-widget/assets/*.js`.

| # | Step | Pass when |
|---|------|-----------|
| 6.1 | Set **Google Font** in Configure → save | Storefront loads font; wishlist controls use it |
| 6.2 | Set **custom CSS** targeting `.wishmax-btn` | Change visible; remove CSS → reverts |
| 6.3 | Cycle **PLP icon placement** | Heart moves to each corner |
| 6.4 | **Full-width PDP button** only with **button** style | Width spans; off restores previous layout |

---

## 7. Shopify Flow (optional)

Requires a store **with Flow** and the trigger deployed via app dev/preview.

| # | Action | Pass when |
|---|--------|-----------|
| 7.1 | **Flow** → new workflow → trigger **Wishlist activity** | Trigger selectable |
| 7.2 | Toggle **Send events to Shopify Flow** in Configure **on**; perform add/remove/share | Workflow receives payload / executes action you configured |

---

## 8. Revenue / order attribution (optional)

Only if you test **orders paid** + wishlist attribution features.

| # | Action | Pass when |
|---|--------|-----------|
| 8.1 | Add a variant to wishlist, then **complete checkout** for that variant | **Analytics** (or attribution UI if present) reflects wishlist-tied order when designed to |

---

## 9. Sign-off

| Area | Tester | Date | Pass / Fail | Notes |
|------|--------|------|-------------|-------|
| Automated (`npm run verify` + Theme Check if applicable) | | | | |
| Admin (§2) | | | | |
| Storefront PDP/PLP (§3) | | | | |
| Cart & wishlist page (§4) | | | | |
| Share & guest (§5) | | | | |
| Advanced theme (§6) | | | | |
| Flow (§7) | | | | |
| Orders / revenue (§8) | | | | |

---

## Related docs

- **[TESTING.md](TESTING.md)** — install, `.env`, Prisma, run app, smoke table  
- **[REQUIREMENTS_DRY_RUN.md](REQUIREMENTS_DRY_RUN.md)** — requirement coverage vs PDF
