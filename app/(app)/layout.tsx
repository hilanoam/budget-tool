import "./globals.css";
import { SessionProvider } from "../../src/lib/SessionProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
