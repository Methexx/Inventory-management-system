export function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Products</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage your inventory catalog, stock levels, and product details.
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p>Product table, search, filters, and management actions will be loaded here.</p>
      </div>
    </div>
  );
}
