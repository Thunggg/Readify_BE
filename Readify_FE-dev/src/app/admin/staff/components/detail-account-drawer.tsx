import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import type { AdminAccount } from "@/types/account";
import dayjs from "dayjs";
import {
  BanIcon,
  CheckCircleIcon,
  CircleHelpIcon,
  CircleMinusIcon,
  MailIcon,
  MarsIcon,
  VenusIcon,
  X,
} from "lucide-react";

function sexBadge(sex?: number) {
  if (sex === 1) {
    return (
      <Badge className="border-none bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
        <MarsIcon className="size-3" />
        Male
      </Badge>
    );
  }
  if (sex === 2) {
    return (
      <Badge className="border-none bg-rose-600/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400">
        <VenusIcon className="size-3" />
        Female
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <CircleHelpIcon className="size-3" />
      Unknown
    </Badge>
  );
}

function statusBadge(status?: number) {
  if (status === 1) {
    return (
      <Badge className="border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400">
        <CheckCircleIcon className="size-3" />
        Active
      </Badge>
    );
  }
  if (status === 0) {
    return (
      <Badge className="border-none bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400">
        <CircleMinusIcon className="size-3" />
        Inactive
      </Badge>
    );
  }
  if (status === -1) {
    return (
      <Badge variant="destructive">
        <BanIcon className="size-3" />
        Banned
      </Badge>
    );
  }
  if (status === 2) {
    return (
      <Badge className="border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
        <MailIcon className="size-3" />
        Email not verified
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <CircleHelpIcon className="size-3" />
      Unknown
    </Badge>
  );
}

function roleBadge(role?: number) {
  const label =
    role === 1
      ? "Admin"
      : role === 2
      ? "Seller"
      : role === 3
      ? "Warehouse"
      : role === 0
      ? "User"
      : "Unknown";

  return <Badge variant="secondary">{label}</Badge>;
}

function valueOrDash(value?: string | number | null) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && value.trim() === "") return "-";
  return String(value);
}

export default function DetailAccountDrawer({
  open,
  onOpenChange,
  selectedAccount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAccount: AdminAccount | null;
}) {
  const fullName =
    [selectedAccount?.firstName, selectedAccount?.lastName]
      .filter(Boolean)
      .join(" ") || "-";

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="fixed bottom-0 right-0 left-auto top-0 h-screen w-[92vw] max-w-[560px] overflow-hidden rounded-none border-l">
        {/* Header Section */}
        <DrawerHeader className="border-b border-border/40 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/10">
                <AvatarImage src={selectedAccount?.avatarUrl || "/placeholder.svg"} alt={selectedAccount?.email} />
                <AvatarFallback className="text-sm font-semibold">
                  {(selectedAccount?.firstName?.[0] ?? selectedAccount?.email?.[0] ?? "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <DrawerTitle className="truncate text-base font-semibold">{fullName}</DrawerTitle>
                <DrawerDescription className="truncate text-xs mt-1">{selectedAccount?.email ?? "-"}</DrawerDescription>
              </div>
            </div>

            {/* Close Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="h-9 w-9 flex-shrink-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {statusBadge?.(selectedAccount?.status)}
            {sexBadge?.(selectedAccount?.sex)}
            {roleBadge?.(selectedAccount?.role)}
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0">
            {/* Profile Section */}
            <section className="border-b border-border/40 px-6 py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Profile Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="text-sm font-medium text-right">{fullName}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="text-sm font-medium">
                    {selectedAccount?.dateOfBirth ? dayjs(selectedAccount.dateOfBirth).format("DD/MM/YYYY") : "-"}
                  </span>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className="border-b border-border/40 px-6 py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{valueOrDash(selectedAccount?.phone)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-right">{valueOrDash(selectedAccount?.address)}</span>
                </div>
              </div>
            </section>

            {/* System Information Section */}
            <section className="px-6 py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                System Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">ID</span>
                  <span className="text-xs font-mono text-muted-foreground">{valueOrDash(selectedAccount?._id)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">
                    {selectedAccount?.createdAt ? dayjs(selectedAccount.createdAt).format("DD/MM/YYYY HH:mm") : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="text-sm font-medium">
                    {selectedAccount?.updatedAt ? dayjs(selectedAccount.updatedAt).format("DD/MM/YYYY HH:mm") : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Last Login</span>
                  <span className="text-sm font-medium">
                    {selectedAccount?.lastLoginAt ? dayjs(selectedAccount.lastLoginAt).format("DD/MM/YYYY HH:mm") : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium">{statusBadge?.(selectedAccount?.status)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
