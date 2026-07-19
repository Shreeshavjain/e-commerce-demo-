import { CalendarDays, Filter, Search, ShoppingBag, DollarSign, PackageOpen, Truck, Clock } from "lucide-react";

export default function AdminOrdersLoading() {
  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-pulse">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_45%)]" />

      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-4 rounded-[2rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5 lg:grid-cols-5 lg:p-8">
          <div className="space-y-3 lg:col-span-1">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded mt-2"></div>
          </div>

          <div className="lg:col-span-4 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[DollarSign, Clock, PackageOpen, CalendarDays].map((Icon, idx) => (
              <div key={idx} className="rounded-3xl border border-border bg-background/85 p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </div>
                <div className="mt-2 h-8 w-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))]">
            <div className="h-10 w-full bg-muted rounded-full"></div>
            <div className="h-10 w-full bg-muted rounded-full"></div>
            <div className="h-10 w-full bg-muted rounded-full"></div>
            <div className="h-10 w-full bg-muted rounded-full"></div>
            <div className="h-10 w-full bg-muted rounded-full"></div>
            <div className="flex gap-2">
              <div className="h-10 w-full bg-muted rounded-full"></div>
              <div className="h-10 w-24 bg-muted rounded-full"></div>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border lg:block mt-6">
            <table className="w-full divide-y divide-border text-sm">
              <thead className="bg-muted/35 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-muted rounded"></div></td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-muted rounded mb-2"></div>
                      <div className="h-3 w-32 bg-muted rounded"></div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-muted rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-muted rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-6 w-16 bg-muted rounded-full"></div></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 bg-muted rounded-full"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-muted rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-8 w-16 bg-muted rounded-full"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="grid gap-3 lg:hidden mt-6">
             {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 w-full bg-muted rounded-2xl"></div>
             ))}
          </div>
        </section>
      </div>
    </main>
  );
}
