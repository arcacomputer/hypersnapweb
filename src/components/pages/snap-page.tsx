import { BookOpen, GitPullRequest, Layers, ShieldCheck } from "lucide-react";
import { InnerPageHero } from "@/components/hero/inner-page-hero";
import { Badge, InfoPanel, LinkButton, Section, WarningPanel } from "@/components/ui";
import { SNAP } from "@/lib/snap";

const terms = [
  {
    title: "Snap embed",
    body: "A beta server-driven JSON/component-rendering standard and SDK with signed interactions. It is an interactive content format, not a token or a reward contract.",
    href: "https://github.com/farcasterorg/snap",
    label: "Snap source",
  },
  {
    title: "Mini App",
    body: "A hosted web app presented through a compatible host/webview, with SDK, wallet and authentication integrations. Availability depends on the host and its dependencies; it is not a Hypersnap node.",
    href: "https://github.com/farcasterorg/miniapps/tree/1cef64ecad40e66d4de86cc50362235bf344cbcc",
    label: "Mini Apps source",
  },
  {
    title: "Snap Compute",
    body: "A proposal for opt-in deterministic execution/replay and capabilities. It is distinct from current server-driven Snaps and is not proof of a deployed compute or reward network.",
    href: "https://github.com/orgs/farcasterorg/discussions/21",
    label: "Discussion #21",
  },
  {
    title: "SNAP ticker",
    body: "A symbol displayed by external Ethereum token/market listings. A shared name does not establish issuer authority, a native protocol asset, reward eligibility or governance adoption.",
    href: SNAP.explorerUrl,
    label: "External explorer listing",
  },
];

export function SnapPage() {
  return (
    <>
      <InnerPageHero
        accent="amber"
        eyebrow="Economics · public research"
        title="Follow the evidence, not a reward promise."
        description="Protocol reward mechanisms remain under public development. Proposals explore data availability, application usage and social contribution. Eligibility, parameters and activation require an adopted release; separate Ethereum listings and claimed distributions need their own provenance."
        actions={[
          { href: "#research", label: "Read the research" },
          { href: "#evidence", label: "Understand the evidence", variant: "secondary" },
        ]}
        aside={
          <div className="glass-panel rounded-2xl p-6">
            <Badge>Source status · November 7, 2026</Badge>
            <h2 className="mt-5 text-xl font-semibold text-white">Proposal ≠ activation</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Public discussion, open implementation, main source, release and verified deployment
              are separate evidence stages. Tokenization PRs #13 and #34 remained open/unmerged
              at this check.
            </p>
            <p className="mt-4 text-xs leading-6 text-slate-400">
              Checked <time dateTime={SNAP.checkedAt}>November 7, 2026 at 07:56 UTC</time>.
              Source-status research only; no wallet, distribution, bridge or deployed reward verification.
            </p>
          </div>
        }
      />

      <Section id="evidence" eyebrow="Evidence boundaries" title="What the sources do—and do not—establish.">
        <div className="grid gap-5 lg:grid-cols-2">
          <InfoPanel icon={BookOpen} title="Contribution markets are a proposal">
            <p>
              <a className="text-cyan-100 underline" href="https://github.com/orgs/farcasterorg/discussions/19">Discussion #19</a>{" "}
              explores contribution work markets for data availability, growth and application
              activity. A maintainer&apos;s{" "}
              <a className="text-cyan-100 underline" href="https://github.com/farcasterorg/protocol/discussions/19#discussioncomment-19342869">November 2 reply</a>{" "}
              intends usage-attributed rewards for full-client developers. Neither establishes a
              currently payable entitlement or a guaranteed return for operating a node.
            </p>
          </InfoPanel>
          <InfoPanel icon={ShieldCheck} title="Attribute distribution claims">
            <p>
              Discussion #19&apos;s author claims completed Ethereum retro distribution/vesting and
              a future same-asset bridge into Hypersnap. Those are attributed claims, not outcomes
              independently verified here. It would be inaccurate either to assert that no token
              exists or to present this listing as the adopted native protocol asset.
            </p>
          </InfoPanel>
        </div>
        <div className="mt-6">
          <WarningPanel>
            <p>
              No rewards, eligibility, earnings or launch date are promised. Registration hashcash
              in open <a className="text-cyan-100 underline" href="https://github.com/farcasterorg/hypersnap/pull/63">PR #63</a>{" "}
              is an onboarding anti-abuse mechanism, not the contribution-reward work-market design.
              Open code, a traded ticker or a proposal is not activation evidence.
            </p>
          </WarningPanel>
        </div>
      </Section>

      <Section id="research" eyebrow="Source trail" title="Read the competing designs."
        description="Each entry carries its evidence level. Discussion and PR statuses were checked November 7, 2026; this is not an adoption or deployment checklist.">
        <div className="grid gap-5 md:grid-cols-2">
          {SNAP.discussions.map((discussion) => (
            <InfoPanel icon={GitPullRequest} title={discussion.label} key={discussion.href}>
              <Badge>{discussion.evidence}</Badge>
              <p className="mt-4">{discussion.description}</p>
              <p className="mt-3 text-xs text-slate-400">Checked November 7, 2026</p>
              <div className="mt-5">
                <LinkButton href={discussion.href} variant="secondary" external>Read the source</LinkButton>
              </div>
            </InfoPanel>
          ))}
        </div>
      </Section>

      <Section id="names" eyebrow="Four different things" title="Snap is not one product or asset."
        description="Interactive embeds, hosted apps, proposed execution and a market ticker have different purposes and evidence requirements.">
        <div className="grid gap-5 md:grid-cols-2">
          {terms.map((term) => (
            <InfoPanel icon={Layers} title={term.title} key={term.title}>
              <p>{term.body}</p>
              <p className="mt-3 text-xs text-slate-400">{term.title === "Snap Compute" ? "Proposal" : term.title === "SNAP ticker" ? "External listing; provenance unresolved" : "Source documentation"} · checked November 7, 2026</p>
              <div className="mt-5">
                <LinkButton href={term.href} variant="secondary" external>{term.label}</LinkButton>
              </div>
            </InfoPanel>
          ))}
        </div>
      </Section>

      <Section id="external-listing" eyebrow="Separate evidence category" title="An external listing is not protocol economics."
        description="The existing Ethereum identifier is retained for transparent provenance and market-endpoint compatibility—not as an official-issuer endorsement.">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <Badge>External listing · unverified protocol relationship</Badge>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            Etherscan displayed a token labeled Hypersnap (SNAP) at the address below. An explorer&apos;s
            supply display does not establish a lifetime cap, bridge supply, issuer authority or
            protocol adoption. The reviewed primary sources do not substantiate the former site&apos;s
            total-supply, allocation or claim-phase figures, so no supply chart or derived FDV is presented.
            An unrelated draft&apos;s parameters are not a replacement.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.12em] text-slate-400">Listed Ethereum address · checked November 7, 2026</p>
          <p className="mt-2 break-all font-mono text-sm leading-7 text-cyan-100">{SNAP.contract}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href={SNAP.explorerUrl} variant="secondary" external>Inspect explorer record</LinkButton>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            The existing <code>/api/snap-market</code> endpoint remains an external Dexscreener feed;
            its legacy calculated-FDV fields are unavailable without verified supply. This research
            page does not load a market widget, connect a wallet or direct visitors to a claim flow.
          </p>
        </div>
      </Section>

      <Section id="open-questions" eyebrow="Before adoption" title="What still needs evidence?">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <ul className="list-disc space-y-3 pl-5 text-sm leading-7 text-slate-300">
            <li>Issuer/governance provenance linking any external asset to adopted protocol economics.</li>
            <li>Verified supply accounting, distribution receipts, bridge design and custody/security assumptions.</li>
            <li>Adopted eligibility, app attribution, anti-abuse rules and reward parameters—not just intended coverage.</li>
            <li>A reviewed implementation, release/activation decision and independently observed deployment.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="https://github.com/orgs/farcasterorg/discussions" external>Join the discussion</LinkButton>
            <LinkButton href="/run-a-node#verify" variant="secondary">Operator verification</LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
