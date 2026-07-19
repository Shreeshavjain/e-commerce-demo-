import { StorefrontNavbar } from "@/components/storefront/storefront-navbar";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider forcedTheme="light">
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <StorefrontNavbar />
        <div className="flex-1 w-full bg-white">
          {children}
        </div>
        <StorefrontFooter />
      </div>
    </ThemeProvider>
  );
}