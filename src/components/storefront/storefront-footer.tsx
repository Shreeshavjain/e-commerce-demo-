"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function StorefrontFooter() {
  return (
    <footer className="bg-gray-50 text-slate-900 border-t border-gray-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
                SVJ Store
              </Link>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                Premium quality goods designed for modern life. Experience the perfect blend of aesthetic design and robust functionality.
              </p>
            </div>
            
            <div className="max-w-md">
              <h3 className="text-sm font-bold tracking-wider text-slate-900">Subscribe to our newsletter</h3>
              <p className="mt-2 text-xs text-slate-600 mb-4">
                Get the latest news on product launches and exclusive discounts.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="w-full min-w-0 flex-auto rounded-full border border-gray-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none sm:text-sm sm:leading-6 transition-all"
                />
                <button
                  type="submit"
                  className="flex-none rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Links Group 1 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Shop</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li>
                <Link href="/products" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/#new-arrivals" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/#trending" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Group 2 */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Support</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li>
                <Link href="/login" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/my-orders" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-16 border-t border-gray-200 pt-8 sm:mt-20 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs leading-5 text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} SVJ Store. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Facebook
            </Link>
            <Link href="#" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Instagram
            </Link>
            <Link href="#" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              YouTube
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
