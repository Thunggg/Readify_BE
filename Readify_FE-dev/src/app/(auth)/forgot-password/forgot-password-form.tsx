"use client"

import Link from "next/link"
import { useRef, useState } from "react"
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
import { HttpError } from "@/lib/http"
import { Loader2 } from "lucide-react"
import styles from "../login/pattern.module.css"
import { useRouter } from "next/navigation"

export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(5, "Email must be at least 5 characters long")
      .max(255, "Email must be less than 255 characters long")
      .email("Invalid email format"),
  })
  .strict()

const ForgotPasswordForm = () => {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    if (isLoading) return
    try {
      setIsLoading(true)

      const res = await authApiRequest.forgotPassword({ email: values.email })

      toast.success(res?.payload.message ?? "An unexpected error occurred", {
        style: {
          "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      })

      router.push("/verify-email?flow=forgot-password")
    } catch (error) {
      // backend: Hệ thống máy chủ cố ý trả về cùng một thông báo ngay cả khi tài khoản không tồn tại.
      // FE: Xử lý 404 như là "success" để tránh lỗi dòng tài khoản tồn tại.
      if (error instanceof HttpError && error.status === 404) {
        toast.success("If an account exists for this email, we’ll send password reset instructions.", {
          style: {
            "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
            "--normal-text": "var(--color-white)",
            "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
          } as React.CSSProperties,
        })
        router.push("/verify-email?flow=forgot-password")
        return
      }

      handleErrorApi({ error, setError: form.setError, duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} relative flex h-auto min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8`}
      onPointerMove={(e) => {
        const el = containerRef.current
        if (!el) return

        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect()
          const x = ((e.clientX - r.left) / r.width) * 100
          const y = ((e.clientY - r.top) / r.height) * 100

          el.style.setProperty("--spot-x", `${x}%`)
          el.style.setProperty("--spot-y", `${y}%`)
        })
      }}
      onPointerLeave={() => {
        const el = containerRef.current
        if (!el) return
        el.style.setProperty("--spot-x", "50%")
        el.style.setProperty("--spot-y", "45%")
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      <Card
        className="z-1 w-full border-none shadow-md sm:max-w-lg"
        onPointerEnter={() => {
          const el = containerRef.current
          if (!el) return
          el.style.setProperty("--spot-size", "0px")
        }}
        onPointerLeave={() => {
          const el = containerRef.current
          if (!el) return
          el.style.setProperty("--spot-size", "170px")
        }}
      >
        <CardHeader className="gap-6">
          <Logo className="gap-3" />

          <div>
            <CardTitle className="mb-1.5 text-2xl text-center">Forgot password</CardTitle>
            <CardDescription className="text-base text-center">
              Enter your email and we’ll send you instructions to reset your password.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel htmlFor="email" className="leading-5">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="Enter your email address" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full cursor-pointer" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset instructions"
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

export default ForgotPasswordForm


