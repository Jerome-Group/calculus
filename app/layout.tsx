import type { Metadata } from "next";
import "./globals.css";

const title = "Calculus · Explore the mathematics of change";
const description =
  "A visual calculus library for MH1100, MH1101 and MH2100. Interactive experiments, precise mathematics, and page-specific course references.";
const socialImage = "https://calculus.jeromegroup.org/calculus-social.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://calculus.jeromegroup.org"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://calculus.jeromegroup.org/",
    siteName: "Calculus",
    title,
    description,
    images: [
      {
        url: socialImage,
        width: 1732,
        height: 908,
        type: "image/jpeg",
        alt: "Calculus. From limits to fields. A vivid mathematical surface in cobalt and lime.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
  icons: {
    icon: "/calculus-logo.png",
    shortcut: "/calculus-logo.png",
    apple: "/calculus-logo.png",
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
