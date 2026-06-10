"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Search, Clock } from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: TrendingUp },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/history", label: "History", icon: Clock },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass-card-strong border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.18_270)] to-[oklch(0.7_0.18_165)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_-4px_oklch(0.65_0.18_270_/_40%)] transition-shadow duration-300">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            PaperTrade
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }
                `}
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
  );
}
