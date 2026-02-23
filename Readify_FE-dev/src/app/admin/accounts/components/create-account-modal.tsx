 "use client";

import React, { useEffect, useState } from "react";
import { TriangleAlert, UserPlus } from "lucide-react";

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
import { Eye, EyeOff } from "lucide-react";
import { createAccountFormSchema, type CreateAccountFormInput } from "@/validation/form-schemas";

export default function CreateAccountModal({
  open,
  onOpenChange,
  onCreateAccount
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: (data: AdminAccount) => void;
}) {
  const [error] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);


  const form = useForm<CreateAccountFormInput>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      email: "",
      password: "",
      status: 1,
      sex: 1,
    },
  });

    useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const { handleSubmit, register, control, formState: { errors } } = form;

  async function onSubmit(data: CreateAccountFormInput) {
    try {
      const res = await AccountApiRequest.createAccount(data);
      if (!res.payload.success) {
        handleErrorApi({ error: res.payload, setError: form.setError, duration: 5000 });
        return;
      }

      onCreateAccount(res.payload.data);
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Account
          </DialogTitle>
          <DialogDescription>
            Fill in the required information to create a new user account.
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
          {/* Section 1: Account Credentials */}
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="ca-email" className="required">
                  Email Address
                </Label>
                <Input
                  id="ca-email"
                  type="email"
                  placeholder="user@example.com"
                  {...register("email")}
                />
                {errors.email?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-password" className="required">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="ca-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    {...register("password")}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 6 characters required
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ca-firstName" className="required">
                  First Name
                </Label>
                <Input
                  id="ca-firstName"
                  placeholder="John"
                  {...register("firstName")}
                />
                {errors.firstName?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-lastName" className="required">
                  Last Name
                </Label>
                <Input
                  id="ca-lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                />
                {errors.lastName?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ca-dateOfBirth" className="required">
                  Date of Birth
                </Label>
                <Input
                  id="ca-dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-sex" className="required">
                  Gender
                </Label>
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.sex.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Contact Information */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ca-phone" className="required">
                  Phone Number
                </Label>
                <Input
                  id="ca-phone"
                  type="tel"
                  placeholder="090 999 9999"
                  {...register("phone")}
                />
                {errors.phone?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-address" className="required">
                  Address
                </Label>
                <Input
                  id="ca-address"
                  placeholder="123 Main Street, HCMC"
                  {...register("address")}
                />
                {errors.address?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Account Status */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ca-status" className="required">
                  Initial Status
                </Label>
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
                        <SelectItem value="2">Email not verified</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status?.message && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.status.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  New accounts are usually &quot;Email not verified&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground"></div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


