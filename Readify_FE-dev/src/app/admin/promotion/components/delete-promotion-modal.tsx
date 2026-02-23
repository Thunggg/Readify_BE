import { PromotionApiRequest } from "@/api-request/promotion";
import { handleErrorApi } from "@/lib/utils";
import { Promotion } from "@/types/promotion";
import { toast } from "sonner";

export default function DeletePromotionModal({
  open,
  onOpenChange,
  selectedPromotion,
  onDeletePromotion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPromotion: Promotion | null;
  onDeletePromotion: () => void;
}) {
  async function handleDeletePromotion() {
    try {
      const res = await PromotionApiRequest.deletePromotion(
        selectedPromotion?._id as string,
      );
      if (!res) {
        throw new Error("API returned undefined response");
      }

      if (!res.payload.success) {
        handleErrorApi({ error: res.payload, duration: 5000 });
        return;
      }

      onOpenChange(false);
      onDeletePromotion();

      toast.success(res.payload.message, {
        style: {
          "--normal-bg":
            "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border":
            "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      });
    } catch (error) {
      handleErrorApi({ error, duration: 5000 });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
        <div className="mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Delete promotion {selectedPromotion?.code ?? ""}?
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This action cannot be undone. This will permanently delete this
            promotion.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            Cancel
          </button>

          <button
            onClick={handleDeletePromotion}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
