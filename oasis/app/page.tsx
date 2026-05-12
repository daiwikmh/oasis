"use client";

import Link from "next/link";
import { useRef } from "react";
import Marquee from "react-fast-marquee";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpRight, ShieldCheck, Send, Users, ArrowLeftRight } from "lucide-react";
import { NoiseTexture } from "@/components/landing/NoiseTexture";

const ACCENT = "#DFE104";
const BG = "#09090B";
const FG = "#FAFAFA";
const MUTED_BG = "#27272A";
const MUTED_FG = "#A1A1AA";
const BORDER = "#3F3F46";

const STATS = [
  { value: "6", label: "Decimals" },
  { value: "1:1", label: "Backed" },
  { value: "0", label: "Freezes" },
  { value: "0", label: "Blocklists" },
  { value: "100", label: "Per batch" },
  { value: "∞", label: "Supply API" },
];

const FEATURES = [
  {
    n: "01",
    Icon: Send,
    title: "Send and receive",
    body: "Non-custodial PUSD transfers on Solana. Passkey-confirmed. Recipient ATAs auto-created. Once confirmed, final.",
  },
  {
    n: "02",
    Icon: Users,
    title: "Run payroll",
    body: "Up to 100 employees per batch. CSV import with row-level validation. One signature per recipient. Recurring schedules persist locally.",
  },
  {
    n: "03",
    Icon: ArrowLeftRight,
    title: "Swap any SPL token",
    body: "PUSD ↔ USDC, SOL, JUP, and the rest of the long tail through Jupiter v6. Best route across every DEX. Slippage you control.",
  },
  {
    n: "04",
    Icon: ShieldCheck,
    title: "Open supply data",
    body: "Live circulating supply and 30-day snapshot history pulled from Palm's public circulation API. No middleman, no portal, no auth.",
  },
];

const PRINCIPLES = [
  "Final means final.",
  "No freeze. No blacklist.",
  "Supply is public.",
  "Self-custody by default.",
  "Every chain, same decimals.",
  "If it works with USDC, it works with PUSD.",
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reducedMotion ? 1 : 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reducedMotion ? 1 : 0.2]);

  const marqueeSpeedFast = reducedMotion ? 0 : 80;
  const marqueeSpeedSlow = reducedMotion ? 0 : 35;

  return (
    <div
      className="min-h-screen"
      style={{ background: BG, color: FG, fontFamily: "var(--font-grotesk), system-ui, sans-serif" }}
    >
      <NoiseTexture />
      <Nav />

      {/* HERO */}
      <section ref={heroRef} className="relative pt-32 md:pt-40 pb-24 md:pb-32 px-4 md:px-8">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="max-w-[95vw] mx-auto"
        >
          <div className="flex items-center gap-3 mb-8 md:mb-12">
            <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
            <span
              className="text-xs md:text-sm uppercase tracking-widest font-semibold"
              style={{ color: MUTED_FG }}
            >
              Stablecoin banking · Solana native · v1
            </span>
          </div>

          <h1
            className="font-bold uppercase tracking-tighter leading-[0.85]"
            style={{ fontSize: "clamp(3.5rem, 13vw, 14rem)" }}
          >
            <span className="block">Pay.</span>
            <span className="block" style={{ color: ACCENT }}>
              Swap.
            </span>
            <span className="block">Earn in PUSD.</span>
          </h1>

          <div className="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl">
            <p className="text-xl md:text-2xl leading-tight" style={{ color: FG }}>
              The non-custodial wallet, payroll, and onramp for Palm USD. No freeze, no
              blacklist, no permission slips. Final settlement, every time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:items-end md:justify-end">
              <KineticButton href="/login" variant="primary">
                Get started
              </KineticButton>
              <KineticButton href="/reserves" variant="outline">
                View reserves
              </KineticButton>
            </div>
          </div>
        </motion.div>

        <DecorativeNumber>01</DecorativeNumber>
      </section>

      {/* STATS MARQUEE */}
      <section
        className="overflow-hidden border-y-2"
        style={{ background: ACCENT, borderColor: ACCENT, color: "#000" }}
      >
        <Marquee speed={marqueeSpeedFast} gradient={false} autoFill play={!reducedMotion}>
          {STATS.map((s, i) => (
            <div key={i} className="flex items-baseline gap-4 md:gap-8 px-6 md:px-12 py-8 md:py-12">
              <span
                className="font-bold uppercase leading-none"
                style={{ fontSize: "clamp(4rem, 8vw, 8rem)" }}
              >
                {s.value}
              </span>
              <span className="text-sm md:text-lg uppercase tracking-widest font-semibold">
                {s.label}
              </span>
              <span className="text-3xl md:text-5xl font-bold mx-4 md:mx-8 opacity-60">×</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* FEATURES — sticky cards */}
      <section className="relative px-4 md:px-8 py-24 md:py-32">
        <div className="max-w-[95vw] mx-auto">
          <div className="flex items-end justify-between mb-12 md:mb-20 gap-4">
            <div>
              <span
                className="text-xs md:text-sm uppercase tracking-widest font-semibold block mb-3"
                style={{ color: MUTED_FG }}
              >
                What's inside
              </span>
              <h2
                className="font-bold uppercase tracking-tighter leading-[0.9]"
                style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
              >
                Four modules.
                <br />
                One signature.
              </h2>
            </div>
          </div>

          <div className="space-y-px" style={{ background: BORDER }}>
            {FEATURES.map((f) => (
              <FeatureCard key={f.n} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPLES MARQUEE */}
      <section
        className="overflow-hidden border-y-2"
        style={{ borderColor: BORDER, background: BG }}
      >
        <Marquee speed={marqueeSpeedSlow} gradient={false} autoFill play={!reducedMotion}>
          {PRINCIPLES.map((p, i) => (
            <div key={i} className="flex items-center gap-8 md:gap-16 px-8 md:px-16 py-12 md:py-16">
              <span
                className="font-bold uppercase tracking-tighter leading-none whitespace-nowrap"
                style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}
              >
                {p}
              </span>
              <span style={{ color: ACCENT }} className="text-3xl md:text-5xl font-bold">
                ◆
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* PROOF — palm constraints */}
      <section className="px-4 md:px-8 py-24 md:py-32">
        <div className="max-w-[95vw] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-5">
            <span
              className="text-xs md:text-sm uppercase tracking-widest font-semibold block mb-4"
              style={{ color: MUTED_FG }}
            >
              The token
            </span>
            <h3
              className="font-bold uppercase tracking-tighter leading-[0.9]"
              style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
            >
              PUSD is just
              <br />
              <span style={{ color: ACCENT }}>an ERC-20.</span>
            </h3>
          </div>
          <div className="md:col-span-7 space-y-6 md:space-y-8 text-lg md:text-xl leading-tight">
            <p style={{ color: FG }}>
              No SDK to install. No proprietary RPC. No portal. PUSD is a standard SPL token on
              Solana with 6 decimals. If your code works with USDC, it works with PUSD.
            </p>
            <p style={{ color: MUTED_FG }}>
              Palm publishes circulating supply and snapshot history to two public endpoints. We
              surface both live on{" "}
              <Link
                href="/reserves"
                className="underline underline-offset-4 hover:opacity-70"
                style={{ color: ACCENT }}
              >
                /reserves
              </Link>
              . That&apos;s the entire integration surface.
            </p>
            <div
              className="border-l-4 pl-6 py-2 text-base md:text-lg"
              style={{ borderColor: ACCENT, color: MUTED_FG }}
            >
              The contract has no freeze authority, no blacklist function, and no pause. We
              don&apos;t maintain client-side blocklists. Treat every confirmed transaction as
              final.
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section
        className="relative overflow-hidden border-t-2 px-4 md:px-8 py-24 md:py-40"
        style={{ borderColor: BORDER }}
      >
        <div className="max-w-[95vw] mx-auto">
          <h2
            className="font-bold uppercase tracking-tighter leading-[0.85]"
            style={{ fontSize: "clamp(3.5rem, 14vw, 16rem)" }}
          >
            Hold PUSD
            <br />
            <span style={{ color: ACCENT }}>like cash.</span>
          </h2>
          <div className="mt-12 md:mt-16 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
            <p className="text-lg md:text-2xl max-w-xl leading-tight" style={{ color: MUTED_FG }}>
              Sign in with email. A Solana wallet appears. Send, swap, run payroll, see the
              reserves backing every dollar.
            </p>
            <KineticButton href="/login" variant="primary" size="lg">
              Open Oasis
            </KineticButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ───────────── components ───────────── */

function Nav() {
  return (
    <nav
      className="sticky top-0 z-40 border-b-2 backdrop-blur-sm"
      style={{ borderColor: BORDER, background: `${BG}E6` }}
    >
      <div className="max-w-[95vw] mx-auto flex items-center justify-between h-16 md:h-20 px-4 md:px-8">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold uppercase tracking-tighter"
          style={{ color: FG }}
        >
          Oasis
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          <Link
            href="/reserves"
            className="hidden sm:inline-flex text-xs md:text-sm uppercase tracking-widest font-semibold hover:opacity-70"
            style={{ color: MUTED_FG }}
          >
            Reserves
          </Link>
          <KineticButton href="/login" variant="primary" size="sm">
            Log in
          </KineticButton>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 px-4 md:px-8 py-12 md:py-16" style={{ borderColor: BORDER }}>
      <div className="max-w-[95vw] mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p
            className="font-bold uppercase tracking-tighter text-2xl md:text-3xl"
            style={{ color: FG }}
          >
            Oasis × PUSD
          </p>
          <p className="mt-2 text-sm" style={{ color: MUTED_FG }}>
            Non-custodial. Solana-native. Final.
          </p>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-3 text-sm uppercase tracking-widest font-semibold"
          style={{ color: MUTED_FG }}
        >
          <Link href="/reserves" className="hover:opacity-70" style={{ color: FG }}>
            Reserves
          </Link>
          <Link href="/login" className="hover:opacity-70" style={{ color: FG }}>
            Log in
          </Link>
          <a
            href="https://www.palmusd.com"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-70"
            style={{ color: FG }}
          >
            Palm USD ↗
          </a>
        </div>
      </div>
      <div
        className="max-w-[95vw] mx-auto mt-12 pt-6 border-t text-xs uppercase tracking-widest"
        style={{ borderColor: BORDER, color: MUTED_FG }}
      >
        © Oasis 2026 · Built on PUSD
      </div>
    </footer>
  );
}

function KineticButton({
  href,
  children,
  variant = "primary",
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-tighter transition-all active:scale-95 hover:scale-[1.03]";
  const sizes = {
    sm: "h-10 px-4 text-xs md:text-sm",
    md: "h-14 px-8 text-sm md:text-base",
    lg: "h-16 md:h-20 px-10 md:px-14 text-base md:text-xl",
  } as const;
  const variantStyle =
    variant === "primary"
      ? { background: ACCENT, color: "#000" }
      : { background: "transparent", color: FG, border: `2px solid ${BORDER}` };
  return (
    <Link
      href={href}
      className={`${base} ${sizes[size]} group`}
      style={variantStyle}
    >
      {children}
      <ArrowUpRight
        size={size === "lg" ? 24 : size === "sm" ? 14 : 18}
        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </Link>
  );
}

function FeatureCard({
  n,
  Icon,
  title,
  body,
}: {
  n: string;
  Icon: typeof Send;
  title: string;
  body: string;
}) {
  return (
    <article
      className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 p-8 md:p-12 transition-colors duration-300"
      style={{ background: BG }}
    >
      <span
        className="md:col-span-2 font-bold uppercase tracking-tighter text-5xl md:text-6xl leading-none transition-colors duration-300"
        style={{ color: MUTED_BG }}
      >
        {n}
      </span>
      <div className="md:col-span-7 flex flex-col gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <Icon size={20} style={{ color: FG }} className="transition-colors duration-300 group-hover:!text-black" />
          <h3
            className="font-bold uppercase tracking-tighter text-3xl md:text-5xl lg:text-6xl leading-[0.9] transition-colors duration-300"
            style={{ color: FG }}
          >
            {title}
          </h3>
        </div>
        <p
          className="text-base md:text-lg lg:text-xl leading-tight transition-colors duration-300"
          style={{ color: MUTED_FG }}
        >
          {body}
        </p>
      </div>
      <div className="md:col-span-3 flex md:items-end md:justify-end">
        <span
          className="text-xs uppercase tracking-widest font-semibold opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-1"
          style={{ color: "#000" }}
        >
          See it <ArrowUpRight size={14} />
        </span>
      </div>

      {/* hover flood — accent fills card on hover */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: ACCENT }}
      />
      <style jsx>{`
        article:hover h3 {
          color: #000;
        }
        article:hover p {
          color: rgba(0, 0, 0, 0.75);
        }
        article:hover span:first-of-type {
          color: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </article>
  );
}

function DecorativeNumber({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="hidden lg:block absolute right-4 md:right-8 bottom-12 font-bold uppercase tracking-tighter leading-none pointer-events-none select-none"
      style={{ color: MUTED_BG, fontSize: "clamp(8rem, 16vw, 18rem)" }}
    >
      {children}
    </span>
  );
}
