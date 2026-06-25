"use client";

import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/forms/pin-input";
import { formatExpiryDisplay } from "@/lib/banking/card-issuance";
import { cn } from "@/lib/utils";

export interface RevealedCardDetails {
  pan: string;
  cvv: string;
  expiry: string;
  cardholderName: string;
}

interface NorthiumMastercardProps {
  cardholderName: string;
  lastFour: string;
  status: string;
  deliveryEta?: string | null;
  expiresAt?: string | null;
  maskedPan?: string | null;
  detailsAvailable?: boolean;
  detailsOpen?: boolean;
  details?: RevealedCardDetails | null;
  detailsPin?: string;
  detailsLoading?: boolean;
  detailsError?: string | null;
  onViewDetails?: () => void;
  onCloseDetails?: () => void;
  onDetailsPinChange?: (pin: string) => void;
  onRevealDetails?: () => void;
}

export function NorthiumMastercard({
  cardholderName,
  lastFour,
  status,
  deliveryEta,
  expiresAt,
  maskedPan,
  detailsAvailable = false,
  detailsOpen = false,
  details = null,
  detailsPin = "",
  detailsLoading = false,
  detailsError = null,
  onViewDetails,
  onCloseDetails,
  onDetailsPinChange,
  onRevealDetails,
}: NorthiumMastercardProps) {
  const isPending = status === "ordered";
  const isActive = status === "active";
  const panLine =
    isActive && maskedPan
      ? maskedPan
      : isPending
        ? "•••• •••• •••• ••••"
        : `•••• •••• •••• ${lastFour}`;

  const showPinOverlay = detailsOpen && !details;
  const showRevealedDetails = detailsOpen && details;

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#081827] via-[#10263A] to-[#1a3a52] p-6 text-white shadow-2xl">
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-northium-gold/20 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 size-48 rounded-full bg-northium-gold/10 blur-3xl" />

        {showPinOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col justify-center bg-[#06121c]/92 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Card Details
              </p>
              {onCloseDetails && (
                <button
                  type="button"
                  onClick={onCloseDetails}
                  className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-white/60">
              Enter your 4-digit transaction PIN to view your full card number and security code.
            </p>
            {onDetailsPinChange && (
              <PinInput
                id="card-details-pin"
                label="4-Digit Transaction PIN"
                value={detailsPin}
                onChange={onDetailsPinChange}
                length={4}
                variant="compact"
                required
                className="[&_label]:text-white/70 [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white"
              />
            )}
            {detailsError && (
              <p className="mt-2 text-xs text-red-300">{detailsError}</p>
            )}
            <div className="mt-4 flex gap-2">
              {onRevealDetails && (
                <Button
                  type="button"
                  size="sm"
                  disabled={detailsLoading || detailsPin.length !== 4}
                  onClick={onRevealDetails}
                  className="flex-1 bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
                >
                  {detailsLoading ? "Verifying..." : "Show Details"}
                </Button>
              )}
              {onCloseDetails && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onCloseDetails}
                  className="border-white/25 bg-transparent text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="relative flex h-full flex-col justify-between">
          {showRevealedDetails ? (
            <>
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
                  Card Details
                </p>
                {onCloseDetails && (
                  <button
                    type="button"
                    onClick={onCloseDetails}
                    className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3 py-1">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/45">
                    Card number
                  </p>
                  <p className="font-mono text-base tracking-[0.12em] text-white sm:text-lg">
                    {details.pan}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/45">
                      Cardholder
                    </p>
                    <p className="text-sm font-medium uppercase text-white">
                      {details.cardholderName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/45">
                      Expiry
                    </p>
                    <p className="font-mono text-sm text-white">{details.expiry}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/45">
                    CVV
                  </p>
                  <p className="font-mono text-sm text-white">{details.cvv}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="flex gap-1">
                  <div className="size-7 rounded-full bg-red-500/90 opacity-90" />
                  <div className="-ml-3 size-7 rounded-full bg-amber-400/90 opacity-90" />
                </div>
              </div>
            </>
          ) : (
            <>
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

              <div className="font-mono text-lg tracking-[0.14em] text-white/90 sm:text-xl">
                {panLine}
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/45">
                    Cardholder
                  </p>
                  <p className="text-sm font-medium uppercase">{cardholderName}</p>
                </div>
                <div className="text-right">
                  {isActive && expiresAt ? (
                    <>
                      <p className="text-[9px] uppercase tracking-widest text-white/45">
                        Valid thru
                      </p>
                      <p className="font-mono text-sm text-white/90">
                        {formatExpiryDisplay(expiresAt)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] uppercase tracking-widest text-white/45">
                        Status
                      </p>
                      <p className="text-xs font-semibold capitalize text-northium-gold">
                        {status.replace(/_/g, " ")}
                      </p>
                      {deliveryEta && (isPending || isActive) && (
                        <p className="mt-1 text-[10px] text-white/50">
                          {isActive ? "Mailed by" : "Est."}{" "}
                          {new Date(deliveryEta).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {detailsAvailable && onViewDetails && !detailsOpen && (
        <Button
          type="button"
          size="sm"
          onClick={onViewDetails}
          className={cn(
            "w-full bg-northium-gold text-[#06121c] shadow-sm hover:bg-northium-gold/90"
          )}
        >
          <Eye className="size-4" />
          View Card Details
        </Button>
      )}
    </div>
  );
}
