"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  source: "gmail" | "calendar";
  title: string;
  snippet: string;
  timestamp: string;
  participants: string[];
  similarity: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const examples = [
    "What did I commit to this week?",
    "Show me threads about budget",
    "Meetings with John next week",
    "Open loops I need to follow up on",
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, tenantId: "placeholder" }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Search"
        description="Query indexed content across sources. Results should always be source-linked and auditable."
        actions={
          <Button href="/evidence#retrieval-test" variant="outline" size="md">
            View retrieval receipts →
          </Button>
        }
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-display-sm">
              Ask or Search
            </CardTitle>
            <p className="mt-2 text-body-sm text-neutral-800">
              Uses vector retrieval when embeddings exist; otherwise returns an empty result set (truthfully).
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What did I commit to this week?"
                className={cn(
                  "w-full flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-body-md text-neutral-900",
                  "placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                )}
              />
              <Button
                type="submit"
                disabled={isSearching}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-body-sm font-semibold text-neutral-900">Try asking</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setQuery(example)}
                    className={cn(
                      "inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-body-sm font-medium",
                      "text-neutral-900/80 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                    )}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="mt-8 space-y-4">
        {results.length === 0 && query && !isSearching && (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <div className="text-4xl">🔍</div>
                <div className="mt-4 text-display-sm font-semibold text-neutral-900">No results</div>
                <p className="mt-2 text-body-sm text-neutral-800">
                  Try a different query or connect sources so content can be ingested and indexed.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button href="/connections" variant="primary" size="md" className="w-full sm:w-auto">
                    Open Connections
                  </Button>
                  <Button href="/evidence" variant="outline" size="md" className="w-full sm:w-auto">
                    View Evidence →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results.map((result) => (
          <Card key={result.id} hover>
            <CardContent className="!mt-0">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    result.source === "gmail" ? "bg-status-error-bg text-status-error-text" : "bg-status-processing-bg text-status-processing-text"
                  )}
                >
                  <span className="text-xl" aria-hidden="true">
                    {result.source === "gmail" ? "📧" : "📅"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <div className="text-body-md font-semibold text-neutral-900 truncate">{result.title}</div>
                    <div className="text-body-xs text-neutral-800 font-mono">
                      {Math.round(result.similarity * 100)}% match
                    </div>
                  </div>
                  <p className="mt-2 text-body-sm text-neutral-800">{result.snippet}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-body-xs text-neutral-800">
                    <span className="font-mono">{result.timestamp}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="truncate">{result.participants.join(", ")}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  Open →
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!query && results.length === 0 && (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <div className="text-4xl">🔎</div>
                <div className="mt-4 text-display-sm font-semibold text-neutral-900">Start searching</div>
                <p className="mt-2 text-body-sm text-neutral-800">
                  Enter a query to search across indexed emails and calendar events. Evidence receipts show if retrieval is verified.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
