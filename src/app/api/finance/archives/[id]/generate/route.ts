import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
const labels:Record<string,string>={invoice:"FACTURE",receipt:"RECU DE PAIEMENT",credit_note:"AVOIR",settlement_certificate:"ATTESTATION DE REGLEMENT"};
function ascii(v:unknown){return String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E]/g," ").slice(0,170);}
function pdfText(v:unknown){return ascii(v).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");}
function makePdf(lines:string[]){
 const ops=["BT","/F1 12 Tf","50 780 Td"];
 for(let i=0;i<lines.length;i++){if(i)ops.push("0 -22 Td");ops.push("("+pdfText(lines[i])+") Tj");}
 ops.push("ET");const stream=ops.join("\n")+"\n";
 const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",`<< /Length ${Buffer.byteLength(stream,"ascii")} >>\nstream\n${stream}endstream`];
 let out="%PDF-1.4\n";const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out,"ascii"));out+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
 const start=Buffer.byteLength(out,"ascii");out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(const offset of offsets.slice(1))out+=String(offset).padStart(10,"0")+" 00000 n \n";out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return Buffer.from(out,"ascii");
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const token=request.headers.get("authorization")?.replace(/^Bearer /i,"");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!token||!url||!key)return NextResponse.json({error:"Authentification requise"},{status:401});
 const sb=createClient(url,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:userResult,error:userError}=await sb.auth.getUser(token);
 if(userError||!userResult.user)return NextResponse.json({error:"Session invalide"},{status:401});
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Identifiant invalide"},{status:400});
 const {data:archive,error}=await sb.from("document_archives").select("id,document_type,document_number,archived_at,snapshot,pdf_path").eq("id",id).single();
 if(error||!archive)return NextResponse.json({error:"Archive inaccessible"},{status:403});
 if(archive.pdf_path)return NextResponse.json({error:"PDF deja conserve : aucun remplacement autorise"},{status:409});
 const s=archive.snapshot||{};const lines=["KARMEO GROUP","ARCHIVE DOCUMENTAIRE - RECONSTITUTION",labels[archive.document_type]||archive.document_type,"Reference : "+(archive.document_number||id),"Archivee le : "+archive.archived_at,""];
 if(archive.document_type==="invoice")lines.push("Facture : "+s.number,"Objet : "+(s.title||""),"Montant : "+(s.total||0)+" FCFA");
 if(archive.document_type==="receipt")lines.push("Facture : "+(s.invoice?.number||""),"Paiement : "+(s.payment?.amount||0)+" FCFA","Date : "+(s.payment?.paid_at||""));
 if(archive.document_type==="credit_note")lines.push("Facture : "+(s.invoice?.number||""),"Avoir : "+(s.credit_note?.amount||0)+" FCFA","Motif : "+(s.credit_note?.reason||""));
 if(archive.document_type==="settlement_certificate")lines.push("Facture : "+(s.invoice?.number||""),"Montant regle : "+(s.paid_total||0)+" FCFA","Solde : 0 FCFA");
 lines.push("","Document reconstruit a partir des donnees archivees.","Ne remplace pas le PDF original emis.");
 const path=id+".pdf";const bytes=makePdf(lines);
 const uploaded=await sb.storage.from("karmeo-finance-archives").upload(path,bytes,{contentType:"application/pdf",upsert:false});
 if(uploaded.error)return NextResponse.json({error:uploaded.error.message},{status:403});
 const linked=await sb.rpc("attach_finance_archive_pdf",{p_archive_id:id,p_path:path});
 if(linked.error)return NextResponse.json({error:"PDF stocke, liaison incomplete : "+linked.error.message},{status:500});
 await sb.rpc("record_finance_archive_access",{p_archive_id:id,p_action:"pdf_upload"});
 return NextResponse.json({ok:true,kind:"reconstructed",path});
}
