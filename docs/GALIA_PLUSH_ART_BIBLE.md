# Galia Cute-Tech Art Bible

## North star

Every character, creature, prop, weapon, vehicle, and landmark should look like it belongs in the same premium animated-game universe: immediately readable in a game, safe and inviting for young players, and emotionally appealing enough to inspire merchandise later.

The five images in `asset/` are the canonical visual masters. They are finished direction, not loose inspiration. When a master already depicts the needed subject, use it directly. Generate or redesign only subjects that the five masters do not cover.

Cute is a treatment, not an erasure of identity. Preserve the subject's faction anatomy, silhouette, palette, costume geometry, role, and signature technology before changing proportions or materials.

## Character language

- Proportions are species-specific. Never apply pet proportions or facial anatomy to humanoids, robots, visored characters, or alien species by default.
- Eyes are identity anatomy, not a global style token. Preserve the source character's eye count, placement, scale, shape, visor, lens, sensor array, glow, pupil structure, and visible-versus-hidden state.
- Large glossy eyes belong only to subjects whose approved reference already supports them. Never add anime eyes, human eyeballs, a smile, or a mouth to a faceless robot or helmeted Ustur.
- Cuteness should usually come from silhouette rhythm, pose, color harmony, readable expression through existing features, softened threat, and clean lighting—not forced facial reconstruction.
- Body proportions may be compacted only when the faction silhouette and role remain intact. Racers must still look agile; guardians must still look powerful; leaders must still look authoritative.
- Expression: warm, curious, brave, or mischievous. Antagonists may look formidable, never gruesome.
- Edges: soften points and blades into padded, toy-safe curves while keeping the original outline recognizable.
- Pose: one readable personality statement; no complex action pose for primary UI portraits.

## Materials and surface finish

- Living characters: clean soft 3D skin or fine fur, gentle blush, no realistic pores.
- Clothing: smooth premium fabric with clean uninterrupted panels and subtle material variation.
- Robots and armor: rounded painted surfaces, soft-touch finishes, clean joints, and restrained wear.
- Energy: small saturated light accents and restrained bloom, never enough to hide the silhouette.
- Avoid visible stitches, dotted seam lines, quilting, patchwork, embroidery, fabric construction marks, or literal plush-toy manufacturing details.
- “Huggable” describes shape and emotional appeal only. It must not turn the website artwork into a photographed plush product.

## Faction anchors

- MUD: teal, burgundy, charcoal, antique gold; clean ceremonial tailoring; capable and warm.
- ONI: plum, black, ivory, gold; smooth organic forms; graceful and magical.
- Ustur: saffron, ochre, brown, cyan; rounded mech armor and heritage cloth; protective and ancient.

## Identity hierarchy

When references conflict, preserve details in this order:

1. Species and faction anatomy
2. Face, eyes, visor, sensors, and silhouette
3. Role-specific equipment and posture
4. Costume geometry and faction palette
5. Cute-tech rendering, material softness, and lighting

The two companion masters define rendering finish and emotional clarity for uncertain assets. They do not override anatomy.

## Presentation

- Primary character cards: portrait, full body, gentle three-quarter pose, generous silhouette padding.
- Background: deep faction-tinted studio gradient, soft oval grounding shadow, restrained complementary rim light.
- No text, logo, border, or embedded UI in production artwork.
- The face and silhouette must remain readable at 96 px.

## Production rules

1. Use the original source art as the identity reference and the five canonical images in `asset/` as binding style references.
2. Create a new versioned asset. Never overwrite the source art.
3. Validate identity at full size, then test face, silhouette, and palette at card and thumbnail sizes.
4. Compare the output against every available source view, not only the first thumbnail. Reject it if identity anatomy drifted.
5. Promote an asset into the game only after it preserves identity and matches the approved rendering finish.
6. Keep source provenance and generation prompt beside the asset manifest.

## Conversion order

1. Faction leaders and PURI
2. Playable captains and combat characters
3. Bosses, creatures, and pets
4. Weapons, pickups, and upgrades
5. Biome landmarks and mode key art
6. Vehicles, skins, and collectible variants
