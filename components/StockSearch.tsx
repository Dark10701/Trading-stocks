"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface Ticker {
  ticker: string;
  name: string;
  market: string;
}

interface StockSearchProps {
  onSelect: (symbol: string) => void;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ticker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);
      try {
        const res = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data || []);
      } catch (err) {
        console.error("Error searching tickers", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 400);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by symbol or company name..."
          className="pl-9 w-full bg-input/50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query) setIsOpen(true);
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && (results.length > 0 || !isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto glass-card-strong shadow-xl shadow-black/20">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No stocks found.
            </div>
          ) : (
            <div className="flex flex-col py-1">
              {results.slice(0, 10).map((item) => (
                <button
                  key={item.ticker}
                  onClick={() => {
                    setQuery("");
                    setIsOpen(false);
                    onSelect(item.ticker);
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 text-left transition-colors"
                >
                  <div>
                    <span className="font-bold text-foreground block">
                      {item.ticker}
                    </span>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-accent/50 px-2 py-1 rounded-md">
                    {item.market}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
