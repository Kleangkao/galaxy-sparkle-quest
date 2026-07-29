import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "th";

const STORAGE_KEY = "galaxy-lang";

const translations = {
  // Navigation & HUD
  galaxy: { en: "Galaxy", th: "กาแล็กซี่" },
  ships: { en: "Ships", th: "ยานอวกาศ" },
  pets: { en: "Pets", th: "เพื่อนต่างดาว" },
  missions: { en: "Missions", th: "ภารกิจ" },
  info: { en: "Info", th: "ข้อมูล" },
  daily: { en: "🎁 Daily", th: "🎁 รางวัลประจำวัน" },
  crystals: { en: "Crystals", th: "คริสตัล" },
  back: { en: "Back", th: "กลับ" },
  galaxyMap: { en: "Galaxy Map", th: "แผนที่กาแล็กซี่" },
  sectorIntel: { en: "Sector Intel", th: "ข้อมูลพื้นที่" },
  activeSectors: { en: "Active Sectors", th: "พื้นที่ที่กำลังมีภารกิจ" },
  localControl: { en: "Local Control", th: "ฝ่ายที่คุมพื้นที่" },
  soloExpedition: { en: "Solo Expedition", th: "เล่นคนเดียว" },
  asyncIntelOnline: { en: "Async intel online", th: "ข้อมูลพื้นที่พร้อมแล้ว" },

  // Galaxy Map
  galaxyMapTitle: { en: "🌌 Galaxy Map", th: "🌌 แผนที่กาแล็กซี่" },
  tapPlanet: { en: "Tap a planet to start exploring!", th: "เลือกดาวเพื่อเริ่มภารกิจ" },
  destinations: { en: "Destinations", th: "จุดหมาย" },
  swipeExplore: { en: "👆 Swipe to explore", th: "👆 ปัดเพื่อสำรวจ" },

  // Faction Select
  cosmicExplorerGalaxy: { en: "🛡️ Guardians of Galia", th: "🛡️ Guardians of Galia" },
  chooseTeam: { en: "Choose your exploration team!", th: "เลือกฝ่ายที่อยากเล่น" },
  joinFaction: { en: "Join", th: "เข้าร่วม" },

  // Tutorial
  welcomeExplorer: { en: "Welcome, Explorer!", th: "ยินดีต้อนรับนะ นักสำรวจ" },
  youveJoined: { en: "You've joined the", th: "คุณเลือกฝ่าย" },
  tapSparkle: { en: "Tap", th: "กดที่" },
  sparkleMoon: { en: "Sparkle Moon", th: "Sparkle Moon" },
  toStartMission: { en: "to start your first mission!", th: "แล้วเริ่มภารกิจแรก" },
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
  alienPetCollection: { en: "🐾 Alien Pet Collection", th: "🐾 คลังเพื่อนต่างดาว" },
  discovered: { en: "discovered", th: "พบแล้ว" },
  explorePlanetsToFind: { en: "Explore planets to find!", th: "ลองเล่นเนื้อเรื่องเพื่อตามหา" },

  // Ship Shop
  shipHangar: { en: "Ship Hangar", th: "โรงจอดยาน" },
  shipColors: { en: "🎨 Ship Colors", th: "🎨 สียาน" },
  upgrades: { en: "⚡ Upgrades", th: "⚡ อัปเกรด" },
  installedSystems: { en: "Installed Systems", th: "ระบบที่ติดตั้งแล้ว" },
  upgradeRules: { en: "Upgrades are permanent passive installs. They auto-activate, stack together, and never get consumed.", th: "ระบบที่อัปเกรดจะทำงานอัตโนมัติ ผลของแต่ละระบบใช้ร่วมกันได้ และไม่หายหลังจบภารกิจ" },
  skinsRules: { en: "Ship colors are cosmetic loadouts. Once owned, you can switch them anytime.", th: "สียานมีไว้ตกแต่งเท่านั้น ซื้อแล้วสลับใช้ได้ตลอด" },
  autoActive: { en: "AUTO-ACTIVE", th: "ทำงานอัตโนมัติ" },
  permanentPassive: { en: "PERMANENT PASSIVE", th: "ติดตัวถาวร" },
  availableMissions: { en: "Available Missions", th: "ภารกิจที่เล่นได้" },
  lockedDossiers: { en: "Locked Dossiers", th: "แฟ้มข้อมูลที่ยังล็อก" },
  nextUnlock: { en: "Next Unlock", th: "ปลดล็อกถัดไป" },
  missionBoard: { en: "Mission Board", th: "กระดานภารกิจ" },
  enterLaunch: { en: "Enter launches selected sector", th: "กด Enter เพื่อเริ่มพื้นที่ที่เลือก" },
  surveyRun: { en: "Survey Run", th: "รอบสำรวจซ้ำ" },
  replayLoop: { en: "Replay sectors to strengthen local control, scan for eggs, and search again for undiscovered pets.", th: "เล่นด่านเดิมซ้ำเพื่อเพิ่มคะแนนให้ฝ่าย สแกนหาไข่ และตามหาเพื่อนที่ยังไม่พบ" },
  replayFocus: { en: "Repeat runs trade lower core rewards for stronger egg scans, missing-pet recovery, and sector influence.", th: "ด่านที่เล่นซ้ำจะให้รางวัลหลักน้อยลง แต่มีโอกาสพบไข่และเพื่อนที่ยังขาด พร้อมเพิ่มคะแนนให้ฝ่ายในพื้นที่นั้น" },
  activeIntelCount: { en: "Active Intel", th: "พื้นที่ที่มีความเคลื่อนไหว" },
  controlledCount: { en: "Controlled", th: "คุมอยู่" },
  equipped: { en: "EQUIPPED", th: "ใส่แล้ว" },
  owned: { en: "✓ Owned", th: "✓ มีแล้ว" },
  unlockAtLevel: { en: "🔒 Unlocks at Level", th: "🔒 ปลดล็อกที่ระดับ" },

  // Planet Card
  controlled: { en: "Controlled", th: "มีฝ่ายคุมอยู่" },
  contested: { en: "⚔️ Contested", th: "⚔️ กำลังแย่งชิง" },
  neutral: { en: "🔘 Neutral", th: "🔘 ยังไม่มีฝ่ายคุม" },
  sectorHeldBy: { en: "Sector held by", th: "พื้นที่นี้อยู่ในการดูแลของ" },
  asyncActivityDetected: { en: "Async activity detected", th: "พบความเคลื่อนไหวในพื้นที่" },
  noIntelYet: { en: "No sector intel yet", th: "ยังไม่มีข้อมูลของพื้นที่นี้" },
  quietSector: { en: "Quiet sector", th: "พื้นที่สงบ" },
  intelActive: { en: "Intel active", th: "มีภารกิจในพื้นที่" },
  leadsHere: { en: "leads here", th: "ขึ้นนำที่นี่" },

  // Exploration
  collectTreasures: { en: "Collect treasures, then return to 🚀", th: "เก็บสมบัติแล้วกลับไปที่ 🚀" },
  missionSuccess: { en: "✅ Mission Complete!", th: "✅ ภารกิจสำเร็จ!" },
  missionFail: { en: "Time's Up!", th: "หมดเวลา!" },
  returnToShip: { en: "Return to 🚀 to finish!", th: "กลับไปที่ 🚀 เพื่อจบ!" },
  collected: { en: "collected", th: "เก็บแล้ว" },

  // Planets Controlled
  planetsControlled: { en: "Planets Controlled", th: "ดาวที่ฝ่ายคุมอยู่" },

  // Faction descriptions
  mudSubtitle: { en: "The Builders", th: "นักสร้าง" },
  mudDescription: { en: "The MUD explorers love building bases and collecting crystals. Brave, curious, and hardworking!", th: "ทีม MUD เชี่ยวชาญการสร้างฐานและเก็บทรัพยากร จึงได้คริสตัลจากภารกิจมากกว่าฝ่ายอื่น" },
  mudBonus2: { en: "+20% more crystals from planets", th: "รับคริสตัลจากเนื้อเรื่องเพิ่ม 20%" },
  oniSubtitle: { en: "Alien Pathfinders", th: "นักสำรวจต่างดาว" },
  oniDescription: { en: "ONI pathfinders study mysterious technology and discover rare life across the frontier. Smart, curious, and inventive!", th: "ทีม ONI เชี่ยวชาญการตามหาเทคโนโลยีลึกลับและสิ่งมีชีวิตหายาก" },
  oniBonus: { en: "Higher chance to find alien pets", th: "มีโอกาสพบเพื่อนต่างดาวมากขึ้น" },
  usturSubtitle: { en: "The Robot Intelligence", th: "หุ่นยนต์อัจฉริยะ" },
  usturDescription: { en: "The USTUR robots use smart technology to travel faster in space. Logical, fast, and helpful!", th: "ทีม USTUR ใช้ระบบนำทางความเร็วสูงและคำนวณเส้นทางได้แม่นยำ" },
  usturBonus: { en: "Faster travel + unlock planets earlier", th: "มีเวลาเพิ่ม และเปิดพื้นที่ใหม่ได้เร็วขึ้น" },

  // Exploration extra
  landingOn: { en: "Landing on", th: "กำลังลงจอดที่" },
  collectAtLeast: { en: "Collect at least", th: "เก็บอย่างน้อย" },
  itemsThenReturn: { en: "items, then return to 🚀", th: "ชิ้น แล้วกลับไปที่ 🚀" },
  onlyCollected: { en: "Only collected", th: "เก็บได้แค่" },
  itemsRewards: { en: "items, 30% rewards", th: "ชิ้น รับรางวัล 30%" },
  collectedTreasures: { en: "treasures!", th: "สมบัติ!" },
  robotScanning: { en: "🤖 Beep boop! Scanning for hidden treasures...", th: "🤖 บี๊บบ๊อบ! กำลังหาสมบัติลับ..." },
  robotRevealed: { en: "🤖 Hidden treasures revealed nearby! ✨", th: "🤖 พบสมบัติลับอยู่ใกล้ ๆ ✨" },
  planetLockedMsg: { en: "🔒 Planet Locked. Reach Level", th: "🔒 ดาวดวงนี้ยังล็อกอยู่ ต้องมีระดับกัปตัน" },
  toUnlock: { en: "to unlock.", th: "ก่อน" },

  // Toasts
  levelUp: { en: "🎉 Level Up! You are now Level", th: "🎉 เลื่อนระดับแล้ว! ตอนนี้อยู่ระดับ" },
  upgradeInstalled: { en: "⚡ Upgrade installed!", th: "⚡ อัปเกรดสำเร็จ!" },
  newShipColor: { en: "🎨 New ship color unlocked!", th: "🎨 ปลดล็อกสียานใหม่!" },
  dailyReward: { en: "🎁 Daily Reward:", th: "🎁 ของขวัญประจำวัน:" },
  plusCrystals: { en: "crystals!", th: "คริสตัล!" },
  plusNewPet: { en: "+ New pet:", th: "+ เพื่อนใหม่:" },
  influenceFor: { en: "influence for", th: "อิทธิพลให้" },
  captured: { en: "captured", th: "ยึดครอง" },
  bonusCrystals: { en: "bonus 💎", th: "โบนัส 💎" },
  intelUpdate: { en: "Intel update:", th: "อัปเดตพื้นที่:" },
  sectorInfluenceLogged: { en: "sector influence logged for", th: "เพิ่มคะแนนพื้นที่ให้ฝ่าย" },
  rivalExpeditionsAdvanced: { en: "Rival expeditions also advanced.", th: "ฝ่ายอื่นมีความเคลื่อนไหวด้วย" },

  // Planet Capture
  planetCaptured: { en: "🛰️ Sector Secured!", th: "🛰️ คุมพื้นที่ได้แล้ว" },
  nowControls: { en: "now leads local control of", th: "ขึ้นนำในพื้นที่" },
  bonusCrystalsTeam: { en: "🎁 +5 bonus crystals for your expedition!", th: "🎁 ทีมได้รับคริสตัลเพิ่ม 5 ชิ้น" },

  // Galaxy Map Nav
  backHome: { en: "Factions", th: "เลือกฝ่าย" },
  menu: { en: "Menu", th: "เมนู" },
  menuHome: { en: "🏠 Home", th: "🏠 หน้าแรก" },
  menuQuiz: { en: "❓ Quiz", th: "❓ ควิซ" },
  menuChangeFaction: { en: "🔄 Change Faction", th: "🔄 เปลี่ยนฝ่าย" },
  menuAlienPets: { en: "🐾 Alien Pets", th: "🐾 เพื่อนต่างดาว" },
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
  eggs: { en: "🥚 Eggs", th: "🥚 ไข่ปริศนา" },
  noEggs: { en: "Find eggs by exploring planets!", th: "สำรวจดาวเพื่อหาไข่!" },

  // Egg hatching
  foundAlienEgg: { en: "🥚 You found an Alien Egg!", th: "🥚 เจอไข่ปริศนา!" },
  commonEgg: { en: "Common Egg", th: "ไข่ธรรมดา" },
  rareEgg: { en: "Rare Egg", th: "ไข่หายาก" },
  legendaryEgg: { en: "Legendary Egg", th: "ไข่ตำนาน" },
  tapToHatch: { en: "Tap to Hatch! 🐣", th: "กดเพื่อฟัก! 🐣" },
  newAlienFriend: { en: "🎉 New Alien Friend!", th: "🎉 พบเพื่อนต่างดาวตัวใหม่!" },
  eggEmpty: { en: "The egg was empty...", th: "ไข่ว่างเปล่า..." },
  hatchEgg: { en: "Hatch", th: "ฟักไข่" },
  foundEggToast: { en: "🥚 Found an alien egg!", th: "🥚 เจอไข่ปริศนา!" },
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
