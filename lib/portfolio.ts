import type { SupabaseClient } from "@supabase/supabase-js";

export const STARTING_CASH = 10000.0;

// Ensures the signed-in user has a portfolio row, creating one (with a seed
// snapshot) on first access. Returns the portfolio id.
export async function ensurePortfolio(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("portfolio")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("portfolio")
    .insert({ user_id: userId, cash_balance: STARTING_CASH })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error("Failed to create portfolio");
  }

  // Seed an initial snapshot so the value chart has a starting point.
  await supabase.from("portfolio_snapshots").insert({
    user_id: userId,
    total_value: STARTING_CASH,
    cash_balance: STARTING_CASH,
  });

  return created.id;
}
