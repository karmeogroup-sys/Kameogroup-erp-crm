"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";

const nav=[
 ["/","Dashboard",["direction","admin","marketing","commercial","project_manager","finance"]],
 ["/crm","CRM",["direction","admin","marketing","commercial"]],
 ["/commercial","Commercial",["direction","admin","commercial"]],
 ["/catalogue","Catalogue",["direction","admin","commercial"]],
 ["/clients","Clients",["direction","admin","commercial","finance","project_manager"]],
 ["/chantiers","Chantiers",["direction","admin","project_manager"]],\n ["/immobilier","Immobilier",["direction","admin","commercial","finance"]],
 ["/finance","Finance",["direction","admin","finance"]],
 ["/recus","Reçus",["direction","admin","finance"]],
 ["/comptabilite","Comptabilité",["direction","admin","finance"]],
 ["/achats","Achats",["direction","admin","project_manager","finance"]],
 ["/documents","Documents",["direction","admin","project_manager","finance"]],
 ["/rapports","Rapports",["direction","admin","finance"]],
 ["/academy","Academy",["direction","admin"]],
 ["/administration","Administration",["direction","admin"]]
] as const;

export default function Shell({title,children}:{title:string;children:React.ReactNode}){
 const sb=useMemo(()=>supabaseBrowser(),[]),[role,setRole]=useState(""),[roleLoaded,setRoleLoaded]=useState(false);
 useEffect(()=>{(async()=>{if(!sb){setRoleLoaded(true);return}const{data:{user}}=await sb.auth.getUser();if(!user){setRoleLoaded(true);return}const{data}=await sb.from("profiles").select("role").eq("id",user.id).maybeSingle();setRole(data?.role||"");setRoleLoaded(true)})()},[sb]);
 async function logout(){if(sb)await sb.auth.signOut();window.location.href="/login"}
 const visible=roleLoaded?nav.filter(([, ,roles])=>roles.includes(role as any)):[];
 return <div className="shell"><aside className="side"><div className="brand">KARMEO<small>ERP / CRM</small></div><nav className="nav">{visible.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav><button className="logout" onClick={logout}>Déconnexion</button></aside><main className="main"><header className="top"><div><span className="eyebrow">KARMEO GROUP</span><h1>{title}</h1></div>{role&&<span className="dashBadge">{role==="direction"?"DIRECTION":role==="project_manager"?"CHEF DE PROJET":role.toUpperCase()}</span>}</header>{children}</main></div>
}