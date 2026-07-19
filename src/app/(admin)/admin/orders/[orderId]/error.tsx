"use client";

export default function AdminOrderDetailError({ reset }: { reset: () => void }) {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-xl font-semibold text-foreground">Unable to load order details</p>
        <p className="mt-2 text-sm text-muted-foreground">Please retry this request. If it keeps failing, check API logs.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
