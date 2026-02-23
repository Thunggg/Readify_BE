"use client"

import { authApiRequest } from "@/api-request/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { handleErrorApi } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { REGEXP_ONLY_DIGITS } from "input-otp"

import { Spinner } from "@/components/ui/shadcn-io/spinner"

type OTPFlow = "register" | "forgot-password"


export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [otp, setOtp] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const verifyingRef = useRef(false)

  const canResend = !isResending && resendCooldown === 0 && !isLoading

  useEffect(() => {
    if (resendCooldown <= 0) return
    const intervalId = window.setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [resendCooldown])

  const flow: OTPFlow =
    searchParams.get("flow") === "forgot-password" ? "forgot-password" : "register"

  const verifyOtp = React.useCallback(async (code: string) => {
    try {
      setIsLoading(true)
      // Simulate slow network/backend (dev only)
      // if (process.env.NODE_ENV === "development") {
      //   await new Promise((resolve) => setTimeout(resolve, 10_000))
      // }
      const response =
        flow === "forgot-password"
          ? await authApiRequest.verifyForgotPasswordOtp({ otp: code.toString() })
          : await authApiRequest.verifyRegisterOtp({
            otp: code.toString(),
          })

      if (response?.payload.success) {
        toast.success(response?.payload.message ?? "An unexpected error occurred", {
          style: {
            "--normal-bg":
              "light-dark(var(--color-green-600), var(--color-green-400))",
            "--normal-text": "var(--color-white)",
            "--normal-border":
              "light-dark(var(--color-green-600), var(--color-green-400))",
          } as React.CSSProperties,
        })

        router.push(flow === "forgot-password" ? "/reset-password" : "/login")
      } else {
        handleErrorApi({
          error: new Error(response?.payload.message ?? "An unexpected error occurred"),
          duration: 5000,
        })
        setOtp("");
      }
    } catch (error) {
      handleErrorApi({ error, duration: 5000 })
      setOtp("");
    } finally {
      setIsLoading(false)
    }
  }, [router, flow])


  useEffect(() => {
    if (isLoading) return
    if (otp.length !== 6) return
    if (verifyingRef.current) return

    verifyingRef.current = true
    verifyOtp(otp).finally(() => {
      verifyingRef.current = false
    })

  }, [otp, isLoading, verifyOtp])


  const resendOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!canResend) return

    try {
      setIsResending(true)
      await authApiRequest.resendRegisterOtp()

      toast.success("OTP resent successfully", {
        style: {
          "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      })

      setResendCooldown(60)
    } catch (error) {
      handleErrorApi({ error, duration: 5000 })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className={`relative ${props.className ?? ""}`} {...props}>

      {isLoading && (
        <div className="absolute inset-0 z-100 grid place-items-center rounded-xl bg-background/10 backdrop-blur-[3px]">
          <div className="flex flex-col items-center gap-2">
            <Spinner variant="infinite" size={30} />
            <p className="text-sm text-muted-foreground">Verifying...</p>
          </div>
        </div>
      )}

      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>
          {flow === "forgot-password"
            ? "We sent a 6-digit reset code to your email."
            : "We sent a 6-digit code to your email."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>
              <InputOTP pattern={REGEXP_ONLY_DIGITS} maxLength={6} id="otp" value={otp} required onChange={setOtp}
                onKeyDown={(e) => {
                  if (!isLoading) return

                  e.preventDefault()
                }}
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                Enter the 6-digit code sent to your email.
              </FieldDescription>
            </Field>
            <FieldGroup>
              <FieldDescription className="text-center">
                Didn&apos;t receive the code?{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={resendOtp}
                  disabled={!canResend}
                  className="h-auto p-0 align-baseline"
                >
                  {isResending
                    ? "Resending..."
                    : resendCooldown > 0
                      ? `Resend (${resendCooldown}s)`
                      : "Resend"}
                </Button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
