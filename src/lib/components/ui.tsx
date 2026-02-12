import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[26px] bg-white/60 border border-white/50 backdrop-blur-2xl",
        "p-6 shadow-[0_22px_50px_rgba(31,41,55,.12)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-slate-900 text-base sm:text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Button({
  children,
  variant = "glass",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "glass" | "primary" | "danger" | "soft";
}) {
  const base =
    "px-4 py-2 rounded-2xl border transition text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    glass: "border-white/50 bg-white/70 hover:bg-white/90",
    primary:
      "border-white/20 bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_10px_30px_rgba(99,102,241,.35)]",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-none",
    soft: "border-white/40 bg-white/30 hover:bg-white/60",
  };

  return (
    <button className={[base, variants[variant], className].join(" ")} {...props}>
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "w-full rounded-2xl bg-white/60 border border-white/45 backdrop-blur-xl px-4 py-2.5 text-sm",
        "shadow-[0_12px_28px_rgba(31,41,55,.08)]",
        "focus:outline-none focus:ring-2 focus:ring-indigo-300",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "info" | "success";
  children: React.ReactNode;
}) {
  const map = {
    error: "text-rose-700 bg-rose-50/80 border-rose-200",
    info: "text-slate-700 bg-white/55 border-white/50",
    success: "text-emerald-800 bg-emerald-50/80 border-emerald-200",
  };

  return (
    <div
      className={[
        "mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur-xl",
        "shadow-[0_12px_28px_rgba(31,41,55,.08)]",
        map[kind],
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-2xl bg-white/50 border border-white/60",
        className,
      ].join(" ")}
    />
  );
}
