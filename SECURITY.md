# Security Policy

KARMEO ERP/CRM contains business and financial data. Never commit production credentials, Supabase secret/service-role keys, passwords, access tokens, client documents, or database exports.

## Reporting

Security issues should be reported privately to the KARMEO GROUP project administrator rather than opened as public GitHub issues.

## Repository rules

- `.env*` files are ignored except `.env.example`.
- Only Supabase publishable keys may be used in `NEXT_PUBLIC_*` variables.
- Production database changes must be versioned under `supabase/migrations/`.
- Pull requests should pass typecheck and build before merge.
