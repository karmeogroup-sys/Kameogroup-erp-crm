import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { claims } } = await supabase.auth.getClaims();
  const isLogin = request.nextUrl.pathname === '/login';
  const isPublicAcademy = request.nextUrl.pathname.startsWith('/academy/access/') || request.nextUrl.pathname.startsWith('/api/academy/access/');
  if (!claims && !isLogin && !isPublicAcademy) {
    const next = request.nextUrl.clone(); next.pathname = '/login';
    return NextResponse.redirect(next);
  }
  if (claims && isLogin) {
    const next = request.nextUrl.clone(); next.pathname = '/';
    return NextResponse.redirect(next);
  }
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
