"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Github,
  MessageSquareText,
  Sigma,
  LineChart,
} from "lucide-react";

const GITHUB_REPO = "https://github.com/Vatsa10/TradeXpert";

/* ------------------------------------------------------------------ */
/* Scroll reveal — IntersectionObserver drives a clip-path inset()     */
/* transition. CSS does the animating, so it stays off the main thread.*/
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);

    // Fail-open: content must never stay clipped if the observer misses
    // (zoom levels, odd viewports, observer quirks). Reveal is decoration,
    // visibility is not negotiable.
    const failOpen = window.setTimeout(() => setVisible(true), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failOpen);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={`lp-reveal ${className}`}
      style={{ "--lp-i": index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SOURCES = [
  "NSE",
  "BSE",
  "Zerodha Kite Connect",
  "Quarterly results",
  "Corporate actions",
  "Finnhub",
  "Google Gemini",
  "FII / DII flows",
  "Nifty 50 · Bank Nifty",
  "Company filings",
];

const FEATURES = [
  {
    icon: MessageSquareText,
    kicker: "01 — Chat analyst",
    title: "Ask in plain English. Get the filing.",
    body: "“Why did HDFC Bank fall this week?” “Compare Tata Motors and M&M on margins.” The analyst reads live NSE and BSE prices, quarterly results and corporate actions, then answers with the numbers it used — and links back to them.",
    image: "/landing/dashboard-real-1.png",
    alt: "TradXpert AI chat analyst answering a question about an Indian equity",
  },
  {
    icon: Sigma,
    kicker: "02 — Quant desk",
    title: "DCF, ratios and portfolio risk, already done.",
    body: "Intrinsic value with editable assumptions, a full ratio sheet across five years, sector heatmaps, and concentration and drawdown checks on your actual holdings. The work an analyst does in a spreadsheet — without the spreadsheet.",
    image: "/landing/dashboard-real-2.png",
    alt: "Valuation and portfolio analytics dashboard with sector heatmap",
  },
  {
    icon: LineChart,
    kicker: "03 — Paper trading",
    title: "Trade the thesis before you risk the capital.",
    body: "Place the position on paper at live market prices, track P&L through the 9:15–15:30 session, and review what the idea actually earned. Connect Zerodha Kite when you're ready to take it live.",
    image: "/landing/dashboard-real-3.png",
    alt: "Paper trading positions and profit and loss view",
  },
];

const STATS = [
  { value: "NSE + BSE", label: "Both exchanges, one workspace" },
  { value: "9:15–15:30", label: "Live through the IST session" },
  { value: "₹0", label: "To open an account and start" },
];

const LandingPage = () => {
  return (
    <div className="lp relative flex w-full flex-col">
      {/* ---------- Atmosphere: warm mesh + paper grain ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[110vh] overflow-hidden">
        <Image
          src="/landing/mesh-bg.jpg"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="scale-125 object-cover opacity-[0.28] blur-3xl saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#faf7f2]/40 via-[#faf7f2]/80 to-[#faf7f2]" />
      </div>
      <div className="lp-grain pointer-events-none absolute inset-0 z-0" />

      {/* ================= HERO ================= */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-36 pb-20 md:pt-44">
        <div className="lp-enter" style={{ "--lp-i": 0 } as React.CSSProperties}>
          <span className="lp-mono inline-flex items-center gap-2.5 rounded-full bg-white/70 px-3.5 py-1.5 text-[11px] tracking-[0.18em] text-[color:var(--lp-ink-soft)] uppercase lp-shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--lp-amber-deep)]" />
            India-first equity research
          </span>
        </div>

        <h1
          className="lp-serif lp-enter mt-8 max-w-4xl text-[clamp(2.75rem,7.2vw,5.5rem)] leading-[0.98] font-normal tracking-[-0.025em] text-balance"
          style={{ "--lp-i": 1 } as React.CSSProperties}
        >
          Research Indian equities
          <br className="hidden sm:block" /> like a{" "}
          <em className="text-[color:var(--lp-amber-deep)] italic">fund</em>.
          <span className="text-[color:var(--lp-ink-faint)]"> Not a forum.</span>
        </h1>

        <p
          className="lp-enter mt-8 max-w-xl text-[1.0625rem] leading-[1.65] text-[color:var(--lp-ink-soft)] md:text-lg"
          style={{ "--lp-i": 2 } as React.CSSProperties}
        >
          TradXpert is an AI analyst built for NSE and BSE. It reads prices,
          results and filings, runs the valuation, watches your portfolio&apos;s
          risk — and lets you paper trade the idea before a single rupee moves.
        </p>

        <div
          className="lp-enter mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          style={{ "--lp-i": 3 } as React.CSSProperties}
        >
          <Link
            href="/sign-up"
            className="lp-press lp-shadow-md group inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-[color:var(--lp-ink)] px-7 text-[0.95rem] font-medium text-[color:var(--lp-cream)] hover:bg-[#241d15]"
          >
            Start researching — free
            <ArrowRight size={17} className="lp-arrow" />
          </Link>
          <Link
            href="/sign-in"
            className="lp-press inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white/70 px-7 text-[0.95rem] font-medium text-[color:var(--lp-ink)] lp-shadow-sm hover:bg-white"
          >
            Sign in
          </Link>
          <Link
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="lp-press inline-flex h-13 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-medium text-[color:var(--lp-ink-faint)] hover:text-[color:var(--lp-ink)]"
          >
            <Github size={17} />
            Source
          </Link>
        </div>

        {/* Hero product shot */}
        <Reveal className="mt-20" index={0}>
          <figure className="lp-shot lp-shadow-lg relative overflow-hidden rounded-[26px] bg-white p-1.5">
            <Image
              src="/landing/dashboard-real-2.png"
              alt="TradXpert dashboard showing Indian market movers, sector heatmap and AI commentary"
              width={1024}
              height={566}
              priority
              sizes="(max-width: 1152px) 100vw, 1088px"
              className="h-auto w-full rounded-[20px]"
            />
            <figcaption className="lp-mono absolute bottom-5 left-5 rounded-full bg-[color:var(--lp-ink)]/85 px-3.5 py-1.5 text-[10px] tracking-[0.16em] text-[color:var(--lp-cream)] uppercase backdrop-blur-sm">
              Market desk · live NSE session
            </figcaption>
          </figure>
        </Reveal>

        {/* Stat row */}
        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-[color:var(--lp-hairline)] sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.value} index={i}>
              <div className="h-full bg-[color:var(--lp-cream)] px-6 py-7">
                <div className="lp-serif text-3xl tracking-tight">{s.value}</div>
                <div className="mt-1.5 text-sm text-[color:var(--lp-ink-faint)]">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= DATA SOURCES ================= */}
      <section className="relative z-10 overflow-hidden border-y border-[color:var(--lp-hairline)] bg-[color:var(--lp-cream-deep)] py-6">
        <div className="flex w-max lp-marquee">
          {[0, 1].map((dup) => (
            <ul
              key={dup}
              aria-hidden={dup === 1}
              className="lp-mono flex shrink-0 items-center gap-10 pr-10 text-[11px] tracking-[0.2em] text-[color:var(--lp-ink-faint)] uppercase"
            >
              {SOURCES.map((s) => (
                <li key={s} className="flex items-center gap-10 whitespace-nowrap">
                  {s}
                  <span className="h-1 w-1 rounded-full bg-[color:var(--lp-amber-deep)]/50" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* ================= FEATURE TRIO ================= */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-28">
        <Reveal>
          <h2 className="lp-serif max-w-2xl text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-balance">
            Three desks. One workspace.
          </h2>
          <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-[color:var(--lp-ink-soft)]">
            Everything a serious retail investor in India stitches together from
            six tabs and a spreadsheet, in one place.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.kicker} index={i}>
              <article className="lp-card lp-shadow-md flex h-full flex-col overflow-hidden rounded-[24px] bg-white">
                <div className="lp-shot overflow-hidden bg-[color:var(--lp-cream-deep)]">
                  <Image
                    src={f.image}
                    alt={f.alt}
                    width={1024}
                    height={566}
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="h-auto w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-2.5">
                    <f.icon
                      size={16}
                      className="text-[color:var(--lp-amber-deep)]"
                      strokeWidth={2}
                    />
                    <span className="lp-mono text-[10px] tracking-[0.2em] text-[color:var(--lp-ink-faint)] uppercase">
                      {f.kicker}
                    </span>
                  </div>
                  <h3 className="lp-serif mt-4 text-[1.5rem] leading-[1.15] tracking-[-0.01em]">
                    {f.title}
                  </h3>
                  <p className="mt-3.5 text-[0.9375rem] leading-[1.6] text-[color:var(--lp-ink-soft)]">
                    {f.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28">
        <Reveal>
          <div className="lp-shadow-lg relative overflow-hidden rounded-[32px] bg-[color:var(--lp-ink)] px-8 py-20 text-center md:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-[color:var(--lp-amber)]/25 blur-[100px]"
            />
            <h2 className="lp-serif relative mx-auto max-w-2xl text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.04] tracking-[-0.02em] text-balance text-[color:var(--lp-cream)]">
              Markets open at 9:15.
              <br />
              <span className="text-[color:var(--lp-amber)] italic">
                Walk in with an analyst.
              </span>
            </h2>
            <p className="relative mx-auto mt-6 max-w-md text-[1.0625rem] leading-relaxed text-[color:var(--lp-cream)]/60">
              Free to start. No broker account required until you want to trade
              for real.
            </p>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="lp-press group inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-[color:var(--lp-amber)] px-8 text-[0.95rem] font-semibold text-[color:var(--lp-ink)] hover:bg-[color:var(--lp-cream)]"
              >
                Create your account
                <ArrowRight size={17} className="lp-arrow" />
              </Link>
              <Link
                href="/sign-in"
                className="lp-press inline-flex h-13 items-center justify-center rounded-full px-6 text-[0.95rem] font-medium text-[color:var(--lp-cream)]/70 hover:text-[color:var(--lp-cream)]"
              >
                I already have one
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 border-t border-[color:var(--lp-hairline)] px-6 py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="lp-serif text-lg tracking-tight">
            TradXpert
            <span className="lp-mono ml-3 text-[10px] tracking-[0.2em] text-[color:var(--lp-ink-faint)] uppercase">
              v1.02 · open source
            </span>
          </p>
          <Link
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="lp-press inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--lp-ink-soft)] lp-shadow-sm hover:text-[color:var(--lp-ink)]"
          >
            <Github size={16} />
            View the source
            <ArrowUpRight size={14} className="lp-arrow" />
          </Link>
        </div>
        <p className="mx-auto mt-8 w-full max-w-6xl text-xs leading-relaxed text-[color:var(--lp-ink-faint)]">
          TradXpert is a research and education tool. Nothing here is investment
          advice. Markets carry risk; do your own diligence before you buy.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
