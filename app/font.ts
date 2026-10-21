import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});