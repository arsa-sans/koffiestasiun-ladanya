// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "@/components/shared/Providers";

export const metadata: Metadata = {
  title: {
    default: "Koffie Station × Ladanya — POS System",
    template: "%s | Koffie Station × Ladanya",
  },
  description:
    "Enterprise-grade dual-brand restaurant POS system for Koffie Station and Ladanya Japanese Food",
  keywords: ["POS", "restaurant", "coffee shop", "Japanese food", "cashier"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Serif+JP:wght@300;400;500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e1e1e",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#EADBC8",
            },
          }}
        />
      </body>
    </html>
  );
}
