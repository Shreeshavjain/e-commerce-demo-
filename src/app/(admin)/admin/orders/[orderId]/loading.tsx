export default function AdminOrderDetailLoading() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-full border border-border bg-card/70" />
        <div className="h-48 animate-pulse rounded-[1.75rem] border border-border bg-card/70" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-3xl border border-border bg-card/70" />
          <div className="h-56 animate-pulse rounded-3xl border border-border bg-card/70" />
        </div>
        <div className="h-80 animate-pulse rounded-[1.75rem] border border-border bg-card/70" />
      </div>
    </main>
  );
}
