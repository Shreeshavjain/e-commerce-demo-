import { ThemeProvider } from "@/components/providers/theme-provider";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider forcedTheme="dark">
      {children}
    </ThemeProvider>
  );
}