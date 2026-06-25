"use client";

import { Input } from "@/components/ui/input";
import { formatAmountInput } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: "decimal" | "numeric";
}

export function AmountInput({
  id,
  value,
  onChange,
  allowDecimals = true,
  className,
  placeholder,
  required,
  disabled,
  inputMode,
}: AmountInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-northium-muted"
      >
        $
      </span>
      <Input
        id={id}
        type="text"
        inputMode={inputMode ?? (allowDecimals ? "decimal" : "numeric")}
        autoComplete="off"
        value={value}
        onChange={(event) =>
          onChange(formatAmountInput(event.target.value, { allowDecimals }))
        }
        className={cn("rounded-xl pl-7", className)}
        placeholder={placeholder ?? (allowDecimals ? "0.00" : "0")}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
