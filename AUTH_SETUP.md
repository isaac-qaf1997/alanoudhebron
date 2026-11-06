# Authentication and role setup

This update adds login protection and two roles to the existing Next.js + Neon project.

## What changed

- `/login` is the login screen.
- `/setup` creates the first Admin exactly once; after the first user exists, it redirects to `/login`.
- Sessions use a signed, HttpOnly, SameSite=Lax cookie with a 7-day lifetime. Passwords are stored as scrypt hashes; no plaintext password is stored.
- Admin can access the dashboard, orders, shipping, inventory, daily delivery sheet, and user management.
- Staff can access only orders and the daily delivery sheet. Staff order pages receive no model costs, order cost totals, courier costs, or item cost fields. The staff Excel export also omits courier fees and net figures.
- Server Actions and API endpoints enforce permissions on the server. Hiding a navigation link is not the security boundary.
- The shipping webhook remains available to the carrier and keeps its existing secret-token verification.

## Deployment steps (keep the existing Neon database)

1. Back up the existing Neon database before changing the deployed code.
2. In Neon SQL Editor, back up the database, then compare the schema with `db/migrations/0001_add_inventory_images.sql` through `db/migrations/0007_storefront_abuse_protection.sql`. Apply every migration that has not already been applied, in ascending order (0001 → 0007). Do not skip `0007_storefront_abuse_protection.sql`: public checkout depends on its idempotency column/index and rate-limit table. The migration files use `IF NOT EXISTS` or guarded constraints where appropriate, but review the current schema first and never run an unreviewed migration against production.
3. In Vercel → Project → Settings → Environment Variables, add `AUTH_SECRET` and `INITIAL_SETUP_TOKEN` for Production (and Preview if you test preview deployments). Generate two different random values locally. For `AUTH_SECRET`, use:

   ```bash
   openssl rand -base64 32
   ```

   Save that output as `AUTH_SECRET`. Generate another independent value and save it as `INITIAL_SETUP_TOKEN`. Do not commit or share either value.
4. Deploy this project to the same Vercel project and same Git repository/domain.
5. Open `https://YOUR-DOMAIN/setup`. Enter `INITIAL_SETUP_TOKEN`, then create the first Admin username and password. Use a unique password of at least 10 characters. The setup route locks itself after the first account is created.
6. Immediately remove `INITIAL_SETUP_TOKEN` from Vercel Environment Variables and redeploy; keep `AUTH_SECRET`.
7. Sign in. From the **المستخدمون** page, create staff accounts and choose their role. Use one account per person. Do not share the Admin login with staff.

## Role matrix

| Feature | Admin | Staff |
|---|---:|---:|
| Dashboard / sales / net profit | Yes | No |
| Orders: create and update status | Yes | Yes |
| Delete orders | Yes | No |
| Inventory management and stock editing | Yes | No (read-only product choices are provided inside order entry) |
| Shipping settings / courier management | Yes | No |
| Daily delivery sheet | Yes | Yes |
| Staff export of daily sheet | Yes | Yes, with courier-fee and net columns omitted |
| User management | Yes | No |

## Important notes

- The initial Admin account is created through the one-time `/setup` page; no default username or password is embedded in the source code.
- Changing/deactivating a user affects authorization on the next request because the role and active flag are read from Neon for each session check.
- If `AUTH_SECRET` is changed, existing sessions become invalid and users will need to log in again.
- Apply the SQL migration before deploying this version, otherwise the login pages cannot read the `users` table.
- Keep `DATABASE_URL`, `AUTH_SECRET`, Cloudinary secrets, and shipping integration secrets server-side. Never prefix these values with `NEXT_PUBLIC_`.
