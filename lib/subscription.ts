"use server";

import { getMyAllTimeRequestCount } from "@/actions/ai-usage";
import { SubscriptionRequiredError } from "@/types/errors";
import { SubscriptionCheck } from "@/types/subscription";
import { NextRequest } from "next/server";
import { AI_REQUEST_FREE_TIER_LIMIT } from "./constants";
import { getCurrentUserId } from "./shared";
import { db } from "@/db";
import { subscription } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getMyActiveSubscription(
  userId: string
): Promise<typeof subscription.$inferSelect | null> {
  return {
    id: "local-sub",
    userId,
    status: "active",
    productId: process.env.NEXT_PUBLIC_TWEAKCN_PRO_PRODUCT_ID || "pro-product",
    priceId: "pro-price",
    variantId: "pro-variant",
    createdAt: new Date(),
    updatedAt: new Date(),
    endsAt: null,
  };
}

export async function validateSubscriptionAndUsage(userId: string): Promise<SubscriptionCheck> {
  return {
    canProceed: true,
    isSubscribed: true,
    requestsUsed: 0,
    requestsRemaining: Infinity,
  };
}

export async function requireSubscriptionOrFreeUsage(req: NextRequest): Promise<void> {
  // Always allowed
}
