import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Tables to migrate in dependency order (parents before children)
const TABLES_IN_ORDER = [
  "normalization_registry",
  "suffering_metrics",
  "suffering_index",
  "ai_incident_summary",
  "analytics_events",
  "safety_signals",
  "global_prayer_board",
  "global_prayer_voices",
  "prayer_wall",
  "prayer_wall_reactions",
  "shared_receipts",
  "raw_records",
  "canonical_entities",
  "canonical_raw_links",
  "incident_clusters",
  "cluster_members",
  "derived_scores",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Source: current project (read with service role to bypass RLS)
    const sourceUrl = Deno.env.get("SUPABASE_URL")!;
    const sourceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const source = createClient(sourceUrl, sourceKey);

    // Target: external project
    const targetUrl = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const targetKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
    const target = createClient(targetUrl, targetKey);

    const results: Record<string, { read: number; wrote: number; error?: string }> = {};

    for (const table of TABLES_IN_ORDER) {
      try {
        // Read all rows (paginate to handle >1000 rows)
        let allRows: any[] = [];
        let from = 0;
        const PAGE = 1000;

        while (true) {
          const { data, error } = await source
            .from(table)
            .select("*")
            .range(from, from + PAGE - 1);

          if (error) throw new Error(`Read error: ${error.message}`);
          if (!data || data.length === 0) break;
          allRows = allRows.concat(data);
          if (data.length < PAGE) break;
          from += PAGE;
        }

        if (allRows.length === 0) {
          results[table] = { read: 0, wrote: 0 };
          continue;
        }

        // Write in batches of 500
        let wrote = 0;
        const BATCH = 500;
        for (let i = 0; i < allRows.length; i += BATCH) {
          const batch = allRows.slice(i, i + BATCH);
          const { error: insertError } = await target
            .from(table)
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

          if (insertError) {
            // Some tables use different PK names, try without onConflict
            const { error: insertError2 } = await target
              .from(table)
              .insert(batch);
            if (insertError2) {
              throw new Error(`Write error: ${insertError2.message}`);
            }
          }
          wrote += batch.length;
        }

        results[table] = { read: allRows.length, wrote };
      } catch (tableErr) {
        results[table] = {
          read: 0,
          wrote: 0,
          error: tableErr instanceof Error ? tableErr.message : String(tableErr),
        };
      }
    }

    // Also migrate DB functions by calling RPC to verify they exist
    const summary = {
      tables_processed: Object.keys(results).length,
      total_rows_read: Object.values(results).reduce((s, r) => s + r.read, 0),
      total_rows_wrote: Object.values(results).reduce((s, r) => s + r.wrote, 0),
      errors: Object.entries(results)
        .filter(([, r]) => r.error)
        .map(([t, r]) => `${t}: ${r.error}`),
      details: results,
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
