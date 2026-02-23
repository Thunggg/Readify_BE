 "use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, TriangleAlert, UserPlus } from "lucide-react";

import type { AdminAccount } from "@/types/account";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountApiRequest } from "@/api-request/account";
import { toast } from "sonner"
import { handleErrorApi } from "@/lib/utils";
import dayjs from "dayjs";

import type { UpdateAccountApiRequest } from "@/validation/api-schemas";
import { updateAccountFormSchema, type UpdateAccountFormInput } from "@/validation/form-schemas";

function transformFormToApi(formData: UpdateAccountFormInput): UpdateAccountApiRequest {
  const { role, ...rest } = formData;
  void role;

  return {
    ...rest,
    password:
      formData.password && formData.password.length >= 6
        ? formData.password
        : undefined,
  };
}

export default function UpdateAccountModal({
  open,
  onOpenChange,
  selectedAccount,
  onUpdateAccount
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAccount: AdminAccount | null;
  onUpdateAccount: (data: AdminAccount) => void;
}) {
  const [error] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UpdateAccountFormInput>({
    resolver: zodResolver(updateAccountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      email: "",
      password: "",
      role: 0,
      status: 1,
      sex: 1,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (selectedAccount) {
      form.reset(
        {
          email: selectedAccount.email ?? "",
          password: "",
          firstName: selectedAccount.firstName ?? "",
          lastName: selectedAccount.lastName ?? "",
          dateOfBirth: selectedAccount.dateOfBirth
            ? dayjs(selectedAccount.dateOfBirth).format("YYYY-MM-DD")
            : "",
          phone: selectedAccount.phone ?? "",
          address: selectedAccount.address ?? "",
          role: selectedAccount.role ?? 0,
          status: selectedAccount.status ?? 1,
          sex: selectedAccount.sex ?? 1,
        },
        {
          keepErrors: false,
          keepDirty: false,
          keepTouched: false,
          keepIsSubmitted: false,
          keepSubmitCount: false,
        }
      );
    } else {
      form.reset(undefined, { keepErrors: false });
    }
  }, [open, selectedAccount, form]);

  const { handleSubmit, register, control, formState: { errors } } = form;

  async function onSubmit(formData: UpdateAccountFormInput) {
    try {
      if (!selectedAccount?._id) return;

      const apiData = transformFormToApi(formData);
      const res = await AccountApiRequest.updateAccount(selectedAccount._id, apiData);
      if (!res.payload.success) {
        handleErrorApi({ error: res.payload, setError: form.setError, duration: 5000 });
        return;
      }

      onUpdateAccount(res.payload.data);
      toast.success(res.payload.message, {
        style: {
          "--normal-bg":
            "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border":
            "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      });
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError: form.setError, duration: 5000 });
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Update account
          </DialogTitle>
          <DialogDescription>
            Update account information. Leave password blank to keep current
            password.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="bg-destructive/10 text-destructive border-none">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Invalid input</AlertTitle>
            <AlertDescription className="text-destructive/80">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Account Information */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ca-id">Account ID</Label>
              <div className="px-3 py-2 text-sm border rounded-md bg-muted/50">
                {selectedAccount?._id || "N/A"}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ca-email">Email *</Label>
              <Input
                id="ca-email"
                placeholder="seller@example.com"
                {...register("email")}
              />
              {errors.email?.message && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ca-password">
                Password{" "}
                <span className="text-muted-foreground font-normal">
                  (leave blank to keep current)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="ca-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  {...register("password")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password?.message && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ca-firstName">First Name *</Label>
                <Input
                  id="ca-firstName"
                  placeholder="John"
                  {...register("firstName")}
                />
                {errors.firstName?.message && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ca-lastName">Last Name *</Label>
                <Input
                  id="ca-lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                />
                {errors.lastName?.message && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ca-dateOfBirth">Date of Birth *</Label>
                <Input
                  id="ca-dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth?.message && (
                  <p className="text-sm text-destructive">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ca-sex">Gender *</Label>
                <Controller
                  control={control}
                  name="sex"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="ca-sex" className="cursor-pointer">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Male</SelectItem>
                        <SelectItem value="2">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sex?.message && (
                  <p className="text-sm text-destructive">
                    {errors.sex.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ca-phone">Phone Number *</Label>
              <Input
                id="ca-phone"
                placeholder="0909999999"
                {...register("phone")}
              />
              {errors.phone?.message && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ca-address">Address *</Label>
              <Input
                id="ca-address"
                placeholder="123 Main St, District 1, HCMC"
                {...register("address")}
              />
              {errors.address?.message && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          {/* Account Status (Optional) */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ca-status">Status *</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="ca-status" className="cursor-pointer">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                      <SelectItem value="-1">Banned</SelectItem>
                      <SelectItem value="2">Email not verified</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status?.message && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Hiển thị Role hiện tại (read-only) */}
            <div className="grid gap-2">
              <Label>Current Role</Label>
              <div className="px-3 py-2 text-sm border rounded-md bg-muted/50">
                {selectedAccount?.role === 0
                  ? "User"
                  : selectedAccount?.role === 1
                  ? "Admin"
                  : selectedAccount?.role === 2
                  ? "Seller"
                  : selectedAccount?.role === 3
                  ? "Warehouse"
                  : "Unknown"}
              </div>
              <p className="text-xs text-muted-foreground">
                Role cannot be changed here. Contact administrator for role
                changes.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">
              Update Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


