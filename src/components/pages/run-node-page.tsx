import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CalendarClock,
  CircleCheck,
  Clock,
  Cloud,
  Compass,
  Cpu,
  Gauge,
  HardDrive,
  Heart,
  Home,
  KeyRound,
  Lock,
  MessagesSquare,
  Network,
  RefreshCw,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Wifi,
} from "lucide-react";
import { Badge, CodeBlock, InfoPanel, LinkButton, PageHeader, WarningPanel } from "@/components/ui";
import { NodeInfoChecker } from "@/components/node-info-checker";
import { RunNodeToc } from "@/components/run-node-toc";
import { sources } from "@/lib/sources";
import type { ComponentType, ReactNode, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// ---- COMMANDS -----------------------------------------------------------

const PREFLIGHT_COMMAND = `lsb_release -a
nproc
free -h
lsblk -f
df -h
ip -brief addr`;

const INSTALL_COMMAND = `mkdir -p ~/hypersnap
cd ~/hypersnap
${sources.node.bootstrapCommand}`;

const TOOLKIT_INSTALL_COMMAND = `curl -fsSL https://hypersnap.org/install.sh | bash`;

const TOOLKIT_DOCTOR_COMMAND = `hypersnap doctor
hypersnap share`;

const CATCHUP_COMMAND = `cd ~/hypersnap
./hypersnap.sh logs
# In another terminal:
curl -s http://127.0.0.1:3381/v1/info | jq .`;

const CONFIRM_COMMAND = `cd ~/hypersnap
docker compose ps
curl -s http://127.0.0.1:3381/v1/info | jq '{version, peer_id, shardInfos: [.shardInfos[] | {shardId, maxHeight, blockDelay}]}'`;

const UPGRADE_COMMAND = `# Only after reviewing the exact release and preserving a cold rollback.
cd ~/hypersnap
./hypersnap.sh upgrade
docker compose ps
curl -s http://127.0.0.1:3381/v1/info | jq '.version'`;

const SSH_HARDENING_COMMAND = `# Read-only inspection on the server; no configuration change or reload.
sudo sshd -t
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication|authenticationmethods|allowusers|allowgroups) '
# Match rules may change the effective policy for your user/address.
# Keep this session open. Test a SECOND key-based sudo login and
# a provider rescue/console path before planning any access changes.`;

const AUTO_UPDATES_COMMAND = `sudo apt update
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades`;

const DIAGNOSTICS_COMMAND = `cd ~/hypersnap 2>/dev/null || true
printf '\\n== host ==\\n'
hostnamectl 2>/dev/null || uname -a
printf '\\n== resources ==\\n'
nproc; free -h; df -h
printf '\\n== docker containers ==\\n'
docker ps -a --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}' 2>&1
printf '\\n== compose ps ==\\n'
(docker compose ps || docker-compose ps) 2>&1
printf '\\n== ports ==\\n'
ss -tulpen | grep -E '3381|3382|3383' || true
printf '\\n== info endpoint ==\\n'
curl -fsS --connect-timeout 5 http://127.0.0.1:3381/v1/info 2>&1 || true
printf '\\n== recent logs ==\\n'
(docker compose logs --tail 120 hypersnap || docker-compose logs --tail 120 hypersnap) 2>&1`;

const FRIEND_INSTALL_MESSAGE = `Please paste terminal output, not screenshots.

If this is a fresh Hypersnap install, use the bootstrap flow — not raw \`docker run\`:

mkdir -p ~/hypersnap
cd ~/hypersnap
${sources.node.bootstrapCommand}

Read the script and pin a reviewed revision before running it. A bootstrap reward notice is not proof about token existence or eligibility. Running a node does not guarantee earnings.`;

const FRIEND_DEBUG_MESSAGE = `Please run this and paste the full text output:

cd ~/hypersnap 2>/dev/null || true
docker ps -a
(docker compose ps || docker-compose ps) 2>&1
(docker compose logs --tail 120 hypersnap || docker-compose logs --tail 120 hypersnap) 2>&1
df -h
curl -s http://127.0.0.1:3381/v1/info || true`;

// ---- TROUBLESHOOTING ----------------------------------------------------

const TROUBLESHOOTING: Array<{ title: ReactNode; open?: boolean; body: ReactNode }> = [
  {
    title: "Container exits with code 1 after a manual docker run",
    open: true,
    body: (
      <p>
        Most common cause: starting the image without the generated <code>config.toml</code> or the
        right volume mounts. Stop creating new failed containers, read logs from the latest one, and
        switch to the bootstrap / Compose flow.
      </p>
    ),
  },
  {
    title: <><code className="font-mono text-cyan-100">docker ps</code> is empty</>,
    body: (
      <p>
        No running container. Run <code>docker ps -a</code> to see failed/stopped containers, then
        read logs from the newest failed one.
      </p>
    ),
  },
  {
    title: <><code className="font-mono text-cyan-100">/v1/info</code> refuses connection during the first sync</>,
    body: (
      <p>
        Often normal during snapshot bootstrap. Check the logs for snapshot chunk progress before
        declaring the node dead. There is no fixed endpoint-start or full-readiness deadline;
        inspect the current phase and resource usage.
      </p>
    ),
  },
  {
    title: "Ports look closed from outside",
    body: (
      <p>
        Separate the layers: cloud firewall, host firewall (UFW), Docker port mapping, app
        readiness. If packets reach the server but the app returns RST, it&apos;s the app, not the
        firewall. <code>sudo ss -tulpen | grep 3381</code> on the host tells you whether the
        process is actually listening.
      </p>
    ),
  },
  {
    title: "Disk hits 100% during snapshot import",
    body: (
      <p>
        Don&apos;t blindly delete snapshot artifacts. Run <code>df -h</code> and{" "}
        <code>du -xhd1 ~/hypersnap</code> first. Prefer expanding storage over cleanup unless you
        can prove a staging directory is stale and unused.
      </p>
    ),
  },
  {
    title: "blockDelay isn't going down",
    body: (
      <>
        <p>
          A few possibilities. Check them in order:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Is the node actually receiving peer traffic? <code>docker compose logs</code> should mention peers / gossip.</li>
          <li>Do firewall rules match the P2P protocols/ports in the exact installed configuration (commonly UDP 3382)?</li>
          <li>Is the server&apos;s clock synced? Drift breaks block validation. <code>timedatectl</code> should report active NTP.</li>
          <li>Is disk full or near full? <code>df -h</code>.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Node restarts in a loop",
    body: (
      <p>
        Read the logs from the latest exit:{" "}
        <code>docker compose logs --tail 200 hypersnap</code>. Look for the first error before the
        crash, not the last line. The most common causes are missing volumes, corrupted state from
        a hard kill mid-write, or a release version mismatch after a partial upgrade. Inspect the
        image, configuration, mounts and release notes before changing anything; do not loop upgrades
        or open a changed database with an older writer.
      </p>
    ),
  },
  {
    title: "Out of memory or OOM-kills",
    body: (
      <p>
        Hypersnap wants 16 GB of real RAM. If your VPS swap is doing the heavy lifting, sync will
        crawl and the kernel may OOM-kill the container. Check{" "}
        <code>dmesg | grep -i kill</code> and <code>free -h</code>. If you&apos;re close to the
        limit, resize the VPS rather than tuning Docker memory limits.
      </p>
    ),
  },
];

// ---- GLOSSARY -----------------------------------------------------------

const GLOSSARY: Array<{ term: string; definition: ReactNode }> = [
  {
    term: "Bootstrap",
    definition: "The one-command install that sets up Docker Compose, generates config, and starts the node. The right entry point for new operators.",
  },
  {
    term: "Snapshot",
    definition: "A pre-baked chunk of historical chain data the node downloads on first start so it doesn't have to replay everything from genesis.",
  },
  {
    term: "Sync / catch-up",
    definition: "Snapshot import and live chain catch-up are only part of readiness. Archive replay, reconciliation, index reconstruction and native application checks may finish later; there is no universal full-node ETA.",
  },
  {
    term: "blockDelay",
    definition: "A reported chain-lag field. Confirm its units and semantics in the installed version before choosing thresholds. Low lag does not prove archive, reconciliation, index or application readiness.",
  },
  {
    term: "Shard",
    definition: "A horizontal partition of the network's data. Hypersnap runs across multiple shards; the node tracks them all.",
  },
  {
    term: "Peer / gossip",
    definition: "Other nodes your node talks to. Verify gossip and synchronization protocols/ports in your installed configuration before opening only the required peer listeners.",
  },
  {
    term: "FID",
    definition: "Farcaster ID. The numeric account identifier that owns posts, follows, and signed messages.",
  },
  {
    term: "Compose",
    definition: "Docker Compose, the multi-container orchestrator. The bootstrap script generates a docker-compose.yml that wraps the node, its config, and its persistent volumes.",
  },
  {
    term: "RocksDB",
    definition: "The embedded key-value store the node uses for local state. It lives under ~/hypersnap and is the main reason you need lots of disk.",
  },
  {
    term: "Stable / nightly channel",
    definition: "Image-channel labels, not provenance or test receipts. Resolve the exact image digest, source commit and release/qualification evidence. Neither stable nor nightly proves current main or suitability for your database.",
  },
];

// ---- LOCAL UI HELPERS ---------------------------------------------------

function GuideSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-16 first:pt-4 lg:py-20">
      <div className="mb-10 max-w-2xl">
        <Badge>{eyebrow}</Badge>
        <h2 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-slate-400 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <li className="glass-panel rounded-2xl p-6 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/[0.08] font-mono text-base text-cyan-100">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </li>
  );
}

function FriendCard({
  icon: IconComponent,
  title,
  command,
}: {
  icon: Icon;
  title: string;
  command: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <IconComponent aria-hidden="true" className="h-5 w-5 text-cyan-200" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="mt-4">
        <CodeBlock command={command} label="Send this" />
      </div>
    </div>
  );
}

function SourceLink({
  href,
  label,
  sub,
  icon: IconComponent,
}: {
  href: string;
  label: string;
  sub: string;
  icon: Icon;
}) {
  return (
    <a
      className="group flex items-start gap-3 glass-panel rounded-2xl p-4 transition hover:border-cyan-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
        <IconComponent aria-hidden="true" className="h-4 w-4 text-cyan-200" />
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-medium text-white group-hover:text-white">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-400">{sub}</span>
      </span>
    </a>
  );
}

function ChecklistItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm leading-6">
      <CircleCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
      <span>{children}</span>
    </li>
  );
}

// ---- PAGE ---------------------------------------------------------------

export function RunNodePage() {
  return (
    <>
      <PageHeader
        eyebrow="Operators"
        title="Run part of the network yourself."
        description="Every node makes the network a little more decentralized. This page walks through the whole loop — why it matters, what to expect, how to install, and how to keep it running. You don't have to be an expert; you do need a server you can keep online."
      />

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
        <WarningPanel>
          <p>
            <span className="font-semibold text-amber-200">Reality check:</span> running a node does not guarantee
            earnings or reward eligibility. Public economics proposals and attributed Ethereum
            distribution claims are not adopted protocol rewards. Read the{" "}
            <a className="text-cyan-100 underline" href="/snap">economics evidence</a> before spending.
          </p>
        </WarningPanel>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0">
            {/* WHY ----------------------------------------------------- */}
            <GuideSection
              id="why"
              eyebrow="Why run a node"
              title="It's the most direct way to make the network real."
              description="A decentralized network is decentralized only if many independent people run a piece of it. Today, that piece is you."
            >
              <p className="mb-6 text-sm leading-7 text-slate-300">
                A read/API node is not automatically a validator. Validator membership and network
                activation require separate coordination. At the November 7, 2026 source check,{" "}
                <a className="text-cyan-100 underline" href="https://github.com/farcasterorg/hypersnap/pull/61">PR #61</a>{" "}
                remained open/unmerged; its operator keys are not proof of active independent validators.
              </p>
              <div className="grid gap-5 md:grid-cols-3">
                <InfoPanel icon={Network} title="More nodes = more independence">
                  <p>
                    Every additional operator means the network depends a little less on any single
                    party staying online or staying friendly. That&apos;s the whole point.
                  </p>
                </InfoPanel>
                <InfoPanel icon={Compass} title="Learn the protocol from the inside">
                  <p>
                    Reading the docs is one thing. Watching catch-up logs scroll, querying{" "}
                    <code className="font-mono text-cyan-100">/v1/info</code>, debugging your own
                    peer connectivity — that&apos;s where the protocol becomes real.
                  </p>
                </InfoPanel>
                <InfoPanel icon={Sparkles} title="Be ready as it grows">
                  <p>
                    Operators who&apos;ve been running for a while will have set up monitoring,
                    upgrade habits, and a sense of what normal looks like. That&apos;s an
                    accumulated skill — start now and you&apos;ll be ahead later.
                  </p>
                </InfoPanel>
              </div>
            </GuideSection>

            {/* WHAT TO EXPECT ------------------------------------------ */}
            <GuideSection
              id="expect"
              eyebrow="What to expect"
              title="Budget for storage, transfer and operating time."
              description="Use upstream requirements as a starting point, then check current provider pricing and the exact release's data/rebuild needs."
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <InfoPanel icon={Banknote} title="Monthly cost">
                  <p>
                    Price compute, persistent storage, backup capacity and network transfer together.
                    Provider rates and data growth vary. Home hardware still has electricity,
                    storage and connectivity costs; no income is guaranteed for operating a node.
                  </p>
                </InfoPanel>
                <InfoPanel icon={Clock} title="Initial sync">
                  <p>
                    Timing depends on data size, hardware, bandwidth and release. Snapshot download,
                    chain catch-up, archive replay, reconciliation and indexes are separate phases.
                    An HTTP response is not a full-readiness signal.
                  </p>
                </InfoPanel>
                <InfoPanel icon={Wifi} title="Bandwidth">
                  <p>
                    Confirm the current snapshot size and transfer allowance before downloading.
                    Bootstrap, historical replay and ongoing peer traffic can have different
                    resource needs; include retry and egress charges in the budget.
                  </p>
                </InfoPanel>
                <InfoPanel icon={CalendarClock} title="Ongoing effort">
                  <p>
                    Monitor process health, every shard, storage growth and data-readiness gates.
                    Schedule upgrades after reviewing release notes and preserving recovery options;
                    repair or reconstruction may require more operator attention.
                  </p>
                </InfoPanel>
              </div>
              <p className="mt-6 text-xs leading-5 text-slate-400">
                This is a planning checklist, not a current provider quote, sync benchmark or
                reward forecast. Recheck capacity as the network and installed release change.
              </p>
            </GuideSection>

            {/* PROVISION ----------------------------------------------- */}
            <GuideSection
              id="provision"
              eyebrow="Provision"
              title="Pick a machine that can stay online."
              description="An early node operator just needs a stable VPS. Home installs can work, but NAT, sleep modes, dynamic IPs, and port forwarding add a lot of moving parts — go that route only if you're comfortable troubleshooting them."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InfoPanel icon={Cloud} title="Cloud / VPS path (recommended)">
                  <ul className="space-y-2 text-sm leading-6">
                    <ChecklistItem>Ubuntu 24.04 LTS x64</ChecklistItem>
                    <ChecklistItem>4 vCPU / 16 GB RAM minimum</ChecklistItem>
                    <ChecklistItem>1.5 TB block storage minimum (1.6 TB gives breathing room)</ChecklistItem>
                    <ChecklistItem>Public IPv4 address</ChecklistItem>
                    <ChecklistItem>Firewall: restricted SSH, verified P2P listeners only; HTTP local/private by default</ChecklistItem>
                  </ul>
                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    Shared CPU works if budget matters. Dedicated CPU is more reliable for
                    long-running sync, but costs more.
                  </p>
                </InfoPanel>
                <InfoPanel icon={Home} title="Home / local path">
                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    <li>Keep the machine awake — no laptops closing mid-sync.</li>
                    <li>Forward required ports from the router to the host.</li>
                    <li>Use wired ethernet if possible.</li>
                    <li>Expect Docker Desktop / WSL weirdness on consumer machines.</li>
                    <li>Dynamic IP changes will break peer reachability.</li>
                  </ul>
                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    Great for learning. Less great if you want a reliable public-facing node.
                  </p>
                </InfoPanel>
              </div>
            </GuideSection>

            {/* REQUIREMENTS -------------------------------------------- */}
            <GuideSection
              id="requirements"
              eyebrow="Requirements"
              title="What you'll actually need."
              description="A node holds its own copy of the network's data and stays in sync with peers. That means real disk, real bandwidth, and a few open ports."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <InfoPanel icon={HardDrive} title="Machine">
                  <ul className="space-y-2 text-sm leading-6">
                    {sources.node.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </InfoPanel>
                <InfoPanel icon={Network} title="Ports">
                  <ul className="space-y-2 text-sm leading-6">
                    <li>HTTP API: TCP 3381, local/private by default</li>
                    <li>Typical gossip mapping: UDP 3382; gRPC TCP 3383 stays private/authenticated</li>
                    <li>Confirm exact protocols, binds and published ports in your installed Compose/config</li>
                  </ul>
                </InfoPanel>
                <InfoPanel icon={Gauge} title="Catch-up">
                  <p className="text-sm leading-6">
                    Compare every shard&apos;s height and lag over time against a trusted reference
                    for the same network. Then independently qualify archive, reconciliation,
                    index and native application readiness below.
                  </p>
                </InfoPanel>
              </div>
            </GuideSection>

            {/* INSTALL ------------------------------------------------- */}
            <GuideSection
              id="install"
              eyebrow="Install"
              title="Three steps, in order."
              description="Run these from the target server. Verify resources first, then install, then watch catch-up. If you attached a large volume, make sure ~/hypersnap resolves onto that volume before bootstrapping."
            >
              <ol className="grid gap-5">
                <StepCard
                  number={1}
                  title="Preflight the server"
                  description="Confirm OS, CPU, RAM, disk, and mount state. If disk is tiny here, stop and fix storage first."
                >
                  <CodeBlock label="Preflight" command={PREFLIGHT_COMMAND} />
                </StepCard>
                <StepCard
                  number={2}
                  title="Install via Hypersnap bootstrap"
                  description="The script installs dependencies, writes ~/hypersnap/hypersnap.sh, fetches Compose/config assets, and starts the managed Docker Compose flow."
                >
                  <CodeBlock label="Bootstrap" command={INSTALL_COMMAND} />
                  <div className="mt-3 flex flex-wrap items-start gap-2 rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-400">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <span>
                      Inspect the bootstrap script and its fetched assets before execution. The
                      command follows mutable main; use a reviewed commit for a reproducible install.
                      Installer notices do not establish token provenance or reward eligibility.
                    </span>
                  </div>
                </StepCard>
                <StepCard
                  number={3}
                  title="Watch catch-up"
                  description="Initial snapshot catch-up can take a while. The local health endpoint may refuse connections until enough bootstrap state exists."
                >
                  <CodeBlock label="Watch logs + health" command={CATCHUP_COMMAND} />
                </StepCard>
              </ol>
            </GuideSection>

            {/* CONFIRM ------------------------------------------------- */}
            <GuideSection
              id="confirm"
              eyebrow="Confirm it's working"
              title="A short post-install checklist."
              description="Start with process and chain checks, then verify each data and application phase separately. No fixed number of hours establishes full readiness."
            >
              <div id="verify" className="scroll-mt-28 mb-6">
                <WarningPanel>
                  <p className="font-semibold text-white">Verification is a set of gates, not one green light.</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li><strong>Chain:</strong> every configured shard advances on the intended network; compare height and lag with a same-network reference.</li>
                    <li><strong>Archive:</strong> required historical blocks/messages are present and replay is complete on every shard, not just at the live tip.</li>
                    <li><strong>Reconciliation:</strong> examine missing/rejected events, signer/registry continuity and repair state; scanned blocks alone do not prove successful merges.</li>
                    <li><strong>Indexes:</strong> check search, graph, metrics and any replacement generation separately. A serving index may coexist with an unfinished rebuild.</li>
                    <li><strong>Native application:</strong> verify known profiles, history, feeds and counts using the native API, without a fallback masking missing data. Signed actions require separate deliberate acceptance.</li>
                  </ul>
                  <p className="mt-3">Record version, image digest, network, observation time and evidence per gate. Unknown stays unknown; do not derive a whole-node percentage or completion ETA from one scan.</p>
                </WarningPanel>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="glass-panel rounded-2xl p-5">
                  <h3 className="text-base font-semibold text-white">Three preliminary checks</h3>
                  <ul className="mt-4 space-y-3">
                    <ChecklistItem>
                      <span>
                        <span className="font-medium text-white">Container is up:</span>{" "}
                        <code className="font-mono text-cyan-100">docker compose ps</code> shows{" "}
                        <code className="font-mono text-cyan-100">hypersnap</code> with status{" "}
                        <code className="font-mono text-cyan-100">running</code>, not{" "}
                        <code className="font-mono text-cyan-100">restarting</code>.
                      </span>
                    </ChecklistItem>
                    <ChecklistItem>
                      <span>
                        <span className="font-medium text-white">/v1/info responds:</span> on the
                        host,{" "}
                        <code className="font-mono text-cyan-100">curl http://127.0.0.1:3381/v1/info</code>{" "}
                        returns JSON (not Connection refused).
                      </span>
                    </ChecklistItem>
                    <ChecklistItem>
                      <span>
                        <span className="font-medium text-white">Every shard advances:</span>{" "}
                        sample twice, compare heights and lag with the same network, and inspect
                        peers/resources if progress stops. Flat lag alone does not diagnose a firewall.
                      </span>
                    </ChecklistItem>
                  </ul>
                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    Confirm the installed version&apos;s lag units and expected thresholds. A running
                    container, reachable info endpoint and low chain lag do not pass the remaining
                    archive, reconciliation, index or application gates.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-cyan-100">
                    Quick health snapshot
                  </p>
                  <div className="mt-3">
                    <CodeBlock label="One-liner" command={CONFIRM_COMMAND} />
                  </div>
                </div>
              </div>
            </GuideSection>

            {/* FIREWALL ------------------------------------------------ */}
            <GuideSection
              id="firewall"
              eyebrow="Network"
              title="Open the right ports — not the whole castle."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InfoPanel icon={Lock} title="Cloud firewall (recommended)">
                  <ul className="space-y-2 text-sm leading-6">
                    <li>TCP 22 from your IP or Tailscale only</li>
                    <li>Allow only the P2P port/protocol pairs verified in your installed configuration</li>
                    <li>Keep HTTP TCP 3381 and gRPC TCP 3383 bound to localhost or a restricted private interface</li>
                    <li>Public HTTP requires a deliberate authenticated, rate-limited gateway and endpoint policy</li>
                    <li>Review IPv4, IPv6, cloud rules and Docker mappings together; Docker publication may bypass UFW expectations</li>
                  </ul>
                </InfoPanel>
                <InfoPanel icon={Server} title="Typical mappings — verify before exposure">
                  <ul className="space-y-2 text-sm leading-6">
                    <li>
                      <code className="font-mono text-cyan-100">127.0.0.1:3381:3381/tcp</code> for local HTTP
                    </li>
                    <li>
                      <code className="font-mono text-cyan-100">3382:3382/udp</code>
                    </li>
                    <li>
                      <code className="font-mono text-cyan-100">127.0.0.1:3383:3383/tcp</code> for local gRPC
                    </li>
                  </ul>
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    These are examples, not an assertion about your running Compose file. Inspect
                    rendered mappings and actual listeners. Opening a broad TCP/UDP range increases
                    exposure; it is not a safer substitute for verifying required protocols.
                  </p>
                </InfoPanel>
              </div>
            </GuideSection>

            {/* OPERATIONS ---------------------------------------------- */}
            <GuideSection
              id="operations"
              eyebrow="Operations"
              title="Day-to-day commands."
              description="The bundled script wraps the most common tasks so you don't have to memorize flags."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                {sources.node.commands.map((command) => (
                  <CodeBlock command={command.command} key={command.label} label={command.label} />
                ))}
                <CodeBlock label="Nightly channel" command={sources.node.nightlyCommand} />
              </div>
            </GuideSection>

            {/* UPGRADES ------------------------------------------------ */}
            <GuideSection
              id="upgrades"
              eyebrow="Upgrades"
              title="Stay on a recent build, without surprises."
              description="Review release compatibility, image provenance and database changes before any restart. Keep a recoverable cold rollback before letting a new writer touch state."
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <InfoPanel icon={RefreshCw} title="Verify the exact artifact">
                  <p>
                    A stable tag does not prove current main, passing tests or deployment suitability.
                    Record the image digest, source commit and qualification evidence. Main-source
                    fixes and open PRs are not evidence that an image contains them.
                  </p>
                </InfoPanel>
                <InfoPanel icon={Settings} title="One-command upgrade">
                  <p>
                    The bundled script pulls the new image, restarts the container, and keeps the
                    same volumes. That is a state-changing operation: a new writer may migrate or
                    reconstruct data. Preserve identity/config and a consistent cold database backup
                    with the old image before running it; test the recovery path.
                  </p>
                </InfoPanel>
                <InfoPanel icon={CircleCheck} title="Verify after">
                  <p>
                    Confirm the intended digest/version, configuration and mounted database, then
                    repeat the separate chain, archive, reconciliation, index and native application
                    gates. An info response alone does not qualify an upgrade.
                  </p>
                </InfoPanel>
              </div>
              <div className="mt-6">
                <CodeBlock label="Upgrade and verify" command={UPGRADE_COMMAND} />
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Cold rollback means the preserved old writer uses only its own unchanged, consistent
                database copy. Never open a changed database with an old writer. Do not share mutable
                database files or inherited SST inodes between old and new writers. Retain the known-good
                fallback until the successor passes acceptance; a major-version label is not the only
                signal of migration or rebuild work.
              </p>
            </GuideSection>

            {/* HARDENING ----------------------------------------------- */}
            <GuideSection
              id="hardening"
              eyebrow="Hardening"
              title="Lock down the server itself."
              description="Inspect access policy first. Access changes need a tested second login, a working rescue path and a deliberate maintenance plan."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <InfoPanel icon={KeyRound} title="SSH: inspect before hardening">
                  <p className="mb-4">
                    Prefer a key-based, sudo-capable non-root account. Keep the current session open
                    and test a second login plus provider console/rescue access before changing root
                    or password policy. Review included files and Match rules; do not blindly edit
                    sshd_config or reload SSH from a generic script.
                  </p>
                  <CodeBlock label="Read-only SSH policy inspection" command={SSH_HARDENING_COMMAND} />
                </InfoPanel>
                <InfoPanel icon={ShieldCheck} title="Automatic security updates">
                  <p className="mb-4">
                    Enable unattended security updates so OS patches land without you manually
                    running <code className="font-mono text-cyan-100">apt upgrade</code> on
                    schedule.
                  </p>
                  <CodeBlock label="Auto-updates" command={AUTO_UPDATES_COMMAND} />
                </InfoPanel>
              </div>
              <div className="mt-6 glass-panel rounded-2xl p-5 text-sm leading-7 text-slate-400">
                <p className="font-semibold text-white">Worth considering</p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <span className="font-medium text-white">Tailscale or WireGuard</span> for SSH.
                    Then your cloud firewall can lock TCP 22 to that private network only — even if
                    a key leaks, the surface is much smaller.
                  </li>
                  <li>
                    <span className="font-medium text-white">fail2ban</span> as a cheap layer
                    against brute-force scanners hitting public services.
                  </li>
                  <li>
                    <span className="font-medium text-white">Off-server log shipping</span> if you
                    care about post-mortem detail. Even a daily{" "}
                    <code className="font-mono text-cyan-100">journalctl</code> snapshot to a
                    second host is better than nothing.
                  </li>
                </ul>
              </div>
            </GuideSection>

            {/* DIAGNOSTICS --------------------------------------------- */}
            <GuideSection
              id="toolkit"
              eyebrow="Operator toolkit"
              title="Install the helper once, then stop debugging by screenshot."
              description="The open-source hypersnap command wraps the common operator checks into copy-pasteable diagnostics and sanitized support reports. It does not replace upstream; it makes upstream easier to run."
            >
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <InfoPanel icon={Stethoscope} title="One command to diagnose">
                  <p className="mb-4">
                    Install the helper from this site, then run the doctor whenever a node is acting
                    weird. The report checks Docker, Compose, containers, ports, disk, memory,
                    logs, and the local info endpoint.
                  </p>
                  <CodeBlock label="Install helper" command={TOOLKIT_INSTALL_COMMAND} />
                </InfoPanel>
                <InfoPanel icon={ShieldCheck} title="Share a sanitized report">
                  <p className="mb-4">
                    <code className="font-mono text-cyan-100">hypersnap share</code> writes a local
                    report designed for GitHub issues, Discord, or Farcaster support threads. Review
                    it before posting publicly.
                  </p>
                  <CodeBlock label="Doctor + report" command={TOOLKIT_DOCTOR_COMMAND} />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <LinkButton href="https://github.com/arcabotai/hypersnapdoctor" variant="secondary" external>
                      Toolkit source
                    </LinkButton>
                  </div>
                </InfoPanel>
              </div>
            </GuideSection>

            <GuideSection
              id="diagnostics"
              eyebrow="Diagnostics"
              title="Ask for terminal output, not screenshots."
              description="If the helper is not installed yet, this read-only fallback captures the state that explains 90% of failed installs: containers, logs, disk, ports, and the health endpoint."
            >
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <CodeBlock label="Read-only diagnostic" command={DIAGNOSTICS_COMMAND} />
                <NodeInfoChecker />
              </div>
            </GuideSection>

            {/* TROUBLESHOOTING ---------------------------------------- */}
            <GuideSection
              id="troubleshoot"
              eyebrow="Troubleshooting"
              title="Common failures, with what they actually mean."
            >
              <div className="grid gap-3">
                {TROUBLESHOOTING.map((item, index) => (
                  <details
                    className="group glass-panel rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden"
                    key={index}
                    open={item.open}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">
                      <span>{item.title}</span>
                      <span
                        aria-hidden="true"
                        className="text-cyan-200 transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="mt-3 text-sm leading-6 text-slate-300">{item.body}</div>
                  </details>
                ))}
              </div>
            </GuideSection>

            {/* HELPING ------------------------------------------------- */}
            <GuideSection
              id="helping"
              eyebrow="Helping a friend"
              title="Two messages worth keeping in your clipboard."
              description="When someone you know is stuck, send terminal output — not screenshots. These ask for the right thing and save a round-trip."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FriendCard
                  icon={MessagesSquare}
                  title="Install message"
                  command={FRIEND_INSTALL_MESSAGE}
                />
                <FriendCard
                  icon={Stethoscope}
                  title="Debug message"
                  command={FRIEND_DEBUG_MESSAGE}
                />
              </div>
            </GuideSection>

            {/* GLOSSARY ------------------------------------------------ */}
            <GuideSection
              id="glossary"
              eyebrow="Glossary"
              title="Plain-English definitions for the words above."
              description="If you're new to running infrastructure, here's what a few of these terms actually mean."
            >
              <dl className="grid gap-4 md:grid-cols-2">
                {GLOSSARY.map((entry) => (
                  <div
                    key={entry.term}
                    className="glass-panel rounded-2xl p-4"
                  >
                    <dt className="text-sm font-semibold text-white">{entry.term}</dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-300">{entry.definition}</dd>
                  </div>
                ))}
              </dl>
            </GuideSection>

            {/* SOURCES ------------------------------------------------- */}
            <GuideSection
              id="sources"
              eyebrow="Sources"
              title="Grounded links and credit."
              description="Most of the operator content here is adapted from upstream. Check these before betting time or money."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SourceLink
                  href="https://github.com/farcasterorg/hypersnap/tree/c0ce1755d9b7058f79b41c1f236a2b9a7041d348"
                  label="farcasterorg/hypersnap"
                  sub="Main source checked November 7, 2026; not a release or runtime audit"
                  icon={ScrollText}
                />
                <SourceLink
                  href="https://github.com/farcasterorg/hypersnap/blob/c0ce1755d9b7058f79b41c1f236a2b9a7041d348/scripts/hypersnap-bootstrap.sh"
                  label="hypersnap-bootstrap.sh"
                  sub="Pinned bootstrap reference; the example install command follows mutable main"
                  icon={Cpu}
                />
                <SourceLink
                  href="https://github.com/farcasterorg/hypersnap/blob/c0ce1755d9b7058f79b41c1f236a2b9a7041d348/docker-compose.mainnet.yml"
                  label="docker-compose.mainnet.yml"
                  sub="Pinned Compose reference; inspect your actual installed mappings and image"
                  icon={ShieldCheck}
                />
                <SourceLink
                  href="https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7"
                  label="CassOnMars 'how to hypersnap' gist"
                  sub="Operator notes from upstream contributors"
                  icon={Heart}
                />
                <SourceLink
                  href="https://github.com/arcabotai/hypersnapdoctor"
                  label="arcabotai/hypersnapdoctor"
                  sub="Operator toolkit: hypersnap doctor, share reports, and install helper"
                  icon={Stethoscope}
                />
                <SourceLink
                  href="/docs"
                  label="Hypersnap docs hub"
                  sub="Concepts, API reference, and AI-agent guides — mirrored on-site"
                  icon={BookOpen}
                />
                <SourceLink
                  href="/contribute"
                  label="Ways to contribute"
                  sub="Code, docs, design, ideas, running a node"
                  icon={Users}
                />
              </div>
              <div className="mt-6 glass-panel rounded-2xl p-5 text-sm leading-7 text-slate-400">
                <p>
                  Big chunks of this guide are adapted from{" "}
                  <span className="font-medium text-white">Arca&apos;s Hypersnap Node Starter Kit</span>
                  , an operator-friendly wrapper around the upstream bootstrap flow. Thanks to Arca
                  / Cad for the field notes.
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  This page wraps upstream — it doesn&apos;t replace it. Upstream docs are still
                  moving fast and mix Snapchain / Hypersnap language. Review a pinned revision and
                  its compatibility before executing anything; this page does not certify a deployment.
                </p>
              </div>
            </GuideSection>

            {/* STILL STUCK --------------------------------------------- */}
            <section className="pb-16 pt-4">
              <div className="glass-panel rounded-2xl border-cyan-400/15 bg-cyan-400/[0.04] p-6 text-sm leading-7 text-slate-300">
                <p className="font-semibold text-white">Still stuck?</p>
                <p className="mt-2">
                  Open an issue on the upstream repo with the diagnostic output above pasted in —
                  every issue is public, and the more concrete output you share the faster someone
                  can help.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <LinkButton href="https://github.com/farcasterorg/hypersnap/issues" external>
                    Open an issue
                  </LinkButton>
                  <LinkButton href="/contribute" variant="secondary">
                    How to contribute
                  </LinkButton>
                  <LinkButton href="/docs" variant="secondary">
                    Read the docs
                  </LinkButton>
                </div>
              </div>
            </section>
          </div>
          <RunNodeToc />
        </div>
      </div>
    </>
  );
}
