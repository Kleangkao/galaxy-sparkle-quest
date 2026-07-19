export interface DiscoveryFind {
  icon: string;
  name: string;
  lore: string;
}

export interface DiscoveryBiome {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  backdrop: string;
  accent: "green" | "orange" | "cyan";
  finds: DiscoveryFind[];
}

export const DISCOVERY_BIOMES: DiscoveryBiome[] = [
  {
    id: "verdant-vault", name: "Verdant Vault", subtitle: "Living forest", accent: "green",
    description: "Follow pollen trails through an ancient grove that remembers every visitor.",
    backdrop: "/assets/star-atlas/bgo63m/03-ethan-pflugh-highresscreenshot00002.webp",
    finds: [
      { icon: "✦", name: "Whisper Seed", lore: "It hums when pointed toward the Aurora Crown." },
      { icon: "❋", name: "PURI Print", lore: "Three toes, a round heel, and traces of luminous pollen." },
      { icon: "✺", name: "Sunleaf", lore: "It folds itself into a star whenever danger approaches." },
      { icon: "⌁", name: "Tide Ribbon", lore: "A floating organism riding invisible gravity currents." },
      { icon: "◈", name: "Prism Shell", lore: "A tiny canopy crawler left this during its first molt." },
      { icon: "◇", name: "Memory Shard", lore: "It holds a two-second view of a forgotten green sky." },
      { icon: "⬡", name: "Survey Token", lore: "Stamped by an expedition missing for sixty cycles." },
      { icon: "✧", name: "Echo Crystal", lore: "It repeats the last note of every nearby song." },
    ],
  },
  {
    id: "ember-dunes", name: "Ember Dunes", subtitle: "Warm desert", accent: "orange",
    description: "Search a gentle firelit desert where wind reveals yesterday's buried stories.",
    backdrop: "/assets/star-atlas/kQLooz/01-vitaly-tyukin-sand-punaab-fire3.webp",
    finds: [
      { icon: "☀", name: "Pocket Sun", lore: "Warm enough to hatch a frost egg, never hot enough to hurt." },
      { icon: "≈", name: "Glass Ripple", lore: "A lightning strike froze this wave of sand in place." },
      { icon: "✹", name: "Ember Bloom", lore: "Its petals open only beneath two moons." },
      { icon: "⌂", name: "Nomad Pin", lore: "Marks a safe route to a water pocket beneath the dunes." },
      { icon: "◌", name: "Dune Pearl", lore: "Polished smooth by a century of singing wind." },
      { icon: "↝", name: "Runner Track", lore: "A tiny six-legged racer crossed here before dawn." },
      { icon: "△", name: "Beacon Scale", lore: "Once part of a navigation kite flown above the storms." },
      { icon: "✦", name: "Warmstar Dust", lore: "PURI sneezes glitter whenever this dust floats nearby." },
    ],
  },
  {
    id: "moonlit-tide", name: "Moonlit Tide", subtitle: "Alien shallows", accent: "cyan",
    description: "Drift through calm luminous shallows and catalogue creatures hidden in the glow.",
    backdrop: "/assets/star-atlas/QK2Y1L/03-joao-lira-aaaax.webp",
    finds: [
      { icon: "◉", name: "Blink Pearl", lore: "The pearl closes its tiny eye when a storm approaches." },
      { icon: "〰", name: "Gravity Kelp", lore: "Its fronds always point toward the nearest moon." },
      { icon: "❉", name: "Foam Star", lore: "A harmless little star that purrs inside bubbles." },
      { icon: "◡", name: "PURI Snack", lore: "Sweet sea moss carefully wrapped in a floating leaf." },
      { icon: "♢", name: "Tidal Lens", lore: "Look through it to see currents as bright ribbons." },
      { icon: "⌁", name: "Drift Feather", lore: "Not a feather at all, but a sleeping ribbon-fish." },
      { icon: "✧", name: "Moon Drop", lore: "It glows brighter whenever two friends hold it together." },
      { icon: "⊙", name: "Bubble Compass", lore: "Its center bubble points home instead of north." },
    ],
  },
];

export function getDiscoveryRotation(biome: DiscoveryBiome, runSeed: number, count = 6) {
  const offset = Math.abs(runSeed) % biome.finds.length;
  return Array.from({ length: Math.min(count, biome.finds.length) }, (_, index) => biome.finds[(offset + index) % biome.finds.length]);
}

export function getMasteryTier(mastery: number) {
  if (mastery >= 100) return "Master Naturalist";
  if (mastery >= 60) return "Biome Ranger";
  if (mastery >= 25) return "Field Scout";
  return "New Arrival";
}
