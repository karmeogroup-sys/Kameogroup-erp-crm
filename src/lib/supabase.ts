import { createBrowserClient } from '@supabase/ssr';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasSupabaseEnv=Boolean(url&&key);
export function supabaseBrowser(){
  if(!hasSupabaseEnv) return null;
  return createBrowserClient(url!,key!);
}
