import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import ParticlesBackground from "@/components/background/ParticlesBackground";
import NavigationProgress from "@/components/layout/NavigationProgress";

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
        <NavigationProgress />
        <ParticlesBackground />
        <AppShell>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
