import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  GitBranch,
  Layers3,
  Network,
  Server,
  Terminal,
} from "lucide-react";
import { HeroSection } from "@/components/hero/hero-section";
import { development } from "@/data/development";
import { creator } from "@/lib/creator";
import { formatNumber } from "@/lib/format";
import type { SnapMarketResponse } from "@/lib/snap-market";
import type { NetworkStatus, NodeHealthStatus } from "@/lib/types";

const paths = [
  {
    audience: "For the curious",
    title: "Understand the project",
    description: "Get the context behind the fork, then follow the decisions and development as they happen.",
    href: "/about",
    action: "Start with the overview",
    icon: BookOpen,
  },
  {
    audience: "For builders",
    title: "Find your starting point",
    description: "Explore the docs, public read interfaces, and source. Check what’s ready before building on it.",
    href: "/docs",
    action: "Explore the documentation",
    icon: Braces,
  },
  {
    audience: "For operators",
    title: "Run a piece of it",
    description: "Review the requirements, deployment guide, and operational checks before bringing a node online.",
    href: "/run-a-node",
    action: "Read the operator guide",
    icon: Terminal,
  },
];

const layers = [
  {
    number: "01",
    title: "Node",
    description: "The software that stores, syncs, and serves social data.",
    detail: "hypersnap · node implementation",
    href: "https://github.com/farcasterorg/hypersnap",
    icon: Server,
  },
  {
    number: "02",
    title: "Protocol",
    description: "The shared rules, proposals, and decisions being worked through in public.",
    detail: "protocol · public discussions",
    href: "https://github.com/farcasterorg/protocol",
    icon: Network,
  },
  {
    number: "03",
    title: "Apps",
    description: "Clients and experiments that explore the experience built on top.",
    detail: "client-snapshot · miniapps",
    href: "https://github.com/farcasterorg/client-snapshot",
    icon: Layers3,
  },
];

const updateLabels = {
  merged: "Merged source",
  proposal: "Proposal",
  discussion: "Discussion",
};

function snapshotDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function HomePage({
  networkStatus,
  networkNodes,
}: {
  // Retained for compatibility with the existing Astro page; market data lives at /snap.
  snapMarket?: SnapMarketResponse;
  networkStatus?: NetworkStatus;
  networkNodes?: NodeHealthStatus[];
}) {
  const trackedNodes = networkNodes ?? networkStatus?.nodes ?? [];
  const onlineNodes = trackedNodes.filter((node) => node.state === "online").length;
  const hasNodes = networkNodes !== undefined || networkStatus?.nodes !== undefined;
  const info = networkStatus?.info;
  const shardCount = info?.shardInfos?.length || info?.numShards;
  const telemetry = [
    {
      label: "Public node",
      value: networkStatus ? (networkStatus.ok ? "Responding" : "Check needed") : "Not sampled",
      detail: info?.version ? `Reported version ${info.version}` : "Public info endpoint probe",
    },
    {
      label: "Messages reported",
      value: formatNumber(info?.dbStats?.numMessages),
      detail: "Reported by the sampled node",
    },
    {
      label: "Reported shards",
      value: formatNumber(shardCount),
      detail: "From that node’s info response",
    },
    {
      label: "Tracked endpoints",
      value: hasNodes ? `${onlineNodes} / ${trackedNodes.length}` : "Not sampled",
      detail: "Public info online / tracked; not total network size",
    },
  ];

  return (
    <div className="hs-home">
      <HeroSection />

      <section className="hs-section hs-container" aria-labelledby="hs-updates-title">
        <div className="hs-section-heading">
          <div>
            <p className="hs-eyebrow">Latest developments</p>
            <h2 id="hs-updates-title">The work, not the hype.</h2>
            <p>Merged changes and open ideas, with a source for every update.</p>
          </div>
          <a className="hs-text-link" href="/updates">All updates <ArrowRight aria-hidden="true" /></a>
        </div>
        <div className="hs-update-grid">
          {development.updates.slice(0, 3).map((update) => (
            <article className="hs-update-card" key={update.id}>
              <div className="hs-card-meta">
                <span className={`hs-label hs-label-${update.status}`}>{updateLabels[update.status]}</span>
                <time dateTime={update.date}>{snapshotDate(update.date)}</time>
              </div>
              <h3><a href={update.url}>{update.title}</a></h3>
              <p>{update.summary}</p>
              <a className="hs-text-link" href={update.url} aria-label={`Read source: ${update.title}`}>
                Read source <ArrowUpRight aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
        <p className="hs-section-note">A merged change is not a deployment report. Proposals and discussions are not shipped features.</p>
      </section>

      <section className="hs-path-section" aria-labelledby="hs-paths-title">
        <div className="hs-container hs-section">
          <div className="hs-section-heading">
            <div>
              <p className="hs-eyebrow">Choose your path</p>
              <h2 id="hs-paths-title">A way in, wherever you start.</h2>
            </div>
          </div>
          <div className="hs-path-grid">
            {paths.map(({ icon: Icon, ...path }) => (
              <a className="hs-path-card" href={path.href} key={path.href}>
                <div className="hs-path-top"><span className="hs-eyebrow">{path.audience}</span><Icon aria-hidden="true" /></div>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <span className="hs-card-action">{path.action} <ArrowRight aria-hidden="true" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="hs-section hs-container" id="ecosystem" aria-labelledby="hs-ecosystem-title">
        <div className="hs-section-heading">
          <div>
            <p className="hs-eyebrow">The ecosystem</p>
            <h2 id="hs-ecosystem-title">Different layers. One open effort.</h2>
            <p>Nodes serve the data. Protocol work shapes the rules. Apps explore what people can do with them.</p>
          </div>
          <a className="hs-text-link" href="#project-sources">Find the project sources <ArrowRight aria-hidden="true" /></a>
        </div>
        <ol className="hs-layer-map" aria-label="Hypersnap project layers">
          {layers.map(({ icon: Icon, ...layer }) => (
            <li className="hs-layer" key={layer.title}>
              <div className="hs-layer-heading"><span className="hs-layer-number">{layer.number}</span><Icon aria-hidden="true" /></div>
              <h3>{layer.title}</h3>
              <p>{layer.description}</p>
              <a className="hs-text-link" href={layer.href}>{layer.detail} <ArrowUpRight aria-hidden="true" /></a>
            </li>
          ))}
        </ol>
        <div className="hs-repos-heading" id="project-sources"><GitBranch aria-hidden="true" /><h3>Find the source</h3><span>Public repositories</span></div>
        <div className="hs-repo-grid">
          {development.repos.map((repo) => (
            <a className="hs-repo-link" href={repo.url} key={repo.name}>
              <span><strong>{repo.name}</strong><span>{repo.role}</span></span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="hs-section-note">These are connected areas of development, not a guarantee that every Farcaster app or native API is ready.</p>
      </section>

      <section className="hs-telemetry-section" aria-labelledby="hs-network-title">
        <div className="hs-container hs-section">
          <div className="hs-section-heading">
            <div>
              <p className="hs-eyebrow">Public infrastructure</p>
              <h2 id="hs-network-title">A window into the endpoints.</h2>
              <p>A measured snapshot, not a claim about the whole network.</p>
            </div>
            <a className="hs-text-link" href="/network">Open network telemetry <ArrowRight aria-hidden="true" /></a>
          </div>
          <dl className="hs-telemetry-grid">
            {telemetry.map((metric) => (
              <div className="hs-metric" key={metric.label}>
                <dt>{metric.label}</dt>
                <dd><span>{metric.value}</span><p>{metric.detail}</p></dd>
              </div>
            ))}
          </dl>
          <div className="hs-telemetry-note">
            <p>Endpoint availability does not establish complete archives, fork adoption, validator decentralization, or native app readiness.</p>
            {networkStatus ? <span>Sampled <time dateTime={networkStatus.checkedAt}>{new Date(networkStatus.checkedAt).toISOString().replace("T", " ").slice(0, 19)} UTC</time> · open telemetry for current checks.</span> : <span>Open telemetry to check current endpoint availability.</span>}
          </div>
        </div>
      </section>

      <section className="hs-section hs-container hs-contribute" aria-labelledby="hs-contribute-title">
        <div>
          <p className="hs-eyebrow">Build in public</p>
          <h2 id="hs-contribute-title">The next chapter is open.</h2>
          <p>Code, documentation, testing, or a well-framed question. There’s more than one way to move the project forward.</p>
          <div className="hs-actions">
            <a className="hs-button hs-button-primary" href="/contribute">Find a way to contribute <ArrowRight aria-hidden="true" /></a>
            <a className="hs-text-link" href="https://github.com/farcasterorg">Follow the source <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="hs-stewardship" aria-label="Portal stewardship and token information">
          <p className="hs-eyebrow">An independently maintained portal</p>
          <p>Hypersnap.org is maintained by <a href={creator.website}>{creator.name}</a> / <a href="https://arca.computer">Arca</a>, contributing to the open Farcasterorg effort.</p>
          <a className="hs-text-link" href="/snap">Economics &amp; token provenance <ArrowUpRight aria-hidden="true" /></a>
        </aside>
      </section>
    </div>
  );
}
