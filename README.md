# TradeXpert: Enterprise-Grade AI Stock Analysis Engine

TradeXpert is a specialized analytical platform built on a distributed, event-driven architecture. It leverages a multi-agent orchestration layer to perform deep fundamental and qualitative analysis of global equities.

## System Architecture

The application employs a decoupled architecture comprising the following components:

- **Orchestration Layer**: Inngest is utilized as a durable execution engine for long-running workflows, managing event-driven function triggers and ensuring transactional consistency across distributed steps.
- **AI Synthesis Tier**: A four-agent multi-agent system (MAS) utilizing Google Gemini (Flash 2.0 and 1.5 Pro) for technical parsing, sentiment derivation, and report generation.
- **Data Persistence Layer**: MongoDB Atlas provides the operational data store for analysis requests, report archival, and historical session state.
- **Authentication Infrastructure**: Powered by Better Auth, implementing secure session management and role-based access control.
- **Front-end / Edge Layer**: Next.js 15+ (App Router) serves as the presentation and Server-Side Rendering (SSR) engine, with React Server Components (RSC) and Server Actions for low-latency backend interactions.

---

## Technical Stack

- **Core Framework**: Next.js 15+ (TypeScript)
- **Runtime Environment**: Bun 1.1+
- **Background Job Orchestration**: Inngest (Durable Execution)
- **AI Infrastructure**: Google Generative AI (Gemini SDK)
- **Database Engine**: MongoDB (Mongoose ODM)
- **External Data Ingestion**: Finnhub API, Alpha Vantage API, NewsAPI

---

## Local Development Lifecycle

### 1. Dependency Acquisition
Ensure your environment is configured for Bun. Execute the following to hydrate the dependency graph:
```bash
bun install
```

### 2. Environment Configuration
Populate the `.env` file with the following interface. Note that the system behavior varies based on the `INNGEST_DEV` and `NODE_ENV` flags:

```env
# Financial Data Connectors
ALPHA_VANTAGE_API_KEY=<string>
FINNHUB_API_KEY=<string>
NEXT_PUBLIC_FINNHUB_API_KEY=<string>

# Persistence & Identity
MONGODB_URI=<mongodb_uri>
BETTER_AUTH_SECRET=<ba_secret>
BETTER_AUTH_URL=http://localhost:3000

# LLM Configuration
GEMINI_API_KEY=<gemini_api_key>

# Inngest Local Cluster
INNGEST_EVENT_KEY=local
INNGEST_DEV=1
# INNGEST_SIGNING_KEY is omitted for local signature bypass
```

### 3. Execution (Twin-Process Model)

Local development requires simultaneous execution of the application server and the orchestration daemon:

#### Primary: Next.js Development Server
```bash
bun dev
```

#### Secondary: Inngest RPC Daemon
The daemon provides the local execution environment for the Inngest SDK and handles autodiscovery of served functions.
```bash
npx inngest-cli@latest dev
```

The orchestration monitoring dashboard is accessible at `http://localhost:8288`.

---

## Production Deployment (Vercel Integration)

The production environment operates in "Cloud Mode," requiring rigorous request validation.

### Required Environment Variables

| Parameter | Identifier | Note |
| :--- | :--- | :--- |
| **Inngest Signing Key** | `INNGEST_SIGNING_KEY` | Provides cryptographic verification of SDK requests. |
| **Inngest Event Key** | `INNGEST_EVENT_KEY` | Authenticates outgoing event ingestion to Inngest Cloud. |
| **Generative AI Key** | `GEMINI_API_KEY` | Required for inference steps within durable functions. |
| **Persistence URI** | `MONGODB_URI` | Production Atlas connection string. |

### Post-Deployment Synchronization
1. After initializing the Vercel deployment, propagate the application schema to Inngest Cloud by syncing the endpoint: `https://<domain>/api/inngest`.
2. Ensure `INNGEST_DEV` is **not** present in the production context to prevent unauthorized local bypass attempts.

---

## Autonomous Agent Implementation
The `runStockAnalysis` workflow implements a linear processing pipeline with automatic retries and error handling:

1. **Ingestion Agent**: Aggregates structured financial metrics and unstructured news corpora.
2. **Quantitative Analyst**: Deterministic processing of technical indicators and financial ratios.
3. **Qualitative Analyst**: Neural sentiment analysis and narrative extraction from news datasets.
4. **Report Synthesizer**: Final LLM-driven aggregation of technical and qualitative findings into a Markdown-formatted report.
