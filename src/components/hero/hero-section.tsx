import { ArrowRight, ArrowUpRight, GitCommitHorizontal } from "lucide-react";
import { development } from "@/data/development";

export function HeroSection() {
  const checkedDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(development.checkedAt));

  return (
    <section className="hs-hero" aria-labelledby="hs-hero-title">
      <div className="hs-container hs-hero-layout">
        <div className="hs-hero-copy">
          <p className="hs-eyebrow"><span className="hs-mark" aria-hidden="true" /> The Hypersnap project</p>
          <h1 id="hs-hero-title">An open future<br />for <span>Farcaster.</span></h1>
          <p className="hs-hero-lead">Open social infrastructure, built in public.</p>
          <p className="hs-hero-description">
            A community fork effort exploring a more open Farcaster. Follow the code,
            read from public endpoints, and help shape what comes next.
          </p>
          <div className="hs-actions">
            <a className="hs-button hs-button-primary" href="/updates">
              What’s new <ArrowRight aria-hidden="true" />
            </a>
            <a className="hs-button hs-button-secondary" href="/docs">
              Build with Hypersnap <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <a className="hs-text-link hs-operator-link" href="/run-a-node">
            Here to run a node? Start with the operator guide <ArrowRight aria-hidden="true" />
          </a>
        </div>

        <aside className="hs-snapshot" aria-labelledby="hs-snapshot-title">
          <div className="hs-snapshot-heading">
            <p className="hs-eyebrow" id="hs-snapshot-title">Project snapshot</p>
            <span className="hs-label">In development</span>
          </div>
          <h2>Work in the open.<br /><span>Progress you can inspect.</span></h2>
          <p className="hs-snapshot-summary">{development.summary}</p>
          <dl className="hs-snapshot-facts">
            <div><dt>Project</dt><dd>Farcaster fork effort</dd></div>
            <div><dt>Public access</dt><dd><a href="/network">Read endpoints <ArrowUpRight aria-hidden="true" /></a></dd></div>
            <div><dt>Roadmap</dt><dd><a href="/updates">Merged work &amp; proposals <ArrowUpRight aria-hidden="true" /></a></dd></div>
          </dl>
          <div className="hs-snapshot-source">
            <span>Reviewed <time dateTime={development.checkedAt}>{checkedDate}</time></span>
            <a href={`https://github.com/farcasterorg/hypersnap/commit/${development.mainCommit}`} aria-label={`View Hypersnap source commit ${development.mainCommit.slice(0, 7)}`}>
              <GitCommitHorizontal aria-hidden="true" /> {development.mainCommit.slice(0, 7)}
            </a>
          </div>
        </aside>
      </div>
      <div className="hs-container hs-hero-footnote">
        <span>Open source. Source-linked. Still evolving.</span>
        <a className="hs-text-link" href="#ecosystem">How the pieces fit together <ArrowRight aria-hidden="true" /></a>
      </div>
    </section>
  );
}
