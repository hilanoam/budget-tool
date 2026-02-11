"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabaseClient";
import AppHeader from "../../../src/lib/components/AppHeader";
import { Alert, Button, Card, CardTitle, Input } from "../../../src/lib/components/ui";

const YEAR = 2026;

type Charge = {
  id: string;
  charge_date: string;
  description: string;
  amount: number;
  category: string | null;
  notes: string | null;
};

function StatPill({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-2xl bg-white/70 glass border border-white/60 shadow-soft px-4 py-3">
      <div className="text-xs text-slate-600 flex items-center gap-2">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

export default function VendorPage() {
  const params = useParams();
  const vendorId = params?.vendorId as string;
    const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState("");
  const [budget, setBudget] = useState<number>(0);
  const [budgetEdit, setBudgetEdit] = useState<string>("0");

  const [charges, setCharges] = useState<Charge[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [savingBudget, setSavingBudget] = useState(false);
  const [adding, setAdding] = useState(false);

  const totalSpent = useMemo(() => charges.reduce((s, c) => s + Number(c.amount || 0), 0), [charges]);
  const remaining = budget - totalSpent;

  async function getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.href = "/login";
      return null;
    }
    return data.session;
  }

 async function loadAll() {
  setMsg(null);
  setLoading(true);

  const { data: s } = await supabase.auth.getSession();
  if (!s.session) {
    window.location.href = "/login";
    return;
  }

  try {
    const [vRes, bRes, chRes] = await Promise.all([
      supabase.from("vendors").select("name").eq("id", vendorId).single(),
      supabase
        .from("vendor_budgets")
        .select("annual_budget")
        .eq("vendor_id", vendorId)
        .eq("year", YEAR)
        .maybeSingle(),
      supabase
        .from("charges")
        .select("id,charge_date,description,amount,category,notes")
        .eq("vendor_id", vendorId)
        .eq("year", YEAR)
        .order("charge_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (vRes.error) throw vRes.error;
    if (bRes.error) throw bRes.error;
    if (chRes.error) throw chRes.error;

    const bval = Number(bRes.data?.annual_budget ?? 0);

    // ✅ עדכון state מרוכז (מינימום רינדורים)
    setVendorName(vRes.data?.name ?? "");
    setBudget(bval);
    setBudgetEdit(String(bval));
    setCharges((chRes.data ?? []) as Charge[]);
  } catch (e: any) {
    setMsg({ kind: "error", text: e?.message ?? "שגיאה לא ידועה" });
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    if (!vendorId) return;
    loadAll();
  }, [vendorId]);

  async function saveBudget() {
    setMsg(null);
    const session = await getSession();
    if (!session) return;

    const val = Number(budgetEdit);
    if (!Number.isFinite(val) || val < 0) return setMsg({ kind: "error", text: "תקציב חייב להיות מספר 0 ומעלה" });

    setSavingBudget(true);
    try {
      const { error } = await supabase
        .from("vendor_budgets")
        .upsert(
          { owner_id: session.user.id, vendor_id: vendorId, year: YEAR, annual_budget: val },
          { onConflict: "vendor_id,year" }
        );

      if (error) throw error;
      setBudget(val);
      setMsg({ kind: "success", text: "התקציב נשמר ✅" });
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "שגיאה לא ידועה" });
    } finally {
      setSavingBudget(false);
    }
  }

  async function addCharge(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const session = await getSession();
    if (!session) return;

    const d = desc.trim();
    const a = Number(amount);
    if (!d || !Number.isFinite(a) || a <= 0) return setMsg({ kind: "error", text: "מלאי תיאור וסכום תקין" });

    setAdding(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const { error } = await supabase.from("charges").insert({
        owner_id: session.user.id,
        vendor_id: vendorId,
        year: YEAR,
        charge_date: today,
        description: d,
        amount: a,
        category: category.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      setDesc("");
      setAmount("");
      setCategory("");
      setNotes("");
      await loadAll();
      setMsg({ kind: "success", text: "חיוב נוסף ✅" });
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "שגיאה לא ידועה" });
    } finally {
      setAdding(false);
    }
  }

  async function deleteCharge(id: string) {
    setMsg(null);
    const ok = confirm("למחוק את החיוב?");
    if (!ok) return;

    const { error } = await supabase.from("charges").delete().eq("id", id);
    if (error) return setMsg({ kind: "error", text: error.message });

    await loadAll();
    setMsg({ kind: "info", text: "נמחק." });
  }

  return (
    <AppHeader
      title="תקציב "
      highlight={vendorName || "…"}
      subtitle={`כרטיסיית ספק • שנה ${YEAR}`}
    >
    <div className="flex flex-wrap gap-2 mb-6">
        <a href="/dashboard">
        <Button variant="ghost">⬅ חזרה לספקים</Button>
        </a>

        <a href="/">
        <Button variant="ghost">🏠 דף הבית</Button>
        </a>
    </div>
      {/* סטטיסטיקות */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill label="תקציב" value={budget.toLocaleString()} emoji="🎯" />
        <StatPill label="נוצל" value={totalSpent.toLocaleString()} emoji="🧾" />
        <StatPill label="יתרה" value={remaining.toLocaleString()} emoji="💎" />
      </div>

      {msg && <Alert kind={msg.kind} >{msg.text}</Alert>}

      {/* תקציב */}
      <Card className="mt-6">
        <CardTitle
          title="תקציב שנתי"
          subtitle="עדכן את התקציב לשנה הנוכחית."
          right={<div className="text-2xl">🧠</div>}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-4">
            <label className="text-xs font-bold text-slate-600">תקציב</label>
            <div className="mt-2">
              <Input
                type="number"
                value={budgetEdit}
                onChange={(e) => setBudgetEdit(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <Button disabled={savingBudget} onClick={saveBudget} className="w-full">
              {savingBudget ? "..." : "שמירה"}
            </Button>
          </div>

        </div>
      </Card>

      {/* הוספת חיוב */}
      <Card className="mt-6">
        <CardTitle title="הוספת חיוב" subtitle="הוסף הוצאה לספק בצורה מהירה." right={<div className="text-2xl">➕</div>} />

        <form onSubmit={addCharge} className="mt-5 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="תיאור" />
          </div>
          <div className="md:col-span-2">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="סכום" type="number" min={0} />
          </div>
          <div className="md:col-span-2">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="קטגוריה" />
          </div>
          <div className="md:col-span-3">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות" />
          </div>

          <div className="md:col-span-12">
            <Button disabled={adding} className="w-full" variant="success">
              {adding ? "..." : "הוסף חיוב"}
            </Button>
          </div>
        </form>
      </Card>

      {/* טבלה */}
      <Card className="mt-6">
        <CardTitle title="חיובים" subtitle={`רשימת חיובים לשנת ${YEAR}.`} right={<div className="text-2xl">📋</div>} />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="py-3 text-right font-extrabold">תאריך</th>
                <th className="py-3 text-right font-extrabold">תיאור</th>
                <th className="py-3 text-right font-extrabold">סכום</th>
                <th className="py-3 text-right font-extrabold">קטגוריה</th>
                <th className="py-3 text-right font-extrabold">הערות</th>
                <th className="py-3 text-right font-extrabold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => (
                <tr key={c.id} className="border-t border-white/60">
                  <td className="py-3 whitespace-nowrap">{c.charge_date}</td>
                  <td className="py-3 font-bold">{c.description}</td>
                  <td className="py-3 whitespace-nowrap">{Number(c.amount).toLocaleString()}</td>
                  <td className="py-3">{c.category ?? "—"}</td>
                  <td className="py-3">{c.notes ?? ""}</td>
                  <td className="py-3">
                    <Button type="button" variant="danger" onClick={() => deleteCharge(c.id)}>
                      מחיקה
                    </Button>
                  </td>
                </tr>
              ))}

              {charges.length === 0 && (
                <tr className="border-t border-white/60">
                  <td colSpan={6} className="py-4 text-slate-700">
                    אין חיובים לשנת {YEAR}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppHeader>
  );
}
