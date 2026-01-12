import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { query, tenantId } = await request.json();

    if (!query || !tenantId) {
      return NextResponse.json(
        { error: "Missing query or tenantId" },
        { status: 400 }
      );
    }

    // TODO: Get user's tenant_id from session instead of body
    // TODO: Generate embedding for query using Vertex AI
    // TODO: Call match_documents function

    const supabase = createAdminClient();

    // Placeholder: In production, this would:
    // 1. Embed the query using Vertex AI
    // 2. Call the match_documents function
    // 3. Return results with document metadata

    const mockResults = {
      query,
      results: [],
      message: "Search not yet implemented - embeddings required",
    };

    return NextResponse.json(mockResults);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
