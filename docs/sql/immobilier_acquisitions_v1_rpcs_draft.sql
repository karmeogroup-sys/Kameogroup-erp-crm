-- Extension transactionnelle pour acquisitions immobilières.
-- À exécuter APRÈS validation du schéma de base et revue sécurité.
-- Aucune écriture dans les tables de trésorerie existantes n'est effectuée ici.
create or replace function public.re_create_acquisition(
 p_code text,p_designation text,p_purpose text,p_location text,p_serviced boolean,
 p_seller_name text,p_price numeric,p_area numeric default null,p_supplier_id uuid default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_asset uuid;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('direction','admin')) then
  raise exception 'Accès refusé';
 end if;
 if p_code is null or length(trim(p_code))<2 or length(trim(coalesce(p_designation,'')))<2
    or length(trim(coalesce(p_seller_name,'')))<2 or p_price<=0 or p_price<>trunc(p_price)
    or p_purpose not in ('revente','patrimoine') then
  raise exception 'Données acquisition invalides';
 end if;
 insert into public.re_acquisition_assets(code,designation,purpose,location,serviced,area_sqm)
 values(trim(p_code),trim(p_designation),p_purpose,p_location,coalesce(p_serviced,false),p_area)
 returning id into v_asset;
 insert into public.re_acquisitions(asset_id,seller_name,supplier_id,contract_price,created_by)
 values(v_asset,trim(p_seller_name),p_supplier_id,p_price,auth.uid())
 returning id into v_id;
 return v_id;
end; $$;
-- Pour la fonction invoker, les politiques RLS d'écriture sont ciblées.
create policy re_assets_insert on public.re_acquisition_assets for insert to authenticated
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin')));
create policy re_acquisitions_insert on public.re_acquisitions for insert to authenticated
 with check (created_by=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin')));
revoke all on function public.re_create_acquisition(text,text,text,text,boolean,text,numeric,numeric,uuid) from public,anon;
grant execute on function public.re_create_acquisition(text,text,text,text,boolean,text,numeric,numeric,uuid) to authenticated;

create or replace function public.re_add_installment(p_acquisition_id uuid,p_due_date date,p_amount numeric)
 returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_number integer; v_price numeric; v_scheduled numeric;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('direction','admin','finance')) then raise exception 'Accès refusé'; end if;
 select contract_price into v_price from public.re_acquisitions where id=p_acquisition_id and status='en_cours' for update;
 if not found then raise exception 'Acquisition introuvable ou clôturée'; end if;
 if p_due_date is null or p_amount is null or p_amount<=0 or p_amount<>trunc(p_amount) then raise exception 'Échéance invalide'; end if;
 select coalesce(max(installment_no),0)+1,coalesce(sum(amount),0) into v_number,v_scheduled from public.re_acquisition_installments where acquisition_id=p_acquisition_id;
 if v_scheduled+p_amount>v_price then raise exception 'Échéancier supérieur au prix'; end if;
 insert into public.re_acquisition_installments(acquisition_id,installment_no,due_date,amount)
 values(p_acquisition_id,v_number,p_due_date,p_amount) returning id into v_id;
 return v_id;
end; $$;
create policy re_installments_insert on public.re_acquisition_installments for insert to authenticated
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
revoke all on function public.re_add_installment(uuid,date,numeric) from public,anon;
grant execute on function public.re_add_installment(uuid,date,numeric) to authenticated;

-- Paiement confirmé uniquement via procédure contrôlée ; pas de liaison trésorerie tant que
-- l'intégration au journal existant n'est pas auditée. Reçu numéroté, pas de cession automatique.
create or replace function public.re_record_acquisition_payment(
 p_acquisition_id uuid,p_amount numeric,p_payment_date date,p_reference text
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_price numeric; v_paid numeric; v_receipt text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('direction','admin','finance')) then raise exception 'Accès refusé'; end if;
 select contract_price into v_price from public.re_acquisitions where id=p_acquisition_id and status='en_cours' for update;
 if not found then raise exception 'Acquisition introuvable ou clôturée'; end if;
 if p_amount is null or p_amount<=0 or p_amount<>trunc(p_amount) or p_payment_date is null
   or length(trim(coalesce(p_reference,'')))<3 then raise exception 'Paiement invalide'; end if;
 select coalesce(sum(amount),0) into v_paid from public.re_acquisition_payments where acquisition_id=p_acquisition_id and status='confirme';
 if v_paid+p_amount>v_price then raise exception 'Montant supérieur au solde'; end if;
 v_id:=gen_random_uuid();
 v_receipt:='KAR-ACQ-'||upper(substr(replace(v_id::text,'-',''),1,12));
 insert into public.re_acquisition_payments(id,acquisition_id,amount,payment_date,external_reference,status,receipt_number,created_by)
 values(v_id,p_acquisition_id,p_amount,p_payment_date,trim(p_reference),'confirme',v_receipt,auth.uid());
 if v_paid+p_amount=v_price then
   update public.re_acquisitions set status='soldee' where id=p_acquisition_id;
 end if;
 return v_id;
end; $$;
create policy re_payments_insert on public.re_acquisition_payments for insert to authenticated
 with check(created_by=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
create policy re_acquisitions_update on public.re_acquisitions for update to authenticated
 using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')))
 with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('direction','admin','finance')));
revoke all on function public.re_record_acquisition_payment(uuid,numeric,date,text) from public,anon;
grant execute on function public.re_record_acquisition_payment(uuid,numeric,date,text) to authenticated;
