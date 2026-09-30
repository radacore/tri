import { useRef, useState } from "react";
import { uploadFile, type UploadResult } from "../api/client";

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
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
      // Fallback: preview lokal bila API mati
      setError(
        `Upload gagal (${e?.message ?? "network"}). Preview lokal dipakai, URL tidak tersimpan permanen.`
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
        className={`rounded-lg border-2 border-dashed p-4 text-center text-sm ${
          drag ? "border-[#0158FE] bg-blue-50" : "border-slate-300"
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
            className="mx-auto max-h-40 rounded object-contain"
          />
        ) : (
          <p className="text-slate-500">
            Drag &amp; drop gambar di sini, atau klik untuk pilih file
            {busy ? " — uploading…" : ""}
          </p>
        )}
      </div>
      {value && (
        <p className="mt-1 break-all text-xs text-slate-500">{value}</p>
      )}
      {info && (
        <p className="mt-1 text-xs text-emerald-700">
          {info.format ?? "webp"}
          {info.width ? ` · ${info.width}x${info.height}` : ""}
          {info.size_kb ? ` · ${info.size_kb} KB` : ""}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-amber-700">{error}</p>}
    </div>
  );
}
