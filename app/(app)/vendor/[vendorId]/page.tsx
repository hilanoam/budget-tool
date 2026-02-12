"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../src/lib/supabaseClient";
import { Alert, Button, Card, CardTitle, Input } from "../../../../src/lib/components/ui";

const YEAR = 2026;

const BUDGET_TYPES = [
  { key: "residential", label: "דירות" },
  { key: "commercial", label: "מסחר" },
  { key: "public", label: "ציבורי" },
] as const;

type BudgetType = (typeof BUDGET_TYPES)[number]["key"];

type Charge = {
  id: string;
  charge_date: string; // yyyy-mm-dd
  amount: number;
  invoice_number: string | null;
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

  const [budgetType, setBudgetType] = useState<BudgetType>("residential");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);

  // Vendor info
  const [vendorName, setVendorName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [savingVendorInfo, setSavingVendorInfo] = useState(false);

  // Budget for selected type
  const [budget, setBudget] = useState<number>(0);
  const [budgetEdit, setBudgetEdit] = useState<string>("0");
  const [savingBudget, setSavingBudget] = useState(false);

  // Charges for selected type
  const [charges, setCharges] = useState<Charge[]>([]);
  const [adding, setAdding] = useState(false);

  // Add charge form (only required fields)
  const [chargeDate, setChargeDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const totalSpent = useMemo(() => charges.reduce((s, c) => s + Number(c.amount || 0), 0), [charges]);
  const remaining = budget - totalSpent;

  async function requireSession() {
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

    const session = await requireSession();
    if (!session) return;

    try {
      const [vRes, bRes, chRes] = await Promise.all([
        supabase
          .from("vendors")
          .select("name,contact_name,contact_email")
          .eq("id", vendorId)
          .single(),

        supabase
          .from("vendor_budgets")
          .select("annual_budget")
          .eq("vendor_id", vendorId)
          .eq("year", YEAR)
          .eq("budget_type", budgetType)
          .maybeSingle(),

        supabase
          .from("charges")
          .select("id,charge_date,amount,invoice_number,notes")
          .eq("vendor_id", vendorId)
          .eq("year", YEAR)
          .eq("budget_type", budgetType)
          .order("charge_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (vRes.error) throw vRes.error;
      if (bRes.error) throw bRes.error;
      if (chRes.error) throw chRes.error;

      setVendorName(vRes.data?.name ?? "");
      setContactName(vRes.data?.contact_name ?? "");
      setContactEmail(vRes.data?.contact_email ?? "");

      const bval = Number(bRes.data?.annual_budget ?? 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, budgetType]);

  async function saveVendorInfo() {
    setMsg(null);
    const session = await requireSession();
    if (!session) return;

    setSavingVendorInfo(true);
    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          contact_name: contactName.trim() || null,
          contact_email: contactEmail.trim() || null,
        })
        .eq("id", vendorId)
        .eq("owner_id", session.user.id);

      if (error) throw error;

      setMsg({ kind: "success", text: "פרטי קשר נשמרו ✅" });
      // אין חובה אבל נחמד לרענן
      await loadAll();
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "שגיאה לא ידועה" });
    } finally {
      setSavingVendorInfo(false);
    }
  }

  async function saveBudget() {
    setMsg(null);
    const session = await requireSession();
    if (!session) return;

    const val = Number(budgetEdit);
    if (!Number.isFinite(val) || val < 0) {
      return setMsg({ kind: "error", text: "תקציב חייב להיות מספר 0 ומעלה" });
    }

    setSavingBudget(true);
    try {
      const { error } = await supabase
        .from("vendor_budgets")
        .upsert(
          {
            owner_id: session.user.id,
            vendor_id: vendorId,
            year: YEAR,
            budget_type: budgetType,
            annual_budget: val,
          },
          { onConflict: "vendor_id,year,budget_type" }
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
    const session = await requireSession();
    if (!session) return;

    const a = Number(amount);
    const d = (chargeDate || "").trim();

    if (!d) return setMsg({ kind: "error", text: "בחרי תאריך" });
    if (!Number.isFinite(a) || a <= 0) return setMsg({ kind: "error", text: "סכום חייב להיות גדול מ-0" });

    setAdding(true);
    try {
      const { error } = await supabase.from("charges").insert({
        owner_id: session.user.id,
        vendor_id: vendorId,
        year: YEAR,
        budget_type: budgetType,
        charge_date: d,
        amount: a,
        invoice_number: invoiceNumber.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      setAmount("");
      setInvoiceNumber("");
      setNotes("");

      await loadAll();
      setMsg({ kind: "success", text: "הוצאה נוספה ✅" });
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "שגיאה לא ידועה" });
    } finally {
      setAdding(false);
    }
  }

  async function deleteCharge(id: string) {
    setMsg(null);
    const ok = confirm("למחוק את ההוצאה?");
    if (!ok) return;

    const { error } = await supabase.from("charges").delete().eq("id", id);
    if (error) return setMsg({ kind: "error", text: error.message });

    await loadAll();
    setMsg({ kind: "info", text: "נמחק." });
  }

  return (
    <div className="fade-in">
      {/* כותרת */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-black">
          {vendorName || "ספק"} • <span className="text-indigo-700">שנת {YEAR}</span>
        </h2>
        <p className="text-sm text-slate-600">ניהול 3 תקציבים: דירות / מסחר / ציבורי</p>
      </div>

      {/* טאבים לסוג תקציב */}
      <div className="flex flex-wrap gap-2 mb-4">
        {BUDGET_TYPES.map((t) => {
          const active = t.key === budgetType;
          return (
            <button
              key={t.key}
              onClick={() => setBudgetType(t.key)}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-extrabold border transition",
                active ? "bg-white border-indigo-300 shadow-soft" : "bg-white/60 border-white/60 hover:bg-white",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* סטטיסטיקות */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill label="תקציב" value={budget.toLocaleString()} emoji="🎯" />
        <StatPill label="נוצל" value={totalSpent.toLocaleString()} emoji="🧾" />
        <StatPill label="יתרה" value={remaining.toLocaleString()} emoji="💎" />
      </div>

      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      {/* פרטי קשר */}
      <Card className="mt-6">
        <CardTitle title="פרטי קשר לספק" right={<div className="text-2xl">📇</div>} />

        <div className="mt-5 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="text-xs font-bold text-slate-600">איש קשר</label>
            <div className="mt-2">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)}/>
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="text-xs font-bold text-slate-600">טלפון</label>
            <div className="mt-2">
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}  />
            </div>
          </div>

          <div className="md:col-span-2 md:self-end">
            <Button disabled={savingVendorInfo} onClick={saveVendorInfo} className="w-full" variant="primary">
              {savingVendorInfo ? "..." : "שמירה"}
            </Button>
          </div>
        </div>
      </Card>

      {/* תקציב שנתי לפי סוג */}
      <Card className="mt-6">
        <CardTitle
          title={`תקציב שנתי • ${BUDGET_TYPES.find((x) => x.key === budgetType)?.label ?? ""}`}
          subtitle="ערוך תקציב"
          right={<div className="text-2xl">🧠</div>}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-4">
            <label className="text-xs font-bold text-slate-600">תקציב</label>
            <div className="mt-2">
              <Input type="number" value={budgetEdit} onChange={(e) => setBudgetEdit(e.target.value)} min={0} />
            </div>
          </div>

          <div className="sm:col-span-3">
            <Button disabled={savingBudget} onClick={saveBudget} className="w-full" variant="primary">
              {savingBudget ? "..." : "שמירה"}
            </Button>
          </div>
        </div>
      </Card>

      {/* הוספת הוצאה */}
      <Card className="mt-6">
        <CardTitle
          title={`הוספת הוצאה • ${BUDGET_TYPES.find((x) => x.key === budgetType)?.label ?? ""}`}
          right={<div className="text-2xl">➕</div>}
        />

        <form onSubmit={addCharge} className="mt-5 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <Input type="date" value={chargeDate} onChange={(e) => setChargeDate(e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="סכום" type="number" min={0} />
          </div>

          <div className="md:col-span-3">
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="מספר חשבונית" />
          </div>

          <div className="md:col-span-3">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות" />
          </div>

          <div className="md:col-span-12">
            <Button disabled={adding} className="w-full" variant="primary">
              {adding ? "..." : "הוסף הוצאה"}
            </Button>
          </div>
        </form>
      </Card>

      {/* טבלה */}
      <Card className="mt-6">
        <CardTitle
          title={`הוצאות • ${BUDGET_TYPES.find((x) => x.key === budgetType)?.label ?? ""}`}
          right={<div className="text-2xl">📋</div>}
        />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="py-3 text-right font-extrabold">תאריך</th>
                <th className="py-3 text-right font-extrabold">סכום</th>
                <th className="py-3 text-right font-extrabold">מס׳ חשבונית</th>
                <th className="py-3 text-right font-extrabold">הערות</th>
                <th className="py-3 text-right font-extrabold">פעולות</th>
              </tr>
            </thead>

            <tbody>
              {charges.map((c) => (
                <tr key={c.id} className="border-t border-white/60">
                  <td className="py-3 whitespace-nowrap">{c.charge_date}</td>
                  <td className="py-3 whitespace-nowrap">{Number(c.amount).toLocaleString()}</td>
                  <td className="py-3">{c.invoice_number ?? "—"}</td>
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
                  <td colSpan={5} className="py-4 text-slate-700">
                    אין הוצאות לסוג התקציב הזה.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {loading && <div className="mt-4 text-sm text-slate-600">טוען נתונים…</div>}
    </div>
  );
}
