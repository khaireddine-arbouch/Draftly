import { NextRequest, NextResponse } from 'next/server';
import {Polar} from '@polar-sh/sdk';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const polar = new Polar({
    server: process.env.POLAR_ENV === "sandbox" ? "sandbox" : "production",
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
  });

  try {
    const session = await polar.checkouts.create({
      products: [process.env.POLAR_STANDARD_PLAN!],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      metadata: {
        userId,
      },
    });

    if (!session.url) {
      console.error("Checkout session created but no URL returned");
      return NextResponse.json({ error: "Checkout session creation failed" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, checkoutId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Checkout session creation failed" }, { status: 500 });
  }
}
