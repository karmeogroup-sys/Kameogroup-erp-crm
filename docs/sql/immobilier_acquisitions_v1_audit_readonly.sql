-- Audit non destructif à lancer après migration en préproduction.
-- Chaque requête doit retourner zéro anomalie, sauf la première (inventaire).
select table_name, rowsecurity as rls_active
from pg_tables
where schemaname='public' and tablename like 're_acquisition%'
order by table_name;

-- Aucune politique INSERT/UPDATE/DELETE ne doit permettre l'accès direct.
select schemaname,tablename,policyname,cmd,roles
from pg_policies
where schemaname='public' and tablename like 're_acquisition%'
 and cmd in ('INSERT','UPDATE','DELETE','ALL');

-- Aucune procédure préparatoire SECURITY INVOKER ne doit rester exécutable
-- par authenticated si ses droits directs sont verrouillés.
select p.proname,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
('re_create_acquisition','re_add_installment','re_record_acquisition_payment');

-- Solde négatif ou montant payé supérieur au contrat.
select a.id,a.contract_price,coalesce(sum(p.amount) filter(where p.status='confirme'),0) as paid
from public.re_acquisitions a
left join public.re_acquisition_payments p on p.acquisition_id=a.id
group by a.id,a.contract_price
having coalesce(sum(p.amount) filter(where p.status='confirme'),0)>a.contract_price;

-- Paiements confirmés sans écriture comptable.
select p.id,p.receipt_number from public.re_acquisition_payments p
left join public.accounting_entries e on e.reference='RE_ACQ_PAYMENT:'||p.id::text
where p.status='confirme' and e.id is null;

-- Écritures de montant ou direction incohérents.
select p.id,p.amount,e.amount,e.direction from public.re_acquisition_payments p
join public.accounting_entries e on e.reference='RE_ACQ_PAYMENT:'||p.id::text
where p.status='confirme' and (e.amount<>p.amount or e.direction<>'debit');

-- Vérification des attestations : dossiers soldés avec solde non nul.
select a.id,a.contract_price,coalesce(sum(p.amount) filter(where p.status='confirme'),0) as paid
from public.re_acquisitions a
left join public.re_acquisition_payments p on p.acquisition_id=a.id
where a.status='soldee'
group by a.id,a.contract_price
having coalesce(sum(p.amount) filter(where p.status='confirme'),0)<>a.contract_price;
