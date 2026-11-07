export type DocTocItem = {
  depth: number;
  text: string;
  id: string;
};

export type SourceDocLink = {
  title: string;
  section: string;
  sourcePath: string;
  githubUrl: string;
  slug?: string;
  contentHtml?: string;
  contentMarkdown?: string;
  toc?: DocTocItem[];
};

export type SourceRepo = {
  name: string;
  description: string;
  url: string;
  defaultBranch: string;
  sourceCommit?: string;
  isEmpty: boolean;
  primaryLanguage: string | null;
  license: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  updatedAt: string;
  latestRelease: {
    tagName: string;
    name: string;
    url: string;
    publishedAt: string;
  } | null;
  readmeSummary: string;
  readmeHeadings: string[];
  docsLinks: SourceDocLink[];
  sourceFacts: {
    publicNodeReferences: string[];
    architectureNotes: string[];
    nodeRequirements: string[];
  };
};

export type SourceSnapshot = {
  schemaVersion: number;
  organization: {
    login: string;
    name: string;
    url: string;
    avatarUrl: string;
    publicRepoCount: number;
    createdAt: string;
  };
  sourceUpdatedAt: string;
  collectedAt?: string;
  publicNode: {
    baseUrl: string;
    infoEndpoint: string;
    apiPrefix: string;
  };
  node: {
    bootstrapCommand: string;
    nightlyCommand: string;
    commands: Array<{ label: string; command: string }>;
    requirements: string[];
    ports: string[];
    noRewardsNotice: string;
  };
  repos: SourceRepo[];
};

export type NetworkInfo = {
  dbStats?: {
    numMessages?: number;
    numFidRegistrations?: number;
    approxSize?: number;
  };
  numShards?: number;
  shardInfos?: Array<{
    shardId: number;
    maxHeight?: number;
    numMessages?: number;
    numFidRegistrations?: number;
    approxSize?: number;
    blockDelay?: number;
    mempoolSize?: number;
  }>;
  version?: string;
  peer_id?: string;
  nextEngineVersionTimestamp?: number;
};

export type NetworkStatus = {
  ok: boolean;
  checkedAt: string;
  endpoint: string;
  info: NetworkInfo | null;
  error?: string;
  nodes?: NodeHealthStatus[];
};

export type NodeHealthState = "online" | "auth-gated" | "degraded" | "unreachable";

export type FarcasterNode = {
  name: string;
  rpcUrl: string;
  infoUrl?: string;
  publicUrl?: string;
  operator?: string;
  network?: "Hypersnap" | "Farcaster";
  note?: string;
};

export type NodeHealthStatus = {
  node: FarcasterNode;
  ok: boolean;
  reachable: boolean;
  state: NodeHealthState;
  latencyMs: number | null;
  version: string | null;
  numShards: number | null;
  peerId: string | null;
  error?: string;
};
