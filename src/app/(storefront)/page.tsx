import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, Clock, CreditCard, ShoppingBag, Smartphone, Watch, Headphones, Laptop } from "lucide-react";
import { listProducts } from "@/services/products";
import { listCategories } from "@/services/categories";
import { ProductCard } from "@/components/storefront/product-card";

export default async function Home() {
  const [featuredData, newArrivalsData, categories] = await Promise.all([
    listProducts({ isFeatured: true, limit: 4 }),
    listProducts({ sortBy: "createdAt", sortOrder: "desc", limit: 8 }),
    listCategories(),
  ]);

  const activeCategories = categories.filter((c) => c.isActive).slice(0, 6);
  const featuredProducts = featuredData.products;
  const newArrivals = newArrivalsData.products;

  return (
    <main className="flex min-h-screen flex-col w-full bg-slate-50">
      {/* Liquid Glass Hero Section */}
      <section className="relative w-full pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle background blurs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
        </div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="max-w-xl text-center md:text-left flex flex-col items-center md:items-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-bold tracking-wide uppercase text-slate-700">Summer Collection 2026</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
              Designed for <br /> modern life.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
              Experience the perfect fusion of premium materials, minimalist design, and everyday functionality.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/products"
                className="w-full sm:w-auto rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                Shop Collection
              </Link>
              <Link
                href="#new-arrivals"
                className="w-full sm:w-auto rounded-full bg-white/70 backdrop-blur-md border border-white/60 px-8 py-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-white hover:shadow-md transition-all text-center flex items-center justify-center"
              >
                View Lookbook
              </Link>
            </div>
          </div>
          
          {/* Floating Product Composition Placeholder */}
          <div className="relative w-full max-w-lg aspect-square hidden md:block">
            {/* Center Main Product */}
            <div className="absolute inset-0 m-auto w-64 h-80 bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl flex flex-col items-center justify-center z-30 transition-transform duration-700 hover:scale-105 hover:-rotate-2">
              <Smartphone className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400">Premium Smartphone</p>
            </div>
            {/* Floating Top Right */}
            <div className="absolute top-10 right-10 w-40 h-40 bg-white/60 backdrop-blur-lg border border-white shadow-xl rounded-full flex flex-col items-center justify-center z-20 animate-[bounce_8s_infinite] transition-transform hover:scale-110">
              <Watch className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">Smartwatch</p>
            </div>
            {/* Floating Bottom Left */}
            <div className="absolute bottom-10 left-0 w-48 h-32 bg-white/70 backdrop-blur-lg border border-white shadow-xl rounded-2xl flex flex-col items-center justify-center z-40 animate-[bounce_10s_infinite_reverse] transition-transform hover:scale-110">
              <Headphones className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">Headphones</p>
            </div>
            {/* Floating Background */}
            <div className="absolute -top-10 left-10 w-56 h-40 bg-slate-100/50 backdrop-blur-md border border-white/50 shadow-lg rounded-2xl flex flex-col items-center justify-center z-10">
              <Laptop className="h-10 w-10 text-slate-300 mb-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories (Soft Glass) */}
      <section id="categories" className="w-full py-16 md:py-24 bg-slate-50 relative z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">Explore Categories</h2>
            <p className="text-lg text-slate-500 font-medium mt-4">Discover the perfect piece for your collection.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {activeCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-white/60 backdrop-blur-md border border-white shadow-sm p-8 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-blue-100 transition-all duration-500 hover:-translate-y-2 h-48"
              >
                <div className="h-16 w-16 rounded-full bg-slate-50 shadow-inner flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.15)] group-hover:bg-blue-50">
                   <div className="h-6 w-6 bg-slate-300 group-hover:bg-blue-400 transition-colors rounded-sm" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors text-center">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="w-full py-16 md:py-32 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Trending Now.</h2>
                <p className="mt-4 text-lg text-slate-500 font-medium leading-relaxed">The most coveted items in our store this week.</p>
              </div>
              <Link href="/products" className="hidden sm:flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors px-6 py-3 rounded-full bg-blue-50 hover:bg-blue-100">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {featuredProducts.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} featured={true} />
                </div>
              ))}
            </div>
            
            <div className="mt-12 sm:hidden flex justify-center">
              <Link href="/products" className="inline-flex items-center justify-center w-full rounded-full bg-slate-100 py-4 px-6 text-sm font-bold text-slate-900 shadow-sm">
                View all products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Liquid Promotional Banner */}
      <section className="w-full py-16 md:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 via-white to-purple-50 opacity-80" />
            <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 lg:flex lg:items-center lg:justify-between lg:px-24 text-center lg:text-left">
              <div className="max-w-xl">
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl text-slate-900 leading-[1.1]">
                  The Summer <br /> Event is here.
                </h2>
                <p className="mt-6 text-lg text-slate-500 font-medium leading-relaxed">
                  Experience our new collection. Use code SUMMER24 at checkout for 20% off all new arrivals.
                </p>
              </div>
              <div className="mt-10 lg:mt-0 lg:ml-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all hover:scale-105"
                >
                  Shop the Sale
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section id="new-arrivals" className="w-full py-16 md:py-32 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Just Landed.</h2>
              <p className="text-lg text-slate-500 font-medium mt-6 leading-relaxed">The absolute latest pieces to arrive in our warehouse. Get them before they're gone.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {newArrivals.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="mt-16 flex justify-center">
              <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-white border-2 border-slate-200 py-4 px-10 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
                Load More
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Premium Trust Section */}
      <section className="w-full py-24 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8">
            
            <div className="flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-900 mb-6">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Free Next-Day Delivery</h3>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed">On all orders over ₹5,000.</p>
            </div>
            
            <div className="flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-900 mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Secure Checkout</h3>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed">Your data is always protected.</p>
            </div>
            
            <div className="flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-900 mb-6">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">24/7 Concierge</h3>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed">We're here to help anytime.</p>
            </div>
            
            <div className="flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-900 mb-6">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Free Returns</h3>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed">30-day hassle-free return policy.</p>
            </div>
            
          </div>
        </div>
      </section>
    </main>
  );
}
