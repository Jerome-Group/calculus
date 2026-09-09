import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MH2100 · Calculus Atlas",
  description:
    "Explore multivariable calculus through interactive 3D geometry, rigorous definitions, and mathematical experiments.",
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
