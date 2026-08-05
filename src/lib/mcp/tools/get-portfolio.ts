import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_club_portfolio",
  title: "Get club portfolio",
  description: "List EMIL Invest's current holdings with quantity, purchase price and cost basis.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("portfolio_holdings")
      .select("ticker, name, sector, exchange, holding_type, quantity, purchase_price, cost_basis, purchase_date")
      .order("ticker");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { holdings: data ?? [] },
    };
  },
});
