import PromotionsTable from "./promotions-table";

export default async function PromotionsPage() {
  return (
    <div className="py-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Promotions
        </h2>
        <p className="text-muted-foreground text-gray-500 dark:text-gray-400">
          Create, update, and manage promotions
        </p>
      </div>

      <PromotionsTable />
    </div>
  );
}
