"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MathVerificationField } from "@/components/forms/math-verification-field";

const TOPICS = [
  { value: "general", label: "General inquiry" },
  { value: "account", label: "Account support" },
  { value: "membership", label: "Membership" },
  { value: "loans", label: "Loans" },
  { value: "security", label: "Security / fraud" },
] as const;

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [humanCheckToken, setHumanCheckToken] = useState("");
  const [humanCheckQuestion, setHumanCheckQuestion] = useState("");
  const [humanCheckAnswer, setHumanCheckAnswer] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: TOPICS[0].value,
    message: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        humanCheckToken,
        humanCheckAnswer: Number(humanCheckAnswer),
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Unable to send message.");
      setHumanCheckToken("");
      return;
    }

    setSuccess(true);
    setForm({ name: "", email: "", topic: TOPICS[0].value, message: "" });
    setHumanCheckToken("");
    setHumanCheckAnswer("");
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-heading text-lg font-semibold text-northium-primary">
          Message sent
        </p>
        <p className="mt-2 text-sm text-northium-muted">
          Thank you. Our team will respond to your email shortly.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setSuccess(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="rounded-xl"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="rounded-xl"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <select
          id="topic"
          value={form.topic}
          onChange={(e) => updateField("topic", e.target.value)}
          className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
        >
          {TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm outline-none focus-visible:border-northium-primary focus-visible:ring-2 focus-visible:ring-northium-primary/20"
          required
          minLength={10}
        />
      </div>

      <MathVerificationField
        token={humanCheckToken}
        question={humanCheckQuestion}
        answer={humanCheckAnswer}
        onTokenChange={setHumanCheckToken}
        onQuestionChange={setHumanCheckQuestion}
        onAnswerChange={setHumanCheckAnswer}
        disabled={loading}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !humanCheckToken}
        className="w-full bg-northium-primary hover:bg-northium-secondary"
      >
        {loading ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
