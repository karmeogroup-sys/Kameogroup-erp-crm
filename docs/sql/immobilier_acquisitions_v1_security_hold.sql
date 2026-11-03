-- Sécurité complémentaire : à appliquer après les deux fichiers SQL préparatoires.
-- Supprime les politiques d'écriture client trop permissives.
drop policy if exists re_assets_insert on public.re_acquisition_assets;
drop policy if exists re_acquisitions_insert on public.re_acquisitions;
drop policy if exists re_installments_insert on public.re_acquisition_installments;
drop policy if exists re_payments_insert on public.re_acquisition_payments;
drop policy if exists re_acquisitions_update on public.re_acquisitions;
-- La validation d'un versement exige des fonctions SECURITY DEFINER auditées
-- dans un schéma non exposé ; les RPC SECURITY INVOKER précédentes ne
-- peuvent plus écrire. Révoquer leur exécution jusqu'à leur remplacement.
revoke execute on function public.re_create_acquisition(text,text,text,text,boolean,text,numeric,numeric,uuid) from authenticated;
revoke execute on function public.re_add_installment(uuid,date,numeric) from authenticated;
revoke execute on function public.re_record_acquisition_payment(uuid,numeric,date,text) from authenticated;
-- Empêcher tout accès en écriture directe aux rôles de l'API.
revoke insert,update,delete,truncate on public.re_acquisition_assets from anon,authenticated;
revoke insert,update,delete,truncate on public.re_acquisitions from anon,authenticated;
revoke insert,update,delete,truncate on public.re_acquisition_installments from anon,authenticated;
revoke insert,update,delete,truncate on public.re_acquisition_payments from anon,authenticated;
revoke insert,update,delete,truncate on public.re_acquisition_documents from anon,authenticated;
