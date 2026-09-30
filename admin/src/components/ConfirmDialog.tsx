import { useState } from "react";
import { X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f3738]/25 p-4 backdrop-blur-[4px]">
      <div className="anim-pop w-full max-w-sm rounded-[24px] bg-white p-7 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-secondary">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="rounded-full bg-[#ef4444] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#dc2626]"
            onClick={onConfirm}
          >
            {confirmLabel}
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

  return { dialog, ask };
}
