"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../supabaseClient"; // אצלך זה כאן

type Vendor = { id: string; name: string };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const activeVendorId = useMemo(() => {
    const m = pathname?.match(/^\/vendor\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      // ✅ הגנה על כל האזור (dashboard + vendor)
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }

      // ✅ טעינת ספקים לסיידבר
      setLoadingVendors(true);
      const { data: vs, error } = await supabase
        .from("vendors")
        .select("id,name")
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error(error);
        setVendors([]);
      } else {
        setVendors((vs ?? []) as Vendor[]);
      }
      setLoadingVendors(false);
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 -right-56 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-fuchsia-300/25 to-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-emerald-300/25 to-cyan-300/25 blur-3xl" />
      </div>

      {/* ✅ TOP TOOLBAR */}
      <header className="relative z-20 sticky top-0">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="rounded-[22px] bg-white/60 glass border border-white/60 shadow-soft px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-white/70 glass shadow-soft grid place-items-center border border-white/60 shrink-0">
                  <span className="text-lg">👑</span>
                </div>

                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-black tracking-tight truncate">
                    Budget Tool <span className="text-indigo-700">• ספקים</span>
                  </h1>
                  <p className="text-xs md:text-sm text-slate-600 truncate">
                    מעבר מהיר בין ספקים + התנתקות
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="rounded-xl px-3 py-2 text-xs md:text-sm font-bold text-slate-900 border border-white/60 bg-white/70 glass hover:bg-white transition shadow-soft shrink-0"
              >
                התנתקות
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ LAYOUT */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          {/* SIDEBAR */}
          <aside className="md:sticky md:top-[96px] h-fit">
            <div className="rounded-[28px] bg-white/70 glass border border-white/60 shadow-soft p-4">
              <Link
                href="/dashboard"
                className={[
                  "block rounded-2xl px-4 py-3 font-black shadow-soft transition",
                  "border border-white/60 bg-white/70 glass hover:bg-white",
                  pathname === "/dashboard" ? "ring-4 ring-indigo-200" : "",
                ].join(" ")}
              >
                ← כל הספקים
              </Link>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-extrabold text-slate-800">רשימת ספקים</p>
                {loadingVendors && <span className="text-xs text-slate-500">טוען…</span>}
              </div>

              <div className="mt-2 max-h-[60vh] overflow-auto nice-scroll pr-1">
                {(!loadingVendors && vendors.length === 0) && (
                  <div className="text-sm text-slate-600 bg-white/60 border border-white/60 rounded-2xl p-3">
                    אין ספקים עדיין.
                  </div>
                )}

                <ul className="space-y-2">
                  {vendors.map((v) => {
                    const active = v.id === activeVendorId;
                    return (
                      <li key={v.id}>
                        <Link
                          href={`/vendor/${v.id}`}
                          className={[
                            "block rounded-2xl px-4 py-3 transition border",
                            "bg-white/60 border-white/60 hover:bg-white",
                            active ? "ring-4 ring-indigo-200 font-extrabold" : "font-bold",
                          ].join(" ")}
                          title={v.name}
                        >
                          <div className="truncate">{v.name}</div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
