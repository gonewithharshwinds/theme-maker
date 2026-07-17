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
    amount: 999,
    currency: "USD",
    recurringInterval: "month",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    startedAt: new Date(),
    customerId: "cust-123",
    checkoutId: "chk-123",
    createdAt: new Date(),
    modifiedAt: new Date(),
    endsAt: null,
    endedAt: null,
    canceledAt: null,
    discountId: null,
    customerCancellationReason: null,
    customerCancellationComment: null,
    metadata: null,
    customFieldData: null,
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
