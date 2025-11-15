"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PENDING_CHECKOUT_STORAGE_KEY } from "@/lib/billing";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncError, setSyncError] = useState<string | null>(null);

  const me = useQuery(api.user.getCurrentUser, {});

  const entitled = useQuery(
    api.subscription.hasEntitlement,
    me && me._id ? { userId: me._id as Id<"users"> } : "skip",
  );

  useEffect(() => {
    if (redirected.current) return;
    if (me === undefined) return;

    if (me === null) {
      redirected.current = true;
      router.replace("/auth/sign-in");
      return;
    }

    if (entitled) {
      redirected.current = true;
      router.replace("/dashboard");
    }
  }, [me, entitled, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (syncState !== "idle") return;

    const checkoutFromUrl = searchParams.get("checkout");
    let checkoutFromStorage: string | null = null;
    try {
      checkoutFromStorage = window.localStorage.getItem(
        PENDING_CHECKOUT_STORAGE_KEY,
      );
    } catch (error) {
      console.warn("[billing] Unable to read pending checkout", error);
    }
    const checkoutId = checkoutFromUrl ?? checkoutFromStorage;

    if (!checkoutId) return;

    let cancelled = false;

    const finalize = async () => {
      setSyncState("syncing");
      setSyncError(null);

      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId }),
        });

        if (!res.ok) {
          throw new Error("Payment confirmation failed");
        }

        if (!cancelled) {
          setSyncState("done");
          try {
            window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
          } catch (removeError) {
            console.warn(
              "[billing] Unable to clear pending checkout",
              removeError,
            );
          }
        }
      } catch (error) {
        if (cancelled) return;
        setSyncState("error");
        setSyncError(
          error instanceof Error
            ? error.message
            : "Unable to finalize payment right now.",
        );
      }
    };

    finalize();

    return () => {
      cancelled = true;
    };
  }, [searchParams, syncState]);

  const billingIdentifier = useMemo(() => {
    if (!me) return null;
    const user = me as Record<string, unknown>;

    if (isNonEmptyString(user.id)) {
      return user.id.trim();
    }

    const convexIdSource = user._id;
    if (isNonEmptyString(convexIdSource)) {
      return convexIdSource.trim();
    }
    if (convexIdSource != null) {
      const convexId = String(convexIdSource).trim();
      if (convexId) return convexId;
    }

    if (isNonEmptyString(user.name)) {
      return encodeURIComponent(user.name.trim());
    }

    return null;
  }, [me]);

  useEffect(() => {
    if (redirected.current) return;
    if (!me || entitled) return;
    if (!billingIdentifier) return;

    const t = setTimeout(() => {
      if (redirected.current) return;
      setTimedOut(true);
      redirected.current = true;
      router.replace(`/billing/${billingIdentifier}`);
    }, 45_000);

    return () => clearTimeout(t);
  }, [billingIdentifier, me, entitled, router]);

  const statusMessage = (() => {
    if (me === undefined) return "Checking your account…";
    if (me === null) return "Redirecting you to sign in…";
    if (entitled) return "All set! Redirecting to your dashboard…";
    if (syncState === "syncing") return "Securing your payment…";
    if (syncState === "error" && syncError) return syncError;
    if (timedOut) return "Taking longer than expected, sending you back to billing.";
    return "Verifying subscription status…";
  })();

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <div className="mb-3">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-[-2px]" />
      </div>
      <div className="mb-1 text-lg">Finalizing your subscription…</div>
      <div className="text-sm text-gray-500" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
};

export default Page;
  