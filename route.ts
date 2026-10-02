import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Ctx={params:Promise<{token:string;assetId:string}>};
export async function GET(_req:Request,{params}:Ctx){
 const {token,assetId}=await params; const sb=supabaseAdmin();
 const {data:e}=await sb.from('training_entitlements').select('id,product_id,expires_at,max_downloads,download_count,revoked_at,training_orders!inner(status)').eq('access_token',token).maybeSingle();
 const order=e?(Array.isArray(e.training_orders)?e.training_orders[0]:e.training_orders as any):null;
 if(!e||order?.status!=='paid'||e.revoked_at||(e.expires_at&&new Date(e.expires_at).getTime()<=Date.now())||(e.max_downloads!==null&&e.download_count>=e.max_downloads)) return new NextResponse('Accès refusé',{status:403});
 const {data:a}=await sb.from('training_assets').select('id,product_id,storage_path').eq('id',assetId).eq('product_id',e.product_id).maybeSingle();
 if(!a)return new NextResponse('Contenu introuvable',{status:404});
 const {data:signed,error}=await sb.storage.from('academy-private').createSignedUrl(a.storage_path,300);
 if(error||!signed)return new NextResponse('Lien temporaire indisponible',{status:500});
 const {error:countError}=await sb.rpc('increment_training_download',{p_entitlement_id:e.id});
 if(countError)return new NextResponse('Impossible de comptabiliser cet accès',{status:500});
 return NextResponse.redirect(signed.signedUrl,302);
}
