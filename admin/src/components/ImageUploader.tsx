import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { uploadFile, type UploadResult } from "../api/client";

export default function ImageUploader({
  value,
  onChange,
  recommended,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Rekomendasi dimensi gambar dalam piksel, mis. "1600 × 900 px (16:9)". */
  recommended?: string;
}) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const r = await uploadFile(file);
      setInfo(r);
      onChange(r.url);
    } catch (e: any) {
      // Fallback: local preview when the API is offline
      setError(
        `Upload failed (${e?.message ?? "network"}). Using a local preview; the URL is not permanently stored.`
      );
      const local = URL.createObjectURL(file);
      onChange(local);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        className={`rounded-[20px] border-2 border-dashed p-5 text-center text-sm transition ${
          drag ? "border-brand bg-brand-subtle" : "border-[#cbdcda]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void doUpload(f);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.svg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doUpload(f);
          }}
        />
        {value ? (
          <img
            src={value}
            alt="preview"
            className="mx-auto max-h-40 rounded-[14px] object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-secondary">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand">
              <ImagePlus className="h-5 w-5" />
            </span>
            <p>
              Drag &amp; drop an image here, or click to browse
              {busy ? " — uploading…" : ""}
            </p>
          </div>
        )}
      </div>
      {recommended && (
        <p className="mt-1.5 text-xs text-ink-secondary">
          <span className="font-semibold text-ink-primary">Recommended size:</span>{" "}
          {recommended}
        </p>
      )}
      {value && (
        <p className="mt-1 break-all text-xs text-ink-secondary">{value}</p>
      )}
      {info && (
        <p className="tabular mt-1 text-xs text-[#065f46]">
          Uploaded: {info.format ?? "webp"}
          {info.width ? ` · ${info.width}×${info.height} px` : ""}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-[#92400e]">{error}</p>}
    </div>
  );
}
