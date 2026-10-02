# Contributing to KARMEO ERP/CRM

## Branches

- `main`: deployable branch.
- Feature work: `feat/<short-name>`.
- Fixes: `fix/<short-name>`.

## Before a pull request

1. Copy `.env.example` to `.env.local` and fill local values.
2. Run `npm ci`.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Never commit `.env.local` or credentials.

## Database changes

Keep schema changes in `supabase/migrations/`. Review RLS, grants, privileged functions and Supabase security advisors after every DDL change.
