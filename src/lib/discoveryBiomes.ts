export interface DiscoveryFind {
  icon: string;
  name: string;
  nameTh: string;
  lore: string;
  loreTh: string;
}

export interface DiscoveryBiome {
  id: string;
  name: string;
  nameTh: string;
  subtitle: string;
  subtitleTh: string;
  description: string;
  descriptionTh: string;
  backdrop: string;
  accent: "green" | "orange" | "cyan";
  finds: DiscoveryFind[];
}

export const DISCOVERY_BIOMES: DiscoveryBiome[] = [
  {
    id: "verdant-vault", name: "Verdant Vault", nameTh: "ป่าเวอร์แดนต์", subtitle: "Living forest", subtitleTh: "ป่าที่มีชีวิต", accent: "green",
    description: "Follow pollen trails through an ancient grove that remembers every visitor.",
    descriptionTh: "ตามรอยละอองแสงในป่าโบราณที่จดจำผู้มาเยือนทุกคน",
    backdrop: "/assets/galia-cute-tech/verdant-tree-biome-v2-optimized.webp",
    finds: [
      { icon: "✦", name: "Whisper Seed", nameTh: "เมล็ดกระซิบ", lore: "It hums when pointed toward the Aurora Crown.", loreTh: "มันส่งเสียงเบา ๆ เมื่อหันไปทางออโรราคราวน์" },
      { icon: "❋", name: "PURI Print", nameTh: "รอยเท้า PURI", lore: "Three toes, a round heel, and traces of luminous pollen.", loreTh: "รอยเท้าสามนิ้วกับละอองเรืองแสงที่ PURI ทิ้งไว้" },
      { icon: "✺", name: "Sunleaf", nameTh: "ใบตะวัน", lore: "It folds itself into a star whenever danger approaches.", loreTh: "ใบไม้จะพับเป็นรูปดาวเมื่อมีอันตรายเข้ามาใกล้" },
      { icon: "⌁", name: "Tide Ribbon", nameTh: "ริบบิ้นสายลม", lore: "A floating organism riding invisible gravity currents.", loreTh: "สิ่งมีชีวิตตัวเล็กที่ลอยไปตามกระแสแรงโน้มถ่วง" },
      { icon: "◈", name: "Prism Shell", nameTh: "เปลือกปริซึม", lore: "A tiny canopy crawler left this during its first molt.", loreTh: "เปลือกที่นักไต่ยอดไม้ตัวจิ๋วทิ้งไว้ตอนลอกคราบ" },
      { icon: "◇", name: "Memory Shard", nameTh: "เศษความทรงจำ", lore: "It holds a two-second view of a forgotten green sky.", loreTh: "ข้างในเก็บภาพท้องฟ้าสีเขียวที่หายไปนานแล้ว" },
      { icon: "⬡", name: "Survey Token", nameTh: "เหรียญนักสำรวจ", lore: "Stamped by an expedition missing for sixty cycles.", loreTh: "ตราของทีมสำรวจที่หายไปเมื่อหกสิบรอบก่อน" },
      { icon: "✧", name: "Echo Crystal", nameTh: "คริสตัลเสียงสะท้อน", lore: "It repeats the last note of every nearby song.", loreTh: "มันจะเล่นโน้ตสุดท้ายของเพลงที่ได้ยินซ้ำอีกครั้ง" },
    ],
  },
  {
    id: "ember-dunes", name: "Ember Dunes", nameTh: "เนินทรายเอ็มเบอร์", subtitle: "Warm desert", subtitleTh: "ทะเลทรายอุ่น", accent: "orange",
    description: "Search a gentle firelit desert where wind reveals yesterday's buried stories.",
    descriptionTh: "ค้นหาเรื่องราวที่ลมค่อย ๆ เปิดออกจากใต้ผืนทรายสีอุ่น",
    backdrop: "/assets/star-atlas/kQLooz/01-vitaly-tyukin-sand-punaab-fire3.webp",
    finds: [
      { icon: "☀", name: "Pocket Sun", nameTh: "ดวงอาทิตย์จิ๋ว", lore: "Warm enough to hatch a frost egg, never hot enough to hurt.", loreTh: "อุ่นพอจะฟักไข่น้ำแข็ง แต่ไม่ร้อนจนทำให้เจ็บ" },
      { icon: "≈", name: "Glass Ripple", nameTh: "คลื่นแก้ว", lore: "A lightning strike froze this wave of sand in place.", loreTh: "สายฟ้าทำให้คลื่นทรายแข็งตัวเป็นแก้ว" },
      { icon: "✹", name: "Ember Bloom", nameTh: "ดอกเอ็มเบอร์", lore: "Its petals open only beneath two moons.", loreTh: "กลีบดอกจะเปิดเมื่อดวงจันทร์สองดวงขึ้นพร้อมกัน" },
      { icon: "⌂", name: "Nomad Pin", nameTh: "หมุดนักเดินทาง", lore: "Marks a safe route to a water pocket beneath the dunes.", loreTh: "บอกเส้นทางปลอดภัยไปยังแหล่งน้ำใต้เนินทราย" },
      { icon: "◌", name: "Dune Pearl", nameTh: "ไข่มุกทะเลทราย", lore: "Polished smooth by a century of singing wind.", loreTh: "ถูกลมขัดจนเรียบตลอดหนึ่งร้อยปี" },
      { icon: "↝", name: "Runner Track", nameTh: "รอยนักวิ่ง", lore: "A tiny six-legged racer crossed here before dawn.", loreTh: "นักวิ่งหกขาตัวจิ๋วผ่านจุดนี้ก่อนรุ่งเช้า" },
      { icon: "△", name: "Beacon Scale", nameTh: "เกล็ดสัญญาณ", lore: "Once part of a navigation kite flown above the storms.", loreTh: "เคยเป็นชิ้นส่วนของเครื่องนำทางเหนือพายุ" },
      { icon: "✦", name: "Warmstar Dust", nameTh: "ผงดาวอุ่น", lore: "PURI sneezes glitter whenever this dust floats nearby.", loreTh: "PURI จะจามเป็นประกายเมื่อผงนี้ลอยมาใกล้" },
    ],
  },
  {
    id: "moonlit-tide", name: "Moonlit Tide", nameTh: "อ่าวแสงจันทร์", subtitle: "Alien shallows", subtitleTh: "ทะเลตื้นต่างดาว", accent: "cyan",
    description: "Drift through calm luminous shallows and catalogue creatures hidden in the glow.",
    descriptionTh: "ล่องผ่านทะเลเรืองแสงอันสงบและบันทึกชีวิตที่ซ่อนอยู่",
    backdrop: "/assets/star-atlas/QK2Y1L/03-joao-lira-aaaax.webp",
    finds: [
      { icon: "◉", name: "Blink Pearl", nameTh: "ไข่มุกกะพริบ", lore: "The pearl closes its tiny eye when a storm approaches.", loreTh: "ไข่มุกจะหลับตาเล็ก ๆ เมื่อพายุใกล้เข้ามา" },
      { icon: "〰", name: "Gravity Kelp", nameTh: "สาหร่ายแรงโน้มถ่วง", lore: "Its fronds always point toward the nearest moon.", loreTh: "ปลายใบจะชี้ไปหาดวงจันทร์ที่อยู่ใกล้ที่สุด" },
      { icon: "❉", name: "Foam Star", nameTh: "ดาวฟองน้ำ", lore: "A harmless little star that purrs inside bubbles.", loreTh: "ดาวตัวเล็กแสนปลอดภัยที่ส่งเสียงครางในฟองน้ำ" },
      { icon: "◡", name: "PURI Snack", nameTh: "ขนมของ PURI", lore: "Sweet sea moss carefully wrapped in a floating leaf.", loreTh: "มอสทะเลรสหวานห่อด้วยใบไม้ลอยน้ำ" },
      { icon: "♢", name: "Tidal Lens", nameTh: "เลนส์กระแสน้ำ", lore: "Look through it to see currents as bright ribbons.", loreTh: "มองผ่านเลนส์แล้วจะเห็นกระแสน้ำเป็นริบบิ้นสว่าง" },
      { icon: "⌁", name: "Drift Feather", nameTh: "ขนนกลอยน้ำ", lore: "Not a feather at all, but a sleeping ribbon-fish.", loreTh: "จริง ๆ แล้วไม่ใช่ขนนก แต่เป็นปลาริบบิ้นที่กำลังหลับ" },
      { icon: "✧", name: "Moon Drop", nameTh: "หยดจันทร์", lore: "It glows brighter whenever two friends hold it together.", loreTh: "จะสว่างขึ้นเมื่อเพื่อนสองคนถือพร้อมกัน" },
      { icon: "⊙", name: "Bubble Compass", nameTh: "เข็มทิศฟองน้ำ", lore: "Its center bubble points home instead of north.", loreTh: "ฟองตรงกลางจะชี้กลับบ้านแทนทิศเหนือ" },
    ],
  },
];

export function getDiscoveryRotation(biome: DiscoveryBiome, runSeed: number, count = 6) {
  const offset = Math.abs(runSeed) % biome.finds.length;
  return Array.from({ length: Math.min(count, biome.finds.length) }, (_, index) => biome.finds[(offset + index) % biome.finds.length]);
}

export function getMasteryTier(mastery: number, lang: "en" | "th" = "en") {
  if (mastery >= 100) return lang === "th" ? "นักธรรมชาติวิทยา" : "Master Naturalist";
  if (mastery >= 60) return lang === "th" ? "ผู้พิทักษ์พื้นที่" : "Biome Ranger";
  if (mastery >= 25) return lang === "th" ? "นักสำรวจภาคสนาม" : "Field Scout";
  return lang === "th" ? "ผู้มาใหม่" : "New Arrival";
}
