"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { authApiRequest } from "@/api-request/auth"
import Logo from "@/components/shadcn-studio/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { handleErrorApi } from "@/lib/utils"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import styles from "../login/pattern.module.css"

function isAtLeast16YearsOld(dateString: string) {
  // dateString from <input type="date" /> => "YYYY-MM-DD"
  const dob = new Date(dateString)
  if (Number.isNaN(dob.getTime())) return false

  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age >= 16
}

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100, "Max 100 characters"),
    lastName: z.string().trim().min(1, "Last name is required").max(100, "Max 100 characters"),
    phone: z.string().trim().min(1, "Phone is required").max(30, "Max 30 characters").regex(/^0[0-9]{9}$/, "Invalid phone number"),
    address: z.string().trim().min(1, "Address is required").max(500, "Max 500 characters"),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, "Date of birth is required")
      .refine(isAtLeast16YearsOld, "You must be at least 16 years old"),
    sex: z.number().int().min(0).max(2),
    email: z
      .string()
      .trim()
      .min(5, "Email must be at least 5 characters long")
      .max(255, "Email must be less than 255 characters long")
      .email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters long").max(255, "Max 255 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters long").max(255, "Max 255 characters"),
    // Optional UI checkbox (not required by backend)
    acceptTerms: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

const RegisterForm = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
  const [isAcceptTerm, setIsAcceptTerm] = useState(false)

  const router = useRouter()

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      sex: 0,
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    if (isLoading) return
    try {
      setIsLoading(true)

      const dateOfBirthIso = `${values.dateOfBirth}T00:00:00.000Z`

      await authApiRequest.register({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        address: values.address,
        dateOfBirth: dateOfBirthIso,
        sex: values.sex,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      })

      toast.success("The OTP code has been sent!", {
        style: {
          "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      })
      router.push("/verify-email?flow=register")
    } catch (error) {
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
        className="z-1 w-full border-none shadow-md sm:max-w-2xl"
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
        <CardHeader className="gap-4">
          <Logo className="gap-3" />

          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription className="text-base">It takes less than a minute.</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                {/* Name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="leading-5">First name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="leading-5">Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Phone + Sex */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="leading-5">Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+84 9xx xxx xxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="leading-5">Sex</FormLabel>
                        <FormControl>
                          <select
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="border-input bg-background shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-[3px]"
                          >
                            <option value={0}>Unknown</option>
                            <option value={1}>Male</option>
                            <option value={2}>Female</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="leading-5">Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street, City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of birth */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="leading-5">Date of birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="leading-5">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="name@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="leading-5">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={isPasswordVisible ? "text" : "password"}
                            placeholder="••••••••••••••••"
                            className="pr-9"
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

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="leading-5">Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={isConfirmVisible ? "text" : "password"}
                            placeholder="••••••••••••••••"
                            className="pr-9"
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

                {/* Optional terms */}
                <div className="flex items-center justify-between gap-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={isAcceptTerm}
                      onCheckedChange={() => setIsAcceptTerm((prev) => !prev)}
                      className="size-6 cursor-pointer"
                    />
                    <label htmlFor="acceptTerms" className="text-muted-foreground text-sm">
                      I agree to the terms & privacy policy
                    </label>
                  </div>
                </div>

                <Button disabled={isLoading || !isAcceptTerm} className="w-full cursor-pointer" type="submit">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-card-foreground hover:underline">
                Sign in
              </Link>
            </p>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <p>or</p>
              <Separator className="flex-1" />
            </div>

            <Button variant="ghost" className="w-full" asChild type="button">
              <a href="#">Sign up with google</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterForm