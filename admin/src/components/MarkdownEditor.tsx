import { useMemo, useState } from "react";
import { marked } from "marked";

export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const html = useMemo(() => {
    try {
      return marked.parse(value || "", { breaks: true }) as string;
    } catch {
      return "";
    }
  }, [value]);
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
        <div
          className="prose-preview min-h-[180px] p-3 text-sm leading-relaxed text-ink-primary [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_blockquote]:border-l-2 [&_blockquote]:border-[#e2eceb] [&_blockquote]:pl-3 [&_blockquote]:text-ink-secondary [&_img]:rounded-xl [&_img]:max-w-full"
          dangerouslySetInnerHTML={{ __html: html || "(empty)" }}
        />
      )}
    </div>
  );
}
