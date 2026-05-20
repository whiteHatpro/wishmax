# Shared database for QA / staging

The app uses **PostgreSQL** via **`DATABASE_URL`** (see `prisma/schema.prisma`).  
QA can either run Postgres locally (**Docker**) or use a **hosted** free-tier database and share **one** connection string for the team.

## Where does `DATABASE_URL` come from?

**It is not stored in GitHub.** Each environment sets it only in `.env` (gitignored):

| Scenario | Where the URL lives |
|---------|---------------------|
| **Your laptop + Docker Compose** | You build it from `docker-compose.yml`: user `wishme`, password `wishme`, host `localhost` (often `127.0.0.1`), port `5432`, database `wishme` — usable **only on your machine**. |
| **Shared QA / team testing** | Create a Postgres instance in **[Neon](https://neon.tech)**, **[Supabase](https://supabase.com)**, **Railway**, etc. Copy the **`DATABASE_URL`** (or assemble it) **from their project dashboard** → put it in each tester’s local `.env` or in your staging host’s secrets. |

What you send QA is literally that **connection string** (treat like a password). Optional: Neon “**Pooling**” URL for runtime and “**Direct**” for `prisma migrate deploy` — see provider docs linked from `docs/DEPLOY.md`.

## What to share with QA (safe checklist)

1. **`DATABASE_URL`** — PostgreSQL connection string from **your Neon/host dashboard** or from **your** staged secrets (never commit it).  
   - Prefer a **staging-only** database, not production.  
   - Do **not** post it in public Slack; use a password manager or internal vault.

2. **Same `.env` as you** for app secrets — `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `SHOPIFY_APP_URL` — from the **same** Partner app (WishMe) if they test against your dev tunnel or staging host.

3. **Optional:** If multiple people run migrations against Neon, use the **non-pooling** / **direct** connection string for `prisma migrate deploy`, or follow [Neon + Prisma](https://www.prisma.io/docs/orm/overview/databases/neon) (pooler vs direct).

## Option A — Local Postgres (everyone identical)

```bash
docker compose up -d
cp env.example .env
# Set DATABASE_URL=postgresql://wishme:wishme@localhost:5432/wishme
npx prisma migrate deploy
npx prisma generate
```

Each developer has **their own** Docker volume unless they point `DATABASE_URL` elsewhere.

## Option B — Shared hosted DB (Neon, Supabase, Railway, etc.)

1. Create a **new** Postgres instance (e.g. Neon free project).  
2. Copy the **connection string** (with `sslmode=require` if required).  
3. Put it in **`DATABASE_URL`** in `.env` for every tester who should share the same data.  
4. One person runs migrations once:

```bash
npx prisma migrate deploy
npx prisma generate
```

Everyone else **only** needs `DATABASE_URL` + generate (or rely on CI that runs `migrate deploy`).

## Inspect data (support / QA)

```bash
npx prisma studio
```

Uses `DATABASE_URL` from `.env`.

## Security

- Treat **`DATABASE_URL`** like a password (sessions + wishlist data).  
- Rotate the DB password if it leaks.  
- SQLite **`prisma/dev.sqlite`** from older clones is **obsolete** after the Postgres migration; delete that file locally if present.
