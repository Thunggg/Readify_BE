"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { ResetPasswordFormInput, resetPasswordFormSchema } from "@/validation/form-schemas";
import { useCallback, useEffect, useState } from "react";
import { handleErrorApi } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountApiRequest } from "@/api-request/account";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { ProfilePasswordSkeleton } from "./skeletons/profile-password-skeleton";

export default function ProfilePassword() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [ready, setReady] = useState(false);

    useEffect(() => {
      const t = setTimeout(() => setReady(true), 400);
      return () => clearTimeout(t);
    }, []);

    const onSubmit = useCallback<SubmitHandler<ResetPasswordFormInput>>(async (data) => {
    try {
      const response = await AccountApiRequest.resetPassword(data);

      if(!response.payload.success || response.status !== 200) {
        handleErrorApi({
          error: response.payload,
          setError: setError,
          duration: 5000,
        });
        return;
      }

      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsCurrentPasswordVisible(false);
      setIsNewPasswordVisible(false);
      setIsConfirmPasswordVisible(false);

      toast.success(response.payload.message, {
        style: {
          "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      });

    } catch (error) {
      handleErrorApi({ error, setError: setError, duration: 5000 });
    }
  }, [setError, reset]);

  if (!ready) return <ProfilePasswordSkeleton />;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>
            Cập nhật mật khẩu để bảo mật tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={isCurrentPasswordVisible ? "text" : "password"}
                  {...register("currentPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                  size="icon"
                  onClick={() => setIsCurrentPasswordVisible((prev) => !prev)}
                >
                  {isCurrentPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={isNewPasswordVisible ? "text" : "password"}
                  {...register("newPassword")}
                />
                <Button
                  type="button"
                  className="cursor-pointer text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNewPasswordVisible((prev) => !prev)}
                >
                  {isNewPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  {...register("confirmPassword")}
                />
                <Button
                  type="button"
                  className="cursor-pointer text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                >
                  {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              {isSubmitting ? (
                <>
                  <Button disabled type="button" className="cursor-pointer">
                    <Spinner />
                    Đang đổi mật khẩu...
                  </Button>
                </>
              ) : (
                <Button type="submit" className="cursor-pointer">Đổi mật khẩu</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}


