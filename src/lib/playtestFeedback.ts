export type FeedbackMode = "story" | "swarm" | "arcade" | "discovery" | "strategy" | "overall";

interface PlaytestData {
  starts: Partial<Record<FeedbackMode, number>>;
  completions: Partial<Record<FeedbackMode, number>>;
  feedback: Array<{ mode: FeedbackMode; fun: number; difficulty: "easy" | "right" | "hard"; note: string; createdAt: string }>;
}

const KEY = "galia-local-playtest-v1";
const EMPTY: PlaytestData = { starts: {}, completions: {}, feedback: [] };

function load(): PlaytestData {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<PlaytestData> | null;
    return { starts: parsed?.starts ?? {}, completions: parsed?.completions ?? {}, feedback: Array.isArray(parsed?.feedback) ? parsed.feedback.slice(-40) : [] };
  } catch { return { ...EMPTY, starts: {}, completions: {}, feedback: [] }; }
}

function save(data: PlaytestData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Feedback storage is optional and device-local. */ }
}

function sendAnonymousEvent(payload: { eventType: "start" | "complete" | "feedback"; mode: FeedbackMode; fun?: number; difficulty?: "easy" | "right" | "hard"; note?: string }) {
  if (!globalThis.fetch) return;
  void globalThis.fetch("/api/playtest-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Local reporting still works offline or when hosted storage is unavailable.
  });
}

export function trackModeStart(mode: FeedbackMode) {
  const data = load();
  data.starts[mode] = (data.starts[mode] ?? 0) + 1;
  save(data);
  sendAnonymousEvent({ eventType: "start", mode });
}

export function trackModeComplete(mode: FeedbackMode) {
  const data = load();
  data.completions[mode] = (data.completions[mode] ?? 0) + 1;
  save(data);
  sendAnonymousEvent({ eventType: "complete", mode });
}

export function savePlaytestFeedback(mode: FeedbackMode, fun: number, difficulty: "easy" | "right" | "hard", note: string) {
  const data = load();
  data.feedback.push({ mode, fun: Math.max(1, Math.min(5, Math.round(fun))), difficulty, note: note.trim().slice(0, 240), createdAt: new Date().toISOString() });
  data.feedback = data.feedback.slice(-40);
  save(data);
  sendAnonymousEvent({ eventType: "feedback", mode, fun, difficulty, note: note.trim().slice(0, 240) });
}

export function getLocalPlaytestSummary() {
  const data = load();
  return { starts: data.starts, completions: data.completions, feedbackCount: data.feedback.length };
}

export function getLocalPlaytestReport() {
  const data = load();
  return JSON.stringify({ product: "Guardians of Galia", version: 1, ...data }, null, 2);
}
