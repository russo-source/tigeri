import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tigeri Expense Tracker",
  description: "TigerScale-branded expense tracker for Tigeri AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body className="font-sans bg-ink-100 text-ink-800">{children}</body>
    </html>
  );
}
