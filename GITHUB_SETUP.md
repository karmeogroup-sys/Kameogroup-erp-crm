# Publication GitHub — KARMEO ERP/CRM

## Dépôt recommandé
`karmeo-erp-crm`

## Avant le premier déploiement
Créer les secrets GitHub Actions suivants dans **Settings > Secrets and variables > Actions** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (serveur uniquement)

Ne jamais committer `.env.local`, une clé `sb_secret_...` réelle, un mot de passe ou une clé service-role.

## Vercel
Configurer les mêmes variables dans Vercel. `SUPABASE_SECRET_KEY` doit rester une variable serveur et ne doit jamais commencer par `NEXT_PUBLIC_`.

## Contrôle CI
À chaque push/PR sur `main`, GitHub Actions lance :
1. installation des dépendances ;
2. TypeScript typecheck ;
3. build Next.js.

Le workflow utilise provisoirement `npm install` car le lockfile n'a pas pu être généré dans l'environnement de préparation. Dès qu'un `package-lock.json` est généré et validé, remplacer cette commande par `npm ci`.
