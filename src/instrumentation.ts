export async function register() {
  // Exclude server-side Sentry imports on Cloudflare Edge to keep the worker bundle under 3MB
  if (process.env.CF_PAGES !== '1') {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("../sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      await import("../sentry.edge.config");
    }
  }
}

export const onRequestError = (err: any) => {
  console.error("Request Error:", err);
};
