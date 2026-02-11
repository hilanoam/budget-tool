"use client";

import React from "react";
import { supabase } from "../supabaseClient";

export default function AppHeader({
  title,
  highlight,
  subtitle,
  children,
}: {
  title: string;
  highlight: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50">
      {/* Background blobs (יותר עדין) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 -right-56 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-fuchsia-300/25 to-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-emerald-300/25 to-cyan-300/25 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 py-6">
        {/* ✅ Header קטן */}
        <header className="rounded-[22px] bg-white/60 glass border border-white/60 shadow-soft px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-white/70 glass shadow-soft grid place-items-center border border-white/60 shrink-0">
                <span className="text-lg">👑</span>
              </div>

              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-black tracking-tight truncate">
                  {title} <span className="text-indigo-700">{highlight}</span>
                </h1>
                {subtitle && (
                  <p className="text-xs md:text-sm text-slate-600 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-900 border border-white/60 bg-white/70 glass hover:bg-white transition shadow-soft shrink-0"
            >
              התנתקות
            </button>
          </div>
        </header>

        {/* ✅ תוכן קרוב ל-header */}
        <div className="mt-5">{children}</div>
      </main>
    </div>
  );
}
