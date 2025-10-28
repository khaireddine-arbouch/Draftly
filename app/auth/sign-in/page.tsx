"use client";
import Google from "@/components/buttons/oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { signInForm, handleSignIn, isLoading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = signInForm;
  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form
        action=""
        className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]"
      >
        <div className="p-8 pb-6">
          <div>
            <h1 className="mb-1 mt-4 text-xl font-semibold">
              Sign In to Draftly
            </h1>
            <p className="text-sm">Welcome back! Sign in to continue</p>
          </div>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Username
              </Label>
              <Input type="email" required id="email" {...register("email")} className={errors.email ? "border-red-500" : ""}/>
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-sm">
                  Password
                </Label>
                <Button asChild variant="link" size="sm">
                  <Link href="/auth/forget-password">
                    Forgot your Password ?
                  </Link>
                </Button>
              </div>
              <Input
                type="password"
                required
                id="password"
                className={errors.password ? "border-red-500" : ""}
                {...register("password")}
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            {errors.root && <p className="text-red-500 text-sm text-center">{errors.root.message}</p>}

            <Button className="w-full" type="submit" onClick={handleSubmit(handleSignIn)} disabled={isLoading}>Sign In</Button>
            {isLoading && <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Signing in...
            </>}
          </div>


          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4 mb-4">
            <hr className="my-4 border-dashed" />
            <span className="text-muted-foreground text-xs">
              Or continue with
            </span>
            <hr className="my-4 border-dashed" />
          </div>

          <div className="">
            <Google/>
          </div>
        </div>

        <div className="bg-muted rounded-(--radius) border p-3">
          <p className="text-accent-foreground text-center text-sm">
            Don&apos;t have an account ?
            <Button asChild variant="link" className="px-2">
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
