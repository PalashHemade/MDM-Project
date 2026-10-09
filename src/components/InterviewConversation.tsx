"use client";

import { useState } from "react";
import Link from "next/link";
import type { InterviewTurn, InterviewStatus } from "@/generated/prisma/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function InterviewConversation({
  interviewId,
  initialTurns,
  initialStatus,
  t,
}: {
  interviewId: string;
  initialTurns: InterviewTurn[];
  initialStatus: InterviewStatus;
  t: Dictionary["interview"];
}) {
  const [turns, setTurns] = useState<InterviewTurn[]>(initialTurns);
  const [status, setStatus] = useState<InterviewStatus>(initialStatus);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentTurn = turns[turns.length - 1];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answerText.trim() || !currentTurn) return;
    setSubmitting(true);

    const res = await fetch(`/api/interviews/${interviewId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnId: currentTurn.id, answerText }),
    });

    setSubmitting(false);
    if (!res.ok) return;

    const data = await res.json();
    setTurns((prev) => prev.map((turn) => (turn.id === currentTurn.id ? { ...turn, transcript: answerText } : turn)));
    setAnswerText("");

    if (data.status === "COMPLETE") {
      setStatus("COMPLETE");
    } else if (data.turn) {
      setTurns((prev) => [...prev, data.turn]);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5 pt-2">
      {turns.map((turn, i) => {
        const isCurrent = i === turns.length - 1 && !turn.transcript;
        return (
          <div key={turn.id} className="flex flex-col gap-3">
            <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3 text-sm">
              <span className="mb-1 block text-[11px] font-semibold text-ink-faint">
                {t.questionLabel} {i + 1}
              </span>
              {turn.questionText}
            </div>
            {turn.transcript && (
              <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-red-tint px-4 py-3 text-sm text-ink">
                {turn.transcript}
              </div>
            )}
            {isCurrent && status === "IN_PROGRESS" && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 self-end w-full">
                <textarea
                  className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red"
                  rows={3}
                  placeholder={t.answerPlaceholder}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !answerText.trim()}
                  className="w-fit self-end rounded-[10px] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? t.submitting : t.submitButton}
                </button>
              </form>
            )}
          </div>
        );
      })}

      {status === "COMPLETE" && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">{t.completeTitle}</h2>
          <p className="text-sm text-ink-soft">{t.completeSub}</p>
          <Link href="/dashboard" className="rounded-[10px] bg-red px-4 py-2 text-sm font-semibold text-white">
            {t.backToDashboard}
          </Link>
        </div>
      )}
    </div>
  );
}
