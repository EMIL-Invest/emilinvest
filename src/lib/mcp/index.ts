import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getClubPortfolio from "./tools/get-portfolio";
import getPerformanceHistory from "./tools/get-performance-history";
import getLeaderboard from "./tools/get-leaderboard";
import getMyCompetitionPortfolio from "./tools/get-my-competition-portfolio";
import listTradableStocks from "./tools/list-tradable-stocks";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "emil-invest",
  title: "Emil Invest",
  version: "0.1.0",
  instructions:
    "Tools for EMIL Invest, a student investment club at NTNU. Read the club's transparent portfolio and its performance versus the OSEBX benchmark, list stocks tradable in the stock competition, view the competition leaderboard, and read the signed-in user's own competition portfolio and trades. All data is read-only.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getClubPortfolio,
    getPerformanceHistory,
    listTradableStocks,
    getLeaderboard,
    getMyCompetitionPortfolio,
  ],
});
