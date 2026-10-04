import { ExternalLink, RotateCw } from "lucide-react";

// Live preview of the public website in an iframe (no extra deps,
// no DOM poking across origins — just reload + hash navigation).
const TAB_ANCHOR: Record<string, string> = {
  hero: "/",
  sections: "/#how-it-works",
  steps: "/#how-it-works",
  pricing: "/#pricing",
  pages: "/order",
  contact: "/contact",
  media: "/",
  footer: "/#site-footer",
};

function siteBase(): string {
  try {
    const env = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    if (env && env.length > 0) return env.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  const h = window.location.hostname;
  if (h === "127.0.0.1" || h === "localhost") return "http://127.0.0.1:4321";
  return window.location.origin;
}

export default function SitePreview({
  tab,
  reloadKey,
  path,
}: {
  tab: string;
  reloadKey: number;
  path?: string | null;
}) {
  const base = siteBase();
  const src = `${base}${path ?? TAB_ANCHOR[tab] ?? "/"}`;
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e2eceb] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#e2eceb] bg-surface-muted px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f8c0c8]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fef3c7]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#cde9a7]" />
        </span>
        <span className="tabular min-w-0 flex-1 truncate text-xs text-ink-secondary">
          {src}
        </span>
        <button
          type="button"
          aria-label="Reload preview"
          title="Reload preview"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"
          onClick={() => {
            const f = document.getElementById(
              "site-preview-frame"
            ) as HTMLIFrameElement | null;
            f?.contentWindow?.location.reload();
          }}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          aria-label="Open website in new tab"
          title="Open website in new tab"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe
        key={`${reloadKey}-${tab}`}
        id="site-preview-frame"
        title="Website preview"
        src={src}
        loading="lazy"
        scrolling="no"
        tabIndex={-1}
        className="pointer-events-none h-[70vh] w-full select-none overflow-hidden border-0 bg-white xl:h-[calc(100vh-220px)]"
      />
      <p className="border-t border-[#e2eceb] px-4 py-2 text-[11px] text-ink-secondary">
        Preview-only: locked on this section (no scrolling) and reloads
        automatically after every save. Open in a new tab to interact.
      </p>
    </div>
  );
}
