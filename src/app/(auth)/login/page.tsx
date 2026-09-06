"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@tilla.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-tilla-900">Tilla</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your GST books (demo)
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              data-testid="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-tilla-500 focus:ring-1 focus:ring-tilla-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              data-testid="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-tilla-500 focus:ring-1 focus:ring-tilla-500"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            data-testid="login-submit"
            disabled={loading}
            className="w-full rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Demo: demo@tilla.app / demo1234
        </p>
      </div>
    </div>
  );
}
