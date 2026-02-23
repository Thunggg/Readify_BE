 "use client";

import React, { useEffect, useState } from "react";
import { TriangleAlert, UserPlus, Upload, X } from "lucide-react";

import type { AdminAccount } from "@/types/account";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { StaffApiRequest } from "@/api-request/staff";
import { toast } from "sonner"
import { handleErrorApi } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { createStaffFormSchema, type CreateStaffFormInput } from "@/validation/staff-form-schemas";
import { MediaApiRequest } from "@/api-request/media";

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const form = useForm<CreateStaffFormInput>({
    resolver: zodResolver(createStaffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      email: "",
      password: "",
      role: 2, // Default to SELLER
      status: 1,
      sex: 1,
    },
  });

    useEffect(() => {
    if (!open) {
      form.reset();
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [open, form]);

  const { handleSubmit, register, control, formState: { errors } } = form;

  async function onSubmit(data: CreateStaffFormInput) {
    try {
      let avatarUrl = data.avatarUrl;

      // Upload avatar nếu có file
      if (avatarFile) {
        setIsUploadingAvatar(true);
        try {
          const uploadRes = await MediaApiRequest.uploadAvatar(avatarFile);
          if (uploadRes?.payload?.success) {
            avatarUrl = uploadRes.payload.data.url;
          }
        } catch (uploadError) {
          toast.error("Failed to upload avatar");
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      // Loại bỏ avatarUrl nếu rỗng
      const submitData = { ...data, avatarUrl };
      if (!submitData.avatarUrl) {
        delete submitData.avatarUrl;
      }

      const res = await StaffApiRequest.createStaff(submitData);
      if (!res?.payload.success) {
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Staff Account
          </DialogTitle>
          <DialogDescription>
            Fill in the required information to create a new staff account.
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

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 pb-3 border-b">
            <div className="relative group">
              <input
                id="ca-avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatarPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="ca-avatar"
                className="cursor-pointer block"
              >
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg transition-all group-hover:scale-105">
                  <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                  <AvatarFallback className="bg-muted">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-7 w-7 text-white" />
                </div>
              </label>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-medium">
                {avatarPreview ? "Change Avatar" : "Upload Avatar"}
              </p>
              <p className="text-xs text-muted-foreground">
                Click to upload (max 5MB)
              </p>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    const input = document.getElementById("ca-avatar") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                  className="text-destructive hover:text-destructive h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Section 1: Account Credentials */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Account Credentials</h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ca-email" className="required text-sm">
                  Email Address
                </Label>
                <Input
                  id="ca-email"
                  type="email"
                  placeholder="user@example.com"
                  {...register("email")}
                />
                {errors.email?.message && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-password" className="required text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="ca-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    {...register("password")}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
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
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Uppercase, lowercase, number & special char
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Personal Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ca-firstName" className="required text-sm">
                  First Name
                </Label>
                <Input
                  id="ca-firstName"
                  placeholder="John"
                  {...register("firstName")}
                />
                {errors.firstName?.message && (
                  <p className="text-xs text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-lastName" className="required text-sm">
                  Last Name
                </Label>
                <Input
                  id="ca-lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                />
                {errors.lastName?.message && (
                  <p className="text-xs text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ca-dateOfBirth" className="required text-sm">
                  Date of Birth
                </Label>
                <Input
                  id="ca-dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth?.message && (
                  <p className="text-xs text-destructive">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-sex" className="required text-sm">
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
                  <p className="text-xs text-destructive">
                    {errors.sex.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ca-phone" className="text-sm">
                  Phone Number
                </Label>
                <Input
                  id="ca-phone"
                  type="tel"
                  placeholder="0909999999"
                  {...register("phone")}
                />
                {errors.phone?.message && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-address" className="text-sm">
                  Address
                </Label>
                <Input
                  id="ca-address"
                  placeholder="123 Main Street"
                  {...register("address")}
                />
                {errors.address?.message && (
                  <p className="text-xs text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Role & Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Role & Status</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ca-role" className="required text-sm">
                  Role
                </Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="ca-role" className="cursor-pointer">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Seller</SelectItem>
                        <SelectItem value="3">Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role?.message && (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ca-status" className="required text-sm">
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
                  <p className="text-xs text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={isUploadingAvatar}>
              {isUploadingAvatar ? "Uploading..." : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


