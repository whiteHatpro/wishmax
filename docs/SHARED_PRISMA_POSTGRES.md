# Shared QA database — Prisma Postgres (MCP)

The team shared database can live on **[Prisma Postgres](https://www.prisma.io/postgres)** (managed Postgres in the Prisma console).

## WishMe QA database (reference)

| Field | Value |
|--------|--------|
| **Display name** | `wishme-shared-qa` |
| **databaseId** | `db_cmpdpgq2b09rr08dzw2j5e7ps` |
| **projectId** | `proj_cmpdpgq2b09rv08dzf8byhq2q` |
| **Region** | Asia Pacific (Singapore) (`ap-southeast-1`) |

**Do not commit connection strings.** Each developer sets **`DATABASE_URL`** only in **`.env`** (gitignored).

## What to put in `DATABASE_URL`

Use the **direct Postgres** connection string **`postgres://...db.prisma.io:5432/...`** (returned when the database was created or from the Prisma Console under this database).

The **`prisma+postgres://accelerate.prisma-data.net/?api_key=...`** URI is for **Prisma Accelerate** clients; **this Remix app** uses ordinary Prisma + PostgreSQL → use the **direct** URL as **`DATABASE_URL`**.

Hand off to QA **via password manager / 1Password / internal vault**, not public Slack/GitHub Issues.

If you lose the URL: **[console.prisma.io](https://console.prisma.io)** → project **`wishme-shared-qa`** → connection strings, or use the **`list_prisma_postgres_connection_strings`** / **`create_prisma_postgres_connection_string`** tools on the authenticated **Prisma Remote** MCP.

## First-time schema on the shared DB

One person runs (with `DATABASE_URL` set to the direct URL):

```bash
npx prisma migrate deploy
npx prisma generate
```

Everyone else: same **`DATABASE_URL`**, then `npx prisma generate` (migrate already applied).

## MCP auth retry

If **Prisma Remote** MCP hits a malformed/error response, authenticate again (`mcp_auth` with `{}`), then **`list_prisma_postgres_databases`** / **`create_prisma_postgres_database`**.
