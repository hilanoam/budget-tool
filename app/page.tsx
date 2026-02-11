"use client";

import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabaseClient";
import { Button, Card, CardTitle, Alert } from "../src/lib/components/ui";

export default function Home() {
  const [status, setStatus] = useState<{
    kind: "info" | "success" | "error";
    text: string;
    hasSession: boolean;
  }>({ kind: "info", text: "בודקת חיבור…", hasSession: false });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus({ kind: "error", text: `Supabase error: ${error.message}`, hasSession: false });
        return;
      }
      setStatus({
        kind: data.session ? "success" : "info",
        text: data.session ? "מחוברת ✅" : "לא מחוברת (אין Session)",
        hasSession: !!data.session,
      });
    })();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 -right-56 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-fuchsia-300/25 to-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-emerald-300/25 to-cyan-300/25 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-3xl px-4 py-10">
        <Card className="p-7">
          <CardTitle
            title="Budget Tool"
            subtitle="כל התקציבים והחיובים במקום אחד."
            right={<div className="text-3xl">💸</div>}
          />

          <Alert kind={status.kind} >{status.text}</Alert>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href="/login">
              <Button className="w-full" variant="ghost">
                התחברות / הרשמה
              </Button>
            </a>

            <a href="/dashboard">
              <Button className="w-full" variant="primary">
                לרשימת ספקים
              </Button>
            </a>
          </div>

        </Card>
      </main>
    </div>
  );
}
