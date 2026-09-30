import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState } = useForm<Form>();

  const onSubmit = async (v: Form) => {
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validasi gagal");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(parsed.data.email, parsed.data.password);
      nav("/", { replace: true });
    } catch (e: any) {
      const msg = String(e?.message ?? "Login gagal");
      setError(
        /429/.test(msg)
          ? "Terlalu banyak percobaan. Tunggu sebentar (rate-limit)."
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card w-full max-w-sm p-6"
      >
        <h1 className="text-xl font-extrabold text-[#0158FE]">
          LogoPulse Admin
        </h1>
        <p className="mb-4 text-sm text-slate-500">Login untuk mengelola konten</p>
        <label className="label">Email</label>
        <input className="input" type="email" {...register("email")} />
        {formState.errors.email && (
          <p className="text-xs text-red-600">
            {formState.errors.email.message}
          </p>
        )}
        <label className="label mt-3">Password</label>
        <input className="input" type="password" {...register("password")} />
        {formState.errors.password && (
          <p className="text-xs text-red-600">
            {formState.errors.password.message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <button className="btn-primary mt-4 w-full" disabled={busy}>
          {busy ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}
