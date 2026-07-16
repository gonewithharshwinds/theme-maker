import { UnauthorizedError } from "@/types/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { User } from "better-auth";

export async function getCurrentUserId(req?: NextRequest): Promise<string> {
  return "local-user";
}

export async function getCurrentUser(req?: NextRequest): Promise<User> {
  return {
    id: "local-user",
    name: "Local User",
    email: "local@tweakcn.local",
    emailVerified: true,
    image: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function logError(error: Error, context?: Record<string, unknown>) {
  console.error("Action error:", error, context);

  if (error.name === "UnauthorizedError" || error.name === "ValidationError") {
    console.warn("Expected error:", { error: error.message, context });
  } else {
    console.error("Unexpected error:", {
      error: error.message,
      stack: error.stack,
      context,
    });
  }
}
