"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add at least one uppercase letter")
  .regex(/[a-z]/, "Add at least one lowercase letter")
  .regex(/\d/, "Add at least one number");

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const signUpSchema = z
  .object({
    email: z.string().email("Email is required"),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    terms: z
      .boolean()
      .refine(value => value, {
        message: "You must accept the terms to continue",
      }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter the email you used for Draftly"),
});

const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter your account email"),
    code: z.string().min(6, "Enter the code from your email"),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

type LoadingKey =
  | "signIn"
  | "signUp"
  | "requestReset"
  | "resetPassword"
  | "signOut";

export const useAuth = () => {
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();
  const [loadingState, setLoadingState] = useState<Record<LoadingKey, boolean>>({
    signIn: false,
    signUp: false,
    requestReset: false,
    resetPassword: false,
    signOut: false,
  });
  const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(
    null,
  );

  const setLoading = (key: LoadingKey, value: boolean) =>
    setLoadingState(prev => ({ ...prev, [key]: value }));

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      terms: false,
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignIn = async (data: SignInData) => {
    setLoading("signIn", true);
    signInForm.clearErrors("root");
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });
      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Invalid email or password";
      signInForm.setError("root", { message });
      toast.error(message);
    } finally {
      setLoading("signIn", false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setLoading("signUp", true);
    signUpForm.clearErrors("root");
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`.trim(),
        flow: "signUp",
      });
      toast.success("Account created – welcome to Draftly!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please try again.";
      signUpForm.setError("root", { message });
      toast.error(message);
    } finally {
      setLoading("signUp", false);
    }
  };

  const handlePasswordResetRequest = async (data: ForgotPasswordData) => {
    setLoading("requestReset", true);
    forgotPasswordForm.clearErrors("root");
    try {
      await signIn("password", {
        email: data.email,
        flow: "reset",
        redirectTo: "/auth/reset-password",
      });
      setPasswordResetEmail(data.email);
      toast.success(
        "If that email is on file, we just sent a secure reset link.",
      );
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to send reset email right now.";
      forgotPasswordForm.setError("root", { message });
      toast.error(message);
    } finally {
      setLoading("requestReset", false);
    }
  };

  const handlePasswordResetConfirmation = async (
    data: ResetPasswordData,
  ) => {
    setLoading("resetPassword", true);
    resetPasswordForm.clearErrors("root");
    try {
      await signIn("password", {
        email: data.email,
        flow: "reset-verification",
        code: data.code,
        newPassword: data.password,
      });
      toast.success("Password updated. You can now sign in.");
      router.push("/auth/sign-in");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to verify the code. Please try again.";
      resetPasswordForm.setError("root", { message });
      toast.error(message);
    } finally {
      setLoading("resetPassword", false);
    }
  };

  const handleSignOut = async () => {
    setLoading("signOut", true);
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/auth/sign-in");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setLoading("signOut", false);
    }
  };

  return {
    signInForm,
    signUpForm,
    forgotPasswordForm,
    resetPasswordForm,
    loadingState,
    passwordResetEmail,
    handleSignIn,
    handleSignUp,
    handlePasswordResetRequest,
    handlePasswordResetConfirmation,
    handleSignOut,
    signOut,
  };
};