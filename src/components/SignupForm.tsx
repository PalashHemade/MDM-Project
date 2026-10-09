"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function SignupForm({ t }: { t: Dictionary["auth"] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-red";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label className={labelClass}>{t.fullName}</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className={labelClass}>{t.email}</label>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelClass}>{t.password}</label>
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-sm text-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-[10px] bg-red px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? t.creatingAccount : t.createAccount}
      </button>
      <p className="text-sm text-ink-soft">
        <Link href="/login" className="font-semibold text-ink">
          {t.haveAccount}
        </Link>
      </p>
    </form>
  );
}
