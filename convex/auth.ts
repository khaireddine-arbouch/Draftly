import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const passwordResetEmailProvider =
  process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM
    ? Resend({
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.AUTH_EMAIL_FROM,
      })
    : undefined;

if (!passwordResetEmailProvider) {
  console.warn(
    "[auth] Password reset emails are disabled. Set RESEND_API_KEY and AUTH_EMAIL_FROM to enable them.",
  );
}

const passwordProvider = Password({
  profile: params => {
    const email = String(params.email ?? "").trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required");
    }
    const firstName = String(
      params.firstName ?? params.firstname ?? "",
    ).trim();
    const lastName = String(params.lastName ?? params.lastname ?? "").trim();
    const flow = typeof params.flow === "string" ? params.flow : undefined;
    const displayName =
      (params.name as string) ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      email;
    return {
      email,
      name: displayName,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(flow === "signUp" ? { onboardedAt: Date.now() } : {}),
    };
  },
  validatePasswordRequirements: password => {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      throw new Error(
        "Password must include uppercase, lowercase letters, and a number",
      );
    }
  },
  reset: passwordResetEmailProvider,
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, passwordProvider],
  callbacks: {
    afterUserCreatedOrUpdated: async (ctx, args) => {
      await ctx.db.patch(args.userId, { lastLoginAt: Date.now() });
    },
  },
});