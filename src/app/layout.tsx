import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyBook — Flight Management",
  description:
    "Book flights worldwide, pick your seats in real-time, and manage your itineraries with SkyBook — your premium flight management companion.",
  keywords: [
    "flight booking",
    "airline tickets",
    "seat selection",
    "flight management",
    "SkyBook",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#020617] text-slate-200 antialiased">
        <Navbar />
        <main className="pt-16">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              color: "#e2e8f0",
              backdropFilter: "blur(20px)",
            },
          }}
        />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
