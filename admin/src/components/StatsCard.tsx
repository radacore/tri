import type { LucideIcon } from "lucide-react";

export type PastelTone = "lime" | "teal" | "pink" | "purple";

const TONES: Record<PastelTone, { bg: string; ink: string }> = {
  lime: { bg: "bg-card-lime", ink: "text-card-lime-ink" },
  teal: { bg: "bg-card-teal", ink: "text-card-teal-ink" },
  pink: { bg: "bg-card-pink", ink: "text-card-pink-ink" },
  purple: { bg: "bg-card-purple", ink: "text-card-purple-ink" },
};

export default function StatsCard({
  title,
  value,
  hint,
  tone,
  icon: Icon,
  bars,
}: {
  title: string;
  value: string;
  hint?: string;
  tone: PastelTone;
  icon: LucideIcon;
  bars?: number[];
}) {
  const t = TONES[tone];
  return (
    <div
      className={`${t.bg} lift flex h-36 flex-col justify-between overflow-hidden rounded-[20px] p-4 shadow-xs relative`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-black/10 ${t.ink}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <p className={`mb-1 text-[11px] font-medium ${t.ink} opacity-80`}>
          {title}
        </p>
        <h3
          className={`tabular text-2xl font-bold tracking-tight ${t.ink}`}
        >
          {value}
        </h3>
        {hint && (
          <p className={`text-[10px] font-semibold ${t.ink} opacity-90`}>
            {hint}
          </p>
        )}
      </div>
      {bars && bars.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-4 flex h-16 items-end gap-1.5 opacity-40">
          {bars.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`w-2.5 rounded-full ${t.ink} bg-current opacity-50`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
