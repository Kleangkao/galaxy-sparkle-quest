export type PetAbilityType = "crystal-boost" | "speed" | "discovery" | "extra-time" | "none";

export interface PetAbility {
  type: PetAbilityType;
  descEn: string;
  descTh: string;
  emoji: string;
}

export interface AlienPet {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  species: string;
  description: string;
  rarity: "common" | "rare" | "legendary";
  color: string;
  ability: PetAbility;
}

export type EggRarity = "common" | "rare" | "legendary";

export interface AlienEgg {
  id: string;
  rarity: EggRarity;
  foundAt: string; // planet id
}

/** All collectible alien companions */
export const ALIEN_PETS: AlienPet[] = [
  {
    id: "aneko", name: "Aneko", emoji: "🐈", image: "/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg", species: "Pink Cat Alien",
    description: "A playful pink cat from the crystal caves. Loves to chase sparkles!",
    rarity: "common", color: "text-cosmic-pink",
    ability: { type: "crystal-boost", descEn: "+10% crystals", descTh: "+10% คริสตัล", emoji: "💎" },
  },
  {
    id: "tigu", name: "Tigu", emoji: "😺", image: "/assets/galia-plush-tech/canonical/teal-companion-master-v1.jpg", species: "Cute Teal Cat",
    description: "A calm teal cat who purrs in zero gravity. Great at finding hidden treasures!",
    rarity: "common", color: "text-cosmic-cyan",
    ability: { type: "discovery", descEn: "+8% companion discovery chance", descTh: "โอกาสพบเพื่อนเพิ่ม 8%", emoji: "🔍" },
  },
  {
    id: "vada", name: "Vada", emoji: "🐲", species: "Dragon Alien",
    description: "A tiny friendly dragon from the rainbow nebula. Breathes glitter, not fire!",
    rarity: "rare", color: "text-cosmic-purple",
    ability: { type: "crystal-boost", descEn: "+20% crystals", descTh: "+20% คริสตัล", emoji: "💎" },
  },
  {
    id: "flynnie", name: "Flynnie", emoji: "🐶", species: "Cute Dog Alien",
    description: "A bouncy space puppy who loves belly rubs and asteroid fetch!",
    rarity: "common", color: "text-cosmic-orange",
    ability: { type: "extra-time", descEn: "+3 seconds in timed modes", descTh: "เพิ่มเวลา 3 วินาที", emoji: "⏱️" },
  },
  {
    id: "nova", name: "Little", emoji: "🐯", species: "Glowing Tiger Alien",
    description: "A tiny glowing tiger from the golden galaxy. Radiates warmth and fierce cuteness!",
    rarity: "legendary", color: "text-cosmic-yellow",
    ability: { type: "discovery", descEn: "+25% companion discovery chance", descTh: "โอกาสเจอเพื่อนเพิ่ม 25%", emoji: "🌟" },
  },
  {
    id: "blobbo", name: "Blobbo", emoji: "🫧", species: "Bubble Blob",
    description: "A squishy bubble creature from Sparkle Moon. Bounces everywhere!",
    rarity: "common", color: "text-cosmic-blue",
    ability: { type: "crystal-boost", descEn: "+15% crystals", descTh: "+15% คริสตัล", emoji: "💎" },
  },
  {
    id: "sparkle", name: "Sparkle", emoji: "✨", species: "Star Sprite",
    description: "A twinkling sprite made of pure starlight. Leaves a trail of glitter!",
    rarity: "rare", color: "text-cosmic-yellow",
    ability: { type: "extra-time", descEn: "+5 seconds in timed modes", descTh: "เพิ่มเวลา 5 วินาที", emoji: "⏱️" },
  },
  {
    id: "frosty", name: "SnowD", emoji: "⛄", species: "Ice Buddy",
    description: "A friendly snowpal from Frosty Star. Always cool under pressure!",
    rarity: "common", color: "text-cosmic-cyan",
    ability: { type: "extra-time", descEn: "+5 seconds in timed modes", descTh: "เพิ่มเวลา 5 วินาที", emoji: "⏱️" },
  },
  {
    id: "zippy", name: "Zippy", emoji: "🦎", species: "Jungle Lizard",
    description: "A speedy lizard who can camouflage with any alien jungle!",
    rarity: "rare", color: "text-cosmic-green",
    ability: { type: "extra-time", descEn: "+4 seconds in timed modes", descTh: "เพิ่มเวลา 4 วินาที", emoji: "⏱️" },
  },
  {
    id: "lumi", name: "Lumi", emoji: "🦋", species: "Rainbow Butterfly",
    description: "A magical butterfly whose wings shimmer with all colors of the rainbow!",
    rarity: "rare", color: "text-cosmic-purple",
    ability: { type: "discovery", descEn: "+15% companion discovery chance", descTh: "โอกาสเจอเพื่อนเพิ่ม 15%", emoji: "🌟" },
  },
];

export function getPetById(id: string): AlienPet | undefined {
  return ALIEN_PETS.find(p => p.id === id.toLowerCase());
}

export function getPetByName(name: string): AlienPet | undefined {
  return ALIEN_PETS.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function getRarityColor(rarity: AlienPet["rarity"]): string {
  switch (rarity) {
    case "common": return "text-muted-foreground";
    case "rare": return "text-cosmic-cyan";
    case "legendary": return "text-cosmic-yellow";
  }
}

export function getRarityBorder(rarity: AlienPet["rarity"]): string {
  switch (rarity) {
    case "common": return "border-border";
    case "rare": return "border-cosmic-cyan/50";
    case "legendary": return "border-cosmic-yellow/50";
  }
}

export function getRarityBg(rarity: AlienPet["rarity"]): string {
  switch (rarity) {
    case "common": return "bg-muted/20";
    case "rare": return "bg-cosmic-cyan/10";
    case "legendary": return "bg-cosmic-yellow/10";
  }
}

/** Generate a random egg based on planet difficulty and survey context */
export function generateEgg(planetUnlockLevel: number, isReplay = false, petStillMissing = false): AlienEgg | null {
  const roll = Math.random();
  const eggChance = Math.min(
    0.8,
    0.25 + planetUnlockLevel * 0.02 + (isReplay ? 0.18 : 0) + (petStillMissing ? 0.08 : 0),
  );
  if (roll > eggChance) return null;

  const rarityRoll = Math.random();
  let rarity: EggRarity = "common";
  const legendaryChance = Math.min(0.22, 0.05 + planetUnlockLevel * 0.01 + (isReplay ? 0.02 : 0));
  const rareChance = Math.min(0.5, 0.20 + planetUnlockLevel * 0.02 + (isReplay ? 0.06 : 0));
  if (rarityRoll < legendaryChance) rarity = "legendary";
  else if (rarityRoll < rareChance) rarity = "rare";

  return {
    id: `egg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    rarity,
    foundAt: "",
  };
}

/** Hatch an egg and return a random pet not yet owned */
export function hatchEgg(egg: AlienEgg, ownedPets: string[]): AlienPet | null {
  const ownedLower = ownedPets.map(p => p.toLowerCase());
  // Filter available pets by rarity tier
  let candidates = ALIEN_PETS.filter(p => !ownedLower.includes(p.id) && !ownedPets.some(o => o.toLowerCase() === p.name.toLowerCase()));
  
  if (egg.rarity === "legendary") {
    const legendaries = candidates.filter(p => p.rarity === "legendary");
    if (legendaries.length > 0) candidates = legendaries;
  } else if (egg.rarity === "rare") {
    const rares = candidates.filter(p => p.rarity === "rare" || p.rarity === "legendary");
    if (rares.length > 0) candidates = rares;
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export const EGG_EMOJIS: Record<EggRarity, string> = {
  common: "🥚",
  rare: "🥚",
  legendary: "🥚",
};

export const EGG_COLORS: Record<EggRarity, { bg: string; border: string; glow: string }> = {
  common: { bg: "bg-muted/30", border: "border-border", glow: "" },
  rare: { bg: "bg-cosmic-cyan/15", border: "border-cosmic-cyan/50", glow: "shadow-[0_0_20px_hsl(190_90%_55%/0.3)]" },
  legendary: { bg: "bg-cosmic-yellow/15", border: "border-cosmic-yellow/50", glow: "shadow-[0_0_25px_hsl(45_95%_60%/0.4)]" },
};
