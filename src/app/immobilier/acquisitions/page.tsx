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
 const [loading,setLoading]=useState(true);\n const [form,setForm]=useState({code:"",designation:"",purpose:"revente",location:"",seller:"",price:"",area:"",serviced:false});\n const [saving,setSaving]=useState(false);\n const [active,setActive]=useState<string|null>(null);\n const [entry,setEntry]=useState({kind:"echeance",amount:"",date:new Date().toISOString().slice(0,10),reference:""});\n async function submitEntry(e:React.FormEvent){e.preventDefault();if(!sb||!active||saving)return;const amount=Number(entry.amount);if(!Number.isSafeInteger(amount)||amount<=0){setError("Montant FCFA invalide.");return;}setSaving(true);setError("");const result=entry.kind==="echeance"?await sb.rpc("re_add_installment",{p_acquisition_id:active,p_due_date:entry.date,p_amount:amount}):await sb.rpc("re_record_acquisition_payment",{p_acquisition_id:active,p_amount:amount,p_payment_date:entry.date,p_reference:entry.reference.trim()});setSaving(false);if(result.error){setError(result.error.message);return;}window.location.reload();}\n\n async function createAcquisition(e:React.FormEvent){e.preventDefault();if(!sb||saving)return;setSaving(true);setError("");const {error:err}=await sb.rpc("re_create_acquisition",{p_code:form.code.trim(),p_designation:form.designation.trim(),p_purpose:form.purpose,p_location:form.location.trim(),p_serviced:form.serviced,p_seller_name:form.seller.trim(),p_price:Number(form.price),p_area:form.area?Number(form.area):null,p_supplier_id:null});setSaving(false);if(err){setError(err.message);return;}window.location.reload();}
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
    {next&&<small>Première échéance prévue : {next.due_date}</small>}\n    <div style={{marginTop:12}}><button className="miniBtn" onClick={()=>{setActive(active===a.id?null:a.id);setEntry({kind:"echeance",amount:"",date:new Date().toISOString().slice(0,10),reference:""});}}>Échéancier / versement</button></div>\n    {active===a.id&&<form onSubmit={submitEntry} style={{display:"grid",gap:8,maxWidth:480,marginTop:12}}><label>Opération<select value={entry.kind} onChange={e=>setEntry({...entry,kind:e.target.value})}><option value="echeance">Ajouter une échéance</option><option value="versement">Enregistrer un versement confirmé</option></select></label><label>Montant FCFA<input required type="number" min="1" step="1" value={entry.amount} onChange={e=>setEntry({...entry,amount:e.target.value})}/></label><label>Date<input required type="date" value={entry.date} onChange={e=>setEntry({...entry,date:e.target.value})}/></label>{entry.kind==="versement"&&<label>Référence bancaire / transaction<input required minLength={3} value={entry.reference} onChange={e=>setEntry({...entry,reference:e.target.value})}/></label>}<button className="btn goldBtn" disabled={saving}>{saving?"Enregistrement…":"Valider l’opération"}</button></form>}
   </article>;
  })}</section>}
  {!loading&&!error&&<section className="crmEmpty" style={{textAlign:"left"}}><h3>Nouvelle acquisition</h3><form onSubmit={createAcquisition} style={{display:"grid",gap:12,maxWidth:650}}>
  <label>Référence du bien<input required minLength={2} value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></label>
  <label>Désignation<input required minLength={2} value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}/></label>
  <label>Destination<select value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}><option value="revente">Revente</option><option value="patrimoine">Patrimoine</option></select></label>
  <label>Localisation<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
  <label>Vendeur<input required minLength={2} value={form.seller} onChange={e=>setForm({...form,seller:e.target.value})}/></label>
  <label>Prix contractuel (FCFA)<input required type="number" min="1" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
  <label>Superficie (m²)<input type="number" min="0.01" step="0.01" value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></label>
  <label><input type="checkbox" checked={form.serviced} onChange={e=>setForm({...form,serviced:e.target.checked})}/> Terrain viabilisé</label>
  <button className="btn goldBtn" disabled={saving}>{saving?"Enregistrement…":"Créer l'acquisition"}</button>
 </form></section>}
  <section className="crmEmpty" style={{textAlign:"left"}}><strong>Sécurité documentaire</strong><p>Les reçus ne sont délivrés qu'après confirmation du paiement. L'attestation de paiement intégral exige un solde nul. La cession foncière nécessite une validation juridique distincte.</p></section>
 </Shell>;
}
