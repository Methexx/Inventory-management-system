export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Overview of your inventory performance, stock health, and category distribution.
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p>Dashboard statistics and overview will be loaded here.</p>
      </div>
    </div>
  );
}
