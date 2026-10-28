import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "Sign in to view your saved reviews." }, { status: 401 });

    const { data, error } = await supabase
      .from("analysis_reports")
      .select("id,input_text,summary,findings,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("TrustLens history read failed:", error.message);
      return NextResponse.json({ error: "Saved history is temporarily unavailable." }, { status: 503 });
    }
    const history = (data || []).map((item) => ({
      id: item.id,
      input_text: item.input_text,
      analysis_text: item.summary,
      signals: item.findings || [],
      created_at: item.created_at,
    }));
    return NextResponse.json({ history });
  } catch (error) {
    console.error("TrustLens history route failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "History service is not configured." }, { status: 503 });
  }
}
