import type { Metadata } from "next";
import { NavSidebar } from "@/components/NavSidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Center | D:\\ Drive",
  description: "Visual Golden Thread for the D:\\ workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <NavSidebar />
        <main className="flex-1 ml-64 p-8 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
