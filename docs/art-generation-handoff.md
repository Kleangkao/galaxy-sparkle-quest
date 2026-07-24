# Guardians of Galia — Art Generation Handoff

## Direction locked for every image

Use the attached Star Atlas image as the **identity reference** and the approved images in `asset/` as the **rendering-style reference**.

### Global prompt — paste this before every subject prompt

> Reimagine the attached subject as premium cute semi-animated 3D game artwork for Guardians of Galia. Preserve the original species, faction anatomy, face structure, eye count, eye shape, visor, sensors, silhouette, costume geometry, palette, age, and role. Cuteness must come from compact readable proportions, softened shape rhythm, a warm confident pose, clean color harmony, and polished animation-film lighting—not from changing the character's identity. Keep USTUR and other non-human eyes, lenses, visors, and facial structures exactly source-faithful; never add anime eyes, human eyes, a mouth, or a smile where the source has none. Use smooth premium surfaces, clean fabric panels, rounded painted armor, restrained glow, and subtle material variation. This is website game art, not a physical plush toy: absolutely no stitches, dotted seam lines, embroidery, quilting, patchwork, fuzzy toy fabric, or photographed-plush construction. No text, logo, border, watermark, gore, or weapon aimed at the viewer. Keep the full silhouette comfortably inside frame with generous padding and make it readable at 96 pixels.

### Negative prompt — append when the generator accepts one

> anime eyes, forced sweet eyes, human eyes on robot, new mouth, identity drift, different species, baby face, Funko proportions, plush seams, stitches, dotted lines, embroidery, quilting, patchwork, fuzzy toy photography, realistic pores, grimdark, gore, excessive bloom, busy background, cropped head, cropped feet, text, logo, watermark

## Output rules

- Character master: square 2048×2048, full body, transparent background if possible.
- Portrait: 4:5, chest-up or three-quarter body, faction-tinted studio gradient.
- Boss/gameplay master: square, transparent background, strong silhouette at 64 px.
- Weapon/tool: 4:3, isolated three-quarter view, transparent background.
- Biome or mode key art: 16:9, environment with clear center-safe and text-safe space.
- Do not bake UI, labels, borders, or rarity colors into an image.
- Generate one neutral master before action poses, skins, or expressions.
- Do not overwrite any source file. Use the output names below.

---

## Batch 1 — Required character masters

These are the highest-priority images. One master can be cropped for faction choice, briefings, Crew, Progress, and Control.

### 1. Commander Charon — MUD leader

- Source: [ArtStation — MUD leader](https://www.artstation.com/artwork/K3DZAR)
- Best local reference: [K3DZAR front portrait](../public/assets/star-atlas/K3DZAR/01-joao-lira-mud-leader-vertical.webp)
- Output: `mud-leader-charon-master-v2.png`
- Subject prompt:

> Create a full-body neutral master of Commander Charon, an authoritative mature MUD leader. Preserve his exact human facial structure, hair, ceremonial armor geometry, teal, burgundy, charcoal, and antique-gold palette, and recognizable leadership silhouette. Make him appealing through slightly compact heroic proportions, rounded armor transitions, calm eyes, a capable half-smile, and a relaxed command pose with one hand near the belt. He must still look mature and authoritative, not childlike. Deep burgundy studio gradient, soft oval ground shadow, restrained teal rim light.

### 2. Pathfinder Vaor — ONI leader

- Source: [ArtStation — ONI leader](https://www.artstation.com/artwork/8BqDQn)
- Best local reference: [8BqDQn vertical](../public/assets/star-atlas/8BqDQn/01-joao-lira-oni-leader-vertical.webp)
- Output: `oni-leader-vaor-master-v2.png`
- Subject prompt:

> Create a full-body neutral master of Pathfinder Vaor, the graceful ONI leader. Preserve the exact ONI species anatomy, face, eye structure, head silhouette, organic costume geometry, plum, black, ivory, and gold palette, and elegant posture. Do not humanize or anime-style the eyes. Make the design cute through clean flowing shapes, poised body language, gentle curiosity, softened organic edges, and luminous but restrained accents. Deep plum studio gradient, soft ground shadow, subtle gold rim light.

### 3. Elder Opos — USTUR leader

- Source: [ArtStation — USTUR leader](https://www.artstation.com/artwork/JrKGXR)
- Best local reference: [JrKGXR vertical](../public/assets/star-atlas/JrKGXR/01-joao-lira-ust-leader-vertical.webp)
- Output: `ustur-leader-opos-master-v2.png`
- Subject prompt:

> Create a full-body neutral master of Elder Opos, an ancient protective USTUR leader. Preserve every source-faithful robotic facial feature: exact sensor and eye-light count, placement, lens shape, visor state, head construction, mechanical silhouette, heritage cloth, saffron, ochre, brown, and cyan palette. Never add human eyes, anime eyes, a mouth, teeth, or a smile. Communicate warmth and wisdom only through posture, head angle, hand gesture, balanced rounded armor plates, and calm cyan sensor light. Keep the leader powerful and ancient rather than baby-like. Dark ochre studio gradient with restrained cyan rim light.

### 4. Nova Reyes — starter MUD pilot

- Source: [ArtStation — MUD Player One](https://www.artstation.com/artwork/Bao3G9)
- Best local reference: [Bao3G9 front](../public/assets/star-atlas/Bao3G9/01-sperasoft-a-keywords-studio-kws-template-cha-mud-m-playerone-fronta-002.webp)
- Existing derivative to replace: [Nova Reyes v1](../public/assets/galia-soft-tech/nova-reyes-mud-pilot-v1.png)
- Output: `nova-reyes-mud-pilot-v2.png`
- Subject prompt:

> Create Nova Reyes as a friendly but competent adult MUD expedition pilot based on the Player One suit. Preserve the suit's recognizable chest, helmet, utility, and color-block geometry. Use compact 3.5-head heroic proportions, a clean black-and-red exploration suit with softly rounded armor, practical equipment, and an alert trailblazer pose holding a scanner at her side. Keep her face mature, natural, and source-compatible; modestly expressive eyes only, never anime eyes. Transparent background.

### 5. K-RAIL — USTUR racer

- Source: [ArtStation — USTUR racer](https://www.artstation.com/artwork/x3XLlY)
- Best local reference: [USTUR racer master](../public/assets/star-atlas/x3XLlY/01-joao-lira-ust-racer-robo1.webp)
- Output: `k-rail-ustur-racer-v2.png`
- Subject prompt:

> Create a full-body master of K-RAIL, an agile USTUR racing pilot. Preserve the exact robotic head, sensors, eye lights, visor, limbs, racing armor silhouette, and source colors. Do not invent a face or human expression. Keep the body agile and aerodynamic rather than short and bulky. Make it appealing through rounded aerodynamic panels, a lively ready-to-launch stance, clean cyan status lights, and confident silhouette rhythm. Transparent background.

### 6. Bastion-7 — USTUR guardian

- Source: [ArtStation — USTUR combat](https://www.artstation.com/artwork/bgenAm)
- Best local reference: [USTUR combat master](../public/assets/star-atlas/bgenAm/01-joao-lira-cc-ust-m-combat-001.webp)
- Output: `bastion-7-ustur-guardian-v2.png`
- Subject prompt:

> Create a full-body master of Bastion-7, a heavy protective USTUR combat guardian. Preserve the original robotic head, sensors, eye lights, armor massing, heritage details, and mechanical anatomy exactly. No human or anime facial features. Keep the guardian broad, powerful, and protective; soften only dangerous corners into polished rounded armor. Pose it as a shield for the crew, planted confidently with one open protective hand. Transparent background, restrained cyan energy accents.

### 7. PURI — primary companion

- Source set: [ArtStation — companion study A](https://www.artstation.com/artwork/QK2Y1L), [ArtStation — companion study B](https://www.artstation.com/artwork/kQLooz)
- Best local identity reference: [QK2Y1L companion view](../public/assets/star-atlas/QK2Y1L/01-joao-lira-illustration-002.webp)
- Output: `puri-companion-master-v2.png`
- Subject prompt:

> Create the canonical PURI companion master. Preserve the selected source creature's exact species anatomy, number and placement of eyes, ears, ridges, limbs, tail, markings, and body silhouette. Do not convert it into a generic Earth cat and do not enlarge or sweeten the eyes beyond the reference. Make it lovable through a compact balanced body, curious head tilt, one small greeting gesture, smooth soft 3D skin or fine fur as appropriate, clean color harmony, and a bright readable silhouette. Transparent background.

### 8. Tigu — alternate companion

- Source: [ArtStation — companion study B](https://www.artstation.com/artwork/kQLooz)
- Best local reference: [kQLooz main view](../public/assets/star-atlas/kQLooz/01-vitaly-tyukin-sand-punaab-fire3.webp)
- Output: `tigu-companion-master-v2.png`
- Subject prompt:

> Create Tigu as a distinct companion using the attached creature as the binding anatomy reference. Preserve every alien facial feature, eye structure, limb count, markings, and species silhouette. Do not turn it into a cat, puppy, or anime mascot. Give it a calm, observant personality through posture and head angle, with smooth premium animated surfaces and restrained luminous accents. Transparent background.

### 9. Ahr — campaign boss

- Source: [ArtStation — Ahr](https://www.artstation.com/artwork/14NRqo)
- Best local reference: [Ahr master](../public/assets/star-atlas/14NRqo/01-joao-lira-ahr.webp)
- Existing derivative to replace: [Ahr v2](../public/assets/galia-cute-tech/ahr-boss-v2.png)
- Output: `ahr-boss-master-v3.png`
- Subject prompt:

> Create Ahr as a formidable but non-gruesome animated-game boss. Preserve the exact creature anatomy, facial and eye structure, silhouette, dark berry and violet palette, core shapes, and recognizable threat. Do not make it a smiling mascot. Cuteness should be limited to clear rounded shape rhythm, expressive mischievous menace, readable proportions, and polished soft-edged rendering. Keep strong boss presence and a visible central weak-point area without adding UI. Transparent background, controlled magenta warning glow.

### 10. MUD station crew / rescue NPC

- Source: [ArtStation — MUD NPC](https://www.artstation.com/artwork/8BqD6Q)
- Best local reference: [MUD NPC portrait](../public/assets/star-atlas/8BqD6Q/01-joao-lira-mud-npc-enemy-portrait-001.webp)
- Output: `mud-station-crew-master-v1.png`
- Subject prompt:

> Convert this MUD NPC into a friendly frontier station engineer and future rescue character. Preserve the face, age, hairstyle, clothing geometry, MUD palette, and practical role. Use compact adult proportions, rounded utility gear, an intelligent approachable expression, and a simple tool-carrying pose. Remove hostile framing without erasing identity. Transparent background.

### 11. Archive elder

- Source: [ArtStation — old leaders](https://www.artstation.com/artwork/1NvkdG)
- Best local reference: [old leader view](../public/assets/star-atlas/1NvkdG/01-joao-lira-old-leaders1.webp)
- Output: `archive-elder-master-v1.png`
- Subject prompt:

> Create a dignified archive elder for lore transmissions. Preserve the selected leader's exact species anatomy, facial structure, eyes or sensors, costume, age, and silhouette. Keep age and authority; do not make the elder infant-like. Add warmth through calm posture, softened shape transitions, clean animated rendering, and a knowing expression supported by the original anatomy. Transparent background.

---

## Batch 2 — Required equipment

These replace raw concept-sheet crops in Crew and Arcade.

### 12. Arc Pistol

- Source: [ArtStation — energy pistol](https://www.artstation.com/artwork/Qxm54E)
- Best local reference: [Qxm54E main](../public/assets/star-atlas/Qxm54E/02-vertpaint-studios-eng-pst-final-main-01.webp)
- Output: `arc-pistol-tool-v2.png`
- Subject prompt:

> Create an isolated Arc Pistol loadout asset. Preserve the original weapon's recognizable silhouette, grip, energy system, color blocks, and technology. Translate it into a compact non-realistic sci-fi signal tool with rounded safe edges, a short readable barrel, chunky ergonomic grip, and one bright status band. It must still look capable and mechanically plausible, not like a foam toy. Three-quarter side view, muzzle angled away from viewer, transparent background.

### 13. Vector Rifle

- Source: [ArtStation — kinetic rifle](https://www.artstation.com/artwork/RqEw2E)
- Best local reference: [RqEw2E main](../public/assets/star-atlas/RqEw2E/03-vertpaint-studios-kin-ar-main-02.webp)
- Output: `vector-rifle-tool-v2.png`
- Subject prompt:

> Create an isolated Vector Rifle loadout asset. Preserve the source silhouette, receiver, stock, magazine or energy geometry, sights, and faction color placement. Simplify surface noise and soften dangerous corners while keeping it clearly more powerful than the Arc Pistol. Premium semi-animated 3D rendering, three-quarter side view, muzzle angled away, transparent background.

### 14. Aegis Repeater

- Source: [ArtStation — heavy kinetic weapon](https://www.artstation.com/artwork/Z0gQ4X)
- Best local reference: [Z0gQ4X main](../public/assets/star-atlas/Z0gQ4X/02-vertpaint-studios-kin-gat-main-02.webp)
- Output: `aegis-repeater-tool-v2.png`
- Subject prompt:

> Create an isolated Aegis Repeater support weapon. Preserve its heavy multi-part silhouette, armored body, grip arrangement, rotating or repeating mechanism, and source technology. Communicate defense through a broad shield-like housing and cyan protective energy band. Round only unsafe edges; do not turn it into a toy blaster. Three-quarter side view, transparent background.

### 15. Arcade contract pistol

- Source: [ArtStation — pistol](https://www.artstation.com/artwork/kN1PYn)
- Best local reference: [pistol view 03](../public/assets/star-atlas/kN1PYn/03-robin-karlsson-pistol-still-03.webp)
- Output: `arcade-calibration-pistol-v1.png`
- Subject prompt:

> Create a compact arcade calibration pistol used for shooting holographic targets. Preserve the source weapon's recognizable design language and mechanical logic, but give it a rounded non-lethal emitter, bright cyan calibration core, clean status lights, and readable compact silhouette. Premium animated-game 3D asset, three-quarter side view, transparent background, muzzle away from viewer.

---

## Batch 3 — Biomes and mode key art

Do not use pet portraits as environmental backdrops. These are new compositions, not simple filters.

### 16. Verdant Vault

- Source: [ArtStation — alien tree](https://www.artstation.com/artwork/bgo63m)
- Best local reference: [tree render](../public/assets/star-atlas/bgo63m/01-ethan-pflugh-treerender-02.webp)
- Existing derivative to replace: [Verdant biome v2](../public/assets/galia-cute-tech/verdant-tree-biome-v2.png)
- Output: `verdant-vault-biome-v3.png`
- Subject prompt:

> Create 16:9 exploration key art for Verdant Vault centered on the attached alien tree. Preserve its trunk, canopy, roots, and distinctive biological structure. Build a welcoming ancient alien grove around it with layered foliage, luminous pollen trails, rounded readable plants, distant ruins, and a small path leading inward. Premium semi-animated 3D environment, mysterious rather than childish, no characters, no text, center-safe composition with quiet corners for UI.

### 17. Ember Dunes

- Creature reference if desired: [ArtStation — companion study B](https://www.artstation.com/artwork/kQLooz)
- Output: `ember-dunes-biome-v1.png`
- Subject prompt:

> Create 16:9 exploration key art for Ember Dunes, a warm alien desert at twilight. Rolling rounded dunes reveal glass ripples, ember blooms, buried navigation markers, distant rock arches, and two small moons. Use warm amber, burgundy, violet, and restrained cyan navigation lights. Premium semi-animated 3D environment, calm and discoverable, no giant character portrait, no text, center-safe with six plausible hidden-object zones.

### 18. Moonlit Tide

- Creature reference if desired: [ArtStation — companion study A](https://www.artstation.com/artwork/QK2Y1L)
- Output: `moonlit-tide-biome-v1.png`
- Subject prompt:

> Create 16:9 exploration key art for Moonlit Tide, calm luminous alien shallows beneath a huge moon. Include translucent gravity kelp, smooth tidal stones, glowing foam stars, drifting ribbon-fish, bubble lenses, and a distant observatory silhouette. Cyan, teal, plum, and silver palette with restrained glow. Premium semi-animated 3D environment, relaxing but not babyish, no large character portrait, no text, center-safe with six plausible hidden-object zones.

### 19. Story Expeditions mode key art

- Character reference: [MUD Player One](https://www.artstation.com/artwork/Bao3G9)
- Environment reference: [alien tree](https://www.artstation.com/artwork/bgo63m)
- Output: `story-expeditions-key-art-v1.png`
- Subject prompt:

> Create 16:9 key art for Story Expeditions: a small Guardian pilot and PURI stand beside their rounded expedition ship at the entrance to a glowing alien route, looking toward the distant Aurora Crown signal. Show a crystal path, one ancient landmark, and a clear sense of beginning a connected campaign. Premium cute semi-animated 3D sci-fi adventure, mature all-ages tone, characters occupy no more than 30% of frame, no text, generous UI-safe space.

### 20. Swarm Protocol mode key art

- Boss reference: [Ahr](https://www.artstation.com/artwork/14NRqo)
- Guardian reference: [USTUR combat](https://www.artstation.com/artwork/bgenAm)
- Output: `swarm-protocol-key-art-v1.png`
- Subject prompt:

> Create 16:9 action key art for Swarm Protocol: a small Guardian moves through readable energy lanes while stylized drones close in and Ahr looms in the distance. Preserve Ahr and Guardian anatomy from their references. Clear cyan player energy versus magenta enemy warning language, strong silhouettes, exciting but non-graphic, no weapon aimed at viewer, no text, center-safe composition.

### 21. Arcade Ops mode key art

- Pilot reference: [USTUR combat](https://www.artstation.com/artwork/bgenAm)
- Tool reference: [pistol](https://www.artstation.com/artwork/kN1PYn)
- Output: `arcade-ops-key-art-v1.png`
- Subject prompt:

> Create 16:9 Arcade Ops key art showing a Guardian using a compact calibration pistol against floating holographic targets in a neon training bay. Include one visible weak-point target, crystal target, and red decoy, with clear mouse-aim action language. Premium semi-animated 3D, energetic and precise, non-lethal sports-training tone, no text, character no larger than 35% of frame.

### 22. Discovery Runs mode key art

- Environment reference: [alien tree](https://www.artstation.com/artwork/bgo63m)
- Companion reference: [PURI study](https://www.artstation.com/artwork/QK2Y1L)
- Output: `discovery-runs-key-art-v1.png`
- Subject prompt:

> Create 16:9 Discovery Runs key art: PURI investigates a softly glowing clue beneath an ancient alien tree while several subtle discoveries hide across the environment. Preserve PURI anatomy exactly. Calm curiosity, layered depth, clean shapes, premium semi-animated 3D, no oversized character, no obvious pulsing question marks, no text, generous UI-safe space.

### 23. Frontier Control mode key art

- Leader references: [MUD](https://www.artstation.com/artwork/K3DZAR), [ONI](https://www.artstation.com/artwork/8BqDQn), [USTUR](https://www.artstation.com/artwork/JrKGXR)
- Output: `frontier-control-key-art-v1.png`
- Subject prompt:

> Create 16:9 strategy key art for Frontier Control: a clean holographic sector map with three readable faction influence paths—MUD burgundy, ONI plum-cyan, USTUR saffron-cyan—and small restrained leader transmission portraits at the outer edges. Preserve every leader's species anatomy and eye structure. Emphasize planning and competing priorities, not combat. Premium semi-animated 3D UI-world scene, no baked text or interface labels.

---

## Batch 4 — Transparent gameplay asset sheets

Generate these after the masters. Ask for evenly spaced objects on a transparent background with no overlap. We will crop them into individual files.

### 24. Story exploration kit

- Output: `story-exploration-kit-v1.png`
- Prompt:

> Create a clean 4×4 transparent asset sheet for a premium semi-animated sci-fi exploration game. Exactly sixteen isolated objects, evenly spaced, no overlap, consistent three-quarter camera: Guardian ship/extraction pad, player navigation beacon, cyan crystal worth 1, violet crystal worth 2, gold crystal worth 3, salvage chest, hidden scan signal, friendly rescue robot, cargo crate, delivery zone, activation node, speed tile, teleport gate, soft ion hazard, patrol drone, ancient key fragment. Rounded readable silhouettes, smooth surfaces, restrained glow, no text, no numbers, no stitches or dotted lines.

### 25. Swarm combat kit

- Output: `swarm-combat-kit-v1.png`
- Prompt:

> Create a clean 4×4 transparent asset sheet for Swarm Protocol. Exactly sixteen isolated top-down or slight three-quarter assets, evenly spaced: player Guardian marker, basic drone, dasher drone, orbiter drone, elite drone, Ahr projectile, cyan player projectile, energy pickup, crystal pickup, shield pickup, repair pickup, Pulse Core perk, Overdrive perk, warning telegraph ring, extraction beacon, boss weak-point core. Premium cute semi-animated 3D sci-fi, readable at 48 pixels, threatening but non-graphic, no text, no stitches.

### 26. Arcade target kit

- Output: `arcade-target-kit-v1.png`
- Prompt:

> Create a clean 3×3 transparent asset sheet for Arcade Ops. Nine isolated front-facing holographic targets: standard drone target, fast drone target, armored target, crystal target, energy target, red decoy, combo target, boss armor plate, glowing weak-point core. Consistent neon training-bay design, cyan valid targets, red decoys, magenta boss elements, bold silhouettes readable at 64 pixels, no text or numbers.

### 27. Discovery collectible kit

- Output: `discovery-collectibles-kit-v1.png`
- Prompt:

> Create a clean 4×4 transparent asset sheet containing sixteen isolated alien field discoveries: whisper seed, PURI footprint token, sunleaf, gravity ribbon, prism shell, memory shard, survey token, echo crystal, pocket sun, glass ripple, ember bloom, dune pearl, blink pearl, gravity kelp sprig, tidal lens, moon drop. Premium semi-animated 3D miniature artifacts, distinct silhouettes, restrained inner glow, collectible but scientifically plausible, no faces unless biologically required, no text, no stitches.

### 28. Ship and upgrade kit

- Output: `ship-upgrade-kit-v1.png`
- Prompt:

> Create a clean 4×3 transparent asset sheet with twelve isolated Guardians of Galia hangar assets: neutral expedition ship, MUD ship variant, ONI ship variant, USTUR ship variant, cosmic shield module, turbo booster, crystal scanner, xenobiology habitat pod, star wings module, Aurora Crown relic, common companion egg, legendary companion egg. Toy-like massing means broad canopy, oversized readable thrusters, rounded panels, and clear faction color blocks—but render as premium website game objects, not physical toys. No seams, stitches, text, or logos.

---

## Companion expansion — generate later

The game also contains eight emoji-only companions: Vada, Flynnie, Little, Blobbo, Sparkle, SnowD, Zippy, and Lumi. Do not generate them until PURI and Tigu are approved, because their finish should inherit the approved companion master without overriding each creature's anatomy.

Use this template:

> Create **[name]**, a **[species]**, as an original Guardians of Galia companion. Use the approved PURI image only for rendering finish, lighting, shape clarity, and emotional warmth—not for anatomy. Give this creature a unique biologically coherent silhouette, distinctive eye structure, memorable movement feature, and one collectible signature trait. Premium cute semi-animated 3D game character, transparent background, no stitches, no dotted lines, no generic anime eyes, no text.

Species:

- Vada — small nebula dragon; glitter breath, wing-led silhouette.
- Flynnie — alien canine runner; bouncy ears and asteroid-fetch harness.
- Little — luminous tiger-like alien; warm gold stripes, legendary presence.
- Blobbo — translucent bubble organism; no forced mammal face.
- Sparkle — living star-energy sprite; simple readable light-body anatomy.
- SnowD — compact ice organism; crystalline cap and cooling aura.
- Zippy — six-limbed jungle lizard; camouflage membrane.
- Lumi — alien prism-wing butterfly; elegant rather than babyish.

## Production order

1. Generate Charon, Vaor, and Opos first.
2. Review anatomy and especially eyes before generating the remaining characters.
3. Generate Nova, K-RAIL, Bastion-7, PURI, and Ahr.
4. Generate the four tools.
5. Generate the three biomes and five mode key-art scenes.
6. Generate the four gameplay sheets.
7. Generate optional NPCs and companion expansion only after the core style is stable.

## Current image replacements

The game currently references 17 raster files. The outputs above cover every one:

- Three faction leader JPEGs → jobs 1–3.
- Nova, K-RAIL, Bastion-7 → jobs 4–6.
- PURI and Tigu → jobs 7–8.
- Ahr → job 9.
- Four weapon images → jobs 12–15.
- Verdant, Ember, and Moonlit backdrops → jobs 16–18.
- Raw old-leader strategy art → job 23, with job 11 retained for lore.
- Reused Story, Swarm, Arcade, Discovery, and Control cards → jobs 19–23.

