"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type MathVerificationFieldProps = {
  token: string;
  question: string;
  answer: string;
  onTokenChange: (token: string) => void;
  onQuestionChange: (question: string) => void;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
};

export function MathVerificationField({
  token,
  question,
  answer,
  onTokenChange,
  onQuestionChange,
  onAnswerChange,
  disabled,
}: MathVerificationFieldProps) {
  const [loading, setLoading] = useState(!token);

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/human-check");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load verification.");
      }
      onTokenChange(data.token);
      onQuestionChange(data.question);
      onAnswerChange("");
    } catch {
      onQuestionChange("Unable to load. Try again.");
    } finally {
      setLoading(false);
    }
  }, [onAnswerChange, onQuestionChange, onTokenChange]);

  useEffect(() => {
    if (!token) {
      void loadChallenge();
    }
  }, [loadChallenge, token]);

  const prompt = loading ? "Loading..." : question;

  return (
    <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
      <p className="shrink-0 text-sm text-northium-muted">{prompt}</p>
      <Input
        id="humanCheckAnswer"
        type="number"
        inputMode="numeric"
        min={2}
        max={18}
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="h-10 w-[4.5rem] shrink-0 rounded-xl px-2 text-center sm:w-20"
        placeholder="="
        required
        disabled={disabled || loading || !token}
        aria-label={loading ? "Verification answer" : `Answer for ${question}`}
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        onClick={() => void loadChallenge()}
        disabled={disabled || loading}
        aria-label="New verification question"
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );
}
