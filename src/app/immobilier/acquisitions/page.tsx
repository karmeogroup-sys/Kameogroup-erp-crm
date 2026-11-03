"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import {supabaseBrowser} from "@/lib/supabase";

type Acquisition={id:string;asset_id:string;seller_name:string;contract_price:number;status:string;created_at:string};
type Asset={id:string;code:string;designation:string;purpose:string;location:string;serviced:boolean};
type Payment={id:string;acquisition_id:string;amount:number;status:string};
type Installment={id:string;acquisition_id:string;amount:number;due_date:string};
const money=(n:number)=>n.toLocaleString("fr-FR")+" FCFA";

export default function AcquisitionsPage(){
 const sb=useMemo(()=>supabaseBrowser(),[]);
 const [acquisitions,setAcquisitions]=useState<Acquisition[]>([]);
 const [assets,setAssets]=useState<Asset[]>([]);
 const [payments,setPayments]=useState<Payment[]>([]);
 const [installments,setInstallments]=useState<Installment[]>([]);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!sb){setError("Configuration Supabase indisponible.");setLoading(false);return;}
   const results=await Promise.all([
    sb.from("re_acquisitions").select("id,asset_id,seller_name,contract_price,status,created_at").order("created_at",{ascending:false}),
    sb.from("re_acquisition_assets").select("id,code,designation,purpose,location,serviced"),
    sb.from("re_acquisition_payments").select("id,acquisition_id,amount,status"),
    sb.from("re_acquisition_installments").select("id,acquisition_id,amount,due_date")
   ]);
   if(!active)return;
   const failure=results.find(r=>r.error);
   if(failure?.error)setError("Données indisponibles : "+failure.error.message);
   else{setAcquisitions(results[0].data||[]);setAssets(results[1].data||[]);setPayments(results[2].data||[]);setInstallments(results[3].data||[]);}
   setLoading(false);
  })();
  return()=>{active=false};
 },[sb]);
 const paid=(id:string)=>payments.filter(p=>p.acquisition_id===id&&p.status==="confirme").reduce((s,p)=>s+Number(p.amount),0);
 const total=acquisitions.reduce((s,a)=>s+Number(a.contract_price),0);
 const remaining=acquisitions.reduce((s,a)=>s+Math.max(0,Number(a.contract_price)-paid(a.id)),0);
 return <Shell title="Acquisitions immobilières">
  <section className="crmHero"><div><span className="dashBadge">IMMOBILIER · ACQUISITIONS</span><h2>Acquisitions & patrimoine</h2><p>Terrains viabilisés ou non, acquisitions pour revente et patrimoine conservé.</p></div><Link className="miniBtn" href="/immobilier">← Immobilier</Link></section>
  <section className="crmStats"><article><span>Dossiers</span><strong>{acquisitions.length}</strong></article><article><span>Engagements contractuels</span><strong>{money(total)}</strong></article><article><span>Restant à payer</span><strong>{money(remaining)}</strong></article><article><span>Versements confirmés</span><strong>{money(total-remaining)}</strong></article></section>
  {loading?<p>Chargement des acquisitions…</p>:error?<section className="crmEmpty"><strong>Module en préparation</strong><p role="alert">{error}</p><p>Les migrations et contrôles de paiement doivent être validés avant toute saisie.</p></section>:
  <section className="crmEmpty" style={{textAlign:"left"}}><h3>Dossiers d'acquisition</h3>
  {!acquisitions.length?<p>Aucune acquisition enregistrée.</p>:acquisitions.map(a=>{
   const asset=assets.find(x=>x.id===a.asset_id),p=paid(a.id),balance=Math.max(0,Number(a.contract_price)-p),next=installments.filter(i=>i.acquisition_id===a.id).sort((x,y)=>x.due_date.localeCompare(y.due_date))[0];
   return <article className="prospectCard" key={a.id} style={{marginTop:12}}>
    <strong>{asset?.code||"Sans référence"} · {asset?.designation||"Bien immobilier"}</strong>
    <p>Vendeur : {a.seller_name} · {asset?.purpose==="patrimoine"?"Patrimoine":"Revente"} · {asset?.serviced?"Viabilisé":"Non viabilisé"}</p>
    <small>{asset?.location||"Localisation non renseignée"} · {a.status}</small>
    <p>Prix : {money(Number(a.contract_price))} · Versé : {money(p)} · <b>Solde : {money(balance)}</b></p>
    {next&&<small>Première échéance prévue : {next.due_date}</small>}
   </article>;
  })}</section>}
  <section className="crmEmpty" style={{textAlign:"left"}}><strong>Sécurité documentaire</strong><p>Les reçus ne sont délivrés qu'après confirmation du paiement. L'attestation de paiement intégral exige un solde nul. La cession foncière nécessite une validation juridique distincte.</p></section>
 </Shell>;
}
