import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { development, statusLabels, type DevelopmentStatus } from "@/data/development";

const filters: Array<{ value: "all" | DevelopmentStatus; label: string }> = [
  { value: "all", label: "All work" },
  { value: "merged", label: "Merged source" },
  { value: "proposal", label: "Open proposals" },
  { value: "discussion", label: "Discussions" },
];

export function UpdatesPage() {
  const [filter, setFilter] = useState<"all" | DevelopmentStatus>("all");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = development.updates.filter((item) =>
    (filter === "all" || item.status === filter) &&
    `${item.title} ${item.summary} ${item.area} ${item.evidence}`.toLowerCase().includes(needle),
  );
  return (
    <div className="dev-page">
      <header className="dev-header">
        <a className="dev-back" href="/">Hypersnap / Development</a>
        <p className="dev-eyebrow">A project in motion</p>
        <h1>What’s changing.<br /><span>What it means.</span></h1>
        <p className="dev-lede">A source-linked field guide to the work on Hypersnap. See what has landed in code, what is still being proposed, and what needs verification on an actual node.</p>
        <div className="dev-meta">
          <span>Editorial check <time dateTime={development.checkedAt}>{development.checkedAt.slice(0, 10)} UTC</time></span>
          <a href={`https://github.com/farcasterorg/hypersnap/commit/${development.mainCommit}`} target="_blank" rel="noopener noreferrer">Reviewed main <code>{development.mainCommit.slice(0, 8)}</code> ↗</a>
        </div>
      </header>

      <section className="dev-legend" aria-label="How to read these updates">
        <div><span className="dev-badge dev-badge--merged">Merged source</span><p>Present in the reviewed upstream code. Not a deployment or correctness certificate.</p></div>
        <div><span className="dev-badge dev-badge--proposal">Open proposal</span><p>Under review. Consensus changes require coordinated adoption and activation.</p></div>
        <div><span className="dev-badge dev-badge--discussion">Discussion</span><p>A design conversation. Not a release schedule, adopted rule or reward promise.</p></div>
      </section>

      <section className="dev-feed" aria-labelledby="developments-heading">
        <div className="dev-section-heading"><div><p className="dev-eyebrow">Development log</p><h2 id="developments-heading">Follow the actual work.</h2></div><a className="dev-text-link" href="https://github.com/farcasterorg/hypersnap/pulls" target="_blank" rel="noopener noreferrer">All upstream pull requests <ArrowUpRight size={16} aria-hidden="true" /></a></div>
        <div className="dev-controls">
          <div className="dev-filters" role="group" aria-label="Filter developments by evidence level">
            {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
          </div>
          <label className="dev-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search developments</span><input type="search" placeholder="Search the work…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <p className="dev-result-count" role="status" aria-live="polite">{visible.length} of {development.updates.length} developments</p>
        <div className="dev-update-list">
          {visible.map((item) => <article className="dev-update" id={item.id} key={item.id}>
            <div className="dev-update-meta"><span className={`dev-badge dev-badge--${item.status}`}>{statusLabels[item.status]}</span><span>{item.area}</span><time dateTime={item.date}>{item.date}</time></div>
            <div className="dev-update-body"><h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}<ArrowUpRight size={19} aria-hidden="true" /></a></h3><p>{item.summary}</p>
              <details><summary>Evidence &amp; limitations</summary><p>{item.evidence}</p><ul>{item.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul></details>
            </div>
          </article>)}
        </div>
        {visible.length === 0 ? <div className="dev-empty"><h3>No matching developments.</h3><p>Try another phrase or evidence level.</p><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</button></div> : null}
        <noscript><p className="dev-note">All updates are shown. Enable JavaScript to use search and filters; source links and evidence disclosures work without it.</p></noscript>
      </section>

      <section className="dev-section" aria-labelledby="conversations-heading"><div className="dev-section-heading"><div><p className="dev-eyebrow">Longer conversations</p><h2 id="conversations-heading">The questions behind the code.</h2></div></div><div className="dev-theme-grid">{development.themes.map((theme) => <a className="dev-theme" key={theme.title} href={theme.url} target="_blank" rel="noopener noreferrer"><h3>{theme.title}<ArrowUpRight size={18} aria-hidden="true" /></h3><p>{theme.description}</p><span>Read the discussion ↗</span></a>)}</div></section>

      <section className="dev-section dev-readiness" aria-labelledby="readiness-heading"><p className="dev-eyebrow">An important distinction</p><h2 id="readiness-heading">A running node is a starting point.</h2><p>Consensus, historical archive replay, reconciliation, derived indexes and application correctness are different checks. A live info endpoint or a completed schema marker cannot establish all of them. A merged patch is not proof that a registry image—or any particular operator’s node—contains it.</p><div className="dev-actions"><a href="/network">Check public endpoints →</a><a href="/run-a-node#verify">Operator verification →</a></div></section>

      <aside className="dev-note"><strong>About this snapshot.</strong> These notes are curated from public repositories and organization discussions. They are not an exhaustive audit, a validator registry or a live activation tracker. Most implementation/history remains outside this review. Repository/docs synchronization is separate from editorial review; an automatic metadata refresh does not advance the date above. Follow the linked upstream records for subsequent changes.</aside>
    </div>
  );
}
