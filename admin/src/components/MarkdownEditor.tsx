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
    <div className="rounded-lg border">
      <div className="flex gap-1 border-b p-1 text-sm">
        <button
          className={`rounded px-3 py-1 ${tab === "write" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          onClick={() => setTab("write")}
          type="button"
        >
          Write
        </button>
        <button
          className={`rounded px-3 py-1 ${tab === "preview" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          onClick={() => setTab("preview")}
          type="button"
        >
          Preview
        </button>
      </div>
      {tab === "write" ? (
        <textarea
          className="min-h-[180px] w-full p-3 font-mono text-sm outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="# Judul&#10;&#10;Tulis markdown…"
        />
      ) : (
        <pre className="min-h-[180px] whitespace-pre-wrap p-3 text-sm text-slate-700">
          {value || "(kosong)"}
        </pre>
      )}
    </div>
  );
}
