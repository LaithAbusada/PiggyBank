import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk, Inter, Instrument_Serif } from "next/font/google";
import { CurrencyProvider } from "@/lib/currency";
import { AccentProvider } from "@/lib/accent";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "PiggyBank — Finance, made friendly",
  description: "The friendly way to save, spend, and actually understand your money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" data-accent="lavender">
        <body
          className={`${spaceGrotesk.variable} ${inter.variable} ${instrumentSerif.variable} antialiased`}
        >
          <AccentProvider>
            <CurrencyProvider>{children}</CurrencyProvider>
          </AccentProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
