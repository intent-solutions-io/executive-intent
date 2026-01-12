"use client";

import { useState } from "react";

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-gray-600">
          Search across your emails and calendar events.
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What did I commit to this week? Search emails and events..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-primary-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Example Queries */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Try asking:</h2>
        <div className="flex flex-wrap gap-2">
          {[
            "What did I commit to this week?",
            "Show me threads about budget",
            "Meetings with John next week",
            "Open loops I need to follow up on",
          ].map((example) => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 && query && !isSearching && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              Try a different search or connect your Google account to start
              indexing.
            </p>
          </div>
        )}

        {results.map((result) => (
          <div
            key={result.id}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  result.source === "gmail" ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                <span className="text-xl">
                  {result.source === "gmail" ? "📧" : "📅"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{result.title}</h3>
                  <span className="text-xs text-gray-400">
                    {Math.round(result.similarity * 100)}% match
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{result.timestamp}</span>
                  <span>•</span>
                  <span>{result.participants.join(", ")}</span>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Open →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!query && results.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">🔎</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-500">
            Enter a query above to search across your indexed emails and
            calendar events. All results include source links for verification.
          </p>
        </div>
      )}
    </div>
  );
}
