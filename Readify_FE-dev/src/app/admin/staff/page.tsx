import AccountsTable from "./accounts-table";

export default async function AccountsPage() {

  return (
    <div className="py-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
        <p className="text-muted-foreground">
          Create, update, and manage staff
        </p>
      </div>

      <AccountsTable />
    </div>
  );
}