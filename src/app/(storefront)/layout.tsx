import { StorefrontNavbar } from "@/components/storefront/storefront-navbar";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StorefrontNavbar />
      {children}
    </div>
  );
}