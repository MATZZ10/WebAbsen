import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Absensi Sekolah",
  description: "Dashboard absensi siswa dan guru",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
