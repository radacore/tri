import { useState } from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-sm p-5">
        <h3 className="font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border px-3 py-1.5 text-sm" onClick={onCancel}>
            Batal
          </button>
          <button
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white"
            onClick={onConfirm}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({ open: false, title: "", message: "", action: null });

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      onCancel={() => setState((s) => ({ ...s, open: false }))}
      onConfirm={() => {
        state.action?.();
        setState((s) => ({ ...s, open: false }));
      }}
    />
  );

  const ask = (title: string, message: string, action: () => void) =>
    setState({ open: true, title, message, action });

  // keep hook stable shape
  const [,] = useState(0);
  return { dialog, ask };
}
