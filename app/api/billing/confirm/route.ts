import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const toMs = (value: unknown): number | undefined => {
  if (!value) return undefined;
  if (typeof value === "number") return value;
  const date =
    typeof value === "string" ? Date.parse(value) : (value as Date).getTime?.();
  return Number.isFinite(date) ? Number(date) : undefined;
};

export async function POST(req: NextRequest) {
  const { checkoutId } = await req.json().catch(() => ({}));

  if (!checkoutId || typeof checkoutId !== "string") {
    return NextResponse.json(
      { error: "checkoutId is required" },
      { status: 400 },
    );
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Polar access token not configured" },
      { status: 500 },
    );
  }

  const polar = new Polar({
    server: process.env.POLAR_ENV === "sandbox" ? "sandbox" : "production",
    accessToken: process.env.POLAR_ACCESS_TOKEN,
  });

  try {
    const checkout = await polar.checkouts.get({ id: checkoutId });

    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout session not found" },
        { status: 404 },
      );
    }

    const subscriptionId =
      checkout.subscriptionId ??
      (checkout.metadata?.subscriptionId as string | undefined) ??
      null;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Checkout missing subscription reference" },
        { status: 400 },
      );
    }

    const subscription = await polar.subscriptions.get({ id: subscriptionId });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const metadataUserId =
      (subscription.metadata?.userId as string | undefined) ??
      (checkout.metadata?.userId as string | undefined) ??
      null;

    if (!metadataUserId) {
      return NextResponse.json(
        { error: "Subscription missing user metadata" },
        { status: 400 },
      );
    }

    const payload = {
      userId: metadataUserId as Id<"users">,
      polarCustomerId:
        subscription.customer?.id ??
        subscription.customerId ??
        checkout.customerId ??
        "",
      polarSubscriptionId: subscriptionId,
      productId:
        subscription.product?.id ?? subscription.productId ?? undefined,
      priceId: subscription.prices?.[0]?.id ?? undefined,
      planCode: subscription.product?.name ?? undefined,
      status: subscription.status ?? checkout.status ?? "active",
      currentPeriodEnd: toMs(subscription.currentPeriodEnd),
      trialEndsAt: toMs(subscription.trialEnd),
      cancelAt: toMs(subscription.endsAt),
      canceledAt: toMs(subscription.canceledAt),
      seats: subscription.seats ?? undefined,
      metadata: subscription,
      creditsGrantPerPeriod: 10,
      creditsRolloverLimit: 100,
    };

    const subscriptionIdInConvex = await fetchMutation(
      api.subscription.upsertFromPolar,
      payload,
    );

    const grantKey = `instant:${subscriptionId}:${
      payload.currentPeriodEnd ?? "first"
    }`;

    await fetchMutation(api.subscription.grantCreditsIfNeeded, {
      subscriptionId: subscriptionIdInConvex,
      idempotencyKey: grantKey,
      amount: payload.creditsGrantPerPeriod,
      reason: "instant-checkout",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[billing] Failed to confirm checkout", error);
    return NextResponse.json(
      { error: "Unable to confirm checkout" },
      { status: 500 },
    );
  }
}

