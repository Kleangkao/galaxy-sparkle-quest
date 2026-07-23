CREATE TABLE IF NOT EXISTS playtest_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('start', 'complete', 'feedback')),
  mode TEXT NOT NULL CHECK (mode IN ('story', 'swarm', 'arcade', 'discovery', 'strategy', 'overall')),
  fun INTEGER,
  difficulty TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS playtest_events_created_at_idx
ON playtest_events (created_at);
