# Heritage Skinwear Studio

An editorial storefront for a northern maker of handcrafted hide clothing and footwear, turning social traffic into WhatsApp enquiries.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/heritage-skinwear/src/App.tsx` — single-page site content, collection data, navigation, and WhatsApp enquiry behavior
- `artifacts/heritage-skinwear/src/index.css` — visual theme, responsive styles, motion, and typography tokens
- `artifacts/heritage-skinwear/index.html` — document metadata and social-share tags

## Architecture decisions

- The first release is a static React/Vite site with no database or API dependency.
- Product enquiries intentionally open WhatsApp with a product-specific prefilled message instead of using checkout.
- Copy uses northern-inspired and respectful language without inventing a specific nation, tribe, or ceremonial meaning.
- Product, image, and WhatsApp destination values are kept close to the page source for easy client handoff edits.

## Product

- Visitors can browse the maker story and collection from a Facebook link.
- Collection filters separate footwear, outerwear, and accessories.
- Product and site-wide enquiry actions open a WhatsApp conversation with availability, sizing, pricing, and shipping prompts.
- Responsive navigation and motion-enhanced editorial sections support desktop and mobile visitors.

## User preferences

- Keep the build free to host and easy for a first-time site builder to hand off.

## Gotchas

- Replace the placeholder WhatsApp destination in `artifacts/heritage-skinwear/src/App.tsx` before sharing the site publicly.
- The current product imagery is remote placeholder/editorial imagery; replace with the client’s own product photos for the final launch.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
