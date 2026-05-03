import Link from "next/link";
import { Database, Cpu, Link2, ArrowRight, Shield } from "lucide-react";

export default function Landing() {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="min-h-screen bg-paper text-ink"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
      }}
    >
      {/* Masthead */}
      <header className="border-b-4 border-ink">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between py-2 border-b border-ink">
            <span className="font-data text-xs text-neutral-500 uppercase tracking-widest">
              Vol. 1 — Est. 2026
            </span>
            <span className="font-data text-xs text-neutral-500 uppercase tracking-widest hidden sm:block">
              {date}
            </span>
            <span className="font-data text-xs text-neutral-500 uppercase tracking-widest">
              Galileo Testnet Edition
            </span>
          </div>

          <div className="py-6 text-center border-b border-ink">
            <h1 className="font-display text-6xl md:text-8xl font-black tracking-tighter leading-none">
              PARELLAX
            </h1>
            <p className="font-sans text-xs uppercase tracking-widest text-neutral-500 mt-2">
              Verifiable Orchestration Layer for Agentic Banking
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-8 py-3">
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Architecture", href: "#architecture" },
              { label: "0G Ecosystem", href: "#architecture" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="font-sans text-xs uppercase tracking-widest hover:text-editorial transition-colors duration-200"
              >
                {label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="font-sans text-xs uppercase tracking-widest bg-ink text-paper px-4 py-2 hover:bg-editorial transition-colors duration-200 min-h-[44px] flex items-center"
            >
              Launch App →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-4 border-ink newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-12">
            {/* 8-col: headline + body */}
            <div className="col-span-12 lg:col-span-8 border-r border-ink py-16 pr-0 lg:pr-8">
              <div className="inline-flex items-center gap-2 border border-editorial px-3 py-1 mb-6">
                <span className="w-2 h-2 bg-editorial" />
                <span className="font-data text-xs uppercase tracking-widest text-editorial">
                  Breaking
                </span>
              </div>

              <h2 className="font-display text-5xl sm:text-7xl lg:text-9xl font-black leading-[0.9] tracking-tighter mb-8">
                BANKING
                <br />
                <span className="italic font-normal">ON YOUR</span>
                <br />
                WORD.
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-ink pt-6">
                <div className="sm:pr-6 sm:border-r border-ink pb-4 sm:pb-0">
                  <p className="font-body text-base leading-relaxed text-justify">
                    Parellax bridges the gap between natural language and
                    cryptographic trust. Speak your intent — we handle the rest.
                    Every transaction is evaluated inside a Trusted Execution
                    Environment and settled on-chain with an ECDSA-gated vault.
                  </p>
                </div>
                <div className="sm:pl-6">
                  <p className="font-body text-base leading-relaxed text-justify">
                    Built on the 0G ecosystem&apos;s three primitives: KV Storage for
                    user preferences and audit trails, TEE Compute for sealed
                    LLM inference, and Chain for immutable settlement. No
                    intermediaries. No trust assumptions.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/dashboard"
                  className="font-sans text-sm uppercase tracking-widest bg-ink text-paper px-8 py-4 hover:bg-editorial transition-colors duration-200 text-center min-h-[44px] flex items-center justify-center gap-2"
                >
                  Launch App <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
                <a
                  href="#how-it-works"
                  className="font-sans text-sm uppercase tracking-widest border border-ink px-8 py-4 hover:bg-ink hover:text-paper transition-colors duration-200 text-center min-h-[44px] flex items-center justify-center"
                >
                  How It Works
                </a>
              </div>
            </div>

            {/* 4-col: mock terminal */}
            <div className="col-span-12 lg:col-span-4 py-16 lg:pl-8 hidden lg:block">
              <div className="border border-ink h-full flex flex-col">
                <div className="border-b border-ink px-4 py-2 flex items-center gap-2 bg-ink">
                  <span className="w-2 h-2 bg-editorial" />
                  <span className="w-2 h-2 bg-yellow-400" />
                  <span className="w-2 h-2 bg-green-400" />
                  <span className="font-data text-xs text-paper ml-2 uppercase tracking-widest">
                    Parellax Terminal
                  </span>
                </div>
                <div className="p-4 font-data text-xs space-y-2 flex-1">
                  {[
                    { text: "> Intent received", cls: "text-neutral-500" },
                    { text: '  "Pay the nanny $200"', cls: "text-ink" },
                    { text: "> Checking spending limit...", cls: "text-neutral-500" },
                    { text: "  Daily limit: 500 OG — OK", cls: "text-ink" },
                    { text: "> Routing to TEE compute", cls: "text-neutral-500" },
                    { text: "  Model: Llama 3.3 70B", cls: "text-ink" },
                    { text: "> Evaluating intent...", cls: "text-neutral-500" },
                    { text: "  Decision: APPROVED", cls: "text-green-600 font-bold" },
                    { text: "> Signing transaction", cls: "text-neutral-500" },
                    { text: "> Broadcasting to 0G chain", cls: "text-neutral-500" },
                    { text: "  Tx confirmed in block 4,291", cls: "text-green-600 font-bold" },
                  ].map((line, i) => (
                    <div key={i} className={line.cls}>
                      {line.text}
                    </div>
                  ))}
                </div>
                <div className="border-t border-ink px-4 py-3 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-neutral-500" strokeWidth={1.5} />
                  <span className="font-data text-xs text-neutral-500 uppercase tracking-widest">
                    TEE Sealed
                  </span>
                  <span className="ml-auto font-data text-xs text-green-600">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="bg-ink text-paper border-b-4 border-ink overflow-hidden py-3">
        <div className="marquee-track">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="flex items-center">
              {[
                ["0G Storage", "KV Audit Logs"],
                ["0G Compute", "TEE-Sealed LLM"],
                ["0G Chain", "ECDSA Vault"],
                ["Qwen 2.5 7B", "TEE Inference"],
                ["Chain ID 16602", "Galileo Testnet"],
                ["Parellax", "v1.0"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center gap-3 shrink-0 px-6">
                  <span className="font-data text-xs text-neutral-400 uppercase tracking-widest">
                    {label}
                  </span>
                  <span className="font-data text-xs text-editorial">◆</span>
                  <span className="font-data text-xs text-paper">{val}</span>
                  <span className="font-data text-xs text-neutral-600 ml-6">|</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Open Source */}
      <section className="border-b-4 border-ink">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="border-b border-ink pb-4 mb-12">
            <span className="font-data text-xs uppercase tracking-widest text-neutral-500">
              Open Source
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-black mt-2">
              USE THE PRIMITIVES
            </h2>
            <p className="font-body text-base text-neutral-600 mt-4 max-w-2xl">
              The storage and compute layers are published as standalone npm packages.
              Drop them into any Node.js or Next.js project that needs 0G KV or TEE inference —
              no Parellax infrastructure required.
            </p>
          </div>

          {/* parellax-storage */}
          <div className="border border-ink mb-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-ink">
              <div className="p-8 border-b lg:border-b-0 lg:border-r border-ink">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-data text-xs text-editorial uppercase tracking-widest">npm · v0.1.1</span>
                  <span className="font-data text-xs text-neutral-500">PRIVATE_KEY required</span>
                </div>
                <h3 className="font-display text-3xl font-black mb-1">Decentralized KV</h3>
                <p className="font-data text-xs text-neutral-500 mb-5">@daiwikdomain/parellax-storage</p>
                <p className="font-body text-sm text-neutral-600 leading-relaxed mb-6">
                  Drop-in wrapper for 0G KV Storage. Set per-wallet spending limits and maintain
                  append-only audit logs stored on the 0G network — not in your database.
                  No operator can modify entries after they are written.
                </p>
                <div className="bg-neutral-950 border border-neutral-800 px-4 py-3 font-data text-xs text-neutral-300">
                  npm install @daiwikdomain/parellax-storage
                </div>
              </div>

              <div className="p-8">
                <p className="font-data text-xs text-neutral-500 uppercase tracking-widest mb-4">AuditEntry type</p>
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-data text-xs text-neutral-300 space-y-0.5 leading-relaxed">
                  <div><span className="text-neutral-500">interface</span> <span className="text-neutral-100">AuditEntry</span> {"{"}</div>
                  <div className="pl-4"><span className="text-neutral-400">ts</span>{"             : number"}</div>
                  <div className="pl-4"><span className="text-neutral-400">intent</span>{"        : string"}</div>
                  <div className="pl-4"><span className="text-neutral-400">decision</span>{"      : "}<span className="text-editorial">'approved'</span>{" | "}<span className="text-editorial">'rejected'</span></div>
                  <div className="pl-4"><span className="text-neutral-400">verificationId</span>{": string"}</div>
                  <div className="pl-4"><span className="text-neutral-400">txHash</span>{"       ?: string"}</div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-ink">
              <div className="p-8 border-b lg:border-b-0 lg:border-r border-ink">
                <p className="font-data text-xs text-neutral-500 uppercase tracking-widest mb-4">Spending limits</p>
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-data text-xs text-neutral-300 space-y-1 leading-relaxed">
                  <div><span className="text-neutral-500">import</span> {"{ setSpendingLimit, getSpendingLimit }"}</div>
                  <div><span className="text-neutral-500">  from</span> <span className="text-editorial">'@daiwikdomain/parellax-storage'</span></div>
                  <div className="pt-2"><span className="text-neutral-500">// write — returns txHash</span></div>
                  <div><span className="text-neutral-500">const</span> tx = <span className="text-neutral-500">await</span> setSpendingLimit(</div>
                  <div className="pl-4"><span className="text-editorial">'0xWallet'</span>,</div>
                  <div className="pl-4">parseEther(<span className="text-editorial">'1.0'</span>)</div>
                  <div>{")"}</div>
                  <div className="pt-2"><span className="text-neutral-500">// read — returns bigint | null</span></div>
                  <div><span className="text-neutral-500">const</span> limit = <span className="text-neutral-500">await</span> getSpendingLimit(<span className="text-editorial">'0xWallet'</span>)</div>
                </div>
              </div>

              <div className="p-8">
                <p className="font-data text-xs text-neutral-500 uppercase tracking-widest mb-4">Audit log</p>
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-data text-xs text-neutral-300 space-y-1 leading-relaxed">
                  <div><span className="text-neutral-500">import</span> {"{ appendAuditLog, getAuditLog }"}</div>
                  <div><span className="text-neutral-500">  from</span> <span className="text-editorial">'@daiwikdomain/parellax-storage'</span></div>
                  <div className="pt-2"><span className="text-neutral-500">// append — fire and forget safe</span></div>
                  <div><span className="text-neutral-500">await</span> appendAuditLog(<span className="text-editorial">'0xWallet'</span>, {"{"}</div>
                  <div className="pl-4">ts: Date.now(), intent, decision: <span className="text-editorial">'approved'</span>,</div>
                  <div className="pl-4">verificationId, txHash</div>
                  <div>{"})"}</div>
                  <div className="pt-2"><span className="text-neutral-500">// read full history</span></div>
                  <div><span className="text-neutral-500">const</span> log = <span className="text-neutral-500">await</span> getAuditLog(<span className="text-editorial">'0xWallet'</span>)</div>
                </div>
              </div>
            </div>
          </div>

          {/* parellax-compute */}
          <div className="border border-ink border-t-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-ink">
              <div className="p-8 border-b lg:border-b-0 lg:border-r border-ink">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-data text-xs text-editorial uppercase tracking-widest">npm · v0.1.1</span>
                  <span className="font-data text-xs text-neutral-500">OG_COMPUTE_KEY required</span>
                </div>
                <h3 className="font-display text-3xl font-black mb-1">TEE Inference</h3>
                <p className="font-data text-xs text-neutral-500 mb-5">@daiwikdomain/parellax-compute</p>
                <p className="font-body text-sm text-neutral-600 leading-relaxed mb-6">
                  Single-function wrapper for 0G Compute TEE. Pass a natural-language intent and
                  financial context — get back a structured approval decision with a cryptographic
                  verification ID and a <span className="font-data">teeVerified</span> flag confirming
                  the inference ran inside a sealed enclave.
                </p>
                <div className="bg-neutral-950 border border-neutral-800 px-4 py-3 font-data text-xs text-neutral-300">
                  npm install @daiwikdomain/parellax-compute
                </div>
              </div>

              <div className="p-8">
                <p className="font-data text-xs text-neutral-500 uppercase tracking-widest mb-4">Return type</p>
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-data text-xs text-neutral-300 space-y-0.5 leading-relaxed">
                  <div><span className="text-neutral-500">interface</span> <span className="text-neutral-100">ApprovalDecision</span> {"{"}</div>
                  <div className="pl-4"><span className="text-neutral-400">approved</span>{"       : boolean"}</div>
                  <div className="pl-4"><span className="text-neutral-400">reason</span>{"         : string"}</div>
                  <div className="pl-4"><span className="text-neutral-400">model</span>{"          : string"}</div>
                  <div className="pl-4"><span className="text-neutral-400">verificationId</span>{" : string"}<span className="text-neutral-600"> // TEE receipt</span></div>
                  <div className="pl-4"><span className="text-neutral-400">teeVerified</span>{"    : boolean"}<span className="text-neutral-600"> // sealed enclave</span></div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 border-b lg:border-b-0 lg:border-r border-ink">
                <p className="font-data text-xs text-neutral-500 uppercase tracking-widest mb-4">Input type</p>
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-data text-xs text-neutral-300 space-y-0.5 leading-relaxed">
                  <div><span className="text-neutral-500">interface</span> <span className="text-neutral-100">TransactionContext</span> {"{"}</div>
                  <div className="pl-4"><span className="text-neutral-400">walletAddr</span>{"       : string"}</div>
                  <div className="pl-4"><span className="text-neutral-400">amountWei</span>{"        : bigint"}</div>
                  <div className="pl-4"><span className="text-neutral-400">recipient</span>{"        : string"}</div>
                  <div className="pl-4"><span className="text-neutral-400">spendingLimitWei</span>{" : bigint"}</div>
                  <div className="pl-4"><span className="text-neutral-400">currentBalanceWei</span>{": bigint"}</div>
                  <div>{"}"}</div>
                </div>
              </div>

              <div className="p-8">
                <p className="font-data text-xs text-neutral-500 uppercase tracking-widest mb-4">Usage</p>
                <div className="bg-neutral-950 border border-neutral-800 p-4 font-data text-xs text-neutral-300 space-y-1 leading-relaxed">
                  <div><span className="text-neutral-500">import</span> {"{ evaluateTransaction }"}</div>
                  <div><span className="text-neutral-500">  from</span> <span className="text-editorial">'@daiwikdomain/parellax-compute'</span></div>
                  <div className="pt-2"><span className="text-neutral-500">const</span> decision = <span className="text-neutral-500">await</span> evaluateTransaction(</div>
                  <div className="pl-4"><span className="text-editorial">'pay the nanny 0.1 OG'</span>,</div>
                  <div className="pl-4">{"{ walletAddr, amountWei,"}</div>
                  <div className="pl-6">{"recipient, spendingLimitWei,"}</div>
                  <div className="pl-6">{"currentBalanceWei }"}</div>
                  <div>{")"}</div>
                  <div className="pt-2">decision.approved <span className="text-neutral-500">// true</span></div>
                  <div>decision.teeVerified <span className="text-neutral-500">// true</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-ink text-paper border-b-4 border-paper">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="border-b border-neutral-700 pb-4 mb-12">
            <span className="font-data text-xs uppercase tracking-widest text-neutral-400">
              Analysis
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-black mt-2">
              HOW IT WORKS
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
            {[
              {
                step: "01",
                icon: "INTENT",
                title: "SPEAK",
                body: "Express your intent in plain language. 'Pay the nanny $200 every Friday.' No form fields. No transaction builders. Just intent.",
              },
              {
                step: "02",
                icon: "COMPUTE",
                title: "EVALUATE",
                body: "Parellax routes your intent to a TEE-sealed LLM on 0G Compute. It checks spending limits, validates the request, and signs an approval — all inside a trusted enclave.",
              },
              {
                step: "03",
                icon: "CHAIN",
                title: "EXECUTE",
                body: "The approved signature unlocks your ECDSA-gated vault on the 0G blockchain. Funds move only when cryptographically verified. Every action is audited to 0G KV storage.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`p-8 ${i < 2 ? "border-b lg:border-b-0 lg:border-r border-neutral-700" : ""}`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="font-data text-xs text-editorial border border-editorial px-2 py-1">
                    {item.step}
                  </span>
                  <span className="font-data text-xs text-neutral-400 uppercase tracking-widest mt-1">
                    {item.icon}
                  </span>
                </div>
                <h3 className="font-display text-3xl font-black mb-4">{item.title}</h3>
                <p className="font-body text-sm leading-relaxed text-neutral-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="border-b-4 border-ink">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="border-b border-ink pb-4 mb-12">
            <span className="font-data text-xs uppercase tracking-widest text-neutral-500">
              Infrastructure
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-black mt-2">
              THE 0G STACK
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 border border-ink">
            {[
              {
                label: "0G STORAGE",
                headline: "Every Action, Immutably Logged",
                Icon: Database,
                fig: "Fig. 1.1",
                points: [
                  "KV store for spending limits",
                  "Append-only audit log",
                  "User preferences on-chain",
                  "Stream ID: parellax.v1",
                ],
              },
              {
                label: "0G COMPUTE",
                headline: "Intelligence Inside a Vault",
                Icon: Cpu,
                fig: "Fig. 1.2",
                points: [
                  "TEE-sealed inference",
                  "Qwen 2.5 7B model",
                  "Approval decisions are signed",
                  "Zero leakage by design",
                ],
              },
              {
                label: "0G CHAIN",
                headline: "Funds Move Only When Verified",
                Icon: Link2,
                fig: "Fig. 1.3",
                points: [
                  "ECDSA-gated vault contract",
                  "Galileo Testnet (ID: 16602)",
                  "No signature, no transfer",
                  "Full on-chain auditability",
                ],
              },
            ].map(({ label, headline, Icon, fig, points }, i) => (
              <div
                key={label}
                className={`p-8 hard-shadow-hover ${i < 2 ? "border-b lg:border-b-0 lg:border-r border-ink" : ""}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="border border-ink w-12 h-12 flex items-center justify-center hover:bg-ink hover:text-paper transition-all duration-200">
                    <Icon className="h-5 w-5" strokeWidth={1} />
                  </div>
                  <span className="font-data text-xs text-neutral-500">{fig}</span>
                </div>
                <span className="font-data text-xs uppercase tracking-widest text-neutral-500">
                  {label}
                </span>
                <h3 className="font-display text-2xl lg:text-3xl font-bold mt-2 mb-6 leading-tight">
                  {headline}
                </h3>
                <ul className="space-y-2">
                  {points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <span className="text-editorial font-data text-xs mt-0.5">—</span>
                      <span className="font-body text-sm text-neutral-600">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live on Testnet */}
      <section className="border-b-4 border-ink bg-ink text-paper">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="border-b border-neutral-700 pb-4 mb-12">
            <span className="font-data text-xs uppercase tracking-widest text-neutral-400">
              Deployed
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-black mt-2">
              LIVE ON TESTNET
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-neutral-700">
            <div className="p-8 border-b lg:border-b-0 lg:border-r border-neutral-700 space-y-6">
              <span className="font-data text-xs uppercase tracking-widest text-neutral-400 block">
                Smart Contract
              </span>
              <div className="space-y-4">
                {[
                  { label: "ParellaxVault", value: "0x84e57567758B1143BD285eED2cbD574187a1D710" },
                  { label: "verifiedBrain", value: "0x445bf5fe58f2Fe5009eD79cFB1005703D68cbF85" },
                  { label: "Network", value: "0G Galileo Testnet — Chain ID 16602" },
                  { label: "RPC", value: "https://evmrpc-testnet.0g.ai" },
                  { label: "Solidity", value: "0.8.28 · cancun · viaIR" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-6 border-b border-neutral-800 pb-3">
                    <span className="font-data text-xs text-neutral-500 uppercase tracking-wider shrink-0">{label}</span>
                    <span className="font-data text-xs text-neutral-300 text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 space-y-6">
              <span className="font-data text-xs uppercase tracking-widest text-neutral-400 block">
                0G Infrastructure
              </span>
              <div className="space-y-4">
                {[
                  { label: "Storage Indexer", value: "indexer-storage-testnet-turbo.0g.ai" },
                  { label: "KV Stream", value: "ethers.id('parellax.v1')" },
                  { label: "Flow Contract", value: "0x22E03a6A89B950F1c82ec5e74F8eCa321a105296" },
                  { label: "Compute Router", value: "router-api-testnet.integratenetwork.work/v1" },
                  { label: "TEE Model", value: "qwen/qwen-2.5-7b-instruct · verify_tee: true" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-6 border-b border-neutral-800 pb-3">
                    <span className="font-data text-xs text-neutral-500 uppercase tracking-wider shrink-0">{label}</span>
                    <span className="font-data text-xs text-neutral-300 text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ornamental divider */}
      <div className="py-8 text-center font-display text-2xl text-neutral-400 tracking-[1em] border-b border-ink">
        &#x2727; &#x2727; &#x2727;
      </div>

      {/* CTA */}
      <section className="bg-ink text-paper">
        <div className="max-w-screen-xl mx-auto px-4 py-24 text-center">
          <span className="font-data text-xs uppercase tracking-widest text-editorial">
            Ready
          </span>
          <h2 className="font-display text-5xl lg:text-7xl font-black mt-4 mb-6 leading-[0.95]">
            YOUR INTENT.
            <br />
            <span className="italic font-normal">Verified on-chain.</span>
          </h2>
          <p className="font-body text-lg text-neutral-400 mb-10 max-w-xl mx-auto">
            Connect to the Galileo Testnet and execute your first agentic
            transaction in under 30 seconds.
          </p>
          <Link
            href="/dashboard"
            className="font-sans text-sm uppercase tracking-widest bg-paper text-ink px-12 py-4 hover:bg-editorial hover:text-paper transition-colors duration-200 inline-flex items-center gap-3 min-h-[44px]"
          >
            Launch Parellax <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-ink">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-12 py-12">
            <div className="col-span-12 lg:col-span-4 lg:pr-8 border-b lg:border-b-0 lg:border-r border-ink pb-8 lg:pb-0">
              <h3 className="font-display text-3xl font-black mb-3">PARELLAX</h3>
              <p className="font-body text-sm text-neutral-600 leading-relaxed mb-4">
                Verifiable Orchestration Layer for Agentic Banking. Built on the
                0G ecosystem for the 0G hackathon.
              </p>
              <span className="font-data text-xs text-neutral-400 uppercase tracking-widest">
                Vol. 1 — Galileo Testnet
              </span>
            </div>

            <div className="col-span-6 lg:col-span-2 pt-8 lg:pt-0 lg:px-8 border-r border-ink">
              <span className="font-data text-xs uppercase tracking-widest text-neutral-500 block mb-4">
                Navigate
              </span>
              <ul className="space-y-2">
                {[
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "Architecture", href: "#architecture" },
                  { label: "Launch App", href: "/dashboard" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="font-sans text-sm hover:text-editorial transition-colors duration-200"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-6 lg:col-span-2 pt-8 lg:pt-0 lg:px-8 border-r border-ink">
              <span className="font-data text-xs uppercase tracking-widest text-neutral-500 block mb-4">
                Built With
              </span>
              <ul className="space-y-2">
                {["0G Storage", "0G Compute", "0G Chain", "Qwen 2.5 7B"].map((item) => (
                  <li key={item} className="font-sans text-sm text-neutral-600">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 lg:col-span-4 pt-8 lg:pt-0 lg:pl-8 border-t lg:border-t-0 border-ink">
              <span className="font-data text-xs uppercase tracking-widest text-neutral-500 block mb-4">
                Technical
              </span>
              <div className="space-y-1 font-data text-xs text-neutral-500">
                <div>Chain ID: 16602 — Galileo Testnet</div>
                <div>Solidity: 0.8.28 (cancun · viaIR)</div>
                <div>SDK: @0gfoundation/0g-ts-sdk@1.2.6</div>
                <div className="pt-2 text-neutral-600">npm packages</div>
                <div>@daiwikdomain/parellax-storage</div>
                <div>@daiwikdomain/parellax-compute</div>
              </div>
            </div>
          </div>

          <div className="border-t border-ink py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-data text-xs text-neutral-500 uppercase tracking-widest">
              Parellax — All Rights Reserved
            </span>
            <span className="font-data text-xs text-neutral-500 uppercase tracking-widest">
              Printed on the Galileo Testnet
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
