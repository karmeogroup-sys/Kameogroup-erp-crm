-- Proposition de liaison comptable : UNE écriture débit par paiement confirmé.
-- À intégrer à une migration revue, après verrouillage des accès en écriture.
create unique index if not exists accounting_entries_re_acquisition_payment_ref_unique
 on public.accounting_entries(reference)
 where reference like 'RE_ACQ_PAYMENT:%';

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
 on conflict do nothing;
 return new;
end; $$;
revoke all on function public.re_sync_acquisition_payment_accounting() from public,anon,authenticated;
drop trigger if exists trg_re_acquisition_payment_accounting on public.re_acquisition_payments;
create trigger trg_re_acquisition_payment_accounting
 after insert on public.re_acquisition_payments
 for each row execute function public.re_sync_acquisition_payment_accounting();
-- Note : déclencheur et écriture dans accounting_entries sont dans la même transaction.
-- Une sortie de trésorerie ne doit PAS être réinscrite manuellement dans expenses.
