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

const EVENT_TYPES = new Set(["start", "complete", "feedback"]);
const MODES = new Set(["story", "swarm", "arcade", "discovery", "strategy", "overall"]);

async function savePlaytestEvent(request, env) {
  if (!env?.DB?.prepare) return new Response("Feedback storage is unavailable.", { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return new Response("Payload too large.", { status: 413 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  const eventType = typeof body?.eventType === "string" ? body.eventType : "";
  const mode = typeof body?.mode === "string" ? body.mode : "";
  if (!EVENT_TYPES.has(eventType) || !MODES.has(mode)) return new Response("Invalid event.", { status: 400 });

  const fun = eventType === "feedback" && Number.isFinite(body?.fun) ? Math.max(1, Math.min(5, Math.round(body.fun))) : null;
  const difficulty = eventType === "feedback" && ["easy", "right", "hard"].includes(body?.difficulty) ? body.difficulty : null;
  const note = eventType === "feedback" && typeof body?.note === "string" ? body.note.trim().slice(0, 240) : null;

  await env.DB.prepare(
    "INSERT INTO playtest_events (id, event_type, mode, fun, difficulty, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), eventType, mode, fun, difficulty, note, new Date().toISOString()).run();

  return Response.json({ saved: true }, { status: 201 });
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS?.fetch) {
      return withSecurityHeaders(new Response("Site assets are unavailable.", { status: 503 }));
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/playtest-events") {
      if (request.method !== "POST") return withSecurityHeaders(new Response("Method not allowed.", { status: 405 }));
      try {
        return withSecurityHeaders(await savePlaytestEvent(request, env));
      } catch {
        return withSecurityHeaders(new Response("Feedback could not be saved.", { status: 503 }));
      }
    }

    return withSecurityHeaders(await fetchAsset(request, env));
  },
};
