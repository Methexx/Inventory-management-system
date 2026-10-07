export function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Categories
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Organize products into categories, manage custom groups, and monitor catalog counts.
        </p>
      </div>

      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p>Category list, creation, rename, and guarded deletion will be loaded here.</p>
      </div>
    </div>
  );
}
