"use client";
import { useEffect,useMemo,useState } from "react";
import Shell from "@/components/Shell";
import { supabaseBrowser } from "@/lib/supabase";
type Lead={id:string;name:string;phone?:string;source?:string;status:string;need?:string;budget?:number};
const stages=[["Nouveau","new"],["Contacté","contacted"],["Qualifié","qualified"],["Rendez-vous","appointment"],["Étude","study"],["Devis","quote_sent"],["Négociation","negotiation"],["Gagné","won"],["Perdu","lost"]] as const;
const empty={name:"",phone:"",source:"WhatsApp",status:"new",need:"",budget:""};
export default function Page(){
 const [leads,setLeads]=useState<Lead[]>([]),[q,setQ]=useState(""),[open,setOpen]=useState(false),[form,setForm]=useState<any>(empty),[msg,setMsg]=useState("");
 const sb=useMemo(()=>supabaseBrowser(),[]);
 async function load(){if(!sb)return;const {data,error}=await sb.from("leads").select("id,name,phone,source,status,need,budget").order("created_at",{ascending:false});if(!error)setLeads((data||[]) as Lead[])}
 useEffect(()=>{load()},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!sb)return;setMsg("");const {error}=await sb.from("leads").insert({name:form.name.trim(),phone:form.phone||null,source:form.source,need:form.need||null,budget:form.budget?Number(form.budget):0,status:form.status});if(error){setMsg("Enregistrement impossible : "+error.message);return}setOpen(false);setForm(empty);await load()}
 async function move(id:string,status:string){if(!sb)return;const before=leads;setLeads(x=>x.map(l=>l.id===id?{...l,status}:l));const {error}=await sb.from("leads").update({status}).eq("id",id);if(error){setLeads(before);setMsg("Mise à jour impossible : "+error.message)}}
 const filtered=leads.filter(l=>[l.name,l.phone,l.need].join(" ").toLowerCase().includes(q.toLowerCase()));
 return <Shell title="CRM">
 <section className="crmHero"><div><span className="dashBadge">PIPELINE COMMERCIAL</span><h2>Prospects & opportunités</h2><p>Centralisez les demandes, qualifiez les prospects et pilotez chaque vente jusqu’au closing.</p></div><button className="btn goldBtn" onClick={()=>setOpen(true)}>+ Nouveau prospect</button></section>
 <section className="crmStats"><article><span>Prospects</span><strong>{leads.length}</strong></article><article><span>Qualifiés</span><strong>{leads.filter(x=>x.status==="qualified").length}</strong></article><article><span>Devis / négociation</span><strong>{leads.filter(x=>["quote_sent","negotiation"].includes(x.status)).length}</strong></article><article><span>Gagnés</span><strong>{leads.filter(x=>x.status==="won").length}</strong></article></section>
 <div className="crmToolbar"><input placeholder="Rechercher un prospect, téléphone, besoin…" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn goldBtn" onClick={()=>setOpen(true)}>+ Ajouter</button></div>
 {msg&&<p className="error">{msg}</p>}
 <section className="crmPipeline">{stages.slice(0,8).map(([label,key])=><div className="crmColumn" key={key}><div className="crmColumnHead"><b>{label}</b><span>{filtered.filter(x=>x.status===key).length}</span></div>{filtered.filter(x=>x.status===key).map(l=><article className="prospectCard" key={l.id}><strong>{l.name}</strong><small>{l.need||"Besoin à qualifier"}</small>{l.phone&&<a href={"tel:"+l.phone}>{l.phone}</a>}<div className="prospectMeta"><span>{l.source||"Direct"}</span>{l.budget?<b>{Number(l.budget).toLocaleString("fr-FR")} FCFA</b>:null}</div><select value={l.status} onChange={e=>move(l.id,e.target.value)}>{stages.map(([n,v])=><option value={v} key={v}>{n}</option>)}</select></article>)}</div>)}</section>
 {!leads.length&&<div className="crmEmpty"><b>Aucun prospect enregistré</b><p>Ajoutez votre premier prospect pour démarrer le pipeline commercial KARMEO.</p><button className="btn goldBtn" onClick={()=>setOpen(true)}>Créer un prospect</button></div>}
 {open&&<div className="modal"><form className="modalCard premiumModal" onSubmit={save}><div className="modalTop"><div><span className="dashBadge">NOUVEAU LEAD</span><h2>Ajouter un prospect</h2></div><button type="button" onClick={()=>setOpen(false)}>×</button></div>
 <label>Nom / entreprise<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
 <label>Téléphone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
 <div className="form2"><label>Source<select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}><option>WhatsApp</option><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>Recommandation</option><option>Direct</option></select></label><label>Budget FCFA<input type="number" min="0" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/></label></div>
 <label>Besoin<textarea placeholder="Pergola, construction, terrain, rénovation…" value={form.need} onChange={e=>setForm({...form,need:e.target.value})}/></label>
 <button className="btn goldBtn full">Enregistrer le prospect</button></form></div>}
 </Shell>
}