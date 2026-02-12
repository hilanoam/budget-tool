"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabaseClient";
import { Alert, Button, Card, CardTitle, Input } from "../../../src/lib/components/ui";

const YEAR = 2026;
type Vendor = { id: string; name: string };

export default function Dashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function requireSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.href = "/login";
      return null;
    }
    return data.session;
  }

  async function loadVendors() {
    setMsg(null);
    const session = await requireSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("vendors")
      .select("id,name")
      .order("created_at", { ascending: true });

    if (error) return setMsg({ kind: "error", text: error.message });
    setVendors((data ?? []) as Vendor[]);
  }

  useEffect(() => {
    loadVendors();
  }, []);

  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const session = await requireSession();
    if (!session) return;

    const vname = name.trim();
    if (!vname) return setMsg({ kind: "error", text: "תן שם ספק" });

    setLoading(true);
    try {
      const { data: v, error: ve } = await supabase
        .from("vendors")
        .insert({ owner_id: session.user.id, name: vname })
        .select("id")
        .single();

      if (ve) throw ve;

      const { error: be } = await supabase.from("vendor_budgets").insert({
        owner_id: session.user.id,
        vendor_id: v.id,
        year: YEAR,
        annual_budget: 0,
      });

      if (be) throw be;

      setName("");
      await loadVendors();
      setMsg({ kind: "success", text: `נוצר ספק חדש: ${vname}` });
    } catch (err: any) {
      setMsg({ kind: "error", text: err?.message ?? "שגיאה לא ידועה" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteVendor(vendorId: string, vname: string) {
    setMsg(null);
    const ok = confirm(`למחוק את הספק "${vname}" וכל הנתונים שלו?`);
    if (!ok) return;

    const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
    if (error) return setMsg({ kind: "error", text: error.message });

    await loadVendors();
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
            <Button disabled={loading} className="w-full">
              {loading ? "..." : "➕ צור ספק"}
            </Button>
          </div>
        </form>

        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <div key={v.id} className="rounded-[28px] bg-white/70 glass border border-white/60 shadow-lift p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-black truncate">{v.name}</h3>
                <p className="text-xs text-slate-600 mt-1">תקציב • חיובים • דוחות</p>
              </div>
              <div className="text-2xl">📌</div>
            </div>

            <div className="mt-4 flex gap-2">
              <a href={`/vendor/${v.id}`} className="flex-1">
                <Button className="w-full" variant="success">
                  פתח כרטיסייה
                </Button>
              </a>

              <Button type="button" onClick={() => deleteVendor(v.id, v.name)} variant="danger">
                מחק
              </Button>
            </div>
          </div>
        ))}

        {vendors.length === 0 && (
          <div className="rounded-[28px] bg-white/70 glass border border-white/60 shadow-soft p-6 text-slate-700">
            אין ספקים עדיין. צרי ספק ראשון למעלה 👆
          </div>
        )}
      </section>
    </div>
  );
}
