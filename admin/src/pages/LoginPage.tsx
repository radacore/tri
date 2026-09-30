import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "../lib/auth";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(parsed.data.email, parsed.data.password);
      nav("/", { replace: true });
    } catch (e: any) {
      const msg = String(e?.message ?? "Login failed");
      setError(
        /429/.test(msg)
          ? "Too many attempts. Please wait a moment (rate-limited)."
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
        className="anim-pop w-full max-w-sm rounded-[24px] bg-white p-7 shadow-sm"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-subtle text-brand">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-primary">
          LogoPulse Admin
        </h1>
        <p className="mb-5 mt-1 text-sm text-ink-secondary">
          Sign in to manage content
        </p>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {formState.errors.email && (
          <p className="mt-1 text-xs text-[#991b1b]">
            {formState.errors.email.message}
          </p>
        )}
        <label className="label mt-3" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {formState.errors.password && (
          <p className="mt-1 text-xs text-[#991b1b]">
            {formState.errors.password.message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-[14px] bg-[#fee2e2] p-3 text-xs font-medium text-[#991b1b]">
            {error}
          </p>
        )}
        <button className="btn-primary mt-5 w-full py-2.5" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
