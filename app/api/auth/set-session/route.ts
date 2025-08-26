import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ENV } from "@/lib/env";

export async function POST(request: NextRequest) {
  const { access_token, refresh_token } = await request.json();
  const cookieStore = cookies();

  const supabase = createServerClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    cookies: {
      async getAll() {
        return (await cookieStore).getAll();
      },
      async setAll(cookiesToSet) {
        const store = await cookieStore;
        cookiesToSet.forEach(({ name, value, options }) =>
          store.set(name, value, options)
        );
      },
    },
  });

  // Set the session on the server
  await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  return NextResponse.json({ success: true });
} 