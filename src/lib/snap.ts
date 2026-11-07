// External market identifiers retained for /api/snap-market compatibility.
// A listing is not evidence of issuer authority or adopted protocol economics.
const DEFAULT_DEXSCREENER_API_URL =
  "https://api.dexscreener.com/latest/dex/pairs/ethereum/0x72a70a747a8390caf1aad3fb1de3564b55871f137539e498d30f02b1167742ea";

export const SNAP = {
  symbol: "SNAP",
  name: "Hypersnap",
  chain: "Ethereum",
  contract: "0x49B5a631F54927c0007232844f06FE18cbf69786",
  pairAddress: "0x72a70a747a8390caf1aad3fb1de3564b55871f137539e498d30f02b1167742ea",
  explorerUrl: "https://etherscan.io/token/0x49B5a631F54927c0007232844f06FE18cbf69786",
  dexscreenerUrl:
    "https://dexscreener.com/ethereum/0x72a70a747a8390caf1aad3fb1de3564b55871f137539e498d30f02b1167742ea",
  dexscreenerApiUrl:
    (typeof process !== "undefined" && process.env?.DEXSCREENER_PAIR_URL) ||
    DEFAULT_DEXSCREENER_API_URL,
  checkedAt: "2026-11-07T07:56:43Z",
  discussions: [
    {
      label: "Discussion #12 · Tokenomics alternatives",
      href: "https://github.com/orgs/farcasterorg/discussions/12",
      description: "Allocation, builder incentives and agent-policy alternatives; not adopted parameters.",
      evidence: "Proposal",
    },
    {
      label: "Discussion #19 · Contribution work markets",
      href: "https://github.com/orgs/farcasterorg/discussions/19",
      description: "Data availability, growth and application activity, with author claims about Ethereum distribution and a future bridge.",
      evidence: "Proposal / author claims",
    },
    {
      label: "November 2 · Full-client developer rewards",
      href: "https://github.com/farcasterorg/protocol/discussions/19#discussioncomment-19342869",
      description: "A maintainer intends app-FID-usage-attributed coverage for full-client developers and acknowledges the proposal's omission; not a payable entitlement.",
      evidence: "Maintainer clarification",
    },
    {
      label: "Discussion #20 · Token call",
      href: "https://github.com/orgs/farcasterorg/discussions/20",
      description: "Competing proposals and participant views, not formal ratification.",
      evidence: "Meeting discussion",
    },
    {
      label: "Discussion #25 · Activity Density Score",
      href: "https://github.com/orgs/farcasterorg/discussions/25",
      description: "Alternative commitment-weighted scoring and emissions, with draft eligibility and agent policy.",
      evidence: "Draft proposal",
    },
    {
      label: "Discussion #26 · Commitment-Weighted Work",
      href: "https://github.com/orgs/farcasterorg/discussions/26",
      description: "A separate OP ERC-20/operator-mediated-agent draft, not canonical Hypersnap tokenomics.",
      evidence: "Draft proposal",
    },
    {
      label: "Hypersnap PR #13 · Tokenization work",
      href: "https://github.com/farcasterorg/hypersnap/pull/13",
      description: "Open/unmerged at the checked date. Source work is not an activated reward mechanism.",
      evidence: "Open implementation PR",
    },
    {
      label: "Hypersnap PR #34 · Tokenization work",
      href: "https://github.com/farcasterorg/hypersnap/pull/34",
      description: "Open/unmerged at the checked date. Review discussion and implementation are not deployment or safety certification.",
      evidence: "Open implementation PR",
    },
  ],
} as const;

/** Keep legacy market-response fields, but withhold FDV without verified supply. */
export function correctedSnapFdv(priceUsd: number): null {
  void priceUsd;
  return null;
}
