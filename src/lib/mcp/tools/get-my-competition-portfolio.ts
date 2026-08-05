import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_competition_portfolio",
  title: "Get my competition portfolio",
  description:
    "The signed-in user's stock competition participation: holdings, cash (ASK) and recent transactions.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: participant, error: pErr } = await supabase
      .from("competition_participants")
      .select("id, display_name, joined_at, is_active, all_time_start_value, monthly_start_value, yearly_start_value")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();

    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    if (!participant) {
      return {
        content: [{ type: "text", text: "You are not registered in the stock competition." }],
        structuredContent: { participant: null, holdings: [], transactions: [] },
      };
    }

    const [{ data: holdings, error: hErr }, { data: transactions, error: tErr }] = await Promise.all([
      supabase
        .from("competition_portfolios")
        .select("ticker, quantity, average_purchase_price")
        .eq("participant_id", participant.id),
      supabase
        .from("competition_transactions")
        .select("ticker, transaction_type, quantity, price_per_share, total_amount, executed_at")
        .eq("participant_id", participant.id)
        .order("executed_at", { ascending: false })
        .limit(25),
    ]);

    const error = hErr ?? tErr;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const payload = { participant, holdings: holdings ?? [], transactions: transactions ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
