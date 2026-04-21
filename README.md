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
SUPABASE_URL="https://<PROJECT-REF>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<SERVER-ONLY-SERVICE-ROLE-KEY>"
SUPABASE_STORAGE_BUCKET="application-files"
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB="10"
SERVER_ACTION_BODY_SIZE_LIMIT="12mb"
```

### Supabase / Prisma notes

- Keep special characters in the password URL-encoded.
- Runtime uses `DATABASE_URL` only.
- Prisma CLI schema operations use `DIRECT_URL` through `directUrl` in `prisma/schema.prisma`.
- For local development, set both `DATABASE_URL` and `DIRECT_URL` to the direct `db.<project-ref>.supabase.co:5432` host if the Supabase pooler is unstable or unreachable.
- If either URL is missing `sslmode=require`, connections can fail intermittently depending on local network and SSL negotiation behavior.

## Supabase Storage setup

All uploaded documents and payment receipts are stored in Supabase Storage, not on the local filesystem.

- Create a private bucket named `application-files`, or set `SUPABASE_STORAGE_BUCKET` to the private bucket name you want to use.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it to browser code or `NEXT_PUBLIC_*`.
- Stored object paths are organized by application:
  - `applications/<applicationId>/documents/...`
  - `applications/<applicationId>/receipts/...`
- File preview/download routes enforce the existing app permissions first, then read from the private bucket server-side.
- Default upload validation allows files up to `10MB`; adjust `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB` if production policy changes.
- `SERVER_ACTION_BODY_SIZE_LIMIT` should stay slightly higher than the upload limit to account for multipart request overhead.

### Recommended local command order

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:push
npm run prisma:seed
npm run dev
```
# future-english-ops
