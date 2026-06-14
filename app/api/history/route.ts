import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("traded_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch trade history" }, { status: 500 });
    }

    return NextResponse.json(trades || []);
  } catch (error: any) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}
