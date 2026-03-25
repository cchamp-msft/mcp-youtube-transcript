import { fetchTranscript } from "youtube-transcript";

export interface TranscriptSnippet {
  text: string;
  start: number;
  duration: number;
}

export function extractVideoId(url: string): string {
  // youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];

  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/ID or youtube.com/v/ID
  const embedMatch = url.match(/youtube\.com\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // If it looks like a bare video ID already
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  throw new Error(`Could not extract video ID from URL: ${url}`);
}

export async function getTranscriptSnippets(
  url: string,
  lang: string,
): Promise<TranscriptSnippet[]> {
  const videoId = extractVideoId(url);
  const raw = await fetchTranscript(videoId, { lang });
  return raw.map((entry) => ({
    text: entry.text,
    start: entry.offset,
    duration: entry.duration,
  }));
}
