import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns the user's portfolio value snapshots over time (oldest first).
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("portfolio_snapshots")
      .select("total_value, cash_balance, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch portfolio history" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Portfolio history API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch portfolio history" },
      { status: 500 }
    );
  }
}
