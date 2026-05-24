import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";

export const metadata: Metadata = {
  title: "StockFlow — Multi-Warehouse Inventory Platform",
  description:
    "Real-time inventory management and order fulfillment platform for multi-warehouse retail and D2C brands. Reserve stock, confirm purchases, and manage fulfillment with race-condition-safe reservations.",
  keywords: [
    "inventory management",
    "warehouse",
    "order fulfillment",
    "stock reservation",
    "D2C",
  ],
  openGraph: {
    title: "StockFlow — Multi-Warehouse Inventory Platform",
    description:
      "Real-time inventory management and order fulfillment for retail and D2C brands.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[hsl(222,24%,8%)] antialiased">
        {/* Ambient background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-indigo-600/8 blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-72 h-72 rounded-full bg-cyan-600/6 blur-3xl" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-[hsl(222,24%,8%)]/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-brand-500/40 transition-shadow duration-300">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight gradient-text">
                StockFlow
              </span>
            </a>

            <nav className="flex items-center gap-6 text-sm text-[hsl(220,12%,56%)]">
              <a
                href="/"
                className="hover:text-white transition-colors duration-200"
              >
                Products
              </a>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Live
              </span>
              <AccountMenu
                user={
                  session?.user
                    ? {
                        id: session.user.id,
                        name: session.user.name,
                        email: session.user.email,
                      }
                    : null
                }
              />
            </nav>
          </div>
        </header>

        <main className="relative z-10">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-24 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[hsl(220,12%,40%)]">
            <p>StockFlow — Race-condition-safe inventory management</p>
          </div>
        </footer>

        <Toaster />
      </body>
    </html>
  );
}
