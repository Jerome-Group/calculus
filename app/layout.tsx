import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculus · Explore the mathematics of change",
  description:
    "A visual calculus library for MH1100, MH1101 and MH2100. Interactive experiments, precise mathematics, and page-specific course references.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
