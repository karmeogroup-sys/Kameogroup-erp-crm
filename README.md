# Supabase migrations

The live KARMEO ERP CRM Supabase project is the migration source of truth.

Applied migrations on 2026-10-02:

1. `core_schema`
2. `rbac_rls_functions_v2`
3. `finance_views_triggers`
4. `api_security_hardening`
5. `security_performance_payment_guards`
6. `helper_functions_invoker_wrappers`
7. `auth_profile_trigger`
8. `client_payment_module`
9. `karmeo_academy_core`

Before cloning the production schema into another Supabase project, pull/export the canonical migration history from the live project rather than replaying obsolete local SQL.

- academy_paid_delivery_trigger
- academy_download_counter
- academy_product_creator_index
