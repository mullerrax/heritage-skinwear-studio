import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AdminRequest = Request & {
  adminUserId: string;
};

function getClaimString(
  claims: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = claims?.[key];
  return typeof value === "string" ? value : undefined;
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const configuredAdminIds = (process.env.ADMIN_CLERK_USER_IDS ??
    process.env.ADMIN_CLERK_USER_ID ??
    "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const configuredAdminEmails = (process.env.ADMIN_CLERK_USER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const sessionClaims = auth.sessionClaims as
    | Record<string, unknown>
    | undefined;
  const email =
    getClaimString(sessionClaims, "email") ??
    getClaimString(sessionClaims, "email_address");
  const metadata = sessionClaims?.metadata as
    | Record<string, unknown>
    | undefined;
  const hasOwnerRole = metadata?.role === "owner";
  const isConfiguredOwner =
    configuredAdminIds.includes(userId) ||
    (email ? configuredAdminEmails.includes(email.toLowerCase()) : false) ||
    hasOwnerRole;

  if (
    (configuredAdminIds.length > 0 || configuredAdminEmails.length > 0) &&
    !isConfiguredOwner
  ) {
    res.status(403).json({ error: "Owner access required" });
    return;
  }

  if (
    configuredAdminIds.length === 0 &&
    configuredAdminEmails.length === 0 &&
    !hasOwnerRole &&
    process.env.NODE_ENV === "production"
  ) {
    res.status(403).json({ error: "Owner access is not configured" });
    return;
  }

  (req as AdminRequest).adminUserId = userId;
  next();
}