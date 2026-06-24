"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      onQuestionChange("Unable to load verification. Try again.");
    } finally {
      setLoading(false);
    }
  }, [onAnswerChange, onQuestionChange, onTokenChange]);

  useEffect(() => {
    if (!token) {
      void loadChallenge();
    }
  }, [loadChallenge, token]);

  return (
    <div className="space-y-2">
      <Label htmlFor="humanCheckAnswer">Human verification</Label>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-sm text-northium-muted">
          {loading ? "Loading..." : question}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => void loadChallenge()}
          disabled={disabled || loading}
          aria-label="New verification question"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <Input
        id="humanCheckAnswer"
        type="number"
        inputMode="numeric"
        min={2}
        max={18}
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="rounded-xl"
        placeholder="Your answer"
        required
        disabled={disabled || loading || !token}
      />
    </div>
  );
}
