import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AdminRequest = Request & {
  adminUserId: string;
};

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

  const configuredAdminId = process.env.ADMIN_CLERK_USER_ID;
  if (
    configuredAdminId &&
    configuredAdminId !== userId
  ) {
    res.status(403).json({ error: "Owner access required" });
    return;
  }

  if (!configuredAdminId && process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Owner access is not configured" });
    return;
  }

  (req as AdminRequest).adminUserId = userId;
  next();
}