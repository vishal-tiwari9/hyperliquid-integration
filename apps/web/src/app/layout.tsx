import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createElement, type ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mochatrade",
  description: "Built on top of Hyperliquid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return createElement(
    "html",
    {
      lang: "en",
      className: `${geistSans.variable} ${geistMono.variable} h-full antialiased`,
    },
    createElement("body", { className: "min-h-full flex flex-col" }, children)
  );
}
