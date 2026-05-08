import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import ParticlesBackground from "@/components/background/ParticlesBackground";

export const metadata: Metadata = {
  title: "My Blog",
  description: "A personal blog powered by Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ParticlesBackground />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
