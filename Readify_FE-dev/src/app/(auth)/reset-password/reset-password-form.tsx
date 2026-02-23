"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { authApiRequest } from "@/api-request/auth"
import Logo from "@/components/shadcn-studio/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { handleErrorApi } from "@/lib/utils"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters long").max(255, "Max 255 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters long").max(255, "Max 255 characters"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

const ResetPasswordForm = () => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (isLoading) return
    try {
      setIsLoading(true)

      const response = await authApiRequest.resetPassword({
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })

      if (response.payload.success) {
        toast.success("Password reset successful!", {
          style: {
            "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
            "--normal-text": "var(--color-white)",
            "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
          } as React.CSSProperties,
        })
        router.push("/login")
        return
      }

      handleErrorApi({ error: new Error(response.payload.message), duration: 5000 })
    } catch (error) {
      handleErrorApi({ error, setError: form.setError, duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full border-none shadow-md sm:max-w-lg">
        <CardHeader className="gap-6">
          <Logo className="gap-3" />

          <div>
            <CardTitle className="mb-1.5 text-2xl text-center">Reset password</CardTitle>
            <CardDescription className="text-base text-center">Enter your new password.</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel htmlFor="newPassword" className="leading-5">
                      New password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={isPasswordVisible ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          className="pr-9"
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsPasswordVisible((prev) => !prev)}
                          className="cursor-pointer text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                        >
                          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                          <span className="sr-only">{isPasswordVisible ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel htmlFor="confirmPassword" className="leading-5">
                      Confirm password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={isConfirmVisible ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          className="pr-9"
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsConfirmVisible((prev) => !prev)}
                          className="cursor-pointer text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                          aria-label={isConfirmVisible ? "Hide confirm password" : "Show confirm password"}
                        >
                          {isConfirmVisible ? <EyeOffIcon /> : <EyeIcon />}
                          <span className="sr-only">{isConfirmVisible ? "Hide confirm password" : "Show confirm password"}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full cursor-pointer" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>

              <Button variant="ghost" className="w-full" asChild type="button">
                <Link href="/login">Back to login</Link>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordForm


