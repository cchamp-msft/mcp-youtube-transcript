# mcp-youtube-transcript

A small [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that fetches YouTube video transcripts so an AI assistant can read, summarize, or search what was said in a video.

It runs over stdio (for Claude Desktop, Claude Code, Cursor, and similar clients) or as a stateless Streamable HTTP server (for Docker or remote use).

## Tools

| Tool | What it does |
| --- | --- |
| `get_transcript` | Returns the transcript as one block of plain text. Paginates by character range. |
| `get_timed_transcript` | Returns an array of `{ text, start, duration }` snippets with timestamps. Paginates by snippet index. |

Both tools accept a full YouTube URL (`watch?v=`, `youtu.be/`, `/embed/`, `/v/`) or a bare 11-character video ID.

### `get_transcript`

| Argument | Type | Default | Notes |
| --- | --- | --- | --- |
| `url` | string | required | YouTube URL or video ID |
| `lang` | string | `en` | Caption language code |
| `offset` | number | `0` | Character offset to start from |
| `response_limit` | number | `50000` | Max characters to return |

Response:

```json
{
  "text": "...",
  "offset": 0,
  "length": 12345,
  "total_length": 12345
}
```

### `get_timed_transcript`

| Argument | Type | Default | Notes |
| --- | --- | --- | --- |
| `url` | string | required | YouTube URL or video ID |
| `lang` | string | `en` | Caption language code |
| `offset` | number | `0` | Snippet index to start from |
| `limit` | number | `500` | Max snippets to return |

Response:

```json
{
  "snippets": [{ "text": "hello", "start": 0.0, "duration": 1.2 }],
  "offset": 0,
  "count": 500,
  "total_snippets": 1834
}
```

Use `total_length` / `total_snippets` to decide whether to page for more.

## Install

Requires Node.js 20 or newer.

```bash
git clone https://github.com/cchamp-msft/mcp-youtube-transcript.git
cd mcp-youtube-transcript
npm install
npm run build
```

The server entry point is `build/index.js`.

## Use with an MCP client

### Claude Code

```bash
claude mcp add youtube-transcript -- node /absolute/path/to/mcp-youtube-transcript/build/index.js
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-youtube-transcript/build/index.js"]
    }
  }
}
```

Other clients that support stdio MCP servers (Cursor, Windsurf, Zed, etc.) use the same command and args.

Then ask your assistant something like: *"Summarize https://www.youtube.com/watch?v=dQw4w9WgXcQ"*.

## HTTP mode

Set `MCP_TRANSPORT=http` to expose a stateless Streamable HTTP endpoint instead of stdio.

```bash
MCP_TRANSPORT=http MCP_PORT=8000 npm start
```

| Path | Purpose |
| --- | --- |
| `POST /mcp` | MCP endpoint |
| `GET /health` | Returns `{"status":"ok"}` |

Point an HTTP-capable client at `http://localhost:8000/mcp`.

### Docker

```bash
docker build -t mcp-youtube-transcript .
docker run --rm -p 8000:8000 -e MCP_TRANSPORT=http mcp-youtube-transcript
```

## Configuration

All configuration is via environment variables.

| Variable | Default | Values |
| --- | --- | --- |
| `MCP_TRANSPORT` | `stdio` | `stdio`, `http` |
| `MCP_PORT` | `8000` | Port for HTTP mode |
| `LOG_LEVEL` | `none` | `none`, `basic`, `debug` (currently only echoed in the startup banner) |

## Development

```bash
npm run dev     # tsc --watch
npm test        # vitest
npm run build   # compile to build/
```

Source layout:

| File | Role |
| --- | --- |
| `src/index.ts` | Entry point, transport selection |
| `src/tools.ts` | MCP tool definitions |
| `src/transcript.ts` | Video ID parsing and transcript fetching |
| `src/config.ts` | Environment variable parsing |

## Limitations

- Transcripts come from the unofficial [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) package, which scrapes YouTube's caption data. YouTube can change its page structure at any time and break it.
- Videos without captions in the requested language return an error. Auto-generated captions usually work, but not always.
- Heavy use from one IP address may be rate limited or blocked by YouTube.
- HTTP mode is stateless and has no authentication. Do not expose it to the public internet without putting it behind a proxy that handles auth.

## Contributing

Issues and pull requests are welcome. For anything larger than a small fix, open an issue first so we can talk it over. Please run `npm test` and `npm run build` before submitting.

## License

[MIT](LICENSE)
