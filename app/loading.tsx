import { Loader2 } from "lucide-react";

// Shown instantly during route transitions (and first compile in dev) so
// navigation feels responsive instead of frozen while the page loads.
export default function Loading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      <div className="space-y-6 animate-pulse">
        <div className="h-9 w-48 rounded-lg bg-accent/40" />
        <div className="h-32 rounded-2xl bg-accent/30" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-accent/30" />
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
