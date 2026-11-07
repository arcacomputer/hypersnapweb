# Hypersnap.org

Community-maintained portal for Hypersnap node software, Farcaster APIs and open protocol development. Maintained by Felirami / Arca. Canonical website repository: `arcacomputer/hypersnapweb`.

## Stack and local checks

Astro static HTML + React islands + Tailwind. A small Cloudflare Worker handles `/api/*`; there is no Next.js/OpenNext runtime here.

```bash
npm ci
npm run dev
# http://localhost:4321
npm test
npm run lint
npm run typecheck
npm run build
```

Use the Node version required by the installed Astro release (Node 22.12+ or a supported newer release). `npm test` uses Node's type-stripping support; fixtures do not probe production or install dependencies.

## Content and evidence

- `src/data/development.ts`: manually curated developments, evidence levels, limitations and public source links. Advance `checkedAt` only after reviewing the linked upstream records. Open proposals must not be presented as deployed features.
- `/updates`: searchable/filterable developments; all entries and evidence disclosures remain readable without JavaScript.
- `src/data/farcasterorg-sources.json`: generated repository/docs metadata. Includes six public repositories, including the discussion-only `protocol` repository. A metadata refresh is **not** an editorial audit or deployment receipt.
- `npm run sync:sources`: refresh public sources. API errors fail the refresh rather than silently replacing the accepted snapshot with partial data. The scheduled workflow opens a reviewable PR; it does not automatically publish protocol claims.
- `/docs`, `/llms.txt`, `/llms-full.txt`: mirrored upstream documentation with source attribution. Documented endpoints do not establish availability on every node.
- `/snap`: economics research and provenance distinctions. Snap embeds, Mini Apps, proposed Snap Compute and token tickers are different things. No buy/claim flow or guaranteed reward promise.
- `/network`: selected public endpoint observations, not a validator registry, network census or application-correctness certificate. Only configured public endpoints may be probed. Never add private operator addresses or retired targets.

## Production website

`wrangler.jsonc` targets the **existing** Cloudflare Worker `hypersnap-web` serving `https://hypersnap.org`. This is no longer the old canary handoff. Preserve its `ASSETS` binding, static asset behavior, `/api/*` routing, compatibility date, security headers and observability. `workers_dev` and preview URLs stay disabled. This configuration creates no KV/R2/D1 resources.

Before publishing, compare active deployment and bindings with the accepted baseline. Build and qualify the source, then deploy only the website:

```bash
npm run build
npx wrangler deploy --dry-run
# Authorized website publisher only, with existing scoped credentials:
npx wrangler deploy
```

After publication, independently check the exact active Worker version, settings, public HTML/CSS, APIs, docs, installer download, sitemap and desktop/mobile behavior. Keep the previous Worker version for rollback; a failed acceptance must not be called a successful release. Do not change DNS or unrelated Workers to publish this site.

The `/api/network-status` and `/api/snap-market` routes remain available. Market data is an external observation, not proof of an official issuer, native protocol adoption or investment value. The operator helper download remains a separate attributed project.

## Boundaries

Website work does not authorize node rebuilds, restarts, database access, validator transitions, credential changes, signed actions or new spending. Do not publish private runbooks, node endpoints, configurations, raw logs or secrets. Source review, test results, releases and actual deployment evidence must remain separate.
