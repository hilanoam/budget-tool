"use client";

import { useState } from "react";
import { supabase } from "../../src/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        setMsg("נרשמת! עכשיו תתחברי. אם יש אימייל-אישור בפרויקט, תצטרכי לאשר במייל קודם.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        window.location.href = "/";
      }
    } catch (err: any) {
      setMsg(err?.message ?? "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1 style={{ marginBottom: 8 }}>Budget Tool</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setMode("login");
          }}
          style={{
            padding: 10,
            flex: 1,
            border: "1px solid #ccc",
            background: mode === "login" ? "#eee" : "#fff",
            cursor: "pointer",
          }}
        >
          התחברות
        </button>

        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setMode("signup");
          }}
          style={{
            padding: 10,
            flex: 1,
            border: "1px solid #ccc",
            background: mode === "signup" ? "#eee" : "#fff",
            cursor: "pointer",
          }}
        >
          הרשמה
        </button>
      </div>

      <h2 style={{ marginTop: 16 }}>{mode === "login" ? "התחברי לחשבון" : "הרשמה לחשבון"}</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <label>
          אימייל
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          סיסמה (לפחות 6 תווים)
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            cursor: "pointer",
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
          }}
        >
          {loading ? "..." : mode === "login" ? "התחברי" : "הרשמי"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <div style={{ marginTop: 16 }}>
        <a href="/">חזרה לדף הבית</a>
      </div>
    </main>
  );
}
