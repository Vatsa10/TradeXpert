# TradeXpert — AI Stock Research & Paper-Trading Platform (India-First)

TradeXpert is an AI-driven equity research platform focused on the Indian market (NSE/BSE), with US-market coverage as a secondary path. It combines a multi-model LLM chat pipeline, a deterministic quant engine, durable background analysis workflows, and a risk-gated paper-trading engine — with an optional personal Zerodha Kite Connect integration for live broker data.

## Feature Overview

### AI Chat Analyst (`/chat`)
- Intent-routed orchestration (`price` / `reason` / `comparison` / `macro`) with three LLM tiers (fast / thinking / pro) on Google Gemini, and automatic **DeepSeek V4 Flash fallback** when Gemini errors or rate-limits.
- **BM25 conversation-history compression** — long chats stay coherent without embeddings: recent turns pass through, older turns are relevance-ranked and re-inserted chronologically.
- Investor **persona mode** (Buffett, Jhunjhunwala, Lynch, Soros, Munger) — detected from the query, shapes voice and checklist.
- Deterministic guardrails: decision policy computes its own comparison scores (LLM verdicts are bounded, not trusted), trend-vs-reasoning consistency reconciliation, confidence calibrated from data availability, rule-based sentiment fallback.
- Hardened ticker extraction (English words like "now"/"all" never become tickers), 3-tier LLM JSON parsing (direct → extracted block → safe default), per-user daily quota (standard + pro tiers), market-pulse injection for "top gainers today"-style queries.

### Quant Engine (`lib/analysis/`, surfaced at `/tools`)
- **Portfolio Lab** — HRP (real hierarchical risk parity), inverse-volatility, and mean-variance optimizers; full metrics suite (Sharpe, Sortino, Calmar, max drawdown, VaR95, CVaR95, skew, kurtosis); correlation heat table; Monte Carlo trade simulator with threshold-based ruin probability.
- **Valuation** — 2-stage DCF with WACC builder (India macro defaults), sensitivity grid, reverse-DCF (implied growth), auto-filled from cleaned financial statements (QoQ/YoY growth, statement alias resolution); half-Kelly position sizer with volatility scaling and correlation penalty, capped by a deterministic risk gate.
- **Options math** — Black-Scholes greeks, Newton-Raphson IV solver with explicit convergence flags, gamma-exposure (GEX) per strike, flip-point, pinning/breakout regime (API: `POST /api/analysis/options`).
- Local technical indicators (Wilder RSI, MACD with crossover detection, Bollinger, Wilder ATR, SMA/EMA) computed from one OHLCV fetch instead of per-indicator API calls.
- **Market Pulse** (`/tools/market`) — most actives / gainers / losers via Yahoo screener, auto-refreshing.
- **Mutual Funds** (`/tools/mutual-funds`) — mfapi.in search, NAV history chart, SIP return calculator with stale-NAV warnings.

### Paper Trading (`/paper`)
- Simulated fills at live prices only (never fabricated), realistic Indian cost model (brokerage, STT, exchange/SEBI/stamp charges).
- Every BUY passes the **risk gate** first: 10% position cap, earnings-proximity halving, VIX-regime halving, cash check — the same guardrails a future live path would use.
- Two-step confirm (review costs + constraints → confirm), positions with avg cost and realized/unrealized PnL, trade history, account reset.
- **No real orders anywhere in the codebase** — live trading stays off until the pipeline earns it.

### Data Layer (`lib/data/providers/`)
| Source | Role | Auth |
| :--- | :--- | :--- |
| NSE/BSE public endpoints | Default Indian quotes/history (circuit-breakered, cached) | none |
| Zerodha Kite Connect | Personal live Indian data + holdings (owner-gated) | Kite API key + daily login |
| Finnhub / Alpha Vantage | US quotes, metrics, statements | free keys |
| Yahoo screener | Market pulse | none |
| mfapi.in | Mutual fund NAVs | none |
| NewsAPI / Finnhub news | News merge (deduped, recency-sorted) | free keys |

Cascade discipline throughout: cache → primary → fallback → **explicit unavailable** (the LLM is told data is missing and instructed not to estimate — it never fabricates from nothing). Failures throw instead of null so they are never negative-cached, and every provider failure logs a single greppable line (`[NSE]`, `[MF]`, `[Kite]`, `[LLM]`, `[Queue]`).

### Deep-Report Pipeline (Inngest)
Durable 4-stage background workflow (`runStockAnalysis`): ingestion → quantitative analyst → qualitative analyst → report synthesizer, with schema-first structured output (Zod), automatic retries, and Mongo persistence.

## Stack

Next.js 16 (App Router, `proxy.ts` middleware with security headers) · TypeScript · Bun · MongoDB Atlas (Mongoose) · Better-Auth (server actions + HTTP handler) · LangChain (`@langchain/google-genai`, `@langchain/openai`) · Inngest · kiteconnect · Tailwind 4 + shadcn/ui (charts are dependency-free inline SVG).

## Setup

```bash
bun install
```

`.env`:

```env
# Persistence & identity
MONGODB_URI=<atlas_uri>
BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_URL=http://localhost:3000

# LLMs
GEMINI_API_KEY=<key>
DEEPSEEK_API_KEY=<key>            # optional — enables fallback + reasoner tier
# DEEPSEEK_MODEL=deepseek-v4-flash

# Market data
FINNHUB_API_KEY=<key>
ALPHA_VANTAGE_API_KEY=<key>
NEWS_API_KEY=<key>
# NSE_INDIA_API_BASE_URL=<optional override for the public NSE source>

# Zerodha Kite (personal use — optional)
KITE_API_KEY=<key>
KITE_API_SECRET=<secret>
# KITE_TOKEN_SECRET=<aes key for token encryption at rest>

# Chat quotas (defaults: 50 standard / 10 pro per day)
# CHAT_DAILY_STANDARD_LIMIT=50
# CHAT_DAILY_PRO_LIMIT=10

# Inngest (local)
INNGEST_EVENT_KEY=local
INNGEST_DEV=1
```

Run (two processes):

```bash
bun dev                        # app on :3000
npx inngest-cli@latest dev     # inngest daemon, dashboard on :8288
```

Tests (pure-logic smoke suite, no network/DB):

```bash
bun scripts/test-analysis.ts
```

## API Surface

All routes session-guarded (401 without auth), validated (400/422 on bad input), no stack traces leaked.

| Route | Purpose |
| :--- | :--- |
| `POST /api/chat` | AI analyst (quota-enforced, history-aware) |
| `POST /api/portfolio/optimize?method=hrp\|inverse_vol\|mean_variance` | Weights + metrics + cumulative series |
| `POST /api/portfolio/monte-carlo` | Trade simulation |
| `POST /api/analysis/dcf` · `GET /api/analysis/fundamentals` | Valuation |
| `POST /api/analysis/options` | Greeks / GEX |
| `POST /api/analysis/position-size` | Risk-gated sizing |
| `GET /api/market/pulse?screen=` | Movers |
| `GET /api/mutual-funds/search` · `GET /api/mutual-funds/[schemeCode]` | MF data + SIP |
| `GET /api/kite/login` → `/api/kite/callback` · `GET /api/kite/status` | Kite session (daily token) |
| `GET/POST /api/paper/*` | Paper account, trades, history |
| `/api/auth/[...all]` | Better-Auth handler |

## Production (Vercel)

Set `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`, and the production `MONGODB_URI` / LLM / data keys; drop `INNGEST_DEV`. After deploy, sync `https://<domain>/api/inngest` with Inngest Cloud. Security headers ship via `proxy.ts`.

## Disclaimer

Research and simulation tool. Nothing here is investment advice; paper trading is simulated and live order placement is intentionally not implemented.
