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
        "rounded-[28px] bg-white/70 glass border border-white/60 shadow-soft p-6 fade-in",
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
        <h2 className="text-lg font-extrabold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "success" | "danger" | "ghost";
}) {
  const base =
    "rounded-xl px-4 py-3 text-sm font-black transition shadow-soft disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "text-white bg-indigo-600 hover:bg-indigo-700",
    success: "text-white bg-emerald-600 hover:bg-emerald-700",
    danger: "text-rose-700 bg-rose-100 hover:bg-rose-200 shadow-none",
    ghost: "text-slate-900 border border-white/60 bg-white/70 glass hover:bg-white",
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
        "w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3",
        "focus:outline-none focus:ring-4 focus:ring-indigo-200",
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
    error: "text-rose-700 bg-rose-50 border-rose-200",
    info: "text-slate-700 bg-slate-50 border-slate-200",
    success: "text-emerald-800 bg-emerald-50 border-emerald-200",
  };
  return (
    <div className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${map[kind]}`}>
      {children}
    </div>
  );
}
