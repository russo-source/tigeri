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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
