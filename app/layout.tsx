import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Word in Heart / 藏在心裡";
  const description = "Private, offline-first Bible verse memorization and recitation.";
  return {
    metadataBase: new URL(origin), title, description, applicationName: "Word in Heart",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: "藏在心裡" },
    icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  };
}

export const viewport: Viewport = { themeColor: "#10253f", colorScheme: "light dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
