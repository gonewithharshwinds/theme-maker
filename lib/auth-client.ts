"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BASE_URL,
});

// Mock the session hook for local offline development
const originalUseSession = authClient.useSession;
authClient.useSession = () => {
  return {
    data: {
      user: {
        id: "local-user",
        name: "Local User",
        email: "local@tweakcn.local",
        image: "",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "local-session",
        userId: "local-user",
        token: "local-token",
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ipAddress: "127.0.0.1",
        userAgent: "local",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    isPending: false,
    error: null,
    refetch: async () => {},
  } as any;
};

