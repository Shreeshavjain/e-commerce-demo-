"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ImageIcon, Loader2, LogOut, MapPin, ShieldCheck, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/components/storefront/product-display-utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";
import { useRazorpayCheckout, type CheckoutStep } from "@/hooks/use-razorpay-checkout";
import type { CheckoutShippingAddress } from "@/types/order";

/* ─── Shipping address types & validation ─────────────────────────── */

type ShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  houseFlat: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type ShippingErrors = Partial<Record<keyof ShippingAddress, string>>;

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "",
  phone: "",
  email: "",
  houseFlat: "",
  street: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^\d{6}$/;

function validateShipping(address: ShippingAddress): ShippingErrors {
  const errors: ShippingErrors = {};

  if (!address.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (address.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters";
  }

  if (!address.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_RE.test(address.phone.trim())) {
    errors.phone = "Enter a valid 10-digit Indian phone number";
  }

  if (address.email.trim() && !EMAIL_RE.test(address.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!address.houseFlat.trim()) {
    errors.houseFlat = "House / Flat number is required";
  }

  if (!address.street.trim()) {
    errors.street = "Street is required";
  }

  if (!address.city.trim()) {
    errors.city = "City is required";
  } else if (address.city.trim().length < 2) {
    errors.city = "City must be at least 2 characters";
  }

  if (!address.state.trim()) {
    errors.state = "State is required";
  }

  if (!address.pincode.trim()) {
    errors.pincode = "Pincode is required";
  } else if (!PINCODE_RE.test(address.pincode.trim())) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }

  return errors;
}

/** Convert the form-local address shape into the API-expected shipping address shape. */
function toCheckoutAddress(address: ShippingAddress): CheckoutShippingAddress {
  return {
    fullName: address.fullName.trim(),
    phoneNumber: address.phone.trim(),
    line1: address.houseFlat.trim(),
    line2: address.street.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.pincode.trim(),
    country: "India",
    landmark: address.landmark.trim(),
  };
}

/* ─── Reusable labelled input ─────────────────────────────────────── */

const INPUT_CLASS = "w-full rounded-[1rem] border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400";

function FormField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
        {!required && <span className="ml-1 normal-case tracking-normal text-slate-400 font-medium">(optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        disabled={disabled}
        className={cn(INPUT_CLASS, error && "border-red-300 focus:border-red-500 focus:ring-red-500/10 bg-red-50/50", disabled && "cursor-not-allowed opacity-60 bg-gray-100")}
      />
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Shipping address form ───────────────────────────────────────── */

function ShippingAddressForm({
  onValidityChange,
  onAddressChange,
  disabled,
}: {
  onValidityChange?: (valid: boolean) => void;
  onAddressChange?: (address: ShippingAddress) => void;
  disabled?: boolean;
}) {
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<ShippingErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});

  const updateField = useCallback(<K extends keyof ShippingAddress>(field: K, value: string) => {
    setAddress((prev) => {
      const next = { ...prev, [field]: value };
      onAddressChange?.(next);
      return next;
    });
    // Clear the error for this field when typing
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [onAddressChange]);

  const handleBlur = useCallback((field: keyof ShippingAddress) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setAddress((current) => {
      const fieldErrors = validateShipping(current);
      setErrors((prev) => {
        if (fieldErrors[field]) {
          return { ...prev, [field]: fieldErrors[field] };
        }
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return current;
    });
  }, []);

  // Notify parent about validity
  useEffect(() => {
    const allErrors = validateShipping(address);
    const isValid = Object.keys(allErrors).length === 0;
    onValidityChange?.(isValid);
  }, [address, onValidityChange]);

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <MapPin className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Shipping Address
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Full Name — full width */}
        <div className="sm:col-span-2">
          <FormField
            id="shipping-fullName"
            label="Full Name"
            value={address.fullName}
            onChange={(v) => updateField("fullName", v)}
            onBlur={() => handleBlur("fullName")}
            error={touched.fullName ? errors.fullName : undefined}
            required
            placeholder="e.g. Rahul Sharma"
            disabled={disabled}
          />
        </div>

        {/* Phone */}
        <FormField
          id="shipping-phone"
          label="Phone Number"
          value={address.phone}
          onChange={(v) => updateField("phone", v)}
          onBlur={() => handleBlur("phone")}
          error={touched.phone ? errors.phone : undefined}
          required
          type="tel"
          inputMode="tel"
          placeholder="10-digit mobile number"
          maxLength={10}
          disabled={disabled}
        />

        {/* Email (optional) */}
        <FormField
          id="shipping-email"
          label="Email"
          value={address.email}
          onChange={(v) => updateField("email", v)}
          onBlur={() => handleBlur("email")}
          error={touched.email ? errors.email : undefined}
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          disabled={disabled}
        />

        {/* House / Flat */}
        <FormField
          id="shipping-houseFlat"
          label="House / Flat Number"
          value={address.houseFlat}
          onChange={(v) => updateField("houseFlat", v)}
          onBlur={() => handleBlur("houseFlat")}
          error={touched.houseFlat ? errors.houseFlat : undefined}
          required
          placeholder="e.g. B-204"
          disabled={disabled}
        />

        {/* Street */}
        <FormField
          id="shipping-street"
          label="Street"
          value={address.street}
          onChange={(v) => updateField("street", v)}
          onBlur={() => handleBlur("street")}
          error={touched.street ? errors.street : undefined}
          required
          placeholder="e.g. MG Road"
          disabled={disabled}
        />

        {/* Landmark (optional) — full width */}
        <div className="sm:col-span-2">
          <FormField
            id="shipping-landmark"
            label="Landmark"
            value={address.landmark}
            onChange={(v) => updateField("landmark", v)}
            placeholder="e.g. Near City Mall"
            disabled={disabled}
          />
        </div>

        {/* City */}
        <FormField
          id="shipping-city"
          label="City"
          value={address.city}
          onChange={(v) => updateField("city", v)}
          onBlur={() => handleBlur("city")}
          error={touched.city ? errors.city : undefined}
          required
          placeholder="e.g. Bangalore"
          disabled={disabled}
        />

        {/* State */}
        <FormField
          id="shipping-state"
          label="State"
          value={address.state}
          onChange={(v) => updateField("state", v)}
          onBlur={() => handleBlur("state")}
          error={touched.state ? errors.state : undefined}
          required
          placeholder="e.g. Karnataka"
          disabled={disabled}
        />

        {/* Pincode */}
        <FormField
          id="shipping-pincode"
          label="Pincode"
          value={address.pincode}
          onChange={(v) => updateField("pincode", v)}
          onBlur={() => handleBlur("pincode")}
          error={touched.pincode ? errors.pincode : undefined}
          required
          inputMode="numeric"
          placeholder="6-digit pincode"
          maxLength={6}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────── */

function CheckoutEmptyState() {
  return (
    <div className="rounded-[2.5rem] border border-gray-100 bg-white px-6 py-20 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
        <ShoppingCart className="h-8 w-8" />
      </div>
      <p className="mt-6 text-2xl font-black text-slate-900 tracking-tight">Redirecting to products...</p>
      <p className="mt-2 text-base text-slate-500 font-medium">Your cart is empty, so we are taking you back to the catalog.</p>
      <Link
        href="/products"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5 active:scale-95"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

/* ─── Line-item row ───────────────────────────────────────────────── */

function CheckoutItemRow({
  productImage,
  productTitle,
  productBrand,
  variantName,
  variantLabel,
  quantity,
  unitPrice,
  lineTotal,
}: {
  productImage: { url: string; altText: string } | null;
  productTitle: string;
  productBrand: string;
  variantName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}) {
  return (
    <div className="flex gap-4 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm items-center">
      <div className="relative aspect-square h-20 w-20 overflow-hidden rounded-[1rem] border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
        {productImage?.url ? (
          <Image src={productImage.url} alt={productImage.altText || productTitle} fill sizes="80px" className="object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {productBrand && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 truncate">{productBrand}</p>}
        <h2 className="text-sm font-bold text-slate-900 truncate">{productTitle}</h2>
        <p className="text-xs font-medium text-slate-500 truncate">{variantName} · {variantLabel}</p>
        <p className="text-xs font-medium text-slate-400 mt-1">Qty: {quantity} × {formatPrice(unitPrice)}</p>
      </div>

      <div className="text-right shrink-0 pl-2">
        <span className="font-black text-slate-900 text-sm">{formatPrice(lineTotal)}</span>
      </div>
    </div>
  );
}

/* ─── Auth gate for checkout ──────────────────────────────────────── */

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function CheckoutAuthGate() {
  const { user, status, isInitialized } = useAuthState();
  const { openAuthModal, logout } = useAuthActions();
  const isBusy = status === "authenticating" || status === "restoring";

  if (!isInitialized) {
    return (
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Restoring session...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Account Details
          </h2>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
            {user.image ? (
              <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-sm font-medium text-slate-500">{user.phoneNumber ?? user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={isBusy}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-gray-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <UserRound className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Account Details
        </h2>
      </div>

      <p className="text-base font-medium text-slate-500 leading-relaxed mb-6">
        Sign in with your phone number to continue. If you are new, we will create your account automatically.
      </p>

      <button
        type="button"
        onClick={() => openAuthModal("phone", "/checkout")}
        disabled={isBusy}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-4 px-6 text-sm font-bold text-white transition-all shadow-lg shadow-blue-600/20",
          "hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
        )}
      >
        {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserRound className="h-5 w-5" />}
        Sign in to continue
      </button>

      <p className="mt-4 text-center text-xs font-medium text-slate-400">
        Secured by Firebase OTP Authentication.
      </p>
    </div>
  );
}

/* ─── Payment processing overlay ──────────────────────────────────── */

function PaymentProcessingOverlay({ step }: { step: CheckoutStep }) {
  if (step === "idle" || step === "success" || step === "error") return null;

  const messages: Record<string, string> = {
    "creating-order": "Creating your order...",
    "awaiting-payment": "Waiting for payment...",
    "verifying": "Verifying your payment...",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-2xl">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <ShieldCheck className="absolute -bottom-1 -right-1 h-6 w-6 text-emerald-500 bg-white rounded-full" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-black text-slate-900 tracking-tight">{messages[step] ?? "Processing..."}</p>
          <p className="text-sm font-medium text-slate-500">Please do not close this page</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Checkout page ───────────────────────────────────────────────── */

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const hasHydrated = useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );

  const { user } = useAuthState();
  const [shippingValid, setShippingValid] = useState(false);

  // Track the current shipping address via a ref (avoids re-renders on every keystroke).
  const shippingAddressRef = useRef<ShippingAddress>(EMPTY_ADDRESS);
  const handleAddressChange = useCallback((address: ShippingAddress) => {
    shippingAddressRef.current = address;
  }, []);

  // ── Razorpay checkout hook ──────────────────────────────────────
  const { step: paymentStep, error: paymentError, isProcessing, initiateCheckout, reset: resetPayment } = useRazorpayCheckout({
    userName: user?.name,
    userEmail: user?.email,
    userPhone: user?.phoneNumber ?? undefined,
  });

  const canPlaceOrder = Boolean(user) && shippingValid && items.length > 0 && !isProcessing;

  const handlePlaceOrder = useCallback(() => {
    if (!canPlaceOrder) return;

    // Build the cart items payload — only IDs and quantities, no prices.
    const cartItems = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    const shippingAddress = toCheckoutAddress(shippingAddressRef.current);
    initiateCheckout(cartItems, shippingAddress);
  }, [canPlaceOrder, items, initiateCheckout]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (items.length === 0) {
      router.replace("/products");
    }
  }, [hasHydrated, items.length, router]);

  if (!hasHydrated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 pt-32">
        <CheckoutEmptyState />
      </main>
    );
  }

  return (
    <>
      <PaymentProcessingOverlay step={paymentStep} />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 pt-32">
        <div className="mb-10 space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Checkout</h1>
          <p className="max-w-2xl text-lg font-medium text-slate-500">
            Securely complete your order and manage delivery details.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-8">
            <CheckoutAuthGate />

            <ShippingAddressForm
              onValidityChange={setShippingValid}
              onAddressChange={handleAddressChange}
              disabled={isProcessing}
            />
          </section>

          <aside className="h-fit rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] lg:sticky lg:top-32 flex flex-col">
            <h2 className="text-xl font-black text-slate-900 mb-6">Order Summary</h2>
            
            <div className="flex-1 overflow-y-auto max-h-[40vh] pr-2 space-y-3 mb-6 scrollbar-hide">
              {items.map((item) => (
                <CheckoutItemRow
                  key={`${item.productId}:${item.variantId}`}
                  productImage={item.productImage}
                  productTitle={item.productTitle}
                  productBrand={item.productBrand}
                  variantName={item.variantName}
                  variantLabel={item.variantLabel}
                  quantity={item.quantity}
                  unitPrice={item.price.unitPrice}
                  lineTotal={item.lineTotal}
                />
              ))}
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                <span>Total Items</span>
                <span className="text-slate-900">{totalItems}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">Total to Pay</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(subtotal)}</span>
              </div>
            </div>

            {paymentStep === "error" && paymentError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-600">{paymentError}</p>
                <button
                  type="button"
                  onClick={resetPayment}
                  className="mt-2 text-sm font-bold text-red-600 underline underline-offset-4 hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={!canPlaceOrder}
              onClick={handlePlaceOrder}
              className={cn(
                "mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold transition-all",
                canPlaceOrder
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95"
                  : "cursor-not-allowed bg-gray-100 text-slate-400"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            {!user ? (
              <p className="mt-4 text-center text-sm font-bold text-slate-400">
                Sign in above to place your order
              </p>
            ) : !shippingValid ? (
              <p className="mt-4 text-center text-sm font-bold text-slate-400">
                Complete the shipping address to continue
              </p>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Secured by Razorpay
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold">100% Secure Payment</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}