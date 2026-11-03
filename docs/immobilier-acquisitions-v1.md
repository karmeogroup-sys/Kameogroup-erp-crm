# KARMEO — Acquisitions immobilières (spécification technique V1)

Statut : préparation de l'implémentation ; aucune migration appliquée en production.

## Périmètre
- Acquisitions pour revente (stock) et conservation (patrimoine), terrains viabilisés ou non.
- Vendeur/propriétaire référencé comme partenaire immobilier, éventuellement lié à un fournisseur existant.
- Dossier foncier unique : parcelle mère, références, superficie, localisation, pièces et historique.
- Contrat, échéancier, versements, reçus PDF, attestation de paiement intégral.
- Cession : préparation documentaire uniquement après contrôle juridique ; paiement soldé ≠ transfert de propriété.
- Lotissement : relation parent/enfants et allocation des coûts sans double comptage.
- Revente : créances clients distinctes des dettes envers vendeurs.

## Modèle cible (à adapter aux tables Supabase réellement présentes)
- real_estate_assets(id, asset_code UNIQUE, parent_asset_id FK, purpose stock|patrimoine, serviced, area_sqm, location, land_reference, status, created_at)
- real_estate_counterparties(id, legal_name, contact, type, supplier_id NULL)
- real_estate_acquisitions(id, asset_id FK, seller_id FK, agreed_price, currency FCFA, contract_date, status, created_by)
- real_estate_installments(id, acquisition_id FK, due_date, amount_due, sequence UNIQUE/acquisition)
- real_estate_disbursements(id, acquisition_id FK, installment_id NULL, amount, paid_at, payment_reference UNIQUE, treasury_entry_id UNIQUE, status, created_by)
- real_estate_documents(id, acquisition_id FK, kind, document_number UNIQUE, storage_path, approved_by, approved_at, created_at)
- real_estate_cost_allocations(id, parent_asset_id, child_asset_id, amount, cost_type)

## Invariants financiers
- Tous les montants >= 0, entiers en FCFA.
- Somme des versements confirmés <= prix convenu sauf avenant documenté.
- Solde = prix contractuel amendé - somme des versements confirmés.
- Paiements annulés/extournés exclus du solde ; historique conservé.
- Un versement validé correspond à une seule écriture de trésorerie (clé d'idempotence et contrainte UNIQUE).
- Une commande fournisseur ne doit jamais dupliquer une dépense déjà enregistrée.
- Reçu seulement pour paiement confirmé ; numéro séquentiel unique ; correction par annulation/avoir, pas suppression.
- Attestation de paiement intégral seulement si solde = 0, après validation habilitée.
- Document de cession soumis au circuit juridique propre au statut foncier.

## Sécurité
- RLS activée sur toutes les tables ; droits distincts direction, finance, juridique, commercial.
- Génération documentaire côté serveur ; pièces privées avec URL signées temporaires.
- Audit des validations, modifications, annulations et téléchargements sensibles.
- Transactions atomiques pour versement + écriture de trésorerie + numéro de reçu.

## Tests d'acceptation
1. Acquisition 25 000 000, cinq versements de 5 000 000 : soldes 20/15/10/5/0 millions.
2. Double soumission du même paiement : une seule écriture et un seul reçu.
3. Paiement partiel et retard : échéancier et alertes exacts.
4. Annulation d'un versement : solde recalculé, reçu invalidé et piste d'audit conservée.
5. Attestation impossible tant que le solde > 0.
6. Aucun document de cession définitif sans validation juridique.
7. Revente et patrimoine ventilés séparément dans le reporting.
8. RLS : un rôle non autorisé ne lit pas les pièces foncières.

## Séquence de réalisation
1. Inspecter les schémas Supabase existants et conventions de sécurité.
2. Ajouter migrations additives, contraintes, index et politiques RLS.
3. Implémenter services transactionnels, tests et API.
4. Construire écrans acquisition/échéancier/versements et génération PDF.
5. Tester en préproduction puis déployer après vérification du projet Vercel cible.
