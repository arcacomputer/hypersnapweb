import { ArrowRight, ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="hs-hero" aria-labelledby="hs-hero-title">
      <div className="hs-container hs-hero-layout">
        <div className="hs-hero-copy">
          <p className="hs-eyebrow"><span className="hs-mark" aria-hidden="true" /> Open-source social networking</p>
          <h1 id="hs-hero-title"><span>Hypersnap</span></h1>
          <p className="hs-hero-lead">A community-built fork of Farcaster.</p>
          <p className="hs-hero-description">Run a node. Build a social app. Help shape the network.<br />Hypersnap brings the software, tools and community together.</p>
          <div className="hs-actions">
            <a className="hs-button hs-button-primary" href="/about">What is Hypersnap? <ArrowRight aria-hidden="true" /></a>
            <a className="hs-button hs-button-secondary" href="/run-a-node">Run a node <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <a className="hs-text-link hs-operator-link" href="/snap">Looking for $SNAP? Read the token guide <ArrowRight aria-hidden="true" /></a>
        </div>
        <aside className="hs-snapshot" aria-labelledby="hs-snapshot-title">
          <p className="hs-eyebrow" id="hs-snapshot-title">The idea, simply</p>
          <h2>More people building.<br /><span>More ways to participate.</span></h2>
          <p className="hs-snapshot-summary">Farcaster is a shared foundation for social apps. Hypersnap starts from that software and develops its own community-led path.</p>
          <dl className="hs-snapshot-facts">
            <div><dt>Understand the project</dt><dd><a href="/about">Start here <ArrowRight aria-hidden="true" /></a></dd></div>
            <div><dt>Token &amp; rewards</dt><dd><a href="/snap">$SNAP guide <ArrowRight aria-hidden="true" /></a></dd></div>
            <div><dt>Make something</dt><dd><a href="/docs">Builder docs <ArrowRight aria-hidden="true" /></a></dd></div>
          </dl>
        </aside>
      </div>
      <div className="hs-container hs-hero-footnote">
        <span>Open source. Built in public. Still growing.</span>
        <a className="hs-text-link" href="/updates">See what’s new <ArrowRight aria-hidden="true" /></a>
      </div>
    </section>
  );
}
