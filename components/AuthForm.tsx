"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type Mode = "login" | "signup";

function sanitizeCallbackUrl(value: string | null): string {
  if (!value) return "/";
  return value.startsWith("/") ? value : "/";
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => sanitizeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  );
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headline = mode === "login" ? "Welcome back" : "Create your account";
  const subheadline =
    mode === "login"
      ? "Sign in with email and password to manage your reservations."
      : "Create a secure account to reserve stock and keep orders isolated.";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const registerData = await registerResponse.json();
        if (!registerResponse.ok) {
          throw new Error(registerData.error ?? "Failed to create account");
        }
      }

      const loginResponse = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (loginResponse?.error) {
        throw new Error("Invalid email or password");
      }

      router.push(loginResponse?.url ?? callbackUrl);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-8">
              Scoped access
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              {headline}
            </h1>
            <p className="text-[hsl(220,12%,58%)] max-w-xl leading-relaxed mb-8">
              {subheadline}
            </p>

            <p className="text-sm text-[hsl(220,12%,52%)] max-w-xl">
              Use your email and password to sign in, or create an account to
              keep reservations scoped to your profile.
            </p>
          </div>

          <div className="p-8 sm:p-10 lg:p-14">
            <div className="flex rounded-2xl bg-black/20 border border-white/10 p-1 mb-8">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-slate-950 shadow-lg" : "text-[hsl(220,12%,68%)] hover:text-white"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${mode === "signup" ? "bg-white text-slate-950 shadow-lg" : "text-[hsl(220,12%,68%)] hover:text-white"}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <label className="block">
                  <span className="block text-sm font-medium text-white mb-2">Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-[hsl(220,12%,48%)] outline-none transition focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/20"
                    placeholder="Avery Stone"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="block text-sm font-medium text-white mb-2">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-[hsl(220,12%,48%)] outline-none transition focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/20"
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-white mb-2">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-[hsl(220,12%,48%)] outline-none transition focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/20"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </label>

              {mode === "signup" && (
                <label className="block">
                  <span className="block text-sm font-medium text-white mb-2">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-[hsl(220,12%,48%)] outline-none transition focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/20"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </label>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:from-brand-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? mode === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}