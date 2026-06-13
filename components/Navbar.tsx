"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Search, Clock } from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: TrendingUp },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/history", label: "History", icon: Clock },
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar: logo always; inline links on md+ */}
      <nav className="sticky top-0 z-50 glass-card-strong border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_270)] to-[oklch(0.7_0.18_165)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_-4px_oklch(0.65_0.18_270_/_40%)] transition-shadow duration-300">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              PaperTrade
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-[oklch(0.65_0.18_270)] to-[oklch(0.7_0.18_165)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom tab bar: phones only. Sits above the home indicator via safe-area inset. */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-card-strong border-t border-border/50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around h-16">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
