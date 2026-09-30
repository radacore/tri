import { useState } from "react";

export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e2eceb]">
      <div className="flex gap-1 border-b border-[#e2eceb] bg-surface-muted p-1 text-sm">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            className={`rounded-full px-3 py-1 font-medium capitalize transition ${
              tab === t
                ? "bg-brand text-white"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
            onClick={() => setTab(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "write" ? (
        <textarea
          className="min-h-[180px] w-full p-3 font-mono text-sm text-ink-primary outline-none placeholder:text-ink-muted"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"# Title\n\nWrite markdown…"}
        />
      ) : (
        <pre className="min-h-[180px] whitespace-pre-wrap p-3 text-sm text-ink-secondary">
          {value || "(empty)"}
        </pre>
      )}
    </div>
  );
}
