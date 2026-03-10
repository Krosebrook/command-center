import type { Metadata } from "next";
import { NavSidebar } from "@/components/NavSidebar";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Command Center | D:\\ Drive",
  description: "Visual Golden Thread for the D:\\ workspace",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎛️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="min-h-screen flex bg-background text-foreground antialiased">
        <ToastProvider>
          {/* Skip to content link for keyboard/screen reader users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen">
            <NavSidebar />
            <main
              id="main-content"
              className="flex-1 w-full bg-background overflow-hidden p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8"
              tabIndex={-1}
            >
              {children}
            </main>
          </div>
          <ChatSidebar />
        </ToastProvider>
      </body>
    </html>
  );
}
