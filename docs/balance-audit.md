# Cross-Mode Balance Audit

## Progress target

The product should reward a short session without allowing one easy mode to invalidate the rest of the game. Accessibility settings never apply reward penalties.

| Mode | Typical session | Base crystals | Base XP | PURI bond | Persistent mastery |
|---|---:|---:|---:|---:|---|
| Arcade | 40–65 sec | 2–20 by score/objective | 3–25 | 1 fail / 3 clear | contract records |
| Swarm | 60–68 sec with timing loadouts | 3–25 by score/boss | 3–27 | 1 fail / 3 clear | high score |
| Discovery | 3–6 min | 6 per journal | 6 per journal | 2 | +12 biome mastery |
| Strategy-lite | 2–4 min | 6 base, +5 capture, +5 objective | 6 base, +4 objective | 1 base / 2 objective | cycles/objectives |
| Story | 2–5 min | planet-defined | planet-defined | campaign systems | influence/chapters |

## Findings and rules

- Discovery is intentionally reliable but slower than a successful combat run.
- Strategy rewards planning: finishing the rotating objective approximately doubles the base value when a capture is also achieved.
- Combat failure still advances XP and PURI bond, preventing younger players from hitting a dead end.
- Story chapters unlock sequentially. Side modes raise Captain rank and unlock equipment, but cannot skip the connected campaign.
- Story route choices change mission conditions: Scout reveals information and removes hazards, Balanced preserves the authored encounter, and Salvage adds risk and an extra collection target.
- Arcade grades use accuracy, clear status, and best combo. Displayed magazine size always reflects the equipped tool.
- Later Frontier Control cycles hide tactical recommendations until the player requests a hint.
- The 100-bond Lucky Hug multiplier is capped at 15% and applies equally to activity rewards.
- Calm/Fast combat pace, reduced effects, wide aim, and high contrast do not reduce rewards or disable records.
- PURI combat bonuses improve forgiveness, while long-term currency remains tied to completing activities.

## Future tuning signals

When telemetry exists, measure completion rate, retry rate, median session duration, reward per minute, and abandonment by objective. Do not add dynamic difficulty or hidden reward reductions without a separate product decision.
