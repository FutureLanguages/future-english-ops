# Future English Ops

## Local database setup

This project uses Supabase with Prisma and expects two database URLs.
For local development, use the direct database host for both.

- `DATABASE_URL`
  - used by Prisma schema as the primary datasource URL
  - used by the Next.js runtime
  - for local development, point this to the direct database host on port `5432`
  - should include:
    - `sslmode=require`

- `DIRECT_URL`
  - used by Prisma CLI schema operations such as `db push`, `db pull`, and similar direct tasks
  - keep `directUrl = env("DIRECT_URL")` in `prisma/schema.prisma`
  - for local development, set this to the same direct database host on port `5432`
  - should include:
    - `sslmode=require`

Example:

```env
DATABASE_URL="postgresql://postgres:<URL-ENCODED-PASSWORD>@db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:<URL-ENCODED-PASSWORD>@db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require"
AUTH_SECRET="replace-this-with-a-long-random-string"
```

### Supabase / Prisma notes

- Keep special characters in the password URL-encoded.
- Runtime uses `DATABASE_URL` only.
- Prisma CLI schema operations use `DIRECT_URL` through `directUrl` in `prisma/schema.prisma`.
- For local development, set both `DATABASE_URL` and `DIRECT_URL` to the direct `db.<project-ref>.supabase.co:5432` host if the Supabase pooler is unstable or unreachable.
- If either URL is missing `sslmode=require`, connections can fail intermittently depending on local network and SSL negotiation behavior.

### Recommended local command order

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:push
npm run prisma:seed
npm run dev
```
