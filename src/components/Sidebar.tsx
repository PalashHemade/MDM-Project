import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const items: { key: keyof Dictionary["nav"]; href: string }[] = [
  { key: "dashboard", href: "/dashboard" },
  { key: "profile", href: "/profile" },
  { key: "interview", href: "/interview/setup" },
];

const comingSoon: (keyof Dictionary["nav"])[] = ["cv", "jobs", "companies", "prep", "history", "german", "progress"];

export function Sidebar({ nav, active }: { nav: Dictionary["nav"]; active: string }) {
  return (
    <div className="flex w-60 shrink-0 flex-col gap-1 border-r border-border px-4 py-7">
      <div className="flex items-center gap-2.5 px-2.5 pb-6">
        <div className="h-7 w-7 rounded-lg bg-red" />
        <span className="font-heading text-lg font-bold">Einstieg</span>
      </div>

      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium ${
            active === item.key ? "bg-red-tint text-red" : "text-ink-soft hover:bg-ground hover:text-ink"
          }`}
        >
          {nav[item.key]}
        </Link>
      ))}

      <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
        {comingSoon.map((key) => (
          <span
            key={key}
            className="flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium text-ink-faint opacity-60"
            title="Coming in a later phase"
          >
            {nav[key]}
          </span>
        ))}
      </div>
    </div>
  );
}
