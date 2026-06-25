"use client";

interface NorthiumMastercardProps {
  cardholderName: string;
  lastFour: string;
  status: string;
  deliveryEta?: string | null;
}

export function NorthiumMastercard({
  cardholderName,
  lastFour,
  status,
  deliveryEta,
}: NorthiumMastercardProps) {
  return (
    <div className="relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[#081827] via-[#10263A] to-[#1a3a52] p-6 text-white shadow-2xl">
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-northium-gold/20 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 size-48 rounded-full bg-northium-gold/10 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
              Northium
            </p>
            <p className="font-heading text-lg font-bold tracking-wide">
              Mastercard
            </p>
          </div>
          <div className="flex gap-1">
            <div className="size-8 rounded-full bg-red-500/90 opacity-90" />
            <div className="-ml-4 size-8 rounded-full bg-amber-400/90 opacity-90" />
          </div>
        </div>
        <div className="font-mono text-xl tracking-[0.2em] text-white/90">
          •••• •••• •••• {lastFour}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/45">
              Cardholder
            </p>
            <p className="text-sm font-medium uppercase">{cardholderName}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-white/45">
              Status
            </p>
            <p className="text-xs font-semibold capitalize text-northium-gold">
              {status.replace(/_/g, " ")}
            </p>
            {deliveryEta && status === "ordered" && (
              <p className="mt-1 text-[10px] text-white/50">
                Est. {new Date(deliveryEta).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
