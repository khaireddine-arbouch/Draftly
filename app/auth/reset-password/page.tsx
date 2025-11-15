"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const {
    resetPasswordForm,
    handlePasswordResetConfirmation,
    loadingState,
  } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = resetPasswordForm;
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");

  useEffect(() => {
    if (codeFromUrl) {
      setValue("code", codeFromUrl);
    }
  }, [codeFromUrl, setValue]);

  const isSubmitting = loadingState.resetPassword;

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form
        onSubmit={handleSubmit(handlePasswordResetConfirmation)}
        className="bg-card m-auto h-fit w-full max-w-lg rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]"
      >
        <div className="p-8 pb-6 space-y-6">
          <div>
            <h1 className="mb-1 mt-4 text-2xl font-semibold">Set a new password</h1>
            <p className="text-sm text-muted-foreground">
              Paste the 32-character code from your email and choose a new password.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm">
                Verification code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                placeholder="Paste the code from your inbox"
                {...register("code")}
                aria-invalid={errors.code ? "true" : "false"}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="text-sm">
                  Confirm password
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {errors.root && (
              <p className="text-red-500 text-sm text-center">
                {errors.root.message}
              </p>
            )}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Button asChild variant="link" className="px-1 text-sm">
              <Link href="/auth/sign-in">Back to sign in</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}

