# Guardians of Galia — Character and Asset Product Plan

## Product direction

The artwork should power a coherent **Crew + Hangar** system rather than a disconnected skin gallery. Players remain young expedition captains. They collect pilots, suits, companions, and equipment that express identity and slightly reshape missions without creating pay-to-win complexity.

## Player-facing systems

### 1. Faction leaders

- Charon introduces the MUD Forge Vanguard.
- Vaor introduces the ONI Dreamseekers.
- Opos introduces the USTUR Swift Circuit.
- Leaders deliver chapter briefings, rank promotions, and faction-control reactions.
- Leader art appears as framed transmissions so concept-sheet backgrounds remain intentional.

### 2. Pilot roster and skins

- A player's active pilot is visible in the command deck, mission briefing, results, and profile.
- Skins are grouped into readable roles: Explorer, Combat, Racer, Engineer, and Envoy.
- Most skins are cosmetic. A role grants one small, easy-to-understand mission modifier.
- Duplicate visual variants become mastery rewards instead of separate inventory clutter.

### 3. Loadout triangle

Every expedition uses three choices:

1. **Pilot role** — changes movement, defense, or discovery.
2. **Tool** — one active ability with a cooldown.
3. **Companion** — one passive bonus and a collectible bond track.

This is deep enough for high-school players but readable for elementary-school players.

### 4. Mission families supported by the library

- **Survey:** exploration, signal tracing, and companion discovery.
- **Salvage:** collect resources while hazards escalate.
- **Rescue:** locate an NPC and escort them to extraction.
- **Defense:** protect a beacon from short enemy waves.
- **Race:** route planning, boost gates, and time trials using USTUR racer art.
- **Boss:** multi-step encounters led by Ahr and other legendary figures.

Violence stays stylized and non-graphic. Weapons function as sci-fi tools against drones, hazards, shields, and corrupted machines.

## Asset routing

| ArtStation project | Product use |
| --- | --- |
| MUD Commander | MUD promotion screens, late-game commander skin |
| MUD Player One | Starter pilot and unlockable suit variants |
| Foliage | Verdant Vault and Kora Wilds environment layers |
| GAN weapon projects | Tool cards, loadout previews, ability icons |
| Opos Elder | USTUR leader and briefing transmissions |
| Vaor Scarka | ONI leader and briefing transmissions |
| Charon Gotti Jr | MUD leader and briefing transmissions |
| MUD NPC | Rescue targets, station crew, codex entries |
| PURI | Companion system and bond progression |
| Mission 1 | Story illustration and mission-result panel |
| Ahr | Aurora Crown boss and mystery narrative |
| Old Leaders | Lore archive and chapter interludes |
| USTUR Combat | Combat-role pilot collection |
| USTUR Racer | Race missions and speed-role pilot collection |

## Technical asset policy

- Untouched source downloads live in `assets/reference/star-atlas/<project-id>/masters/`.
- `assets/reference/star-atlas/manifest.json` preserves source URLs and local filenames.
- Web-ready display images and thumbnails live in `public/assets/star-atlas/`.
- `public/assets/star-atlas/catalog.json` records dimensions, aspect ratio, alpha, and file weight.
- `scripts/build-art-library.py` safely regenerates all web derivatives.
- UI uses thumbnails for lists and display images only for focused cards or story panels.
- Future crops must be saved as new derivatives; source masters are never overwritten.

## Recommended build order

1. Command Deck with speaking leader transmissions.
2. Pilot roster and three starter loadouts.
3. Two new mission families: Rescue and Race.
4. Equipment tool selection using the weapon collection.
5. PURI companion bond track.
6. Ahr boss encounter and first complete campaign ending.
7. Codex, mastery variants, achievements, and optional cloud-profile adapter.

## Release caution

The supplied images are available publicly and are now preserved locally with source links. Before a commercial public release, confirm the applicable Star Atlas, studio, and artist permissions for redistribution and in-product use. Keep a visible credits/source screen even when broader usage is approved.
