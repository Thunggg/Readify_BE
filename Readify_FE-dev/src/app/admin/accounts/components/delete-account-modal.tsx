import { AccountApiRequest } from "@/api-request/account";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { handleErrorApi } from "@/lib/utils";
import { AdminAccount } from "@/types/account";
import { toast } from "sonner";

export default function DeleteAccountModal({
  open,
  onOpenChange,
  selectedAccount,
  onDeleteAccount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAccount: AdminAccount | null;
  onDeleteAccount: () => void;
}) {
    async function handleDeleteAccount() {
    try {
      const res = await AccountApiRequest.deleteAccount(selectedAccount?._id as string);

      if (!res.payload.success) {
        handleErrorApi({ error: res.payload, duration: 5000 });
        return;
      }

      onOpenChange(false);
      onDeleteAccount();

      toast.success(res.payload.message, {
        style: {
          "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      })
      
    } catch (error) {
      handleErrorApi({ error, duration: 5000 });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete account {selectedAccount?.email ?? ""}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDeleteAccount}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
