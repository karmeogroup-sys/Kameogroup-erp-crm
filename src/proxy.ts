import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const path=request.nextUrl.pathname;
 const publicRoute=path==='/login'||path==='/reset-password'||path.startsWith('/academy/access/')||path.startsWith('/api/academy/access/');
 if(!url||!key){if(!publicRoute){const next=request.nextUrl.clone();next.pathname='/login';return NextResponse.redirect(next);}return response;}
 const sb=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(items){items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data}=await sb.auth.getClaims();const claims=data?.claims??null;
 if(!claims&&!publicRoute){const next=request.nextUrl.clone();next.pathname='/login';return NextResponse.redirect(next);}
 if(claims&&path==='/login'){const next=request.nextUrl.clone();next.pathname='/';return NextResponse.redirect(next);}return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};