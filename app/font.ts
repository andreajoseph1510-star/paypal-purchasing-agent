import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

export const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});