import { Heebo } from "next/font/google";

const heebo = Heebo({
  subsets: ["hebrew"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-heebo",
});

export const metadata = {
  title: "Budget Tool",
  description: "Budget Tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
