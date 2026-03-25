import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    alias: {
      "youtube-transcript": "youtube-transcript/dist/youtube-transcript.esm.js",
    },
  },
});
