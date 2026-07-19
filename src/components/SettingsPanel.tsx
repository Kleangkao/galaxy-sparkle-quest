import { Gauge, RotateCcw, Settings2, Sparkles, Target, Users, Contrast } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  factionName: string;
  settings: GameState["accessibility"];
  onOpenChange: (open: boolean) => void;
  onChange: (settings: GameState["accessibility"]) => void;
  onSwitchFaction: () => void;
  onResetProgress: () => void;
}

export default function SettingsPanel({ open, factionName, settings, onOpenChange, onChange, onSwitchFaction, onResetProgress }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()} className="game-settings max-h-[88vh] max-w-2xl overflow-y-auto border-border/70 bg-card/95 p-0 text-foreground shadow-2xl backdrop-blur-xl">
        <DialogHeader className="game-settings__header">
          <div className="game-settings__icon"><Settings2 className="h-5 w-5" /></div>
          <div>
            <DialogTitle>Game settings</DialogTitle>
            <DialogDescription>Adjust comfort and control assists. These options never reduce your rewards.</DialogDescription>
          </div>
        </DialogHeader>

        <div className="game-settings__body">
          <SettingsGroup icon={Gauge} title="Gameplay" description="Tune the action modes to a pace that feels comfortable.">
            <SettingRow label="Combat pace" detail="Changes how quickly Swarm and Arcade simulations move.">
              <SegmentedControl
                value={String(settings.combatSpeed)}
                options={[{ value: "0.75", label: "Calm" }, { value: "1", label: "Standard" }, { value: "1.15", label: "Fast" }]}
                onChange={(value) => onChange({ ...settings, combatSpeed: Number(value) as GameState["accessibility"]["combatSpeed"] })}
              />
            </SettingRow>
            <SettingRow label="Aim help" detail="Wide makes Arcade targets more forgiving to click.">
              <SegmentedControl
                value={settings.aimHelp}
                options={[{ value: "standard", label: "Standard" }, { value: "wide", label: "Wide" }]}
                onChange={(aimHelp) => onChange({ ...settings, aimHelp: aimHelp as GameState["accessibility"]["aimHelp"] })}
              />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup icon={Sparkles} title="Visual comfort" description="Reduce visual intensity or increase interface clarity.">
            <SettingRow label="Screen effects" detail="Reduced removes nonessential motion and glow effects.">
              <SegmentedControl
                value={settings.effects}
                options={[{ value: "full", label: "Full" }, { value: "reduced", label: "Reduced" }]}
                onChange={(effects) => onChange({ ...settings, effects: effects as GameState["accessibility"]["effects"] })}
              />
            </SettingRow>
            <SettingRow label="Contrast" detail="High makes panels, labels, and controls easier to separate.">
              <SegmentedControl
                value={settings.contrast}
                options={[{ value: "standard", label: "Standard" }, { value: "high", label: "High" }]}
                onChange={(contrast) => onChange({ ...settings, contrast: contrast as GameState["accessibility"]["contrast"] })}
              />
            </SettingRow>
          </SettingsGroup>

          <section className="game-settings__section">
            <div className="game-settings__section-title"><Users className="h-4 w-4" /><div><strong>Profile & progress</strong><small>Manage the current faction save.</small></div></div>
            <div className="game-settings__profile-actions">
              <button onClick={onSwitchFaction}><Users className="h-4 w-4" /><span>Switch faction<small>Your {factionName} save stays safe</small></span></button>
              <button className="is-danger" onClick={onResetProgress}><RotateCcw className="h-4 w-4" /><span>Reset {factionName} progress<small>Requires confirmation</small></span></button>
            </div>
          </section>

          <div className="game-settings__note"><Contrast className="h-4 w-4" /><span>Preferences save automatically for this faction and can be changed anytime.</span></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsGroup({ icon: Icon, title, description, children }: { icon: typeof Target; title: string; description: string; children: React.ReactNode }) {
  return <section className="game-settings__section"><div className="game-settings__section-title"><Icon className="h-4 w-4" /><div><strong>{title}</strong><small>{description}</small></div></div><div className="game-settings__rows">{children}</div></section>;
}

function SettingRow({ label, detail, children }: { label: string; detail: string; children: React.ReactNode }) {
  return <div className="game-settings__row"><div><strong>{label}</strong><small>{detail}</small></div>{children}</div>;
}

function SegmentedControl({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <div className="game-settings__segments">{options.map((option) => <button key={option.value} className={value === option.value ? "is-active" : ""} onClick={() => onChange(option.value)} aria-pressed={value === option.value}>{option.label}</button>)}</div>;
}
