import AccountsTable from "./accounts-table";

export default async function AccountsPage() {

  return (
    <div className="py-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <p className="text-muted-foreground">
          Create, update, and manage accounts
        </p>
      </div>

      <AccountsTable />
    </div>
  );
}