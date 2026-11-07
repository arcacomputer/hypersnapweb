// Editorial snapshot: review source links and statuses before changing checkedAt.
// This is deliberately separate from the automatic repository/docs metadata sync.
export type DevelopmentStatus = "merged" | "proposal" | "discussion";
export type DevelopmentUpdate = {
  id: string; title: string; summary: string; status: DevelopmentStatus;
  url: string; date: string; area: string; evidence: string;
  sources: Array<{ label: string; url: string }>;
};

export const development = {
  checkedAt: "2026-11-07T07:56:43Z",
  mainCommit: "c0ce1755d9b7058f79b41c1f236a2b9a7041d348",
  summary: "Public node reads are available. Source improvements are landing. Validator, relay and onboarding changes are being proposed—not declared activated here.",
  updates: [
    {
      id: "trending-generation", title: "Trending feeds follow the metrics generation", status: "merged", date: "2026-11-06", area: "Feeds",
      summary: "Feed readers now share the metrics writer’s handle and refresh cached rankings when the generation changes, as well as when the cache ages.",
      url: "https://github.com/farcasterorg/hypersnap/commit/c0ce1755d9b7058f79b41c1f236a2b9a7041d348",
      evidence: "Merged source, not a deployment receipt. Existing rankings can still serve during background refresh. Trending is a bounded ranking, not an exhaustive historical archive.",
      sources: [{ label: "Read the source change", url: "https://github.com/farcasterorg/hypersnap/commit/c0ce1755d9b7058f79b41c1f236a2b9a7041d348" }],
    },
    {
      id: "validator-set", title: "A proposed validator-set update", status: "proposal", date: "2026-11-06", area: "Network",
      summary: "PR #61 proposes changing the validator set. The volunteer thread is a place to coordinate participation, not a verified list of active validators.",
      url: "https://github.com/farcasterorg/hypersnap/pull/61",
      evidence: "Open at this editorial check. The eight proposed operator keys and future shard heights do not prove active independent validators. Review approval does not mean merged, released or activated. Do not change a node’s trust configuration based on a submission alone.",
      sources: [{ label: "Validator proposal #61", url: "https://github.com/farcasterorg/hypersnap/pull/61" }, { label: "Operator coordination #51", url: "https://github.com/farcasterorg/hypersnap/issues/51" }],
    },
    {
      id: "relay-cutover", title: "Relay and gossip cutover work", status: "proposal", date: "2026-11-06", area: "Interoperability",
      summary: "PR #62 proposes a bidirectional relay for compatible signed user messages and a height-coordinated gossip cutover. Destination validation and account constraints still apply.",
      url: "https://github.com/farcasterorg/hypersnap/pull/62",
      evidence: "Open, unmerged implementation. Selected implementation paths were reviewed, not tested. Publication to a mempool does not prove consensus inclusion. The relay excludes consensus records, L1 events and native identities; it is not universal cross-network parity.",
      sources: [{ label: "Relay proposal #62", url: "https://github.com/farcasterorg/hypersnap/pull/62" }],
    },
    {
      id: "free-onboarding", title: "A proposal for free onboarding", status: "proposal", date: "2026-11-06", area: "Identity",
      summary: "PR #63 proposes custody-signed, hashcash-gated native registration without an IdRegistry transaction, with native FIDs beginning at 2^32 and registry replication through shard 0.",
      url: "https://github.com/farcasterorg/hypersnap/pull/63",
      evidence: "Open implementation, not a live sign-up offer. Activation requires coordinated validators and gossip. Unlimited storage, phone performance and end-to-end client support are not established. Registration hashcash is distinct from proposed contribution rewards.",
      sources: [{ label: "Onboarding proposal #63", url: "https://github.com/farcasterorg/hypersnap/pull/63" }],
    },
    {
      id: "profile-pins", title: "Portable profile pinned casts", status: "proposal", date: "2026-11-05", area: "Profiles",
      summary: "PR #60 proposes carrying pinned-cast references with profile data instead of keeping them only in one client’s database.",
      url: "https://github.com/farcasterorg/hypersnap/pull/60",
      evidence: "Type 15 and V25 are provisional. Coordinated validator changes and client support are required; no mainnet/testnet activation schedule is established by this proposal.",
      sources: [{ label: "Profile-pins proposal #60", url: "https://github.com/farcasterorg/hypersnap/pull/60" }],
    },
    {
      id: "metrics-reconstruction", title: "Safer metrics reconstruction in source", status: "merged", date: "2026-11-05", area: "Indexing",
      summary: "Main includes separate-generation cast-metrics reconstruction and staged daily-statistics repair, with persistent progress and publication boundaries.",
      url: "https://github.com/farcasterorg/hypersnap/commit/75f1c61d209d49d1b8c6f63d0ec0df8f9b058d58",
      evidence: "A source implementation is not proof of correct history on a node. Daily-statistics repair refuses incomplete retained history; cast-metrics reconstruction has its own archive/reconciliation prerequisites. Optional daily stats can be disabled.",
      sources: [{ label: "Metrics replacement", url: "https://github.com/farcasterorg/hypersnap/blob/75f1c61d209d49d1b8c6f63d0ec0df8f9b058d58/src/api/metrics/replacement.rs" }, { label: "Daily-statistics repair", url: "https://github.com/farcasterorg/hypersnap/blob/75f1c61d209d49d1b8c6f63d0ec0df8f9b058d58/src/api/daily_stats/repair.rs" }],
    },
    {
      id: "search-graph", title: "Search, graph and index-recovery improvements", status: "merged", date: "2026-11-05", area: "Indexing",
      summary: "Merged PRs add search pagination improvements, replacement-generation social-graph rebuilding and recovery for selected replay-safe indexes.",
      url: "https://github.com/farcasterorg/hypersnap/pull/59",
      evidence: "PRs #56, #57 and #59 merged on November 5. Each node still needs a matching build, completed reconstruction and content-level checks; a schema flag alone does not prove readiness.",
      sources: [{ label: "Search #59", url: "https://github.com/farcasterorg/hypersnap/pull/59" }, { label: "Graph rebuilding #57", url: "https://github.com/farcasterorg/hypersnap/pull/57" }, { label: "Index recovery #56", url: "https://github.com/farcasterorg/hypersnap/pull/56" }],
    },
    {
      id: "protocol-design", title: "The protocol conversation is still open", status: "discussion", date: "2026-11-07", area: "Protocol",
      summary: "Functional signers, native channels, mini-app discovery, moderation, compute and contribution incentives are being discussed in the open.",
      url: "https://github.com/orgs/farcasterorg/discussions",
      evidence: "Discussion is not adoption. Token, proof-of-work and reward proposals do not establish activated consensus rules, current economics or guaranteed operator income. This date is the editorial review date, not a claimed new protocol release.",
      sources: [{ label: "Browse organization discussions", url: "https://github.com/orgs/farcasterorg/discussions" }],
    },
  ] satisfies DevelopmentUpdate[],
  themes: [
    { title: "Identity & delegation", description: "Functional signers explore delegated permissions, recovery and revocation. Presentation metadata is not signing authority.", url: "https://github.com/orgs/farcasterorg/discussions/11" },
    { title: "Open consensus", description: "Validator participation and network transitions need explicit coordination and activation evidence.", url: "https://github.com/orgs/farcasterorg/discussions/13" },
    { title: "Portable social surfaces", description: "Native channels, mini-app discovery, query interfaces and moderation are protocol design conversations, not a feature-parity guarantee.", url: "https://github.com/orgs/farcasterorg/discussions/14" },
    { title: "Contribution & incentives", description: "Proof of work, quality, compute and attribution proposals are evolving. Running a node is not a guaranteed token-reward programme.", url: "https://github.com/orgs/farcasterorg/discussions/19" },
  ],
  repos: [
    { name: "hypersnap", role: "Rust node, storage, consensus, replay and native APIs.", url: "https://github.com/farcasterorg/hypersnap" },
    { name: "protocol", role: "Organization discussions, proposals and design history—not a node implementation.", url: "https://github.com/farcasterorg/protocol" },
    { name: "hypersnap-docs-web", role: "HTTP API and integration documentation. A documented route is not a live capability guarantee.", url: "https://github.com/farcasterorg/hypersnap-docs-web" },
    { name: "client-snapshot", role: "Reference mobile/web client snapshot. Backend, identity and distribution ownership remain integration work.", url: "https://github.com/farcasterorg/client-snapshot" },
    { name: "snap", role: "Server-driven interactive embeds rendered by clients. Snaps are distinct from Mini App webviews.", url: "https://github.com/farcasterorg/snap" },
    { name: "miniapps", role: "SDK, host and backend integration packages. SDK support is not proof of a fully independent deployment.", url: "https://github.com/farcasterorg/miniapps" },
  ],
};

export const statusLabels: Record<DevelopmentStatus, string> = {
  merged: "Merged source", proposal: "Open proposal", discussion: "Discussion",
};
