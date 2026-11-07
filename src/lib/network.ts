import { sources } from "@/lib/sources";
import type { FarcasterNode, NetworkInfo, NetworkStatus, NodeHealthStatus } from "@/lib/types";

const INFO_ENDPOINT = `${sources.publicNode.baseUrl}${sources.publicNode.infoEndpoint}`;
const NODE_PROBE_TIMEOUT_MS = 10_000;

export const KNOWN_FARCASTER_NODES: FarcasterNode[] = [
  {
    name: "Hypersnap Public",
    rpcUrl: sources.publicNode.baseUrl,
    operator: "Hypersnap",
    network: "Hypersnap",
    note: "Canonical public Hypersnap node used by this site.",
  },
  {
    name: "Neynar Hub API",
    rpcUrl: "https://hub-api.neynar.com",
    publicUrl: "https://neynar.com",
    operator: "Neynar",
    network: "Farcaster",
    note: "Reachable hosted Farcaster hub API. It may require a paid/API-key plan, so auth-gated is not the same as offline.",
  },
  {
    name: "Pinata Hub",
    rpcUrl: "https://hub.pinata.cloud",
    publicUrl: "https://pinata.cloud",
    operator: "Pinata",
    network: "Farcaster",
    note: "Hosted Farcaster hub endpoint; usually blocks unauthenticated info probes.",
  },
  {
    name: "Standard Crypto Hub",
    rpcUrl: "https://hub.farcaster.standardcrypto.vc",
    operator: "Standard Crypto",
    network: "Farcaster",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isNetworkInfo(value: unknown): value is NetworkInfo {
  if (!isRecord(value)) return false;
  let recognizable = false;
  for (const key of ["version", "peer_id"]) {
    if (key in value) {
      if (typeof value[key] !== "string" || !value[key].trim()) return false;
      recognizable = true;
    }
  }
  for (const key of ["numShards", "nextEngineVersionTimestamp"]) {
    if (key in value && !nonNegativeNumber(value[key])) return false;
  }
  const countKeys = ["numMessages", "numFidRegistrations", "approxSize"];
  if ("dbStats" in value) {
    if (!isRecord(value.dbStats)) return false;
    for (const key of countKeys) {
      if (key in value.dbStats) {
        if (!nonNegativeNumber(value.dbStats[key])) return false;
        recognizable = true;
      }
    }
  }
  if ("shardInfos" in value) {
    if (!Array.isArray(value.shardInfos)) return false;
    for (const shard of value.shardInfos) {
      if (!isRecord(shard) || !nonNegativeNumber(shard.shardId) || !Number.isInteger(shard.shardId)) return false;
      for (const key of [...countKeys, "maxHeight", "blockDelay", "mempoolSize"]) {
        if (key in shard && !nonNegativeNumber(shard[key])) return false;
      }
    }
    recognizable ||= value.shardInfos.length > 0;
  }
  return recognizable;
}

function reportedFailure(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  if (value.ok === false || value.online === false || value.status === "offline" || value.status === "error") {
    return typeof value.error === "string" ? value.error
      : typeof value.message === "string" ? value.message : "Endpoint reports offline or failed status";
  }
  return undefined;
}

function statusForHttpCode(status: number): Pick<NodeHealthStatus, "state" | "ok" | "reachable" | "error"> {
  if ([401, 402, 403].includes(status)) {
    return {
      state: "auth-gated",
      ok: false,
      reachable: true,
      error: `HTTP ${status} — reachable, but not publicly readable without credentials`,
    };
  }

  return {
    state: "unreachable",
    ok: false,
    reachable: false,
    error: `HTTP ${status}`,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.message.toLowerCase().includes("timeout")) {
      return "Timed out";
    }
    return error.message;
  }

  return "Unknown error";
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const response = await fetch(INFO_ENDPOINT, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(NODE_PROBE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        ok: false,
        checkedAt: new Date().toISOString(),
        endpoint: INFO_ENDPOINT,
        info: null,
        error: `Node returned HTTP ${response.status}`,
      };
    }

    const info: unknown = await response.json();
    const failure = reportedFailure(info);
    const valid = isNetworkInfo(info) && !failure;

    return {
      ok: valid,
      checkedAt: new Date().toISOString(),
      endpoint: INFO_ENDPOINT,
      info: valid ? info : null,
      error: failure ?? (valid ? undefined : "Unexpected node response shape"),
    };
  } catch (error) {
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      endpoint: INFO_ENDPOINT,
      info: null,
      error: errorMessage(error),
    };
  }
}

async function checkNodeHealth(node: FarcasterNode): Promise<NodeHealthStatus> {
  const infoUrl = node.infoUrl ?? `${node.rpcUrl}/v1/info`;
  const start = Date.now();

  try {
    const response = await fetch(infoUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(NODE_PROBE_TIMEOUT_MS),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const classified = statusForHttpCode(response.status);
      return {
        node,
        ...classified,
        latencyMs,
        version: null,
        numShards: null,
        peerId: null,
      };
    }

    const data: unknown = await response.json();

    const failure = reportedFailure(data);
    if (!isNetworkInfo(data) || failure) {
      return {
        node,
        ok: false,
        reachable: true,
        state: "degraded",
        latencyMs,
        version: null,
        numShards: null,
        peerId: null,
        error: failure ?? "Unexpected response shape",
      };
    }

    const info = data as NetworkInfo;
    return {
      node,
      ok: true,
      reachable: true,
      state: "online",
      latencyMs,
      version: info.version ?? null,
      numShards: info.numShards ?? info.shardInfos?.length ?? null,
      peerId: info.peer_id ?? null,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      node,
      ok: false,
      reachable: false,
      state: "unreachable",
      latencyMs: latencyMs > NODE_PROBE_TIMEOUT_MS - 500 ? null : latencyMs,
      version: null,
      numShards: null,
      peerId: null,
      error: errorMessage(error),
    };
  }
}

export async function getNodeHealthStatuses(): Promise<NodeHealthStatus[]> {
  return Promise.all(KNOWN_FARCASTER_NODES.map(checkNodeHealth));
}
