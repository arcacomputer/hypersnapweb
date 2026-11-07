import { Activity, Braces, RadioTower } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { NetworkStatusGrid } from "@/components/network-status";
import { CodeBlock, InfoPanel, PageHeader, Section } from "@/components/ui";
import type { NetworkStatus, NodeHealthStatus, SourceSnapshot } from "@/lib/types";

export function NetworkPage({ status, nodes, publicNode }: { status: NetworkStatus; nodes?: NodeHealthStatus[]; publicNode: SourceSnapshot["publicNode"] }) {
  return (
    <>
      <PageHeader
        eyebrow="Network access"
        title="Public endpoints, measured honestly."
        description="Read-only observations of the public Hypersnap endpoint and selected Farcaster hub providers. Endpoint availability is not proof of archive completeness, consensus, fork agreement, or application readiness."
      />
      <Section
        title="Public endpoint observations"
        description={`Primary info comes from ${publicNode.baseUrl}${publicNode.infoEndpoint}. The view refreshes on arrival and every minute while visible; failed refreshes leave earlier observations explicitly stale.`}
      >
        <Reveal><NetworkStatusGrid initialStatus={status} initialNodes={nodes} /></Reveal>
      </Section>
      <Section
        eyebrow="Access"
        title="Choose the right surface."
        description="Use the public endpoint for reads. Independent operator telemetry describes only that operator, not the entire network. Keep your own raw HTTP and gRPC listeners private or authenticated."
      >
        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <InfoPanel icon={Braces} title="Public HTTP API">
              <p className="mb-4">Public read endpoints use the Farcaster v2-compatible prefix; availability does not qualify every API or historical result.</p>
              <CodeBlock label="Base URL" command={`${publicNode.baseUrl}${publicNode.apiPrefix}`} />
            </InfoPanel>
          </StaggerItem>
          <StaggerItem>
            <InfoPanel icon={RadioTower} title="Primary node info">
              <p className="mb-4">Reported version, shard heights, and any available counters. Missing fields are unknown, not zero.</p>
              <CodeBlock label="Info endpoint" command={`curl ${publicNode.baseUrl}${publicNode.infoEndpoint} | jq .`} />
            </InfoPanel>
          </StaggerItem>
          <StaggerItem>
            <InfoPanel icon={RadioTower} title="Independent operator telemetry">
              <p className="mb-4">Arca operator aggregate telemetry separates chain progress from archive and application readiness. It is not a public raw-node API or network-wide measurement.</p>
              <a className="text-cyan-200 underline" href="https://stats.opencaster.org" target="_blank" rel="noreferrer">stats.opencaster.org ↗</a>
            </InfoPanel>
          </StaggerItem>
          <StaggerItem>
            <InfoPanel icon={Activity} title="Private local node">
              <p className="mb-4">Inspect your own listener locally. Protect HTTP 3381/tcp and gRPC 3383/tcp; peer gossip uses 3382/udp.</p>
              <CodeBlock label="Local status" command="curl http://localhost:3381/v1/info | jq ." />
            </InfoPanel>
          </StaggerItem>
        </Stagger>
      </Section>
    </>
  );
}
