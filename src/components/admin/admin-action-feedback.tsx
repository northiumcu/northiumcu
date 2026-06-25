import { cn } from "@/lib/utils";

export type AdminFeedback = {
  type: "success" | "error";
  text: string;
} | null;

export function AdminActionFeedback({
  feedback,
  className,
}: {
  feedback: AdminFeedback;
  className?: string;
}) {
  if (!feedback) return null;

  return (
    <div
      role={feedback.type === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        feedback.type === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-northium-gold/30 bg-northium-gold/10 text-northium-gold",
        className
      )}
    >
      {feedback.text}
    </div>
  );
}
