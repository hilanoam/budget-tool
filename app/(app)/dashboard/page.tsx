"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabaseClient";
import { useSessionUser } from "../../../src/lib/SessionProvider";
import { Alert, Button, Card, CardTitle, Input, Skeleton } from "../../../src/lib/components/ui";

const YEAR = 2026;
type Vendor = { id: string; name: string };

export default function Dashboard() {
  const { userId, ready } = useSessionUser();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    let alive = true;

    (async () => {
      setLoadingList(true);
      const { data, error } = await supabase
        .from("vendors")
        .select("id,name")
        .order("created_at", { ascending: true });

      if (!alive) return;

      if (error) setMsg({ kind: "error", text: error.message });
      setVendors((data ?? []) as Vendor[]);
      setLoadingList(false);
    })();

    return () => {
      alive = false;
    };
  }, [ready, userId]);

  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!userId) return;

    const vname = name.trim();
    if (!vname) return setMsg({ kind: "error", text: "תן שם ספק" });

    setLoadingAdd(true);
    try {
      const { data: v, error: ve } = await supabase
        .from("vendors")
        .insert({ owner_id: userId, name: vname })
        .select("id,name")
        .single();

      if (ve) throw ve;

      const { error: be } = await supabase.from("vendor_budgets").insert({
        owner_id: userId,
        vendor_id: v.id,
        year: YEAR,
        annual_budget: 0,
        budget_type: "residential",
      });

      if (be) throw be;

      // ✅ optimistic update (בלי reload)
      setVendors((prev) => [...prev, { id: v.id, name: v.name }]);
      setName("");
      window.dispatchEvent(new Event("vendors:changed"));
      setMsg({ kind: "success", text: `נוצר ספק חדש: ${vname}` });
    } catch (err: any) {
      setMsg({ kind: "error", text: err?.message ?? "שגיאה לא ידועה" });
    } finally {
      setLoadingAdd(false);
    }
  }

  async function deleteVendor(vendorId: string, vname: string) {
    setMsg(null);
    const ok = confirm(`למחוק את הספק "${vname}" וכל הנתונים שלו?`);
    if (!ok) return;

    // ✅ optimistic remove
    setVendors((prev) => prev.filter((x) => x.id !== vendorId));

    const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
    if (error) {
      // rollback פשוט: נטען מחדש אם נכשל
      setMsg({ kind: "error", text: error.message });
      const { data } = await supabase.from("vendors").select("id,name").order("created_at", { ascending: true });
      setVendors((data ?? []) as Vendor[]);
      return;
    }

    window.dispatchEvent(new Event("vendors:changed"));
    setMsg({ kind: "info", text: `נמחק: ${vname}` });
  }

  return (
    <div className="fade-in">
      <Card>
        <CardTitle
          title="ספקים"
          subtitle="צור ספק חדש או פתח כרטיסייה קיימת."
          right={<div className="hidden md:block text-2xl">✨</div>}
        />

        <form onSubmit={addVendor} className="mt-6 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-9">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם ספק חדש" />
          </div>
          <div className="md:col-span-3">
            <Button disabled={loadingAdd} className="w-full">
              {loadingAdd ? "..." : "➕ צור ספק"}
            </Button>
          </div>
        </form>

        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingList &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-[28px]" />
          ))}

        {!loadingList &&
          vendors.map((v) => (
            <div key={v.id} className="rounded-[28px] bg-white/70 glass border border-white/60 shadow-lift p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black truncate">{v.name}</h3>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <a href={`/vendor/${v.id}`} className="flex-1">
                  <Button className="w-full" variant="primary">
                    פתח
                  </Button>
                </a>

                <Button type="button" onClick={() => deleteVendor(v.id, v.name)} variant="danger">
                 gfa מחק
                </Button>
              </div>
            </div>
          ))}

        {!loadingList && vendors.length === 0 && (
          <div className="rounded-[28px] bg-white/70 glass border border-white/60 shadow-soft p-6 text-slate-700">
            אין ספקים עדיין. צרי ספק ראשון למעלה 👆
          </div>
        )}
      </section>
    </div>
  );
}
