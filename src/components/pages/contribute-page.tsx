import { CalendarClock, GitBranch, GitPullRequest, Lightbulb, Megaphone, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { InfoPanel, LinkButton, PageHeader, RepoCard, Section } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getPrimaryRepos, sources } from "@/lib/sources";

export function ContributePage() {
  const repos = getPrimaryRepos();

  return (
    <>
      <PageHeader
        eyebrow="Contribute"
        title="Anyone can help build it."
        description="Help make social infrastructure more independent. Contribute node code, documentation, design, application integration or carefully scoped operator feedback."
      />

      <Section
        eyebrow="Where the work lives"
        title="The public repositories."
        description={`Public work is distributed across the farcasterorg repositories and discussions. This repository/docs metadata snapshot was refreshed on ${formatDate(sources.sourceUpdatedAt)}.`}
      >
        <Stagger className="grid gap-6 lg:grid-cols-2">
          {repos.map((repo) => (
            <StaggerItem key={repo.name}>
              <RepoCard
                forks={repo.forks}
                language={repo.primaryLanguage ?? (repo.isEmpty ? "Empty repo" : "Repository")}
                name={repo.name}
                openIssues={repo.openIssues}
                stars={repo.stars}
                summary={repo.readmeSummary}
                url={repo.url}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section
        eyebrow="How to help"
        title="Every kind of contribution counts."
        description="You don't have to be a Rust engineer to make a difference. Here are some of the most useful places to start."
      >
        <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: GitBranch, title: "Write code", body: <>The protocol lives in <code className="font-mono text-cyan-200">farcasterorg/hypersnap</code>: Rust node logic, hyper mode, storage, gossip, snapshots. Issues are open and triaged in public.</> },
            { icon: GitPullRequest, title: "Improve the docs", body: "Reference pages, guides, examples, LLM-friendly exports — anything that helps the next person figure something out faster." },
            { icon: ShieldCheck, title: "Review what changed", body: "The site auto-syncs from source and opens a PR when things change. A second pair of eyes on those PRs keeps the portal honest." },
            { icon: Users, title: "Run a node", body: "The most direct way to make the network more decentralized. Every node added makes the whole thing harder to take down." },
          ].map((item) => (
            <StaggerItem key={item.title}>
              <InfoPanel icon={item.icon} title={item.title}>
                <p>{item.body}</p>
              </InfoPanel>
            </StaggerItem>
          ))}
          <StaggerItem>
            <InfoPanel icon={ShieldCheck} title="Improve node tooling">
              <p className="mb-4">
                The operator helper lives at{" "}
                <code className="font-mono text-cyan-200">arcabotai/hypersnapdoctor</code>: installer,
                doctor checks, sanitized reports, and safe repair workflows for people running nodes.
              </p>
              <LinkButton href="https://github.com/arcabotai/hypersnapdoctor" variant="secondary" external>
                Open toolkit repo
              </LinkButton>
            </InfoPanel>
          </StaggerItem>
          <StaggerItem>
            <InfoPanel icon={Megaphone} title="Tell people about it">
              <p>
                Decentralized networks grow when people know they exist. Share the project, write
                about it, talk about it.
              </p>
            </InfoPanel>
          </StaggerItem>
          <StaggerItem>
            <InfoPanel icon={Lightbulb} title="Bring ideas">
              <p>
                Open an issue, start a discussion, sketch a design. The project moves on the strength
                of its contributors&apos; thinking — yours included.
              </p>
            </InfoPanel>
          </StaggerItem>
        </Stagger>
      </Section>

      <Section
        eyebrow="Automation"
        title="How the site stays honest."
        description="A scheduled GitHub Action refreshes repository/docs metadata and opens a reviewable PR. The dated development notes are curated separately: metadata synchronization never certifies deployment or advances the editorial review date."
      >
        <Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            <InfoPanel icon={RefreshCw} title="Curated snapshots">
              <p>
                The sync imports a focused set of facts: repo metadata, README summaries, release
                data, docs indexes, public node details, bootstrap commands, and architecture notes.
              </p>
            </InfoPanel>
            <InfoPanel icon={CalendarClock} title="Daily, but only when there's news">
              <p>
                The workflow ignores timestamp churn — it only opens a PR when the source repos
                actually have meaningful updates.
              </p>
            </InfoPanel>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
