import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// Uncomment the line below and configure wrangler.jsonc to enable ISR caching via R2
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache,
});
