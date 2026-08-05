import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_performance_history",
  title: "Get performance history",
  description:
    "Daily portfolio value history for EMIL Invest, including the OSEBX benchmark value and invested capital.",
  inputSchema: {
    limit: z.number().int().min(1).max(365).default(60).describe("Number of most recent days to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("portfolio_history")
      .select("date, portfolio_value, osebx_value, invested_capital")
      .order("date", { ascending: false })
      .limit(limit ?? 60);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).slice().reverse();
    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { history: rows },
    };
  },
});
