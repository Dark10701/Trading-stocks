"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error");

  const signInWithGoogle = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
    }
    // On success the browser is redirected to Google, so no further action here.
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass-card gradient-border glow-primary w-full max-w-sm p-8 text-center animate-fade-up">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.18_270)] to-[oklch(0.7_0.18_165)] flex items-center justify-center mx-auto mb-5 shadow-lg">
          <TrendingUp className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome to PaperTrade
        </h1>
        <p className="text-sm text-muted-foreground mt-2 mb-8">
          Sign in to start trading with $10,000 in virtual cash.
        </p>

        {hasError && (
          <p className="text-sm text-destructive mb-4">
            Sign-in failed. Please try again.
          </p>
        )}

        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full gap-2.5 h-11 bg-white text-[#1f1f1f] hover:bg-white/90 border-0 font-semibold"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground/70 mt-6">
          Paper trading only — no real money is involved.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
