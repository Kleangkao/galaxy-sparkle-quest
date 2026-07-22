export interface MissionBrief {
  title: string;
  encounters: string;
  tip: string;
  transmission: string;
}

export const MISSION_BRIEFS: Record<string, MissionBrief> = {
  "sparkle-moon": {
    title: "First Contact",
    encounters: "Open route, no enemies, basic crystal collect loop.",
    tip: "Take a clean path, grab 5 resources, return quickly to learn controls.",
    transmission: "PURI: Your signal matches the beacon. Let us find out why.",
  },
  "candy-planet": {
    title: "Living Signal Hunt",
    encounters: "A creature trail moves through a coral maze and hidden pockets.",
    tip: "Read the lanes first, then sweep one side at a time like a tracker.",
    transmission: "Nova: It is not running from us. It is testing whether we can follow.",
  },
  "frosty-star": {
    title: "Slipstream Navigation",
    encounters: "Two-cell ice slides turn every movement into a route decision.",
    tip: "Prioritize nearby clusters first, do not chase isolated pickups early.",
    transmission: "K-RAIL: Momentum is a language. The ice is about to teach it.",
  },
  "jungle-world": {
    title: "Risk Zone",
    encounters: "Hazard cells that damage HP.",
    tip: "Avoid hazard shortcuts unless timer is low and target count is almost done.",
    transmission: "Bastion-7: Patrols are searching the canopy. Quiet steps, Captain.",
  },
  "rainbow-nebula": {
    title: "Prism Warden",
    encounters: "A named boss guards five shield nodes while a patrol closes in.",
    tip: "Break the nodes before committing to the Warden's center lane.",
    transmission: "PURI: That is not a storm. Something inside it just looked back.",
  },
  "bubbly-bay": {
    title: "Pressure Payload",
    encounters: "Carry pressure blooms to two extraction valves under pursuit.",
    tip: "Collect a safe batch, deliver it, then cross the dangerous center once.",
    transmission: "Nova: The habitat survives if both valves receive a charge.",
  },
  "cookie-crater": {
    title: "Hazard Survival",
    encounters: "An unstable crater pulses with damage zones while the rescue timer falls.",
    tip: "Favor safe ground; the mission rewards survival, not reckless shortcuts.",
    transmission: "Bastion-7: The crater is collapsing. We only need to outlast the surge.",
  },
  "starlight-shore": {
    title: "Starlight Rescue",
    encounters: "Recover a companion signal, relay stars, and an exit node in one operation.",
    tip: "Secure the companion first, then build a clean route through the remaining goals.",
    transmission: "PURI: I know that signal. Please do not leave it in the dark.",
  },
  "crystal-cave": {
    title: "Frontier Decision",
    encounters: "Choose a risky reward route or a safer rescue route through two defended gates.",
    tip: "Your route choice changes time and rewards; commit before entering the center.",
    transmission: "Nova: Every faction wants the core. We decide what kind of captain reaches it.",
  },
  "golden-galaxy": {
    title: "Sector Chaos",
    encounters: "Mixed hazards: enemies, walls, teleports, and multi-goals.",
    tip: "Do objectives in order: safe collect -> pet confirm -> controlled return.",
    transmission: "PURI: The whole signal trail ends here. Captain, bring us home together.",
  },
};

export function getMissionBrief(planetId: string): MissionBrief | null {
  return MISSION_BRIEFS[planetId] ?? null;
}
