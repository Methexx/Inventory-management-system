export function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Stock History
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Audit trail of all stock movements, initial quantities, restocks, and sales.
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p>Stock movement log and filters will be loaded here.</p>
      </div>
    </div>
  );
}
