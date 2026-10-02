# KARMEO ERP/CRM — Checklist préproduction

1. Créer le projet Supabase.
2. Appliquer, dans l'ordre, `supabase/migrations/001_core.sql`, `002_security_and_functions.sql`, puis `003_finance_views_triggers.sql`.
3. Créer le premier utilisateur Direction dans Supabase Auth, puis une ligne `profiles` avec le même UUID et le rôle `direction`.
4. Configurer les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans Vercel (Preview + Production).
5. Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté navigateur.
6. Lancer `npm install`, `npm run typecheck`, puis `npm run build`.
7. Déployer d'abord en Preview. Tester : connexion, création lead, changement d'étape, conversion client, devis, facture, paiement, dépense, marge projet.
8. Vérifier RLS avec au moins un compte par rôle.
9. Promouvoir seulement la Preview validée vers Production.

## Données métier à verrouiller avant production
- TVA/taxes et mentions légales de facturation.
- Règles officielles de numérotation devis/factures/reçus.
- Workflow d'approbation des dépenses et remises.
- Sauvegarde/restauration et politique de conservation.
