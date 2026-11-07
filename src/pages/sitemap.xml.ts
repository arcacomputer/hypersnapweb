import type { APIRoute } from "astro";
import { getAllDocSlugs, sources } from "@/lib/sources";
import { SITE_URL } from "@/lib/seo";

const staticRoutes = ["", "/about", "/updates", "/network", "/snap", "/run-a-node", "/docs", "/contribute"];

export const GET: APIRoute = () => {
  const lastmod = sources.sourceUpdatedAt;

  const urls = [
    ...staticRoutes.map((route) => ({
      loc: `${SITE_URL}${route}`,
      lastmod,
      changefreq: route === "" ? "daily" : "weekly",
      priority: route === "" ? "1.0" : "0.8",
    })),
    ...getAllDocSlugs().map((slug) => ({
      loc: `${SITE_URL}/docs/${slug}`,
      lastmod,
      changefreq: "weekly",
      priority: "0.7",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
