import Image from "next/image";
import { bankingImages } from "@/lib/brand/images";
import type { VisualKey } from "@/lib/brand/visuals";
import { cn } from "@/lib/utils";

interface BankingImageProps {
  visual: VisualKey;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  overlay?: "none" | "light" | "dark" | "navy";
  sizes?: string;
}

const overlayClasses = {
  none: "",
  light: "after:bg-white/20",
  dark: "after:bg-black/30",
  navy: "after:bg-northium-primary/50",
};

export function BankingImage({
  visual,
  className,
  imageClassName,
  priority = false,
  overlay = "none",
  sizes = "(max-width: 1024px) 100vw, 50vw",
}: BankingImageProps) {
  const { src, alt } = bankingImages[visual];

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        overlay !== "none" &&
          "after:pointer-events-none after:absolute after:inset-0 after:content-['']",
        overlay !== "none" && overlayClasses[overlay],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}

interface BankingImageSrcProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  overlay?: "none" | "light" | "dark" | "navy";
  sizes?: string;
}

export function BankingImageSrc({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
  overlay = "none",
  sizes = "(max-width: 768px) 100vw, 33vw",
}: BankingImageSrcProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        overlay !== "none" &&
          "after:pointer-events-none after:absolute after:inset-0 after:content-['']",
        overlay !== "none" && overlayClasses[overlay],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
