import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer/index";
import { getFormattedTodayDate } from "../utils";
import { getNews, getAIAnalysisContext } from "../actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getStockPrice, getRecentNews } from "../analysis/tools";
import { runQuantitativeAnalyst, runQualitativeAnalyst, runReportWriter } from "../analysis/agents";
import { connectToDatabase } from "@/database/mongoose";
import AnalysisRequest from "@/database/models/analysis.model";

type UserForNewsEmail = {
  id: string;
  email: string;
  name: string;
};

type MarketNewsArticle = any;

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email", triggers: [{ event: "app/user.created" }] },
  async ({ event, step }: any) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
    `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-3.1-flash-lite-preview" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining TradXpert. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary", triggers: [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }] },
  async ({ step }: any) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);
    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: UserForNewsEmail;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as UserForNewsEmail[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: (placeholder) Summarize news via AI
    const userNewsSummaries: {
      user: UserForNewsEmail;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-3.1-flash-lite-preview" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Failed to summarize news for : ", user.email, e);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: (placeholder) Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);

/**
 * Progressive Multi-Agent Stock Analysis Workflow
 * 1. Data Fetcher (Finnhub rich context + news)
 * 2. Quantitative + Qualitative analysts IN PARALLEL, each persisted the
 *    moment it lands so the polling client can reveal cards progressively.
 * 3. Report Writer (needs both stages; errors clearly if either failed)
 */

/** Result envelope so one failing agent never rejects the Promise.all. */
type StageResult<T> = { ok: true; data: T } | { ok: false; error: string };

const stageError = (error: any): string =>
  error?.message || "Unknown error during AI synthesis";

export const runStockAnalysis = inngest.createFunction(
  { id: "run-stock-analysis", triggers: [{ event: "app/analysis.requested" }] },
  async ({ event, step }: any) => {
    const { requestId, symbol, companyName, userEmail } = event.data;

    const persist = async (stepId: string, update: Record<string, any>) =>
      step.run(stepId, async () => {
        await connectToDatabase();
        await AnalysisRequest.findOneAndUpdate(
          { requestId },
          { ...update, updatedAt: new Date() }
        );
        return true;
      });

    try {
      // 1. Fetch Data (Rich Finnhub Context + Fallback tools)
      const { stockData, newsData } = await step.run("fetch-data", async () => {
        // Get the rich "TradingView-style" context from Finnhub
        const richContext = await getAIAnalysisContext(symbol);

        // Fallback/Supplemental news if needed (optional, richContext already has some)
        const news = await getRecentNews(companyName);

        return { stockData: richContext, newsData: news };
      });

      // 2. Quant + Qual run concurrently. Each chain persists its own stage as
      // soon as it resolves, so quant is readable while qual is still running.
      const quantChain = step
        .run("quant-analysis", async (): Promise<StageResult<any>> => {
          try {
            return { ok: true, data: await runQuantitativeAnalyst(stockData) };
          } catch (error: any) {
            return { ok: false, error: stageError(error) };
          }
        })
        .then(async (result: StageResult<any>) => {
          await persist(
            "persist-quant",
            result.ok
              ? { quantAnalysis: result.data, "stages.quant.state": "completed", "stages.quant.completedAt": new Date() }
              : { "stages.quant.state": "error", "stages.quant.error": result.error, "stages.quant.completedAt": new Date() }
          );
          return result;
        });

      const qualChain = step
        .run("qual-analysis", async (): Promise<StageResult<any>> => {
          try {
            return { ok: true, data: await runQualitativeAnalyst(newsData) };
          } catch (error: any) {
            return { ok: false, error: stageError(error) };
          }
        })
        .then(async (result: StageResult<any>) => {
          await persist(
            "persist-qual",
            result.ok
              ? { qualAnalysis: result.data, "stages.qual.state": "completed", "stages.qual.completedAt": new Date() }
              : { "stages.qual.state": "error", "stages.qual.error": result.error, "stages.qual.completedAt": new Date() }
          );
          return result;
        });

      const [quantResult, qualResult]: [StageResult<any>, StageResult<any>] =
        await Promise.all([quantChain, qualChain]);

      // 3. The report writer needs both halves. Rather than hallucinate a
      // recommendation from half the inputs, fail the report stage loudly.
      if (!quantResult.ok || !qualResult.ok) {
        const failed = [
          !quantResult.ok ? `quantitative (${quantResult.error})` : null,
          !qualResult.ok ? `qualitative (${qualResult.error})` : null,
        ]
          .filter(Boolean)
          .join(" and ");
        const message = `Report not generated: the ${failed} stage failed.`;

        await persist("persist-report-blocked", {
          status: "error",
          error: message,
          "stages.report.state": "error",
          "stages.report.error": message,
          "stages.report.completedAt": new Date(),
        });

        return { success: false, requestId, error: message };
      }

      // 4. Final Report Generation
      const finalReport = await step.run("generate-report", async () => {
        return await runReportWriter(
          companyName,
          symbol,
          quantResult.data,
          qualResult.data
        );
      });

      // 5. Update MongoDB with the result
      await persist("save-result", {
        status: "completed",
        report: finalReport,
        "stages.report.state": "completed",
        "stages.report.completedAt": new Date(),
      });

      return { success: true, requestId };
    } catch (error: any) {
      console.error("Inngest Analysis Error:", error);

      // Update MongoDB to reflect the error status
      await persist("mark-as-failed", {
        status: "error",
        error: stageError(error),
        "stages.report.state": "error",
        "stages.report.error": stageError(error),
        "stages.report.completedAt": new Date(),
      });

      throw error; // Re-throw for Inngest retry logic
    }
  }
);
