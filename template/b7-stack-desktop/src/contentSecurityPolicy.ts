// The window may load its own files and call the API. Inline scripts and
// styles are allowed only for Vite's dev server, which needs them for hot
// reloading. The dev server sends this policy in development
// (vite.renderer.config.ts) and the app:// handler in a packaged app
// (src/main/index.ts), so it does not depend on any webRequest listener.
export function contentSecurityPolicy(
  apiBaseUrl: string,
  { devServer }: { devServer: boolean },
): string {
  return [
    `default-src 'self'${devServer ? " 'unsafe-inline'" : ""}`,
    `connect-src 'self' ${new URL(apiBaseUrl).origin}`,
    "img-src 'self' data:",
  ].join("; ");
}
