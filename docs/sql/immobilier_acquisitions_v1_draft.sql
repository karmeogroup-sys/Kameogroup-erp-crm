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
