"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ImageIcon, Loader2, LogOut, MapPin, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/components/storefront/product-display-utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";

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

/* ─── Reusable labelled input ─────────────────────────────────────── */

const INPUT_CLASS = "w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40";

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
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {!required && <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">(optional)</span>}
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
        className={cn(INPUT_CLASS, error && "border-destructive/60 focus:ring-destructive/30")}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ─── Shipping address form ───────────────────────────────────────── */

function ShippingAddressForm({
  onValidityChange,
}: {
  onValidityChange?: (valid: boolean) => void;
}) {
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<ShippingErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});

  const updateField = useCallback(<K extends keyof ShippingAddress>(field: K, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field when typing
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

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
    <div className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Shipping Address
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
        />

        {/* Landmark (optional) — full width */}
        <div className="sm:col-span-2">
          <FormField
            id="shipping-landmark"
            label="Landmark"
            value={address.landmark}
            onChange={(v) => updateField("landmark", v)}
            placeholder="e.g. Near City Mall"
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
        />
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────── */

function CheckoutEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <ShoppingCart className="h-6 w-6" />
      </div>
      <p className="mt-5 text-lg font-semibold text-foreground">Redirecting to products...</p>
      <p className="mt-2 text-sm text-muted-foreground">Your cart is empty, so we are taking you back to the catalog.</p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
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
    <div className="grid gap-4 rounded-[1.5rem] border border-border bg-card/80 p-4 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        {productImage?.url ? (
          <Image src={productImage.url} alt={productImage.altText || productTitle} fill sizes="92px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {productBrand ? <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{productBrand}</p> : null}
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{productTitle}</h2>
          <p className="text-sm text-muted-foreground">Color: {variantName}</p>
          <p className="text-sm text-muted-foreground">Storage / Variant: {variantLabel}</p>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:justify-items-end">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-1 sm:text-right">
          <span className="text-muted-foreground">Qty</span>
          <span className="font-medium text-foreground">{quantity}</span>

          <span className="text-muted-foreground">Unit price</span>
          <span className="font-medium text-foreground">{formatPrice(unitPrice)}</span>

          <span className="text-muted-foreground">Line total</span>
          <span className="font-semibold text-foreground">{formatPrice(lineTotal)}</span>
        </div>
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
      <div className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Restoring session...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Signed In
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-foreground text-sm font-medium text-background">
            {user.image ? (
              <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.phoneNumber ?? user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
          <UserRound className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Account
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Sign in with your phone number to continue. If you are new, we will create your account automatically.
      </p>

      <button
        type="button"
        onClick={() => openAuthModal("phone", "/checkout")}
        disabled={isBusy}
        className={cn(
          "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-medium text-background transition",
          "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
        Sign in with phone
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        We use a secure backend session cookie after verifying your phone via Firebase OTP.
      </p>
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
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CheckoutEmptyState />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Storefront</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Checkout</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Fill in your shipping details and review your order before proceeding.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          {/* ── Auth gate ── */}
          <CheckoutAuthGate />

          {/* ── Shipping address form ── */}
          <ShippingAddressForm onValidityChange={setShippingValid} />

          {/* ── Cart items ── */}
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Order Items ({totalItems})
            </p>
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
        </section>

        <aside className="h-fit rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5 lg:sticky lg:top-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order summary</p>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>Total items</span>
              <span className="font-medium text-foreground">{totalItems}</span>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled
            title={!user ? "Sign in to place your order" : "Payment will be connected later"}
            className={cn(
              "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
              "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            Place Order
            <ArrowRight className="h-4 w-4" />
          </button>

          {!user ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Sign in to place your order
            </p>
          ) : !shippingValid ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Complete the shipping address to continue
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}