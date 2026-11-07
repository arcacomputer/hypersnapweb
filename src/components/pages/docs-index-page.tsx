import { Bot, BookOpen, Braces, ExternalLink, FileText, Sparkles } from "lucide-react";
import { Link } from "@/components/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { InfoPanel, LinkButton, PageHeader, Section } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getDocsTree, getRepo, sources } from "@/lib/sources";

function resolveSectionEntry(
  sections: ReturnType<typeof getDocsTree>,
  candidateNames: string[],
): string {
  for (const candidate of candidateNames) {
    const section = sections.find(
      (item) => item.section.toLowerCase() === candidate.toLowerCase(),
    );
    const first = section?.links[0];
    if (first?.slug) {
      return `/docs/${first.slug}`;
    }
  }
  return "/docs";
}

type Icon = (props: { className?: string; "aria-hidden"?: boolean | "true" }) => React.ReactNode;

function PathCard({
  icon: IconComponent,
  title,
  body,
  ctaLabel,
  ctaHref,
  external = false,
}: {
  icon: Icon;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  external?: boolean;
}) {
  return (
    <InfoPanel icon={IconComponent as typeof Braces} title={title}>
      <p className="mb-4">{body}</p>
      {external ? (
        <a
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-200/90 hover:text-white"
          href={ctaHref}
          rel="noreferrer"
          target="_blank"
        >
          {ctaLabel}
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-200/90 hover:text-white"
          href={ctaHref}
        >
          {ctaLabel} →
        </Link>
      )}
    </InfoPanel>
  );
}

export function DocsIndexPage() {
  const docsRepo = getRepo("hypersnap-docs-web");
  const sections = getDocsTree();
  const introDoc = sections
    .flatMap((section) => section.links)
    .find((link) => link.slug === "introduction" || link.slug === "getting-started");

  const totalDocs = sections.reduce((acc, section) => acc + section.links.length, 0);
  const lastSync = formatDate(sources.sourceUpdatedAt);

  return (
    <>
      <PageHeader
        eyebrow="Docs"
        title="Read the docs without leaving the site."
        description="Every page here is rendered from the open source docs in farcasterorg/hypersnap-docs-web. The original repo is the source of truth — we mirror, link back, and keep things in sync."
      />

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <FileText aria-hidden="true" className="h-4 w-4 text-cyan-300/80" />
              {totalDocs} pages mirrored
            </span>
            <span>Last synced: {lastSync}</span>
            <a
              className="inline-flex items-center gap-1.5 text-cyan-200/90 hover:text-white"
              href={docsRepo?.url ?? "https://github.com/farcasterorg/hypersnap-docs-web"}
              rel="noreferrer"
              target="_blank"
            >
              View source repo
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
          {introDoc?.slug ? (
            <div className="mt-8">
              <LinkButton href={`/docs/${introDoc.slug}`}>Start reading</LinkButton>
            </div>
          ) : null}
        </Reveal>
      </div>

      <aside className="dev-note mx-auto max-w-6xl"><strong>Documentation ≠ deployment.</strong> These pages mirror upstream interfaces. Confirm network identity, node version, authentication and index completeness before relying on a route. <a href="/updates">Read current development and proposal status →</a></aside>
      <Section eyebrow="Paths" title="Pick the path that fits.">
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StaggerItem>
            <PathCard
              icon={Braces}
              title="Building an app"
              body="Explore documented APIs for users, casts, feeds, reactions, search and integrations. Availability and completeness depend on the selected node, version and index readiness."
              ctaLabel="Open API reference"
              ctaHref={resolveSectionEntry(sections, ["Read API reference", "Webhooks"])}
            />
          </StaggerItem>
          <StaggerItem>
            <PathCard
              icon={BookOpen}
              title="Running a node"
              body="Bootstrap script, port map, runbook, live status. Move from public reads into running your own piece of the network."
              ctaLabel="Operator guides"
              ctaHref="/run-a-node"
            />
          </StaggerItem>
          <StaggerItem>
            <PathCard
              icon={Bot}
              title="Coding with an AI agent"
              body="LLM-friendly index and full-spec exports help coding agents integrate without scraping HTML. Point your agent at /llms-full.txt."
              ctaLabel="Open AI agents guide"
              ctaHref={resolveSectionEntry(sections, ["For AI agents", "Agents"])}
            />
          </StaggerItem>
        </Stagger>
      </Section>

      <Section eyebrow="Browse" title="All sections.">
        <Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {sections.map((section) => (
              <div className="glass-panel rounded-2xl p-6" key={section.section}>
                <h3 className="text-lg font-semibold text-white">{section.section}</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.slug}>
                      <Link
                        className="text-slate-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
                        href={`/docs/${link.slug}`}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <div className="mx-auto w-full max-w-6xl px-6 pb-20 sm:px-8 lg:px-10">
        <Reveal>
          <div className="glass-panel rounded-2xl border-cyan-400/15 p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Sparkles aria-hidden="true" className="h-4 w-4 text-cyan-300" />
                  For AI agents
                </p>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                  Two plain-text endpoints are designed for coding agents: an index of all docs, and a
                  single concatenated file with everything inline.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/llms.txt" variant="secondary">
                  /llms.txt
                </LinkButton>
                <LinkButton href="/llms-full.txt" variant="secondary">
                  /llms-full.txt
                </LinkButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
