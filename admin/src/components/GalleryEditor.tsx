import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import ImageUploader from "./ImageUploader";

export interface GalleryItem {
  url: string;
  alt: string;
}

/** Galeri case study: upload, susun ulang, isi alt, hapus. */
export default function GalleryEditor({
  value,
  onChange,
  baseUrl,
}: {
  value: GalleryItem[];
  onChange: (v: GalleryItem[]) => void;
  /** Origin landing untuk pratinjau path relatif (/cases/…, /uploads/…). */
  baseUrl?: string;
}) {
  const [picking, setPicking] = useState(false);
  const items = value ?? [];
  const previewSrc = (url: string) => (url.startsWith("/") && baseUrl ? baseUrl + url : url);

  const move = (i: number, dir: 1 | -1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    const t = next[i];
    next[i] = next[j];
    next[j] = t;
    onChange(next);
  };

  const setAlt = (i: number, alt: string) =>
    onChange(items.map((it, j) => (j === i ? { ...it, alt } : it)));

  const removeAt = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div>
      {items.length === 0 ? (
        <p className="rounded-[14px] bg-surface-muted p-4 text-center text-sm text-ink-secondary">
          No gallery images yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={`${i}-${it.url}`}
              className="flex items-start gap-3 rounded-[14px] bg-surface-muted p-2 ring-1 ring-[#e2eceb]"
            >
              <img
                src={previewSrc(it.url)}
                alt=""
                loading="lazy"
                className="h-16 w-16 shrink-0 rounded-[10px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <input
                  className="input text-xs"
                  value={it.alt}
                  placeholder="Describe the image (alt text)"
                  onChange={(e) => setAlt(i, e.target.value)}
                />
                <p className="mt-1 truncate text-[11px] text-ink-secondary">{it.url}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-secondary shadow-sm transition hover:text-ink-primary disabled:opacity-40"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-secondary shadow-sm transition hover:text-ink-primary disabled:opacity-40"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove image"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#991b1b] shadow-sm"
                  onClick={() => removeAt(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {picking ? (
        <div className="mt-3">
          <ImageUploader
            value=""
            onChange={(url) => {
              if (url && !url.startsWith("blob:")) {
                onChange([...items, { url, alt: "" }]);
                setPicking(false);
              }
            }}
          />
          <button type="button" className="btn-secondary mt-2" onClick={() => setPicking(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-secondary mt-3 inline-flex items-center gap-2"
          onClick={() => setPicking(true)}
        >
          <Plus className="h-4 w-4" /> Add image
        </button>
      )}
    </div>
  );
}
