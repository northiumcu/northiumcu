"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PinInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Dots in the field only — no indicators or hint (apply form). */
  variant?: "default" | "compact";
}

export function PinInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  className,
  variant = "default",
}: PinInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const compact = variant === "compact";
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      {!compact && (
        <div className="flex justify-center gap-2 py-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              aria-hidden
              className={cn(
                "size-2.5 rounded-full border transition-colors",
                index < value.length
                  ? "border-northium-primary bg-northium-primary"
                  : "border-northium-border bg-white"
              )}
            />
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          id={inputId}
          type={visible ? "text" : "password"}
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={value}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="rounded-xl pr-11 text-center tracking-[0.45em]"
          autoComplete="one-time-code"
          placeholder="••••••"
          disabled={disabled}
          required={required}
          aria-describedby={compact ? undefined : `${inputId}-hint`}
        />
        <button
          type="button"
          onClick={() => setVisible((show) => !show)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-northium-muted transition-colors hover:text-northium-primary disabled:opacity-50"
          aria-label={visible ? "Hide PIN" : "Show PIN"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {!compact && (
        <p id={`${inputId}-hint`} className="text-center text-xs text-northium-muted">
          6-digit PIN
        </p>
      )}
    </div>
  );
}
