"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Package, Search, Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthUser } from "@/hooks/use-auth";

export function StorefrontNavbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const totalItems = useCartStore((state) => state.getTotalItems());
  const user = useAuthUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Search toggle focus
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  const [hash, setHash] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Sync hash on mount and when pathname changes (if Next.js updates it)
      setHash(window.location.hash);
      
      const handleHashChange = () => {
        setHash(window.location.hash);
      };
      
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, [pathname]);

  const cartLabel = isMounted && totalItems > 0 ? `Cart, ${totalItems} item${totalItems === 1 ? "" : "s"}` : "Cart";

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/#categories" },
    { name: "New Arrivals", href: "/#new-arrivals" },
  ];

  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return pathname === "/" && hash === href.replace("/", "");
    }
    if (href === "/") {
      return pathname === "/" && hash === "";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-6 z-50 pointer-events-none transition-all duration-500">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center h-12 w-12 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm hover:bg-white/90 transition-all text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link 
              href="/" 
              onClick={() => setHash("")}
              className="flex items-center justify-center h-12 px-6 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm hover:bg-white/90 transition-all"
            >
              <span className="text-xl font-black tracking-tight text-slate-900">
                SVJ Store
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center p-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => {
                      if (link.href.startsWith("/#")) {
                        setHash(link.href.replace("/", ""));
                      } else if (link.href === "/") {
                        setHash("");
                      }
                    }}
                    className={cn(
                      "relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-500 ease-out",
                      active 
                        ? "text-white shadow-md shadow-blue-500/20" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-0 bg-blue-600 rounded-full -z-10 animate-in fade-in zoom-in-95 duration-300" />
                    )}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right: Actions (Search, Account, Cart) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            
            {/* Desktop Search Toggle Capsule */}
            <div className={cn(
              "hidden md:flex items-center transition-all duration-500 ease-out overflow-hidden rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm",
              isSearchOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-transparent shadow-none"
            )}>
              <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center h-12">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none py-2.5 pl-5 pr-10 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"
                  onBlur={() => {
                    if (!searchQuery) setIsSearchOpen(false);
                  }}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle Search"
              className={cn(
                "hidden md:flex relative h-12 w-12 items-center justify-center rounded-full transition-all duration-300 backdrop-blur-xl border border-white/40 shadow-sm",
                isSearchOpen ? "bg-white text-slate-900" : "bg-white/70 text-slate-700 hover:bg-white/90 hover:text-blue-600"
              )}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            {/* Mobile Search Button */}
            <Link
              href="/products"
              className="md:hidden flex h-12 w-12 items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-slate-700 hover:bg-white/90 transition-all"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* User Account / Login Circle */}
            {isMounted && user ? (
              <Link
                href="/my-orders"
                aria-label="My Account"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-slate-700 hover:bg-white/90 hover:text-blue-600 transition-all"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                aria-label="Sign In"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-slate-700 hover:bg-white/90 hover:text-blue-600 transition-all"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Cart Circle */}
            <Link
              href="/cart"
              aria-label={cartLabel}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-slate-900 hover:bg-white/90 hover:text-blue-600 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {isMounted && totalItems > 0 && (
                <span className="absolute top-2 right-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold leading-none text-white border-2 border-white transform translate-x-1/4 -translate-y-1/4 shadow-sm shadow-blue-500/20">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white/80 backdrop-blur-2xl shadow-2xl p-6 flex flex-col transform transition-transform animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <Link 
                href="/" 
                className="text-2xl font-black tracking-tight text-slate-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SVJ Store
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-8">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                <Search className="h-5 w-5" />
              </button>
            </form>

            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-white/50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link href="/#categories" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-white/50" onClick={() => setIsMobileMenuOpen(false)}>Categories</Link>
              <Link href="/#new-arrivals" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-white/50" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link>
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-200/50 flex flex-col gap-4">
              {isMounted && user ? (
                <Link
                  href="/my-orders"
                  className="flex items-center justify-center gap-3 w-full rounded-2xl bg-white border border-slate-200 py-3.5 text-sm font-bold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package className="h-5 w-5 text-slate-400" />
                  My Orders
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full rounded-2xl bg-blue-600 text-white py-3.5 text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}