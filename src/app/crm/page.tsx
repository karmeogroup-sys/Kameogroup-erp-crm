"use client";
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { supabaseBrowser } from "@/lib/supabase";

type Lead={id:string;name:string;phone?:string;email?:string;source?:string;status:string;need?:string;budget?:number;next_follow_up?:string};
const stages=["Nouveau","À qualifier","Qualifié","Devis","Négociation","Gagné","Perdu"];
const empty={name:"",phone:"",email:"",source:"WhatsApp",status:"Nouveau",need:"",budget:""};

export default function Page(){
 const [leads,setLeads]=useState<Lead[]>([]),[q,setQ]=useState(""),[open,setOpen]=useState(false),[form,setForm]=useState<any>(empty),[msg,setMsg]=useState("");
 const sb=useMemo(()=>supabaseBrowser(),[]);
 async function load(){if(!sb)return;const {data,error}=await sb.from("prospects").select("*").order("created_at",{ascending:false});if(!error)setLeads((data||[]) as Lead[])}
 useEffect(()=>{load()},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!sb)return;setMsg("");const payload={...form,budget:form.budget?Number(form.budget):null};const {error}=await sb.from("prospects").insert(payload);if(error){setMsg("Impossible d’enregistrer. La table prospects doit être activée dans Supabase.");return}setOpen(false);setForm(empty);await load()}
 async function move(id:string,status:string){if(!sb)return;setLeads(x=>x.map(l=>l.id===id?{...l,status}:l));await sb.from("prospects").update({status}).eq("id",id)}
 const filtered=leads.filter(l=>[l.name,l.phone,l.email,l.need].join(" ").toLowerCase().includes(q.toLowerCase()));
 return <Shell title="CRM">
  <section className="crmHero"><div><span className="dashBadge">PIPELINE COMMERCIAL</span><h2>Prospects & opportunités</h2><p>Centralisez les demandes, qualifiez les prospects et pilotez chaque vente jusqu’au closing.</p></div><button className="btn goldBtn" onClick={()=>setOpen(true)}>+ Nouveau prospect</button></section>
  <section className="crmStats"><article><span>Prospects</span><strong>{leads.length}</strong></article><article><span>Qualifiés</span><strong>{leads.filter(x=>x.status==="Qualifié").length}</strong></article><article><span>Devis / négociation</span><strong>{leads.filter(x=>["Devis","Négociation"].includes(x.status)).length}</strong></article><article><span>Gagnés</span><strong>{leads.filter(x=>x.status==="Gagné").length}</strong></article></section>
  <div className="crmToolbar"><input placeholder="Rechercher un prospect, téléphone, besoin…" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn goldBtn" onClick={()=>setOpen(true)}>+ Ajouter</button></div>
  <section className="crmPipeline">{stages.slice(0,6).map(stage=><div className="crmColumn" key={stage}><div className="crmColumnHead"><b>{stage}</b><span>{filtered.filter(x=>x.status===stage).length}</span></div>{filtered.filter(x=>x.status===stage).map(l=><article className="prospectCard" key={l.id}><strong>{l.name}</strong><small>{l.need||"Besoin à qualifier"}</small>{l.phone&&<a href={"tel:"+l.phone}>{l.phone}</a>}<div className="prospectMeta"><span>{l.source||"Direct"}</span>{l.budget? <b>{Number(l.budget).toLocaleString("fr-FR")} FCFA</b>:null}</div><select value={l.status} onChange={e=>move(l.id,e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></article>)}</div>)}</section>
  {!leads.length&&<div className="crmEmpty"><b>Aucun prospect enregistré</b><p>Ajoutez votre premier prospect pour démarrer le pipeline commercial KARMEO.</p><button className="btn goldBtn" onClick={()=>setOpen(true)}>Créer un prospect</button></div>}
  {open&&<div className="modal"><form className="modalCard premiumModal" onSubmit={save}><div className="modalTop"><div><span className="dashBadge">NOUVEAU LEAD</span><h2>Ajouter un prospect</h2></div><button type="button" onClick={()=>setOpen(false)}>×</button></div>
   <label>Nom / entreprise<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <div className="form2"><label>Téléphone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label></div>
   <div className="form2"><label>Source<select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}><option>WhatsApp</option><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>Recommandation</option><option>Direct</option></select></label><label>Budget FCFA<input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/></label></div>
   <label>Besoin<textarea placeholder="Pergola, construction, terrain, rénovation…" value={form.need} onChange={e=>setForm({...form,need:e.target.value})}/></label>
   {msg&&<p className="error">{msg}</p>}<button className="btn goldBtn full">Enregistrer le prospect</button>
  </form></div>}
 </Shell>
}