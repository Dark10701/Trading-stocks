"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Styled replacement for window.confirm(): dimmed backdrop, glass panel,
// cancel/confirm actions with a loading state while the action runs.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative glass-card-strong w-full max-w-sm p-6 rounded-2xl animate-fade-up">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className={`flex-1 text-white border-0 font-bold ${
              destructive
                ? "bg-gradient-to-r from-destructive to-[oklch(0.55_0.22_25)] hover:opacity-90"
                : "bg-gradient-to-r from-[oklch(0.65_0.18_270)] to-[oklch(0.55_0.2_280)] hover:opacity-90"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
