import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import ImageUploader from "./ImageUploader";

/** Daftar gambar kolase hero: upload, susun ulang, hapus, lalu simpan. */
export default function HeroImages({
  value,
  onSave,
  saving,
}: {
  value: string[];
  onSave: (imgs: string[]) => void;
  saving?: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const [list, setList] = useState<string[] | null>(null);
  const imgs = list ?? value ?? [];
  const move = (i: number, dir: 1 | -1) => {
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    const next = imgs.slice();
    const t = next[i];
    next[i] = next[j];
    next[j] = t;
    setList(next);
  };
  const removeAt = (i: number) => setList(imgs.filter((_, j) => j !== i));
  return (
    <div>
      {imgs.length === 0 ? (
        <p className="rounded-[14px] bg-surface-muted p-4 text-center text-sm text-ink-secondary">
          No custom images — the landing shows its defaults.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {imgs.map((src, i) => (
            <li
              key={`${i}-${src}`}
              className="anim-rise group relative overflow-hidden rounded-[14px] ring-1 ring-[#e2eceb]"
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
            >
              <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
              <span className="tabular absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-primary shadow"
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-primary shadow"
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#991b1b] shadow"
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
                setList([...imgs, url]);
                setPicking(false);
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary mt-2"
            onClick={() => setPicking(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-secondary mt-3 inline-flex items-center gap-2"
          onClick={() => setPicking(true)}
        >
          <Plus className="h-4 w-4" /> Upload image
        </button>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="btn-primary shadow-lg"
          disabled={!!saving}
          onClick={() => {
            onSave(imgs);
            setList(null);
          }}
        >
          {saving ? "Saving…" : "Save hero images"}
        </button>
      </div>
    </div>
  );
}
