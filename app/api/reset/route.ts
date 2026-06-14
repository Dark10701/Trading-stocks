import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STARTING_CASH } from "@/lib/portfolio";

// Wipes the signed-in user's positions, trades, and snapshots, then resets cash
// to the starting balance and seeds a fresh snapshot.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await supabase.from("positions").delete().eq("user_id", user.id);
    await supabase.from("trades").delete().eq("user_id", user.id);
    await supabase.from("portfolio_snapshots").delete().eq("user_id", user.id);

    const { error: resetErr } = await supabase
      .from("portfolio")
      .update({ cash_balance: STARTING_CASH })
      .eq("user_id", user.id);
    if (resetErr) {
      return NextResponse.json({ error: "Failed to reset portfolio" }, { status: 500 });
    }

    await supabase.from("portfolio_snapshots").insert({
      user_id: user.id,
      total_value: STARTING_CASH,
      cash_balance: STARTING_CASH,
    });

    return NextResponse.json({ success: true, cash_balance: STARTING_CASH });
  } catch (error: any) {
    console.error("Reset API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset portfolio" },
      { status: 500 }
    );
  }
}
