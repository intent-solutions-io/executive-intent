import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/embeddings/provider";

export interface SearchResult {
  id: string;
  documentId: string;
  chunkText: string;
  similarity: number;
  document: {
    title: string | null;
    source: string;
    externalUrl: string | null;
    author: string | null;
    timestamp: string | null;
  };
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

interface MatchResult {
  id: string;
  document_id: string;
  chunk_text: string;
  similarity: number;
}

interface DocumentRow {
  id: string;
  title: string | null;
  source: string;
  external_url: string | null;
  author: string | null;
  timestamp: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { query, tenantId, limit = 10, threshold = 0.5 } = await request.json();

    if (!query || !tenantId) {
      return NextResponse.json(
        { error: "Missing query or tenantId" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Step 1: Generate embedding for the query
    console.log(`Generating embedding for query: "${query}"`);
    let queryEmbedding: number[];

    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (error) {
      console.error("Failed to generate query embedding:", error);
      return NextResponse.json(
        { error: "Failed to process query" },
        { status: 500 }
      );
    }

    // Step 2: Call the match_documents function
    console.log(`Searching for matches with threshold ${threshold}, limit ${limit}`);

    const { data, error: matchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_tenant_id: tenantId,
      } as never
    );

    if (matchError) {
      console.error("Match documents error:", matchError);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    const matches = (data || []) as MatchResult[];

    if (matches.length === 0) {
      return NextResponse.json({
        query,
        results: [],
        totalResults: 0,
      });
    }

    // Step 3: Fetch document metadata for each match
    const documentIds = [...new Set(matches.map(m => m.document_id))];

    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("id, title, source, external_url, author, timestamp")
      .in("id", documentIds);

    if (docError) {
      console.error("Failed to fetch documents:", docError);
    }

    const documents = (docData || []) as DocumentRow[];

    // Create a map for quick lookup
    const docMap = new Map(documents.map(d => [d.id, d]));

    // Step 4: Combine matches with document metadata
    const results: SearchResult[] = matches.map(match => {
      const doc = docMap.get(match.document_id);

      return {
        id: match.id,
        documentId: match.document_id,
        chunkText: match.chunk_text,
        similarity: match.similarity,
        document: {
          title: doc?.title || null,
          source: doc?.source || "unknown",
          externalUrl: doc?.external_url || null,
          author: doc?.author || null,
          timestamp: doc?.timestamp || null,
        },
      };
    });

    console.log(`Found ${results.length} results for query: "${query}"`);

    return NextResponse.json({
      query,
      results,
      totalResults: results.length,
    } as SearchResponse);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for simple health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "search",
    method: "POST required with { query, tenantId }",
  });
}
