export interface MissionBrief {
  title: string;
  encounters: string;
  tip: string;
  transmission: string;
  completion: string;
}

export const MISSION_BRIEFS: Record<string, MissionBrief> = {
  "sparkle-moon": {
    title: "First Contact",
    encounters: "Open route, no enemies, basic crystal collect loop.",
    tip: "Take a clean path, grab 5 resources, return quickly to learn controls.",
    transmission: "PURI: Your signal matches the beacon. Let us find out why.",
    completion: "Collect 5 crystals, then walk back onto the ship tile.",
  },
  "candy-planet": {
    title: "Living Signal Hunt",
    encounters: "A creature trail moves through a coral maze and hidden pockets.",
    tip: "Read the lanes first, then sweep one side at a time like a tracker.",
    transmission: "Nova: It is not running from us. It is testing whether we can follow.",
    completion: "Collect 6 trail signals. The mission ends immediately; no return trip.",
  },
  "frosty-star": {
    title: "Slipstream Navigation",
    encounters: "Narrow ice lanes turn every one-tile movement into a route decision.",
    tip: "Prioritize nearby clusters first, do not chase isolated pickups early.",
    transmission: "K-RAIL: Momentum is a language. The ice is about to teach it.",
    completion: "Collect 8 navigation shards. Every normal input moves exactly one tile.",
  },
  "jungle-world": {
    title: "Risk Zone",
    encounters: "Hazard cells that damage HP.",
    tip: "Avoid hazard shortcuts unless timer is low and target count is almost done.",
    transmission: "Bastion-7: Patrols are searching the canopy. Quiet steps, Captain.",
    completion: "Collect 8 keys while protecting your HP. No return trip.",
  },
  "rainbow-nebula": {
    title: "Prism Warden",
    encounters: "A named boss guards five shield nodes while a patrol closes in.",
    tip: "Break the nodes before committing to the Warden's center lane.",
    transmission: "PURI: That is not a storm. Something inside it just looked back.",
    completion: "Step on all 5 glowing swirl nodes. At 0% shield, extraction is automatic—do not return to the ship.",
  },
  "bubbly-bay": {
    title: "Pressure Payload",
    encounters: "Carry pressure blooms to two extraction valves under pursuit.",
    tip: "Collect a safe batch, deliver it, then cross the dangerous center once.",
    transmission: "Nova: The habitat survives if both valves receive a charge.",
    completion: "Collect payload, then step onto both marked delivery valves.",
  },
  "cookie-crater": {
    title: "Hazard Survival",
    encounters: "An unstable crater pulses with damage zones while the rescue timer falls.",
    tip: "Favor safe ground; the mission rewards survival, not reckless shortcuts.",
    transmission: "Bastion-7: The crater is collapsing. We only need to outlast the surge.",
    completion: "Collect 6 stabilizers, then return to the ship tile.",
  },
  "starlight-shore": {
    title: "Starlight Rescue",
    encounters: "Recover a companion signal, relay stars, and an exit node in one operation.",
    tip: "Secure the companion first, then build a clean route through the remaining goals.",
    transmission: "PURI: I know that signal. Please do not leave it in the dark.",
    completion: "Find the companion, collect 7 stars, and activate the glowing node.",
  },
  "crystal-cave": {
    title: "Frontier Decision",
    encounters: "Choose a risky reward route or a safer rescue route through two defended gates.",
    tip: "Your route choice changes time and rewards; commit before entering the center.",
    transmission: "Nova: Every faction wants the core. We decide what kind of captain reaches it.",
    completion: "Collect 6 fragments, charge 2 nodes, and deliver to both gates.",
  },
  "golden-galaxy": {
    title: "Sector Chaos",
    encounters: "Mixed hazards: enemies, walls, teleports, and multi-goals.",
    tip: "Do objectives in order: safe collect -> pet confirm -> controlled return.",
    transmission: "PURI: The whole signal trail ends here. Captain, bring us home together.",
    completion: "Finish every counter, then return to the ship for final extraction.",
  },
};

export function getMissionBrief(planetId: string): MissionBrief | null {
  return MISSION_BRIEFS[planetId] ?? null;
}
