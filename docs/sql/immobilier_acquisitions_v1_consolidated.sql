-- Migration consolidée testée sur branche Supabase, à auditer avant production.

-- Ne pas exécuter les anciens fichiers *_rpcs_draft.sql.

-- KARMEO immobilier acquisitions V1 (additive, à valider en préproduction)
create table if not exists public.re_acquisition_assets (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 parent_id uuid references public.re_acquisition_assets(id),
 purpose text not null check (purpose in ('revente','patrimoine')),
 designation text not null,
 location text,
 land_reference text,
 area_sqm numeric(16,2) check (area_sqm > 0),
 serviced boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.re_acquisitions (
 id uuid primary key default gen_random_uuid(),
 asset_id uuid not null unique references public.re_acquisition_assets(id),
 seller_name text not null,
 supplier_id uuid references public.suppliers(id),
 contract_price numeric(18,0) not null check (contract_price > 0),
 contract_date date,
 status text not null default 'en_cours' check(status in ('en_cours','soldee','annulee')),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.re_acquisition_installments (
 id uuid primary key default gen_random_uuid(),
 acquisition_id uuid not null references public.re_acquisitions(id),
 installment_no integer not null check(installment_no > 0),
 due_date date not null,
 amount numeric(18,0) not null check(amount > 0),
 unique(acquisition_id,installment_no)
);
create table if not exists public.re_acquisition_payments (
 id uuid primary key default gen_random_uuid(),
 acquisition_id uuid not null references public.re_acquisitions(id),
 installment_id uuid references public.re_acquisition_installments(id),
 amount numeric(18,0) not null check(amount > 0),
 payment_date date not null,
 external_reference text not null unique,
 treasury_reference text unique,
 status text not null default 'brouillon' check(status in ('brouillon','confirme','annule')),
 receipt_number text unique,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.re_acquisition_documents (
 id uuid primary key default gen_random_uuid(),
 acquisition_id uuid not null references public.re_acquisitions(id),
 kind text not null check(kind in ('contrat','recu','attestation_solde','cession_projet','autre')),
 document_number text unique,
 storage_path text,
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists re_acq_payments_acquisition_idx on public.re_acquisition_payments(acquisition_id,status);
create index if not exists re_acq_installments_due_idx on public.re_acquisition_installments(due_date);
alter table public.re_acquisition_assets enable row level security;
alter table public.re_acquisitions enable row level security;
alter table public.re_acquisition_installments enable row level security;
alter table public.re_acquisition_payments enable row level security;
alter table public.re_acquisition_documents enable row level security;
-- Lecture limitée aux rôles direction/admin/finance ; écritures bloquées côté client jusqu'aux RPC transactionnelles auditées.
create policy re_assets_read on public.re_acquisition_assets for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
create policy re_acquisitions_read on public.re_acquisitions for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
create policy re_installments_read on public.re_acquisition_installments for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
create policy re_payments_read on public.re_acquisition_payments for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
create policy re_documents_read on public.re_acquisition_documents for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
-- Pas de policies INSERT/UPDATE/DELETE : fail-closed tant que les flux métier ne sont pas validés.


grant select on public.re_acquisition_assets,public.re_acquisitions,public.re_acquisition_installments,public.re_acquisition_payments,public.re_acquisition_documents to authenticated;

-- RPC sécurisées, à utiliser À LA PLACE du fichier *_rpcs_draft.sql.
-- Précondition : schéma de base + liaison comptable validés en préproduction.
-- Les tables restent sans politique d'écriture directe et les privilèges INSERT/UPDATE sont révoqués.
-- Fonction SECURITY DEFINER dans un schéma non exposé, appelée via wrapper public INVOKER.
create schema if not exists re_internal;
revoke all on schema re_internal from public,anon,authenticated;
-- Pas de droit USAGE direct pour authenticated : appels via wrappers SECURITY DEFINER.

create or replace function re_internal.assert_role(allowed text[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role=any(allowed))
 then raise exception 'Accès refusé' using errcode='42501'; end if;
 return actor;
end $$;
revoke all on function re_internal.assert_role(text[]) from public,anon,authenticated;

create or replace function re_internal.create_acquisition(
 p_code text,p_designation text,p_purpose text,p_location text,p_serviced boolean,
 p_seller_name text,p_price numeric,p_area numeric,p_supplier_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; asset uuid; acquisition uuid;
begin
 actor:=re_internal.assert_role(array['direction','admin']);
 if length(trim(coalesce(p_code,'')))<2 or length(trim(coalesce(p_designation,'')))<2
 or length(trim(coalesce(p_seller_name,'')))<2 or p_purpose not in ('revente','patrimoine')
 or p_price is null or p_price<=0 or p_price<>trunc(p_price) or p_price>999999999999999999
 or (p_area is not null and p_area<=0) then raise exception 'Acquisition invalide'; end if;
 insert into public.re_acquisition_assets(code,designation,purpose,location,serviced,area_sqm)
 values(trim(p_code),trim(p_designation),p_purpose,p_location,coalesce(p_serviced,false),p_area)
 returning id into asset;
 insert into public.re_acquisitions(asset_id,seller_name,supplier_id,contract_price,created_by)
 values(asset,trim(p_seller_name),p_supplier_id,p_price,actor) returning id into acquisition;
 return acquisition;
end $$;
revoke all on function re_internal.create_acquisition(text,text,text,text,boolean,text,numeric,numeric,uuid) from public,anon,authenticated;

create or replace function re_internal.add_installment(p_acquisition_id uuid,p_due_date date,p_amount numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare price numeric; scheduled numeric; next_no int; installment uuid;
begin
 perform re_internal.assert_role(array['direction','admin','finance']);
 if p_due_date is null or p_amount is null or p_amount<=0 or p_amount<>trunc(p_amount) then raise exception 'Échéance invalide'; end if;
 select contract_price into price from public.re_acquisitions where id=p_acquisition_id and status='en_cours' for update;
 if not found then raise exception 'Acquisition indisponible'; end if;
 select coalesce(sum(amount),0),coalesce(max(installment_no),0)+1 into scheduled,next_no
 from public.re_acquisition_installments where acquisition_id=p_acquisition_id;
 if scheduled+p_amount>price then raise exception 'Échéancier supérieur au contrat'; end if;
 insert into public.re_acquisition_installments(acquisition_id,installment_no,due_date,amount)
 values(p_acquisition_id,next_no,p_due_date,p_amount) returning id into installment;
 return installment;
end $$;
revoke all on function re_internal.add_installment(uuid,date,numeric) from public,anon,authenticated;

create or replace function re_internal.record_payment(p_acquisition_id uuid,p_amount numeric,p_payment_date date,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; price numeric; paid numeric; payment uuid:=gen_random_uuid();
begin
 actor:=re_internal.assert_role(array['direction','admin','finance']);
 if p_amount is null or p_amount<=0 or p_amount<>trunc(p_amount) or p_payment_date is null
 or length(trim(coalesce(p_reference,'')))<3 then raise exception 'Versement invalide'; end if;
 select contract_price into price from public.re_acquisitions where id=p_acquisition_id and status='en_cours' for update;
 if not found then raise exception 'Acquisition indisponible'; end if;
 select coalesce(sum(amount),0) into paid from public.re_acquisition_payments
 where acquisition_id=p_acquisition_id and status='confirme';
 if paid+p_amount>price then raise exception 'Versement supérieur au solde'; end if;
 insert into public.re_acquisition_payments(id,acquisition_id,amount,payment_date,external_reference,status,receipt_number,created_by)
 values(payment,p_acquisition_id,p_amount,p_payment_date,trim(p_reference),'confirme',
 'KAR-ACQ-'||upper(substr(replace(payment::text,'-',''),1,12)),actor);
 -- Le trigger de rapprochement comptable doit réussir dans la même transaction.
 if paid+p_amount=price then update public.re_acquisitions set status='soldee' where id=p_acquisition_id; end if;
 return payment;
end $$;
revoke all on function re_internal.record_payment(uuid,numeric,date,text) from public,anon,authenticated;

-- API publique limitée aux trois points d'entrée ; aucun accès direct aux tables.\n-- Les wrappers sont SECURITY DEFINER car ils doivent appeler des fonctions internes\n-- non exécutables par authenticated. L'autorisation est contrôlée dans assert_role.\n-- À valider avec tests de rôles et audit de privilèges avant déploiement.
create or replace function public.re_create_acquisition(
 p_code text,p_designation text,p_purpose text,p_location text,p_serviced boolean,
 p_seller_name text,p_price numeric,p_area numeric default null,p_supplier_id uuid default null)
returns uuid language sql security definer set search_path='' as $$
 select re_internal.create_acquisition(p_code,p_designation,p_purpose,p_location,p_serviced,p_seller_name,p_price,p_area,p_supplier_id);
$$;
create or replace function public.re_add_installment(p_acquisition_id uuid,p_due_date date,p_amount numeric)
returns uuid language sql security definer set search_path='' as $$
 select re_internal.add_installment(p_acquisition_id,p_due_date,p_amount);
$$;
create or replace function public.re_record_acquisition_payment(p_acquisition_id uuid,p_amount numeric,p_payment_date date,p_reference text)
returns uuid language sql security definer set search_path='' as $$
 select re_internal.record_payment(p_acquisition_id,p_amount,p_payment_date,p_reference);
$$;
revoke all on function public.re_create_acquisition(text,text,text,text,boolean,text,numeric,numeric,uuid) from public,anon;
revoke all on function public.re_add_installment(uuid,date,numeric) from public,anon;
revoke all on function public.re_record_acquisition_payment(uuid,numeric,date,text) from public,anon;
grant execute on function public.re_create_acquisition(text,text,text,text,boolean,text,numeric,numeric,uuid) to authenticated;
grant execute on function public.re_add_installment(uuid,date,numeric) to authenticated;
grant execute on function public.re_record_acquisition_payment(uuid,numeric,date,text) to authenticated;


-- Proposition de liaison comptable : UNE écriture débit par paiement confirmé.
-- À intégrer à une migration revue, après verrouillage des accès en écriture.
-- L'index existant accounting_entries_reference_unique garantit déjà l'unicité des références non nulles.

create or replace function public.re_sync_acquisition_payment_accounting()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
 if tg_op <> 'INSERT' then
  raise exception 'Paiement acquisition immuable';
 end if;
 if new.status <> 'confirme' then return new; end if;
 insert into public.accounting_entries
 (entry_date,direction,category,label,amount,reference,notes,created_by)
 values(new.payment_date,'debit','Acquisition immobilière',
 'Versement acquisition '||new.acquisition_id::text,new.amount,
 'RE_ACQ_PAYMENT:'||new.id::text,new.external_reference,new.created_by)
;
 return new;
end; $$;
revoke all on function public.re_sync_acquisition_payment_accounting() from public,anon,authenticated;
drop trigger if exists trg_re_acquisition_payment_accounting on public.re_acquisition_payments;
create trigger trg_re_acquisition_payment_accounting
 after insert on public.re_acquisition_payments
 for each row execute function public.re_sync_acquisition_payment_accounting();
-- Note : déclencheur et écriture dans accounting_entries sont dans la même transaction.
-- Une sortie de trésorerie ne doit PAS être réinscrite manuellement dans expenses.
