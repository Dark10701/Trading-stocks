import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google redirects back here with a one-time code; exchange it for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send the user back to login with an error flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
