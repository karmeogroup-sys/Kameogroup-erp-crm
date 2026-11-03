# Raccordement comptable — acquisitions immobilières
Date : 2026-11-03. Statut : **conception, non appliquée en production**.

## Schéma existant vérifié
Table `public.accounting_entries` : `id`, `entry_date`, `direction`, `category`, `label`, `amount`, `reference`, `notes`, `created_by`, `created_at`.
La table `real_estate_payments` actuelle concerne les **encaissements de souscriptions clients**, pas les **décaissements d'acquisition**.

## Règle de rapprochement
Chaque versement confirmé à un vendeur doit correspondre à **une seule** ligne de sortie `accounting_entries` et ne doit pas être également reporté comme dépense chantier ou paiement fournisseur.

Proposition : ajouter `accounting_entry_id uuid unique references public.accounting_entries(id)` à `re_acquisition_payments`, après revue des contraintes et triggers du journal.
Créer paiement et écriture dans **la même transaction** ; verrouiller l'acquisition `FOR UPDATE`, vérifier solde, unicité de référence, autorisation, puis écrire journal et paiement. Un échec doit annuler les deux écritures.
`direction` et `category` doivent être conformes aux contraintes existantes (à inspecter avant toute migration).
Un reçu PDF porte le numéro de paiement et l'identifiant de la ligne comptable ; l'attestation finale n'est générée qu'après confirmation du solde zéro.
Les opérations d'annulation se font par **contrepassation**, jamais par suppression silencieuse.

## Conditions de mise en service
- Revoir les triggers et les CHECK de `accounting_entries`.
- Remplacer les RPC préparatoires par une interface d'écriture atomique et sécurisée.
- Vérifier que les rôles non autorisés ne peuvent appeler ni les RPC ni écrire directement.
- Tests concurrence, idempotence, annulation, journal et PDF.
- Déployer d'abord sur environnement de test.
