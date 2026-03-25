import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTranscriptSnippets } from "./transcript.js";

export function registerTools(server: McpServer): void {

  // ── get_transcript ──────────────────────────────────────────────────

  server.tool(
    "get_transcript",
    "Fetch a YouTube video transcript as plain text. Supports pagination by character range via offset and response_limit.",
    {
      url: z.string().describe("YouTube video URL or video ID"),
      lang: z.string().optional().describe("Language code (default: 'en')"),
      offset: z.number().optional().describe("Character offset to start from (default: 0)"),
      response_limit: z.number().optional().describe("Max characters to return (default: 50000)"),
    },
    async ({ url, lang, offset, response_limit }) => {
      try {
        const snippets = await getTranscriptSnippets(url, lang ?? "en");
        const fullText = snippets.map((s) => s.text).join(" ");
        const start = offset ?? 0;
        const limit = response_limit ?? 50000;
        const slice = fullText.slice(start, start + limit);

        const result = {
          text: slice,
          offset: start,
          length: slice.length,
          total_length: fullText.length,
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return errorResponse(error);
      }
    },
  );

  // ── get_timed_transcript ────────────────────────────────────────────

  server.tool(
    "get_timed_transcript",
    "Fetch a YouTube video transcript with timestamps. Returns an array of {text, start, duration} objects with pagination by snippet index.",
    {
      url: z.string().describe("YouTube video URL or video ID"),
      lang: z.string().optional().describe("Language code (default: 'en')"),
      offset: z.number().optional().describe("Snippet index to start from (default: 0)"),
      limit: z.number().optional().describe("Maximum number of snippets to return (default: 500)"),
    },
    async ({ url, lang, offset, limit }) => {
      try {
        const snippets = await getTranscriptSnippets(url, lang ?? "en");
        const start = offset ?? 0;
        const count = limit ?? 500;
        const slice = snippets.slice(start, start + count);

        const result = {
          snippets: slice,
          offset: start,
          count: slice.length,
          total_snippets: snippets.length,
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return errorResponse(error);
      }
    },
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const safe = message.length > 300 ? message.slice(0, 300) + "..." : message;
  return {
    content: [{ type: "text" as const, text: `Error: ${safe}` }],
    isError: true,
  };
}
