import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ListAllReviewsResponse,
  ListApprovedReviewsResponse,
  ModerateReviewBody,
  ModerateReviewParams,
  ModerateReviewResponse,
  SubmitReviewBody,
  SubmitReviewResponse,
} from "@workspace/api-zod";
import { db, reviewsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

router.get("/reviews", async (_req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.approved, true))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(ListApprovedReviewsResponse.parse(reviews));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values(parsed.data).returning();
  res.status(201).json(SubmitReviewResponse.parse(review));
});

router.get("/admin/reviews", requireAdmin, async (_req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .orderBy(desc(reviewsTable.createdAt));

  res.json(ListAllReviewsResponse.parse(reviews));
});

router.patch(
  "/admin/reviews/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = ModerateReviewParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = ModerateReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [review] = await db
      .update(reviewsTable)
      .set({ approved: parsed.data.approved, updatedAt: new Date() })
      .where(eq(reviewsTable.id, params.data.id))
      .returning();

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json(ModerateReviewResponse.parse(review));
  },
);

export default router;