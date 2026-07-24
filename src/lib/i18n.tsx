import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "th";

const STORAGE_KEY = "galaxy-lang";

const translations = {
  // Navigation & HUD
  galaxy: { en: "Galaxy", th: "กาแล็กซี่" },
  ships: { en: "Ships", th: "ยานอวกาศ" },
  pets: { en: "Pets", th: "เพื่อนเอเลี่ยน" },
  missions: { en: "Missions", th: "ภารกิจ" },
  info: { en: "Info", th: "ข้อมูล" },
  daily: { en: "🎁 Daily", th: "🎁 ของขวัญ" },
  crystals: { en: "Crystals", th: "คริสตัล" },
  back: { en: "Back", th: "กลับ" },
  galaxyMap: { en: "Galaxy Map", th: "แผนที่กาแล็กซี่" },
  sectorIntel: { en: "Sector Intel", th: "ข่าวกรองเซกเตอร์" },
  activeSectors: { en: "Active Sectors", th: "เซกเตอร์ที่เคลื่อนไหว" },
  localControl: { en: "Local Control", th: "การควบคุมพื้นที่" },
  soloExpedition: { en: "Solo Expedition", th: "คณะสำรวจเดี่ยว" },
  asyncIntelOnline: { en: "Async intel online", th: "ระบบข่าวกรองอะซิงก์ออนไลน์" },

  // Galaxy Map
  galaxyMapTitle: { en: "🌌 Galaxy Map", th: "🌌 แผนที่กาแล็กซี่" },
  tapPlanet: { en: "Tap a planet to start exploring!", th: "กดที่ดาวเพื่อเริ่มสำรวจ!" },
  destinations: { en: "Destinations", th: "จุดหมาย" },
  swipeExplore: { en: "👆 Swipe to explore", th: "👆 ปัดเพื่อสำรวจ" },

  // Faction Select
  cosmicExplorerGalaxy: { en: "🛡️ Guardians of Galia", th: "🛡️ Guardians of Galia" },
  chooseTeam: { en: "Choose your exploration team!", th: "เลือกทีมสำรวจได้เลย!" },
  joinFaction: { en: "Join", th: "เข้าร่วม" },

  // Tutorial
  welcomeExplorer: { en: "Welcome, Explorer!", th: "ยินดีต้อนรับ นักสำรวจ!" },
  youveJoined: { en: "You've joined the", th: "เธอเข้าร่วม" },
  tapSparkle: { en: "Tap", th: "กดที่" },
  sparkleMoon: { en: "Sparkle Moon", th: "Sparkle Moon" },
  toStartMission: { en: "to start your first mission!", th: "เพื่อเริ่มภารกิจแรก!" },
  letsGo: { en: "Let's Go!", th: "ไปกันเลย!" },
  startExploring: { en: "Start Exploring! 🚀", th: "เริ่มสำรวจ! 🚀" },

  // Planet Explore
  explore: { en: "Explore!", th: "สำรวจ!" },
  xp: { en: "XP", th: "XP" },

  // Celebration
  planetComplete: { en: "✨ Planet Complete! ✨", th: "✨ ผ่านด่านแล้ว! ✨" },
  experience: { en: "Experience", th: "ค่าประสบการณ์" },
  newPetFound: { en: "🐾 New Pet Found!", th: "🐾 เจอเพื่อนใหม่!" },
  continueBtn: { en: "Continue! 🚀", th: "ไปต่อ! 🚀" },
  mudBonus: { en: "⛏️ MUD builder bonus applied! (+20% crystals)", th: "⛏️ โบนัส MUD! (+20% คริสตัล)" },

  // Pet Collection
  alienPetCollection: { en: "🐾 Alien Pet Collection", th: "🐾 คอลเลกชั่นเพื่อนเอเลี่ยน" },
  discovered: { en: "discovered", th: "ค้นพบแล้ว" },
  explorePlanetsToFind: { en: "Explore planets to find!", th: "ไปสำรวจดาวเพื่อหา!" },

  // Ship Shop
  shipHangar: { en: "Ship Hangar", th: "โรงจอดยาน" },
  shipColors: { en: "🎨 Ship Colors", th: "🎨 สียาน" },
  upgrades: { en: "⚡ Upgrades", th: "⚡ อัพเกรด" },
  installedSystems: { en: "Installed Systems", th: "ระบบที่ติดตั้งแล้ว" },
  upgradeRules: { en: "Upgrades are permanent passive installs. They auto-activate, stack together, and never get consumed.", th: "อัปเกรดเป็นการติดตั้งแบบติดตัว เปิดใช้ให้อัตโนมัติ ซ้อนผลกันได้ และไม่หายไปเมื่อใช้" },
  skinsRules: { en: "Ship colors are cosmetic loadouts. Once owned, you can switch them anytime.", th: "สียานเป็นของตกแต่ง เมื่อเป็นเจ้าของแล้วสามารถสลับใช้ได้ตลอด" },
  autoActive: { en: "AUTO-ACTIVE", th: "ทำงานอัตโนมัติ" },
  permanentPassive: { en: "PERMANENT PASSIVE", th: "ติดตัวถาวร" },
  availableMissions: { en: "Available Missions", th: "ภารกิจที่เล่นได้" },
  lockedDossiers: { en: "Locked Dossiers", th: "แฟ้มข้อมูลที่ยังล็อก" },
  nextUnlock: { en: "Next Unlock", th: "ปลดล็อกถัดไป" },
  missionBoard: { en: "Mission Board", th: "กระดานภารกิจ" },
  enterLaunch: { en: "Enter launches selected sector", th: "กด Enter เพื่อเริ่มเซกเตอร์ที่เลือก" },
  surveyRun: { en: "Survey Run", th: "รอบสำรวจซ้ำ" },
  replayLoop: { en: "Replay sectors to strengthen local control, scan for eggs, and search again for undiscovered pets.", th: "เล่นซ้ำเพื่อเสริมการควบคุมพื้นที่ สแกนหาไข่ และค้นหาสัตว์เลี้ยงที่ยังไม่พบ" },
  replayFocus: { en: "Repeat runs trade lower core rewards for stronger egg scans, missing-pet recovery, and sector influence.", th: "การเล่นซ้ำจะแลกกับรางวัลหลักที่ลดลง แต่ได้การสแกนไข่ โอกาสเจอสัตว์เลี้ยงที่ยังขาด และอิทธิพลของเซกเตอร์เพิ่มขึ้น" },
  activeIntelCount: { en: "Active Intel", th: "ข่าวกรองที่เคลื่อนไหว" },
  controlledCount: { en: "Controlled", th: "ครอบครอง" },
  equipped: { en: "EQUIPPED", th: "ใส่แล้ว" },
  owned: { en: "✓ Owned", th: "✓ มีแล้ว" },
  unlockAtLevel: { en: "🔒 Unlocks at Level", th: "🔒 ปลดล็อคเลเวล" },

  // Planet Card
  controlled: { en: "Controlled", th: "ครอบครอง" },
  contested: { en: "⚔️ Contested", th: "⚔️ แข่งกันอยู่" },
  neutral: { en: "🔘 Neutral", th: "🔘 ว่าง" },
  sectorHeldBy: { en: "Sector held by", th: "เซกเตอร์อยู่ภายใต้การควบคุมของ" },
  asyncActivityDetected: { en: "Async activity detected", th: "พบความเคลื่อนไหวแบบอะซิงก์" },
  noIntelYet: { en: "No sector intel yet", th: "ยังไม่มีข่าวกรองของเซกเตอร์" },
  quietSector: { en: "Quiet sector", th: "เซกเตอร์เงียบ" },
  intelActive: { en: "Intel active", th: "ข่าวกรองกำลังเคลื่อนไหว" },
  leadsHere: { en: "leads here", th: "ขึ้นนำที่นี่" },

  // Exploration
  collectTreasures: { en: "Collect treasures, then return to 🚀", th: "เก็บสมบัติแล้วกลับไปที่ 🚀" },
  missionSuccess: { en: "✅ Mission Complete!", th: "✅ ภารกิจสำเร็จ!" },
  missionFail: { en: "Time's Up!", th: "หมดเวลา!" },
  returnToShip: { en: "Return to 🚀 to finish!", th: "กลับไปที่ 🚀 เพื่อจบ!" },
  collected: { en: "collected", th: "เก็บแล้ว" },

  // Planets Controlled
  planetsControlled: { en: "Planets Controlled", th: "ดาวที่ครอบครอง" },

  // Faction descriptions
  mudSubtitle: { en: "The Builders", th: "นักสร้าง" },
  mudDescription: { en: "The MUD explorers love building bases and collecting crystals. Brave, curious, and hardworking!", th: "ทีม MUD ชอบสร้างฐานและเก็บคริสตัล กล้าหาญ อยากรู้อยากเห็น และขยัน!" },
  mudBonus2: { en: "+20% more crystals from planets", th: "+20% คริสตัลเพิ่มจากดาว" },
  oniSubtitle: { en: "The Alien Masters", th: "เจ้าแห่งเอเลี่ยน" },
  oniDescription: { en: "The ONI aliens use special space magic and discover rare alien pets. Smart, mysterious, and creative!", th: "ทีม ONI ใช้เวทมนตร์อวกาศและค้นพบเพื่อนเอเลี่ยนหายาก ฉลาด ลึกลับ และสร้างสรรค์!" },
  oniBonus: { en: "Higher chance to find alien pets", th: "โอกาสเจอเพื่อนเอเลี่ยนมากขึ้น" },
  usturSubtitle: { en: "The Robot Intelligence", th: "หุ่นยนต์อัจฉริยะ" },
  usturDescription: { en: "The USTUR robots use smart technology to travel faster in space. Logical, fast, and helpful!", th: "ทีม USTUR ใช้เทคโนโลยีเดินทางเร็วขึ้น มีเหตุผล รวดเร็ว และช่วยเหลือดี!" },
  usturBonus: { en: "Faster travel + unlock planets earlier", th: "เดินทางเร็วขึ้น + ปลดล็อคดาวเร็วขึ้น" },

  // Exploration extra
  landingOn: { en: "Landing on", th: "กำลังลงจอดที่" },
  collectAtLeast: { en: "Collect at least", th: "เก็บอย่างน้อย" },
  itemsThenReturn: { en: "items, then return to 🚀", th: "ชิ้น แล้วกลับไปที่ 🚀" },
  onlyCollected: { en: "Only collected", th: "เก็บได้แค่" },
  itemsRewards: { en: "items — 30% rewards", th: "ชิ้น — ได้รางวัล 30%" },
  collectedTreasures: { en: "treasures!", th: "สมบัติ!" },
  robotScanning: { en: "🤖 Beep boop! Scanning for hidden treasures...", th: "🤖 บี๊บบ๊อบ! กำลังหาสมบัติลับ..." },
  robotRevealed: { en: "🤖 Hidden treasures revealed nearby! ✨", th: "🤖 เจอสมบัติลับใกล้ๆ แล้ว! ✨" },
  planetLockedMsg: { en: "🔒 Planet Locked. Reach Level", th: "🔒 ดาวดวงนี้ยังล็อกอยู่ ต้องเลเวล" },
  toUnlock: { en: "to unlock.", th: "ก่อน" },

  // Toasts
  levelUp: { en: "🎉 Level Up! You are now Level", th: "🎉 เลเวลอัพ! ตอนนี้เลเวล" },
  upgradeInstalled: { en: "⚡ Upgrade installed!", th: "⚡ อัพเกรดสำเร็จ!" },
  newShipColor: { en: "🎨 New ship color unlocked!", th: "🎨 ปลดล็อคสียานใหม่!" },
  dailyReward: { en: "🎁 Daily Reward:", th: "🎁 ของขวัญประจำวัน:" },
  plusCrystals: { en: "crystals!", th: "คริสตัล!" },
  plusNewPet: { en: "+ New pet:", th: "+ เพื่อนใหม่:" },
  influenceFor: { en: "influence for", th: "อิทธิพลให้" },
  captured: { en: "captured", th: "ยึดครอง" },
  bonusCrystals: { en: "bonus 💎", th: "โบนัส 💎" },
  intelUpdate: { en: "Intel update:", th: "อัปเดตข่าวกรอง:" },
  sectorInfluenceLogged: { en: "sector influence logged for", th: "บันทึกอิทธิพลของเซกเตอร์ให้" },
  rivalExpeditionsAdvanced: { en: "Rival expeditions also advanced.", th: "คณะสำรวจฝ่ายอื่นก็ขยับเช่นกัน" },

  // Planet Capture
  planetCaptured: { en: "🛰️ Sector Secured!", th: "🛰️ ยึดเซกเตอร์สำเร็จ!" },
  nowControls: { en: "now leads local control of", th: "ขึ้นนำการควบคุมพื้นที่ของ" },
  bonusCrystalsTeam: { en: "🎁 +5 bonus crystals for your expedition!", th: "🎁 +5 โบนัสคริสตัลให้คณะสำรวจของคุณ!" },

  // Galaxy Map Nav
  backHome: { en: "Factions", th: "เลือกฝ่าย" },
  menu: { en: "Menu", th: "เมนู" },
  menuHome: { en: "🏠 Home", th: "🏠 หน้าแรก" },
  menuQuiz: { en: "❓ Quiz", th: "❓ ควิซ" },
  menuChangeFaction: { en: "🔄 Change Faction", th: "🔄 เปลี่ยนฝ่าย" },
  menuAlienPets: { en: "🐾 Alien Pets", th: "🐾 เพื่อนเอเลี่ยน" },
  menuSettings: { en: "⚙️ Settings", th: "⚙️ ตั้งค่า" },
  menuMissionBoard: { en: "📋 Mission Board", th: "📋 กระดานภารกิจ" },
  menuResetProgress: { en: "🗑 Reset Progress", th: "🗑 รีเซ็ตความคืบหน้า" },

  // Start here hint
  startHere: { en: "START HERE", th: "เริ่มที่นี่" },
  tapToStartMission: { en: "Tap this planet to start your mission!", th: "กดที่ดาวนี้เพื่อเริ่มภารกิจ!" },

  // Pet rarity labels
  rarityCommon: { en: "Common", th: "ธรรมดา" },
  rarityRare: { en: "Rare", th: "หายาก" },
  rarityLegendary: { en: "Legendary", th: "ตำนาน" },

  // Pet system
  setActivePet: { en: "Set as Active Pet", th: "เลือกเป็นเพื่อนคู่ใจ" },
  activePet: { en: "⭐ Active", th: "⭐ คู่ใจ" },
  ability: { en: "Ability", th: "ความสามารถ" },
  eggs: { en: "🥚 Eggs", th: "🥚 ไข่เอเลี่ยน" },
  noEggs: { en: "Find eggs by exploring planets!", th: "สำรวจดาวเพื่อหาไข่!" },

  // Egg hatching
  foundAlienEgg: { en: "🥚 You found an Alien Egg!", th: "🥚 เจอไข่เอเลี่ยน!" },
  commonEgg: { en: "Common Egg", th: "ไข่ธรรมดา" },
  rareEgg: { en: "Rare Egg", th: "ไข่หายาก" },
  legendaryEgg: { en: "Legendary Egg", th: "ไข่ตำนาน" },
  tapToHatch: { en: "Tap to Hatch! 🐣", th: "กดเพื่อฟัก! 🐣" },
  newAlienFriend: { en: "🎉 New Alien Friend!", th: "🎉 ได้เพื่อนเอเลี่ยนใหม่!" },
  eggEmpty: { en: "The egg was empty...", th: "ไข่ว่างเปล่า..." },
  hatchEgg: { en: "Hatch", th: "ฟักไข่" },
  foundEggToast: { en: "🥚 Found an alien egg!", th: "🥚 เจอไข่เอเลี่ยน!" },
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tr: (en: string, th: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => translations[key]?.en || key,
  tr: (en) => en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "th" || saved === "en") return saved;
    } catch {
      // Browser storage is optional; language detection still works without it.
    }
    // Auto-detect device language
    const browserNavigator = navigator as Navigator & { userLanguage?: string };
    const browserLang = browserNavigator.language || browserNavigator.userLanguage || "";
    return browserLang.startsWith("th") ? "th" : "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Keep the in-memory language when storage is blocked.
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[key]?.[lang] || translations[key]?.en || key;
  };

  const tr = (en: string, th: string) => lang === "th" ? th : en;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tr }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
