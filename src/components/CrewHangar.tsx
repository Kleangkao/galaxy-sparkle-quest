import { useState } from "react";
import { ArrowLeft, Check, Crosshair, Gauge, PawPrint, Radar, Shield, UserRound, Zap } from "lucide-react";
import { GameState, SHIP_SKINS, SHIP_UPGRADES } from "@/lib/gameState";
import {
  PILOTS,
  TOOLS,
  getPilotCallsign,
  getPilotEffect,
  getPilotRole,
  getPilotTagline,
  getPilotUnlock,
  getToolEffect,
  getToolFamily,
  getToolUnlock,
} from "@/lib/loadouts";
import ShipUpgradeShop from "@/components/ShipUpgradeShop";
import { useI18n } from "@/lib/i18n";
import { getPetById } from "@/lib/pets";

interface Props {
  gameState: GameState;
  onSetPilot: (id: string) => void;
  onSetTool: (id: string) => void;
  onBuyUpgrade: (id: string, cost: number) => void;
  onBuySkin: (id: string, cost: number) => void;
  onEquipSkin: (id: string) => void;
  onOpenPets: () => void;
  onBack: () => void;
}

export default function CrewHangar(props: Props) {
  const { lang, tr } = useI18n();
  const [view, setView] = useState<"crew" | "ship">("crew");

  if (view === "ship") {
    return (
      <ShipUpgradeShop
        gameState={props.gameState}
        onBuyUpgrade={props.onBuyUpgrade}
        onBuySkin={props.onBuySkin}
        onEquipSkin={props.onEquipSkin}
        onBack={() => setView("crew")}
      />
    );
  }

  const activePilot = PILOTS.find((pilot) => pilot.id === props.gameState.activePilot) ?? PILOTS[0];
  const activeTool = TOOLS.find((tool) => tool.id === props.gameState.activeTool) ?? TOOLS[0];
  const activePet = props.gameState.activePet ? getPetById(props.gameState.activePet) : undefined;
  const activeSkin = SHIP_SKINS.find((skin) => skin.id === props.gameState.activeSkin) ?? SHIP_SKINS[0];
  const activeShipSystem = [...props.gameState.upgrades]
    .reverse()
    .map((id) => SHIP_UPGRADES.find((upgrade) => upgrade.id === id))
    .find(Boolean);

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <button onClick={props.onBack} className="hangar-back">
        <ArrowLeft className="h-4 w-4" /> {tr("Frontier", "กลับ")}
      </button>

      <header className="hangar-header">
        <div>
          <div className="command-kicker">{tr("Crew deck · Loadout online", "ทีมและอุปกรณ์พร้อมใช้งาน")}</div>
          <h1>{tr("Crew & Hangar", "จัดทีมและอุปกรณ์")}</h1>
          <p>{tr("Choose one pilot for your overall play style and one weapon for combat. Every effect names the modes where it works.", "เลือกนักบิน 1 คนตามสไตล์ที่ชอบ และเลือกอาวุธ 1 ชิ้นสำหรับโหมดต่อสู้ แต่ละความสามารถจะบอกชัดว่าใช้กับโหมดไหน")}</p>
        </div>
        <div className="hangar-header__actions">
          <button className="hangar-ship-link is-companion" onClick={props.onOpenPets}>
            <PawPrint className="h-4 w-4" />
            {tr(`Companions · ${props.gameState.pets.length}`, `เพื่อนร่วมทาง · ${props.gameState.pets.length}`)} →
          </button>
          <button className="hangar-ship-link" onClick={() => setView("ship")}>{tr("Ship systems", "ระบบยาน")} →</button>
        </div>
      </header>

      <section className="loadout-summary" aria-label={tr("Active expedition loadout", "ชุดที่ใช้อยู่")}>
        <div><UserRound /><span>{tr("Active pilot", "นักบินที่ใช้")}</span><strong>{activePilot.name}</strong><small>{getPilotEffect(activePilot, lang)}</small></div>
        <div><Radar /><span>{tr("Equipped weapon", "อาวุธที่ใช้")}</span><strong>{activeTool.name}</strong><small>{getToolEffect(activeTool, lang)}</small></div>
        <div><PawPrint /><span>{tr("Active companion", "เพื่อนร่วมทาง")}</span><strong>{activePet?.name ?? tr("None selected", "ยังไม่ได้เลือก")}</strong><small>{activePet ? (lang === "th" ? activePet.ability.descTh : activePet.ability.descEn) : tr("Choose one in Companions.", "เลือกได้ที่หน้าเพื่อนร่วมทาง")}</small></div>
        <div><Gauge /><span>{tr("Ship systems", "ระบบยาน")}</span><strong>{lang === "th" ? activeSkin.nameTh : activeSkin.name}</strong><small>{activeShipSystem ? (lang === "th" ? activeShipSystem.effectTh : activeShipSystem.effect) : tr("No permanent system installed yet.", "ยังไม่ได้ติดตั้งระบบถาวร")}</small></div>
      </section>

      <section className="hangar-section" aria-labelledby="pilot-roster-title">
        <div className="hangar-section__heading">
          <div><span>01</span><div><h2 id="pilot-roster-title">{tr("Pilot roster", "รายชื่อนักบิน")}</h2><p>{tr("Your pilot sets the expedition's main strength.", "นักบินกำหนดความสามารถหลักของทีม")}</p></div></div>
          <small>{tr("Earn pilots through Story and mastery challenges", "ปลดล็อกนักบินได้จากเนื้อเรื่องและการทำสถิติ")}</small>
        </div>
        <div className="pilot-grid">
          {PILOTS.map((pilot) => {
            const active = pilot.id === activePilot.id;
            const unlock = getPilotUnlock(pilot.id, props.gameState);
            return (
              <button key={pilot.id} disabled={!unlock.unlocked} className={`pilot-card ${active ? "is-active" : ""} ${!unlock.unlocked ? "opacity-55" : ""}`} onClick={() => unlock.unlocked && props.onSetPilot(pilot.id)}>
                <img src={pilot.image} alt={pilot.name} />
                <span className="pilot-card__role">{getPilotRole(pilot, lang)}</span>
                <div className="pilot-card__content">
                  <div><small>{getPilotCallsign(pilot, lang)}</small><h3>{pilot.name}</h3></div>
                  {active && <span className="pilot-card__check"><Check className="h-4 w-4" /> {tr("Active", "กำลังใช้")}</span>}
                  <p>{getPilotTagline(pilot, lang)}</p>
                  <strong>{getPilotEffect(pilot, lang)}</strong>
                  {!unlock.unlocked && <small>{tr(`Locked · ${unlock.requirement}`, `ปลดล็อกเมื่อ${unlock.requirementTh}`)}</small>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hangar-section" aria-labelledby="tool-rack-title">
        <div className="hangar-section__heading">
          <div><span>02</span><div><h2 id="tool-rack-title">{tr("Combat weapons", "อาวุธต่อสู้")}</h2><p>{tr("Weapons affect Swarm or Arcade only. Story is improved by pilots and ship systems.", "อาวุธมีผลกับโหมดฝ่าฝูงศัตรูหรือยิงเป้าเท่านั้น ส่วนเนื้อเรื่องใช้ความสามารถนักบินและระบบยาน")}</p></div></div>
          <small>{tr("One tool equipped", "เลือกใช้ได้ 1 ชิ้น")}</small>
        </div>
        <div className="tool-grid">
          {TOOLS.map((tool) => {
            const active = tool.id === activeTool.id;
            const unlock = getToolUnlock(tool.id, props.gameState);
            const Icon = tool.effectType === "quickdraw" ? Zap : tool.effectType === "power" ? Crosshair : Shield;
            return (
              <button key={tool.id} disabled={!unlock.unlocked} className={`tool-card ${active ? "is-active" : ""} ${!unlock.unlocked ? "opacity-55" : ""}`} onClick={() => unlock.unlocked && props.onSetTool(tool.id)}>
                <div className="tool-card__image"><img src={tool.image} alt={tool.name} /></div>
                <div className="tool-card__copy">
                  <span>{getToolFamily(tool, lang)}</span><h3>{tool.name}</h3><p><Icon className="h-4 w-4" />{getToolEffect(tool, lang)}</p>
                  {!unlock.unlocked && <small>{tr(`Locked · ${unlock.requirement}`, `ปลดล็อกเมื่อ${unlock.requirementTh}`)}</small>}
                </div>
                {active && <Check className="tool-card__check h-5 w-5" />}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
