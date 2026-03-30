import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greater Amman Municipality - Building Permits",
  description: "Building permits portal for Greater Amman Municipality",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
