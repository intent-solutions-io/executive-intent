import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Executive Intent",
  description:
    "Your inbox + calendar, organized for decisions. DLP-enforced. Source-linked. Executive-ready.",
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
