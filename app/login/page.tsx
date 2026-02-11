"use client";

import { useState } from "react";
import { supabase } from "../../src/lib/supabaseClient";
import { Alert, Button, Card, CardTitle, Input } from "../../src/lib/components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        setMsg({
          kind: "success",
          text: "נרשמת! עכשיו תתחברי. אם יש אימייל-אישור בפרויקט, תצטרכי לאשר במייל קודם.",
        });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setMsg({ kind: "error", text: err?.message ?? "שגיאה לא ידועה" });
    } finally {
      setLoading(false);
    }
  }

  const tabBase =
    "rounded-xl px-4 py-2 text-sm font-extrabold border border-white/60 bg-white/60 glass shadow-soft transition";
  const tabOn = "text-indigo-700";
  const tabOff = "text-slate-700 hover:bg-white";

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 -right-56 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-fuchsia-300/25 to-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-emerald-300/25 to-cyan-300/25 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-md px-4 py-10">
        <Card className="p-7">
          <CardTitle
            title="Budget Tool"
            subtitle={mode === "login" ? "התחברי לחשבון" : "הרשמה לחשבון"}
            right={<div className="text-3xl">🔐</div>}
          />

          {/* Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setMode("login");
              }}
              className={`${tabBase} ${mode === "login" ? tabOn : tabOff}`}
            >
              התחברות
            </button>

            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setMode("signup");
              }}
              className={`${tabBase} ${mode === "signup" ? tabOn : tabOff}`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">אימייל</label>
              <div className="mt-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="name@example.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">סיסמה (לפחות 6 תווים)</label>
              <div className="mt-2">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••"
                />
              </div>
            </div>

            <Button disabled={loading} className="w-full">
              {loading ? "..." : mode === "login" ? "התחברות" : "הרשמה"}
            </Button>

            {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

            <a href="/" className="text-center text-sm font-bold text-indigo-700 hover:underline mt-1">
              חזרה לדף הבית
            </a>
          </form>
        </Card>
      </main>
    </div>
  );
}
