import type { Metadata } from "next";
import "./globals.css"; // <--- MUST BE HERE

export const metadata: Metadata = {
  title: "Solon AI",
  description: "Constitutional Expert",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}