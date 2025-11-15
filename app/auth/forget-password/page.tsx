"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const { forgotPasswordForm, handlePasswordResetRequest, loadingState, passwordResetEmail } = useAuth()
    const { register, handleSubmit, formState: { errors } } = forgotPasswordForm
    const isSubmitting = loadingState.requestReset

    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <form
                onSubmit={handleSubmit(handlePasswordResetRequest)}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]">
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Recover password</h1>
                        <p className="text-sm text-muted-foreground">
                            We&apos;ll email you a secure link to set a new password.
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                id="email"
                                autoComplete="email"
                                placeholder="name@example.com"
                                {...register("email")}
                                aria-invalid={errors.email ? "true" : "false"}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">{errors.email.message}</p>
                            )}
                        </div>

                        {errors.root && (
                            <p className="text-red-500 text-sm text-center">
                                {errors.root.message}
                            </p>
                        )}

                        {passwordResetEmail && (
                            <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                If {passwordResetEmail} is on file, we just sent reset instructions. Check your inbox and spam folder.
                            </p>
                        )}

                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send reset link
                        </Button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            You&apos;ll receive a link that expires in 24 hours.
                        </p>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Remembered your password?
                        <Button
                            asChild
                            variant="link"
                            className="px-2 text-sm">
                            <Link href="/auth/sign-in">Log in</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
