import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ecommerce",
    template: "%s | Ecommerce",
  },
  description:
    "A scalable Next.js ecommerce foundation for storefront and admin experiences.",
  applicationName: "Ecommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen">
              {children}
              <Toaster position="top-right" richColors closeButton />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
