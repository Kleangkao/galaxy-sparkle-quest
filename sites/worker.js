const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404 || (request.method !== "GET" && request.method !== "HEAD")) return response;

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (!acceptsHtml) return response;

  const fallbackUrl = new URL("/index.html", request.url);
  return env.ASSETS.fetch(new Request(fallbackUrl, request));
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS?.fetch) {
      return withSecurityHeaders(new Response("Site assets are unavailable.", { status: 503 }));
    }

    return withSecurityHeaders(await fetchAsset(request, env));
  },
};
