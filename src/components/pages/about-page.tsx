import { ArrowUpRight } from "lucide-react";
import { development } from "@/data/development";
import { creator } from "@/lib/creator";

export function AboutPage() {
  return <div className="dev-page guide-page">
    <header className="dev-header"><p className="dev-eyebrow">Start here</p><h1>What is<br /><span>Hypersnap?</span></h1><p className="dev-lede">Hypersnap is a community-built fork of Farcaster: open-source software for running social-network nodes and building apps.</p><p className="guide-intro">The goal is simple: give more builders and communities the tools to operate and shape their social network.</p><div className="dev-actions"><a href="/run-a-node">Run a node →</a><a href="/snap">Explore $SNAP →</a><a href="/docs">Build an app →</a></div></header>

    <section className="dev-section" aria-labelledby="basics-heading"><p className="dev-eyebrow">The basics</p><h2 id="basics-heading">One project. A few different pieces.</h2><div className="dev-theme-grid guide-grid">
      <div className="dev-theme"><h3>The network</h3><p>Nodes store and share social data, such as posts and follows. Hypersnap is based on Farcaster and Snapchain’s open-source software.</p><a href="/network">See public node status →</a></div>
      <div className="dev-theme"><h3>The apps</h3><p>A client is the app people use to browse and post. Developers can use the APIs to build clients, tools and integrations.</p><a href="/docs">Read the builder docs →</a></div>
      <div className="dev-theme"><h3>The community</h3><p>Builders and operators work on the software, discuss changes and contribute documentation. You do not need to run a server to help.</p><a href="/contribute">Find a way to contribute →</a></div>
      <div className="dev-theme"><h3>$SNAP</h3><p>The token and economics discussions explore how contributions could be rewarded. The Ethereum listing and proposed network rewards need separate explanations.</p><a href="/snap">Read the $SNAP guide →</a></div>
    </div></section>

    <section className="dev-section" aria-labelledby="questions-heading"><p className="dev-eyebrow">Common questions</p><h2 id="questions-heading">A little more context.</h2>
      <details className="guide-disclosure"><summary>What does “fork of Farcaster” mean?</summary><p>A fork starts with existing open-source software and develops it in a different direction. Hypersnap builds on Farcaster’s data formats and Snapchain’s node software. This does not mean every app or service works unchanged.</p></details>
      <details className="guide-disclosure"><summary>Is the whole project finished?</summary><p>No. The node software, apps and protocol changes are at different stages. Public endpoints can be available while other features are still being developed. <a href="/updates">The development page</a> separates changes already in code from ideas under review.</p></details>
      <details className="guide-disclosure"><summary>Do I need to run a validator?</summary><p>No. You can build an app, contribute docs or run a read node. A read node serves data; a validator takes part in consensus. Joining the validator set is a separate process.</p></details>
      <details className="guide-disclosure"><summary>Where can I check the technical details?</summary><p>Start with the <a href="/docs">API docs</a>, <a href="/run-a-node#verify">operator checks</a> or <a href="/updates">development notes</a>. Feature support depends on the node and version you use.</p></details>
    </section>

    <section className="dev-section"><p className="dev-eyebrow">Follow along</p><h2>Built in public.</h2><p className="guide-intro">Code and community discussions live on GitHub. This website brings the main paths together.</p><div className="dev-actions"><a href="/updates">Latest updates →</a><a href="https://github.com/orgs/farcasterorg/discussions" target="_blank" rel="noopener noreferrer">Join the discussion ↗</a></div>
      <details className="guide-disclosure"><summary>Browse the source repositories</summary><div className="dev-theme-grid">{development.repos.map((repo) => <a className="dev-theme" href={repo.url} key={repo.name} target="_blank" rel="noopener noreferrer"><h3>{repo.name}<ArrowUpRight size={18} aria-hidden="true" /></h3><p>{repo.role}</p></a>)}</div></details>
    </section>
    <aside className="dev-note">Hypersnap.org is maintained by <a href={creator.website}>{creator.name}</a> and <a href="https://arca.computer">Arca</a> as a community contribution. It is not a validator registry or an authority for token claims. <a href="https://github.com/arcacomputer/hypersnapweb">Website source ↗</a></aside>
  </div>;
}
