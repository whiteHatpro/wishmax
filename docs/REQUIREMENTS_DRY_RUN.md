# WishmaX — Requirements dry run

**Source:** `docs/beede188-8c19-4738-b105-08b85dafe3cf_WishmaX.pdf`  
**Repo:** https://github.com/whiteHatpro/wishme  
**Last automated pass:** `npm run verify` + `npx shopify theme check --path extensions/wishmax-widget -C theme-check:theme-app-extension` (run locally after changes)

---

## 1. Automated checks (CI-style)

| Check | Result |
|--------|--------|
| `npm run verify` | Run before PR: build, lint, prisma validate, app config validate |
| Theme Check (theme app extension) | **Pass** when 0 offenses |

---

## 2. PDF requirements vs implementation

Legend: **Yes** = covered · **Partial** = subset or different shape · **No** = not implemented · **Manual** = merchant / process

### Admin / app home

| Requirement (PDF) | Status | Notes |
|-------------------|--------|--------|
| Install, permissions, embed | **Manual** | Partner + `shopify app dev` / install URL |
| Sections: Configure, Analytics, API Details, Subscription, FAQs | **Yes** | Routes: `/app/configure`, `/app/analytics`, `/app/api-details`, `/app/subscription`, `/app/faqs` |
| Configure — display (heart/button, colours, sizes, placement, etc.) | **Partial** | Heart vs button, colours, desktop + mobile icon size, button labels, hover colour (heart), PDP/PLP/cart/header toggles, Flow toggle. **Advanced theme:** optional Google Font, custom CSS, PLP icon corner placement, full-width PDP button (button style). Not in PDF / not built: border-radius sliders, drag-to-position PLP, global “theme picker”. |
| Wishlist page settings (URL, heading, multi-select, share, empty state copy) | **Partial** | Theme block: heading, **empty message**, page handle. **Multiselect + Add selected to cart** + **Copy share link** (guest + logged-in). Default handle/docs in Configure. |
| Share wishlist | **Yes** | `allowShare`; **POST** share; logged-in + **guest snapshot** share; **`/share/:token`** + **GET `/api/wishlist/share/:token`** JSON |
| Guest wishlist | **Yes** | localStorage + merge; **guest analytics** via `/api/wishlist/event` |
| Cart behaviour / redirect | **Partial** | Admin toggle; wishlist page respects **`redirectToCart`**; cart line injection (best-effort by theme) |
| Shopify Flow | **Partial** | **Flow trigger extension** (`extensions/wishmax-flow/`) + **`flowTriggerReceive`** from add/remove/share; merchant enables Flow + toggle in Configure |
| Headless API keys | **Partial** | **API Details**: generate/revoke **hashed** keys; storefront still uses CORS + shop — full headless key-gated API surface can be extended later |
| Advanced (custom CSS, fonts, PLP position, full-width PDP button) | **Partial** | **Configure → Advanced theme** + `/api/config` + storefront `wishmax.js` / `wishlist-page`: custom CSS, Google Font family, `plpIconPlacement`, `fullWidthButtonOnPdp` (button style). **No** separate “theme selector” UI (single set of theme fields). |

### Analytics (PDF)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Full KPI set (adds, guest vs logged-in, funnels, revenue, sources, etc.) | **Partial** | **Event-backed** metrics in admin: adds/removes/shares/share visits/page views/wishlist→cart events/merge; unique guests & customers (range); date range. **No revenue / order attribution** (would need Orders webhooks + attribution). **No source-page funnel breakdown** beyond stored `sourcePage` on events. |

### API (PDF paths)

| Endpoint / behaviour | Status | Notes |
|----------------------|--------|--------|
| Add / remove / get / merge | **Yes** | **`/api/wishlist`** + aliases **`/api/wishlist/add`**, **`/remove`**, **`/merge`** (POST body same as PDF-style fields) |
| Share | **Yes** | **`/api/wishlist`** `action: share` + **`POST /api/wishlist/share`** |
| Shared GET | **Yes** | HTML **`/share/:token`** + JSON **`GET /api/wishlist/share/:token`** |
| Public / customer / guest semantics | **Partial** | Logged-in + guest offline + guest share snapshot; **`/api/wishlist/event`** for guest + page analytics |

### Storefront / UX (PDF)

| Requirement | Status | Notes |
|-------------|--------|--------|
| PDP wishlist | **Yes** | Injects near cart form; **variant select** guard when options disabled |
| PLP / collection | **Yes** | Heuristic cards |
| Header count | **Partial** | When header link matches selector — **theme must expose link** |
| Cart page | **Partial** | **`/cart.js` + row matching** — layout varies by theme |
| Variant rules (PDP must select variant, etc.) | **Partial** | PLP uses first/card variant; PDP validates selected option not disabled |
| `shop.metafields.wishmax.app_url` | **Partial** | Liquid + **sync** from app; metafield access still Partner/Custom Data dependent |

### Compliance / launch (PDF tail)

| Item | Status | Notes |
|------|--------|-------|
| App Store review / BFS / billing | **Manual** | **Subscription** page documents Bronze/$5 intent; real billing is Partner Dashboard |

---

## 3. Manual QA checklist

Follow **[MANUAL_QA.md](MANUAL_QA.md)** for step-by-step checks and a **sign-off** table. At minimum before merge:

- [ ] **`npm run verify`** passes (+ Theme Check if `extensions/wishmax-widget/` changed)
- [ ] Embedded app: Configure save + Analytics + API Details + Subscription + FAQs
- [ ] Storefront PDP / PLP / cart / wishlist page; guest + logged-in; share URL + JSON
- [ ] **Shopify Flow** (if testing Flow): trigger + Configure toggle on

---

## 4. Remaining gaps vs full PDF (nice-to-have / later)

1. **Revenue / wishlist attribution**, **order webhooks**, **full PDF KPI set**  
2. **Theme picker / extra PDF polish** (e.g. border-radius controls, drag PLP placement) if product scope expands  
3. **Deeper cart** integrations (3rd-party carts noted as out of scope in PDF)  
4. **Headless**: enforce `X-Wishmax-Key` on dedicated routes if product needs strict separation from public CORS

---

## 5. Config / extensions to keep aligned

- `shopify.app.toml` — `application_url`, `embedded`, `[auth]`, `[build]`, scopes  
- `extensions/wishmax-widget/` — theme app extension only  
- `extensions/wishmax-flow/` — Flow trigger handle **`wishmax-wishlist-activity`** must stay aligned with `app/lib/flow-trigger.server.ts`

Update this file whenever features ship.
