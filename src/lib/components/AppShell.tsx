"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useSessionUser } from "../SessionProvider";
import { Skeleton } from "./ui";

type Vendor = { id: string; name: string };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, ready } = useSessionUser();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const activeVendorId = useMemo(() => {
    const m = pathname?.match(/^\/vendor\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const onDashboard = pathname === "/dashboard";

  const itemBase = "block rounded-2xl px-4 py-3 transition border";
  const itemActive = "bg-white border-indigo-300 shadow-soft font-extrabold";
  const itemIdle = "bg-white/60 border-white/60 hover:bg-white font-bold";

  async function loadVendors() {
    setLoadingVendors(true);
    const { data: vs, error } = await supabase
      .from("vendors")
      .select("id,name")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setVendors([]);
    } else {
      setVendors((vs ?? []) as Vendor[]);
    }
    setLoadingVendors(false);
  }

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      router.replace("/login");
      return;
    }

    loadVendors();

    const onChanged = () => loadVendors();
    window.addEventListener("vendors:changed", onChanged);
    return () => window.removeEventListener("vendors:changed", onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen relative overflow-visible bg-gradient-to-br from-slate-50 via-indigo-50 to-rose-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-56 -right-56 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-fuchsia-300/25 to-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-emerald-300/25 to-cyan-300/25 blur-3xl" />
      </div>

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

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <aside className="md:sticky md:top-[96px] h-fit">
            <div className="rounded-[28px] bg-white/70 glass border border-white/60 shadow-soft p-4 overflow-visible">
              <Link href="/dashboard" className={[itemBase, onDashboard ? itemActive : itemIdle].join(" ")}>
                ← כל הספקים
              </Link>

              <div className="mt-4 text-sm font-extrabold text-slate-800">רשימת ספקים</div>

              <div className="mt-3 max-h-[60vh] overflow-auto nice-scroll pr-1 space-y-2">
                {loadingVendors && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </>
                )}

                {!loadingVendors && vendors.length === 0 && (
                  <div className="rounded-2xl bg-white/60 border border-white/60 p-4 text-sm text-slate-600">
                    אין ספקים עדיין
                  </div>
                )}

                {!loadingVendors &&
                  vendors.map((v) => {
                    const active = v.id === activeVendorId;
                    return (
                      <Link
                        key={v.id}
                        href={`/vendor/${v.id}`}
                        title={v.name}
                        className={[itemBase, active ? itemActive : itemIdle].join(" ")}
                      >
                        <div className="truncate">{v.name}</div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
