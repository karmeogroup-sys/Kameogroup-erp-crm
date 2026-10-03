"use client";
import {useEffect,useMemo,useState} from "react";
import Shell from "@/components/Shell";
import {supabaseBrowser} from "@/lib/supabase";

type Profile={id:string;full_name:string|null;role:string;created_at:string};
type Log={id:number;entity:string;action:string;created_at:string;entity_id:string|null};
type Agent={id:string;display_name:string;active:boolean;created_at:string};
type Perf={id:string;display_name:string;active:boolean;quotes_count:number;pipeline:number;accepted_count:number;accepted_revenue:number;last_quote_at:string|null};
const roles=[["direction","Direction"],["admin","Administrateur"],["marketing","Marketing"],["commercial","Commercial"],["project_manager","Chef de projet"],["finance","Finance"]];

export default function Administration(){
 const sb=useMemo(()=>supabaseBrowser(),[]),[profiles,setProfiles]=useState<Profile[]>([]),[logs,setLogs]=useState<Log[]>([]),[role,setRole]=useState(""),[msg,setMsg]=useState(""),[agents,setAgents]=useState<Agent[]>([]),[agentOpen,setAgentOpen]=useState(false),[agent,setAgent]=useState({name:"",code:""}),[perf,setPerf]=useState<Perf[]>([]);
 async function load(){if(!sb)return;const [{data:p},{data:l},{data:a},{data:pf}]=await Promise.all([sb.from("profiles").select("id,full_name,role,created_at").order("created_at"),sb.from("audit_logs").select("id,entity,action,entity_id,created_at").order("created_at",{ascending:false}).limit(12),sb.from("sales_agents").select("id,display_name,active,created_at").order("created_at"),sb.from("sales_agent_performance").select("*").order("accepted_revenue",{ascending:false})]);setProfiles((p??[]) as Profile[]);setLogs((l??[]) as Log[]);setAgents((a??[]) as Agent[]);setPerf((pf??[]) as Perf[]);if(p?.[0])setRole(p[0].role)}
 useEffect(()=>{load()},[]);
 async function changeRole(id:string){if(!sb)return;setMsg("");const {error}=await sb.rpc("admin_set_profile_role",{p_user_id:id,p_role:role});if(error){setMsg("Modification impossible : "+error.message);return}setMsg("Rôle mis à jour.");await load()}
 async function addAgent(e:React.FormEvent){e.preventDefault();if(!sb)return;setMsg("");const{error}=await sb.rpc("admin_create_sales_agent",{p_display_name:agent.name,p_access_code:agent.code});if(error){setMsg("Création impossible : "+error.message);return}setAgent({name:"",code:""});setAgentOpen(false);setMsg("Commercial ajouté.");load()}
 async function toggleAgent(id:string,active:boolean){if(!sb)return;const{error}=await sb.rpc("admin_set_sales_agent_active",{p_agent_id:id,p_active:!active});setMsg(error?"Modification impossible : "+error.message:(!active?"Commercial activé.":"Accès commercial suspendu."));if(!error)load()}
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
  <section className="panel"><div className="panelHead"><div><span className="dashBadge">COMMERCIAUX</span><h3>Identité sur devis & factures</h3></div><button className="btn goldBtn" onClick={()=>setAgentOpen(true)}>+ Ajouter un commercial</button></div>
   <div className="cards">{agents.length?agents.map(a=><div className="card" key={a.id}><b>{a.display_name}</b><p>Nom professionnel utilisé sur les documents commerciaux.</p><small>{a.active?"Accès actif":"Accès désactivé"}</small><div className="row"><button className="miniBtn" onClick={()=>toggleAgent(a.id,a.active)}>{a.active?"Suspendre accès":"Réactiver"}</button></div></div>):<div className="card"><b>Aucun commercial enregistré</b><p>Ajoutez les membres de l’équipe commerciale et attribuez-leur un code d’accès personnel.</p></div>}</div>
  </section>
  {agentOpen&&<div className="modal"><form className="modalCard premiumModal" onSubmit={addAgent}><div className="modalTop"><div><span className="dashBadge">NOUVEL ACCÈS</span><h2>Ajouter un commercial</h2></div><button type="button" onClick={()=>setAgentOpen(false)}>×</button></div><label>Nom affiché sur devis et factures<input required value={agent.name} onChange={e=>setAgent({...agent,name:e.target.value})} placeholder="Ex. Jean KOUASSI"/></label><label>Code d’accès personnel<input required minLength={4} type="password" value={agent.code} onChange={e=>setAgent({...agent,code:e.target.value})} placeholder="4 caractères minimum"/></label><p>Le code est chiffré et n’est jamais affiché dans l’administration.</p><button className="btn goldBtn full">Créer le commercial</button></form></div>}
  <section className="panel"><div className="panelHead"><div><span className="dashBadge">DIRECTION</span><h3>Performance commerciale</h3></div></div>
   <div className="cards">{perf.length?perf.map(p=><article className="card" key={p.id}><div className="row"><b>{p.display_name}</b><span>{p.active?"Actif":"Suspendu"}</span></div><p>Devis : <strong>{Number(p.quotes_count)}</strong> · Acceptés : <strong>{Number(p.accepted_count)}</strong></p><p>Pipeline : <strong>{Number(p.pipeline).toLocaleString("fr-FR")} FCFA</strong></p><p>CA accepté : <strong>{Number(p.accepted_revenue).toLocaleString("fr-FR")} FCFA</strong></p><small>{p.last_quote_at?"Dernier devis : "+new Date(p.last_quote_at).toLocaleString("fr-FR"):"Aucun devis enregistré"}</small></article>):<div className="card"><b>Aucune performance disponible</b><p>Les indicateurs apparaîtront dès les premiers devis attribués.</p></div>}</div>
  </section>
  <section className="panel"><div className="panelHead"><div><span className="dashBadge">SÉCURITÉ</span><h3>Journal d’activité</h3></div></div>
   <div className="cards">{logs.length?logs.map(l=><div className="card" key={l.id}><b>{l.action.replaceAll("_"," ")}</b><p>{l.entity}{l.entity_id?" · "+l.entity_id:""}</p><small>{new Date(l.created_at).toLocaleString("fr-FR")}</small></div>):<div className="card"><b>Aucune action récente</b><p>Les changements administratifs seront enregistrés ici.</p></div>}</div>
  </section>
 </Shell>
}