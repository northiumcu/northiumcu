"use client";

import { useId } from "react";
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
}

export function PinInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  className,
}: PinInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
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
      <Input
        id={inputId}
        type="password"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        className="rounded-xl text-center tracking-[0.45em]"
        autoComplete="one-time-code"
        placeholder="••••••"
        disabled={disabled}
        required={required}
        aria-describedby={`${inputId}-hint`}
      />
      <p id={`${inputId}-hint`} className="text-center text-xs text-northium-muted">
        6-digit PIN
      </p>
    </div>
  );
}
