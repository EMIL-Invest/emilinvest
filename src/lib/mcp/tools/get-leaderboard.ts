import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_competition_leaderboard",
  title: "Get competition leaderboard",
  description: "Ranked results from the latest stock competition leaderboard snapshot.",
  inputSchema: {
    period: z
      .enum(["monthly", "yearly", "all_time"])
      .default("all_time")
      .describe("Which competition period to rank by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ period }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    // Finn siste snapshot-dato først, og filtrer på den — uten dette blandes
    // rader fra eldre snapshots inn og samme deltaker dukker opp flere ganger.
    const { data: latest, error: latestError } = await supabase
      .from("competition_leaderboard")
      .select("snapshot_date")
      .eq("period_type", period ?? "all_time")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) return { content: [{ type: "text", text: latestError.message }], isError: true };
    if (!latest) {
      return { content: [{ type: "text", text: "[]" }], structuredContent: { entries: [] } };
    }

    const { data, error } = await supabase
      .from("competition_leaderboard")
      .select("rank, portfolio_value, return_percentage, snapshot_date, participant_id, competition_participants(display_name)")
      .eq("period_type", period ?? "all_time")
      .eq("snapshot_date", latest.snapshot_date)
      .order("rank", { ascending: true })
      .limit(100);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { entries: data ?? [] },
    };
  },
});
