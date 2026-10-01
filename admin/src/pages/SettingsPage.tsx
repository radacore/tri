import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { post } from "../api/client";
import { toast } from "../components/Layout";

// NOTE: plan pricing, FAQ, hero, and footer content live under
// "Website Identity". This page keeps account security only.
export default function SettingsPage() {
  const [newPass, setNewPass] = useState("");

  const passMut = useMutation({
    mutationFn: (password: string) => post("/admin/change-password", { password }),
    onSuccess: () => {
      toast("Password changed");
      setNewPass("");
    },
    onError: (e: any) => toast(`Password change failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Settings</h1>
      <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink-primary">Change admin password</h2>
        <input
          className="input"
          type="password"
          placeholder="New password (min 8 characters)"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={passMut.isPending || newPass.length < 8}
          onClick={() => passMut.mutate(newPass)}
        >
          {passMut.isPending ? "Saving…" : "Change Password"}
        </button>
      </div>
      <div className="rounded-[24px] bg-white p-5 text-sm text-ink-secondary shadow-sm">
        <h2 className="font-semibold text-ink-primary">Email templates</h2>
        <p className="mt-1">
          Notification emails are sent automatically when an order status changes
          (pending → paid → in_progress → revision → completed → delivered).
          Templates are managed in the backend; here just make sure
          customer email addresses are valid on the Orders page.
        </p>
      </div>
    </div>
  );
}
