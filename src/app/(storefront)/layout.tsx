import { StorefrontNavbar } from "@/components/storefront/storefront-navbar";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StorefrontNavbar />
      <div className="flex-1">
        {children}
      </div>
      <StorefrontFooter />
    </div>
  );
}