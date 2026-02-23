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
import { EyeIcon, EyeOffIcon } from "lucide-react"

import styles from "./pattern.module.css"
import { Spinner } from "@/components/ui/spinner"

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(5, "Email must be at least 5 characters long")
      .max(255, "Email must be less than 255 characters long")
      .email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(255, "Password must be less than 255 characters long"),
  })
  .strict();

const LoginForm = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false)

  const router = useRouter();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const response = await authApiRequest.login(
        values.email,
        values.password
      );

      if (!response?.payload?.success) {
        return handleErrorApi({ error: response?.payload, setError: form.setError, duration: 5000 });
      }

      const accessToken = response?.payload?.data?.accessToken;

      // set access token vào cookie của next server
       await fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      });


      // Decode JWT token để lấy role (không cần verify vì đã tin backend)
      const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
      const role = tokenPayload.role;

      toast.success("Login successful!", {
        style: {
          "--normal-bg":
            "light-dark(var(--color-green-600), var(--color-green-400))",
          "--normal-text": "var(--color-white)",
          "--normal-border":
            "light-dark(var(--color-green-600), var(--color-green-400))",
        } as React.CSSProperties,
      });

      // Redirect dựa vào role
      if (role === 3) {
        router.push("/admin/income");
      } else if (role === 2) {
        router.push("/seller");
      } else if (role === 1) {
        router.push("/admin/income");
      } else {
        router.push("/");
      }
    } catch (error) {
      handleErrorApi({ error, setError: form.setError, duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} relative flex h-auto min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8`}
      onPointerMove={(e) => {
        const el = containerRef.current;
        if (!el) return;

        // Avoid excessive style recalcs by batching into rAF
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 100;
          const y = ((e.clientY - r.top) / r.height) * 100;

          el.style.setProperty("--spot-x", `${x}%`);
          el.style.setProperty("--spot-y", `${y}%`);
        });
      }}
      onPointerLeave={() => {
        const el = containerRef.current;
        if (!el) return;
        el.style.setProperty("--spot-x", "50%");
        el.style.setProperty("--spot-y", "45%");
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      <Card
        className="z-1 w-full border-none shadow-md sm:max-w-lg"
        onPointerEnter={() => {
          const el = containerRef.current;
          if (!el) return;
          el.style.setProperty("--spot-size", "0px");
        }}
        onPointerLeave={() => {
          const el = containerRef.current;
          if (!el) return;
          // restore default spotlight size
          el.style.setProperty("--spot-size", "170px");
        }}
      >
        <CardHeader className="gap-6">
          <Logo className="gap-3" />

          <div>
            <CardTitle className="mb-1.5 text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-base text-center">
              Welcome back. Please sign in to continue.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel htmlFor="email" className="leading-5">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                        />
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
                    <FormItem className="w-full space-y-1">
                      <FormLabel htmlFor="password" className="leading-5">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            id="password"
                            type={isVisible ? "text" : "password"}
                            placeholder="••••••••••••••••"
                            className="pr-9"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsVisible((prev) => !prev)}
                            className="cursor-pointer text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                          >
                            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                            <span className="sr-only">
                              {isVisible ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between gap-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="rememberMe"
                      className="size-6 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-muted-foreground text-sm"
                    >
                      Remember Me
                    </label>
                  </div>

                  <Link
                    href="/forgot-password"
                    className="text-sm hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  className="w-full cursor-pointer"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      <div>Login</div>
                    </>
                  ) : (
                    <>
                      <div>Login</div>
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-muted-foreground text-center">
              Dont have an account?{" "}
              <Link
                href="/register"
                className="text-card-foreground hover:underline"
              >
                Sign up
              </Link>
            </p>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <p>or</p>
              <Separator className="flex-1" />
            </div>

            <Button variant="ghost" className="w-full" asChild type="button">
              <a href="#">Sign in with google</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
