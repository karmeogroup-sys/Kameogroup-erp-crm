"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
export default function Login() {
 const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
 const [visible,setVisible]=useState(false); const [msg,setMsg]=useState(""); const [loading,setLoading]=useState(false);
 async function go(e:React.FormEvent){e.preventDefault();setMsg("");setLoading(true);const sb=supabaseBrowser();if(!sb){setMsg("Configuration Supabase indisponible.");setLoading(false);return;}
 const {error}=await sb.auth.signInWithPassword({email,password});if(error){setMsg("Identifiants incorrects ou accès non autorisé.");setLoading(false);}else location.href="/";}
 async function forgot(){if(!email){setMsg("Saisissez votre adresse e-mail avant de demander un nouveau mot de passe.");return;}
 const sb=supabaseBrowser();if(!sb){setMsg("Configuration Supabase indisponible.");return;}setLoading(true);setMsg("");
 const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/reset-password"});
 setMsg(error?"Envoi impossible. Réessayez ou contactez l’administrateur.":"Si ce compte existe, un lien de récupération vous sera envoyé.");setLoading(false);}
 return <main className="premiumLogin"><div className="loginGlow loginGlowOne"/><div className="loginGlow loginGlowTwo"/>
 <section className="loginBrandPanel"><div className="logoStage"><img className="animatedKarmeoLogo" src="/karmeo-logo.svg" alt="KARMEO GROUP"/><div className="logoShine"/></div><div className="brandCopy"><span className="eyebrow">PLATEFORME DE GESTION INTÉGRÉE</span><h2>Pilotez KARMEO GROUP<br/>depuis un seul espace.</h2><p>CRM, commercial, chantiers, achats, finance, documents, reporting et Academy.</p></div></section>
 <section className="loginFormPanel"><form className="premiumLoginCard" onSubmit={go}><div className="mobileLogo"><img src="/karmeo-logo.svg" alt="KARMEO GROUP"/></div><span className="eyebrow gold">ESPACE SÉCURISÉ</span><h1>Bienvenue</h1><p className="loginIntro">Connectez-vous à votre ERP/CRM KARMEO.</p>
 <label>Adresse e-mail<div className="loginField"><span className="fieldIcon">✉</span><input type="email" autoComplete="email" placeholder="nom@karmeogroup.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label>
 <label>Mot de passe<div className="loginField"><span className="fieldIcon">●</span><input type={visible?"text":"password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" aria-label={visible?"Masquer le mot de passe":"Afficher le mot de passe"} aria-pressed={visible} onClick={()=>setVisible(!visible)} style={{background:"transparent",border:0,color:"#d6ad51",padding:"8px 12px",cursor:"pointer",whiteSpace:"nowrap"}}>{visible?"Masquer":"Afficher"}</button></div></label>
 <button type="button" onClick={forgot} disabled={loading} style={{background:"none",border:0,color:"#d6ad51",cursor:"pointer",margin:"4px 0 16px",textAlign:"right",width:"100%"}}>Mot de passe oublié ?</button>
 <button className="premiumLoginButton" disabled={loading}><span>{loading?"Connexion...":"Se connecter"}</span><span className="loginArrow">→</span></button>{msg&&<p className="loginError" role="status">{msg}</p>}<div className="secureNote"><span>●</span> Connexion sécurisée · Accès réservé à KARMEO GROUP</div></form></section></main>;
}