# Changelog

## 0.9.1 — Completion flow and pointer performance

- Removed the dead-end “Stay here” action and unrelated cross-mode recommendation.
- Completed runs now return to the relevant mode or assignment menu.
- Moved Arcade pointer tracking off the React render path and onto one composited animation frame.
- Reduced always-running background animation work across every mode.
- Added regression coverage for completion navigation and high-frequency pointer movement.

## 0.9.0 — Public beta readiness

- Completed the EN/TH browser foundation and self-hosted both language fonts.
- Added clear local-save, privacy, support, credit, and browser-only disclosures.
- Added safe recovery for stale website versions and runtime failures.
- Updated routing dependencies and cleared the production security audit.
- Added desktop-browser journey tests and continuous release checks.
- Kept the complete source artwork archive while excluding unused art from public builds.
