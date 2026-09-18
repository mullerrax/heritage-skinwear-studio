---
name: Production owner access
description: Why the owner dashboard uses an explicit Clerk user allowlist in production.
---

Production owner access is deny-by-default unless the owner’s Clerk user ID is configured through `ADMIN_CLERK_USER_ID`. Development may allow an authenticated Clerk user so the dashboard can be exercised before the owner identity is known.

**Why:** The public storefront must remain safe to publish without accidentally granting product, review, or image-upload permissions to any signed-in user.

**How to apply:** Configure the real owner ID before publishing or handing over the production dashboard; do not weaken the middleware to make production sign-in appear to work.