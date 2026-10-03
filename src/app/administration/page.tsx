"use client";
import {useEffect,useMemo,useState} from "react";
import Shell from "@/components/Shell";
import {supabaseBrowser} from "@/lib/supabase";

type Profile={id:string;full_name:string|null;role:string;created_at:string};
type Log={id:number;entity:string;action:string;created_at:string;entity_id:string|null};
const roles=[["direction","Direction"],["admin","Administrateur"],["marketing","Marketing"],["commercial","Commercial"],["project_manager","Chef de projet"],["finance","Finance"]];

export default function Administration(){
 const sb=useMemo(()=>supabaseBrowser(),[]),[profiles,setProfiles]=useState<Profile[]>([]),[logs,setLogs]=useState<Log[]>([]),[role,setRole]=useState(""),[msg,setMsg]=useState("");
 async function load(){if(!sb)return;const [{data:p},{data:l}]=await Promise.all([sb.from("profiles").select("id,full_name,role,created_at").order("created_at"),sb.from("audit_logs").select("id,entity,action,entity_id,created_at").order("created_at",{ascending:false}).limit(12)]);setProfiles((p??[]) as Profile[]);setLogs((l??[]) as Log[]);if(p?.[0])setRole(p[0].role)}
 useEffect(()=>{load()},[]);
 async function changeRole(id:string){if(!sb)return;setMsg("");const {error}=await sb.rpc("admin_set_profile_role",{p_user_id:id,p_role:role});if(error){setMsg("Modification impossible : "+error.message);return}setMsg("Rôle mis à jour.");await load()}
 return <Shell title="Administration">
  <section className="dashHero"><div><span className="dashBadge">CONSOLE DE GESTION</span><h2>Administration KARMEO</h2><p>Utilisateurs, rôles, sécurité et traçabilité de l’ERP/CRM.</p></div></section>
  {msg&&<p className="notice">{msg}</p>}
  <div className="statsGrid">
   <div className="statCard"><span>Utilisateurs</span><strong>{profiles.length}</strong><small>Comptes ERP actifs</small></div>
   <div className="statCard"><span>Rôles disponibles</span><strong>{roles.length}</strong><small>Accès par fonction</small></div>
   <div className="statCard"><span>Journal</span><strong>{logs.length}</strong><small>Dernières actions visibles</small></div>
  </div>
  <section className="panel"><div className="panelHead"><div><span className="dashBadge">ÉQUIPE</span><h3>Utilisateurs & permissions</h3></div></div>
   <div className="cards">{profiles.map(p=><div className="card" key={p.id}><b>{p.full_name||"Utilisateur KARMEO"}</b><p>Rôle actuel : <strong>{roles.find(x=>x[0]===p.role)?.[1]||p.role}</strong></p><div className="row"><select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}</select><button className="miniBtn" onClick={()=>changeRole(p.id)}>Appliquer</button></div></div>)}</div>
  </section>
  <section className="panel"><div className="panelHead"><div><span className="dashBadge">SÉCURITÉ</span><h3>Journal d’activité</h3></div></div>
   <div className="cards">{logs.length?logs.map(l=><div className="card" key={l.id}><b>{l.action.replaceAll("_"," ")}</b><p>{l.entity}{l.entity_id?" · "+l.entity_id:""}</p><small>{new Date(l.created_at).toLocaleString("fr-FR")}</small></div>):<div className="card"><b>Aucune action récente</b><p>Les changements administratifs seront enregistrés ici.</p></div>}</div>
  </section>
 </Shell>
}