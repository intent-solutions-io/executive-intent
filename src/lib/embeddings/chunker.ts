/**
 * Text Chunker for Executive Intent
 *
 * Splits text into semantic chunks for embedding generation.
 * Designed for email and calendar content.
 */

import { createHash } from "crypto";

export interface ChunkOptions {
  maxChunkSize?: number; // Max characters per chunk
  overlapSize?: number; // Characters to overlap between chunks
  preserveParagraphs?: boolean; // Try to split at paragraph boundaries
}

export interface TextChunk {
  text: string;
  index: number;
  hash: string;
  startOffset: number;
  endOffset: number;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 1000,
  overlapSize: 100,
  preserveParagraphs: true,
};

/**
 * Generates a consistent hash for a chunk
 */
export function generateChunkHash(text: string, index: number): string {
  const input = `${index}:${text}`;
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex").slice(0, 16);
}

/**
 * Finds the best split point near a target position
 * Prefers: paragraph > sentence > word boundaries
 */
function findSplitPoint(
  text: string,
  targetPos: number,
  searchRange: number = 100
): number {
  const start = Math.max(0, targetPos - searchRange);
  const end = Math.min(text.length, targetPos + searchRange);
  const searchText = text.slice(start, end);

  // Look for paragraph break (double newline)
  const paragraphMatch = searchText.match(/\n\n/);
  if (paragraphMatch && paragraphMatch.index !== undefined) {
    return start + paragraphMatch.index + 2;
  }

  // Look for sentence boundary (. ! ? followed by space or newline)
  const sentenceMatch = searchText.match(/[.!?]\s/);
  if (sentenceMatch && sentenceMatch.index !== undefined) {
    return start + sentenceMatch.index + 2;
  }

  // Look for word boundary (space or newline)
  const wordMatch = searchText.match(/\s/);
  if (wordMatch && wordMatch.index !== undefined) {
    return start + wordMatch.index + 1;
  }

  // No good boundary found, split at target
  return targetPos;
}

/**
 * Splits text into overlapping chunks at semantic boundaries
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxChunkSize, overlapSize, preserveParagraphs } = opts;

  // Handle empty or short text
  if (!text || text.trim().length === 0) {
    return [];
  }

  const trimmedText = text.trim();

  if (trimmedText.length <= maxChunkSize) {
    return [
      {
        text: trimmedText,
        index: 0,
        hash: generateChunkHash(trimmedText, 0),
        startOffset: 0,
        endOffset: trimmedText.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let currentPos = 0;
  let chunkIndex = 0;

  while (currentPos < trimmedText.length) {
    // Calculate end position for this chunk
    let endPos = Math.min(currentPos + maxChunkSize, trimmedText.length);

    // If not at the end, find a good split point
    if (endPos < trimmedText.length && preserveParagraphs) {
      endPos = findSplitPoint(trimmedText, endPos);
    }

    // Extract chunk text
    const chunkText = trimmedText.slice(currentPos, endPos).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        index: chunkIndex,
        hash: generateChunkHash(chunkText, chunkIndex),
        startOffset: currentPos,
        endOffset: endPos,
      });
      chunkIndex++;
    }

    // Move to next chunk with overlap
    const nextPos = endPos - overlapSize;

    // Ensure we're always making forward progress
    // (prevent infinite loops when overlap is larger than chunk)
    if (nextPos <= currentPos) {
      currentPos = endPos;
    } else {
      currentPos = nextPos;
    }

    // Safety check: if we're very close to the end, just break
    if (currentPos >= trimmedText.length - 1) {
      break;
    }
  }

  return chunks;
}

/**
 * Chunks email content with special handling for headers
 */
export function chunkEmail(
  subject: string,
  body: string,
  options: ChunkOptions = {}
): TextChunk[] {
  // Combine subject and body with clear separation
  const fullText = `Subject: ${subject}\n\n${body}`;
  return chunkText(fullText, options);
}

/**
 * Chunks calendar event content
 */
export function chunkCalendarEvent(
  title: string,
  description: string | undefined,
  location: string | undefined,
  attendees: string[] | undefined,
  options: ChunkOptions = {}
): TextChunk[] {
  const parts: string[] = [`Event: ${title}`];

  if (location) {
    parts.push(`Location: ${location}`);
  }

  if (attendees && attendees.length > 0) {
    parts.push(`Attendees: ${attendees.join(", ")}`);
  }

  if (description) {
    parts.push(`\nDescription:\n${description}`);
  }

  const fullText = parts.join("\n");
  return chunkText(fullText, options);
}

/**
 * Validates chunk integrity
 */
export function validateChunks(chunks: TextChunk[]): boolean {
  if (chunks.length === 0) {
    return true;
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Check index matches position
    if (chunk.index !== i) {
      return false;
    }

    // Check hash is valid
    if (chunk.hash !== generateChunkHash(chunk.text, chunk.index)) {
      return false;
    }

    // Check offsets are valid
    if (chunk.startOffset >= chunk.endOffset) {
      return false;
    }

    // Check chunks don't have gaps (allowing for overlap)
    if (i > 0) {
      const prevChunk = chunks[i - 1];
      if (chunk.startOffset > prevChunk.endOffset) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Reconstructs approximate original text from chunks
 * (Note: Due to overlap, this won't be exact)
 */
export function reconstructFromChunks(chunks: TextChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  if (chunks.length === 1) {
    return chunks[0].text;
  }

  // Sort by index
  const sorted = [...chunks].sort((a, b) => a.index - b.index);

  let result = sorted[0].text;

  for (let i = 1; i < sorted.length; i++) {
    const chunk = sorted[i];
    const prevChunk = sorted[i - 1];

    // Calculate how much overlap there might be
    const overlapStart = chunk.startOffset;
    const prevEnd = prevChunk.endOffset;

    if (overlapStart < prevEnd) {
      // There's overlap - append only the non-overlapping part
      const overlap = prevEnd - overlapStart;
      if (overlap < chunk.text.length) {
        result += chunk.text.slice(overlap);
      }
    } else {
      // No overlap - append with space
      result += " " + chunk.text;
    }
  }

  return result;
}
