"use client";

import { useEffect, useState } from "react";
import { Activity, Database, ExternalLink, GitCommit, LockKeyhole, Server, Wifi, WifiOff } from "lucide-react";
import { compactPeerId, formatBytes, formatExactNumber, formatNumber } from "@/lib/format";
import { StatCard, ShardCard } from "@/components/ui";
import type { NetworkStatus, NodeHealthStatus } from "@/lib/types";

const statusStyles = {
  online: {
    label: "Online",
    text: "text-emerald-300",
    icon: "text-emerald-300/80",
    dot: true,
  },
  "auth-gated": {
    label: "Auth gated",
    text: "text-amber-200",
    icon: "text-amber-200/80",
    dot: false,
  },
  degraded: {
    label: "Degraded",
    text: "text-amber-200",
    icon: "text-amber-200/80",
    dot: false,
  },
  unreachable: {
    label: "Unreachable",
    text: "text-rose-300",
    icon: "text-rose-400/80",
    dot: false,
  },
} as const;

function NodeHealthCard({ status, stale }: { status: NodeHealthStatus; stale: boolean }) {
  const style = stale ? { label: `Stale · last ${statusStyles[status.state].label.toLowerCase()}`, text: "text-slate-400", icon: "text-slate-400", dot: false } : statusStyles[status.state];
  const displayUrl = status.node.publicUrl ?? status.node.rpcUrl;

  return (
    <div className="glass-panel group relative min-w-0 overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-60" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{status.node.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {[status.node.operator, status.node.network].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {style.dot ? (
            <span className="pulse-live h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" aria-hidden="true" />
          ) : null}
          {status.state === "online" ? (
            <Wifi className={`h-4 w-4 ${style.icon}`} aria-hidden="true" />
          ) : status.state === "auth-gated" ? (
            <LockKeyhole className={`h-4 w-4 ${style.icon}`} aria-hidden="true" />
          ) : (
            <WifiOff className={`h-4 w-4 ${style.icon}`} aria-hidden="true" />
          )}
        </div>
      </div>
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Status</span>
          <span className={`font-medium ${style.text}`}>{style.label}</span>
        </div>
        {status.latencyMs !== null ? (
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Latency</span>
            <span className="font-mono text-slate-300">{status.latencyMs}ms</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Endpoint</span>
          <a
            className="inline-flex min-w-0 items-center gap-1 truncate font-mono text-cyan-200/80 hover:text-cyan-100"
            href={displayUrl}
            rel="noreferrer"
            target="_blank"
            title={displayUrl}
          >
            <span className="truncate">{new URL(displayUrl).host}</span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          </a>
        </div>
        {status.version ? (
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Version</span>
            <span className="font-mono text-slate-300">{status.version}</span>
          </div>
        ) : null}
        {status.numShards !== null ? (
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Shards</span>
            <span className="font-mono text-slate-300">{status.numShards}</span>
          </div>
        ) : null}
        {status.peerId ? (
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Peer</span>
            <span className="truncate font-mono text-slate-300" title={status.peerId}>
              {compactPeerId(status.peerId)}
            </span>
          </div>
        ) : null}
        {status.node.note ? <p className="pt-1 leading-5 text-slate-500">{status.node.note}</p> : null}
        {status.error ? (
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Probe</span>
            <span className={`truncate ${style.text}`} title={status.error}>
              {status.error}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type NetworkStatusPayload = NetworkStatus & { nodes?: NodeHealthStatus[] };

export function isStatusPayload(value: unknown): value is NetworkStatusPayload {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (typeof data.ok !== "boolean" || typeof data.checkedAt !== "string" || !Number.isFinite(Date.parse(data.checkedAt)) || typeof data.endpoint !== "string") return false;
  if (data.info !== null && (!data.info || typeof data.info !== "object" || Array.isArray(data.info))) return false;
  if (data.ok && (!data.info || Object.keys(data.info).length === 0)) return false;
  const info = data.info as NetworkStatus["info"];
  if (info) {
    if (info.version !== undefined && typeof info.version !== "string") return false;
    if (info.peer_id !== undefined && typeof info.peer_id !== "string") return false;
    if (info.dbStats !== undefined && (!info.dbStats || typeof info.dbStats !== "object" || Array.isArray(info.dbStats))) return false;
    if (info.shardInfos !== undefined && (!Array.isArray(info.shardInfos) || !info.shardInfos.every((shard) => shard && typeof shard.shardId === "number"))) return false;
  }
  if (data.nodes !== undefined && (!Array.isArray(data.nodes) || !data.nodes.every((node) =>
    node && typeof node === "object" && Object.hasOwn(statusStyles, node.state) && typeof node.reachable === "boolean" &&
    node.node && typeof node.node.name === "string" && typeof node.node.rpcUrl === "string" &&
    URL.canParse(node.node.publicUrl ?? node.node.rpcUrl) && /^https?:\/\//.test(node.node.publicUrl ?? node.node.rpcUrl) &&
    (node.peerId === null || typeof node.peerId === "string")
  ))) return false;
  return true;
}

export function NetworkStatusGrid({
  compact = false,
  initialStatus,
  initialNodes,
}: {
  compact?: boolean;
  initialStatus?: NetworkStatus;
  initialNodes?: NodeHealthStatus[];
}) {
  const [status, setStatus] = useState<NetworkStatus | null>(initialStatus ?? null);
  const [nodeStatuses, setNodeStatuses] = useState<NodeHealthStatus[]>(initialNodes ?? []);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let lastAttempt = 0;
    let controller: AbortController | undefined;
    let poll: number | undefined;

    async function load() {
      if (cancelled || inFlight) return;
      inFlight = true;
      lastAttempt = Date.now();
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 15_000);
      try {
        const response = await fetch("/api/network-status", { cache: "no-store", signal: controller.signal });
        const json: unknown = await response.json();
        if (!isStatusPayload(json)) throw new Error(`Unexpected status response (HTTP ${response.status})`);
        if (!response.ok && json.ok) throw new Error(`Status refresh HTTP ${response.status}`);
        if (cancelled) return;
        setStatus(json);
        setNodeStatuses(json.nodes ?? []);
        setHasRefreshed(true);
        setRefreshError(null);
        setNow(Date.now());
      } catch (error) {
        if (!cancelled) setRefreshError(error instanceof Error && error.name !== "AbortError" ? error.message : "Status refresh timed out");
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
        if (!cancelled) poll = window.setTimeout(() => { if (!document.hidden) void load(); }, 60_000);
      }
    }
    function onVisible() {
      setNow(Date.now());
      if (!document.hidden && Date.now() - lastAttempt >= 60_000) {
        window.clearTimeout(poll);
        void load();
      }
    }
    // Always replace build-time observations immediately, even on hidden startup.
    void load();
    const clock = window.setInterval(() => setNow(Date.now()), 15_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      controller?.abort();
      window.clearTimeout(poll);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!status) {
    return <div className="glass-panel rounded-2xl p-6" role="status">{refreshError ?? "Loading public endpoint observations…"}</div>;
  }

  const info = status.info;
  const shardInfos = info?.shardInfos ?? [];
  const shardCount = shardInfos.length > 0 ? shardInfos.length : info?.numShards;
  const includesShardZero = shardInfos.some((shard) => shard.shardId === 0);
  const delays = shardInfos.map((shard) => shard.blockDelay).filter((delay): delay is number => typeof delay === "number" && Number.isFinite(delay));
  const maxBlockDelay = delays.length ? Math.max(...delays) : undefined;
  const checkedAt = Date.parse(status.checkedAt);
  const stale = !hasRefreshed || !!refreshError || !Number.isFinite(checkedAt) || now - checkedAt > 90_000 || checkedAt > now + 30_000;

  const onlineCount = nodeStatuses.filter((n) => n.state === "online").length;
  const reachableCount = nodeStatuses.filter((n) => n.reachable).length;

  return (
    <div className="space-y-8">
      <p className={`text-sm leading-6 ${stale ? "text-amber-200" : "text-slate-400"}`} role="status">
        {stale ? "Stale / unverified observation" : "Latest endpoint observation"} · Checked: {status.checkedAt}.
        {refreshError ? ` Refresh failed: ${refreshError}. Earlier data is retained, not a new health result.` : !hasRefreshed ? " Refreshing the build-time snapshot…" : " Refreshes every minute while visible."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Public info endpoint"
          value={stale ? "Stale" : status.ok ? "Online" : "Unavailable"}
          detail={status.ok ? `Version ${info?.version ?? "unknown"}` : status.error}
        />
        <StatCard
          icon={Database}
          label="Messages reported"
          value={formatNumber(info?.dbStats?.numMessages)}
          detail={formatBytes(info?.dbStats?.approxSize)}
        />
        <StatCard
          icon={Server}
          label="Reported shards"
          value={formatExactNumber(shardCount)}
          detail={`${includesShardZero ? "Includes shard 0. " : ""}Max reported block delay: ${maxBlockDelay === undefined ? "Unknown" : formatExactNumber(maxBlockDelay)}${delays.length < shardInfos.length ? " (partial reporting)" : ""}`}
        />
        <StatCard
          icon={GitCommit}
          label={compact ? "Peer" : "FID registrations"}
          value={compact ? compactPeerId(info?.peer_id) : formatExactNumber(info?.dbStats?.numFidRegistrations)}
          detail={compact ? "Public node identity" : "Indexed from Farcaster identity state"}
        />
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-slate-400">
            Known Hypersnap + Farcaster endpoints
          </h3>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs tabular-nums text-slate-400">
            {onlineCount}/{nodeStatuses.length} public info online{stale ? " · stale" : ""}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs tabular-nums text-slate-400">
            {reachableCount}/{nodeStatuses.length} reachable{stale ? " · stale" : ""}
          </span>
        </div>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-slate-500">
          Public Hypersnap nodes expose <code className="font-mono text-slate-300">/v1/info</code>. Some Farcaster hosted hub providers are alive but intentionally return 401/402/403 without credentials; those are marked auth gated instead of falsely offline.
          {" "}Online means only a readable, recognizable info response. Archive completeness, consensus, fork agreement, and application readiness are not tested by this probe.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {nodeStatuses.map((nodeStatus) => (
            <NodeHealthCard key={nodeStatus.node.name} status={nodeStatus} stale={stale} />
          ))}
        </div>
      </div>
      {!compact ? <div className="grid gap-5 md:grid-cols-3">
        {shardInfos.map((shard) => <ShardCard key={shard.shardId} shardId={shard.shardId}
          maxHeight={formatExactNumber(shard.maxHeight)} blockDelay={shard.blockDelay === undefined ? "Unknown" : formatExactNumber(shard.blockDelay)}
          numMessages={formatExactNumber(shard.numMessages)} approxSize={formatBytes(shard.approxSize)} />)}
      </div> : null}
    </div>
  );
}
