import { useRef } from "react";
import { Contrast, Download, Gauge, Keyboard, Languages, Maximize2, RotateCcw, Settings2, Sparkles, Target, Upload, Users, Volume2 } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

interface Props {
  open: boolean;
  factionName: string;
  settings: GameState["accessibility"];
  onOpenChange: (open: boolean) => void;
  onChange: (settings: GameState["accessibility"]) => void;
  onSwitchFaction: () => void;
  onResetProgress: () => void;
  onReplayOnboarding: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
}

export default function SettingsPanel({ open, factionName, settings, onOpenChange, onChange, onSwitchFaction, onResetProgress, onReplayOnboarding, onExportSave, onImportSave }: Props) {
  const { tr } = useI18n();
  const importInput = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()} className="game-settings max-h-[88vh] max-w-2xl overflow-y-auto border-border/70 bg-card/95 p-0 text-foreground shadow-2xl backdrop-blur-xl">
        <DialogHeader className="game-settings__header">
          <div className="game-settings__icon"><Settings2 className="h-5 w-5" /></div>
          <div>
            <DialogTitle>{tr("Game settings", "ตั้งค่าเกม")}</DialogTitle>
            <DialogDescription>{tr("Adjust comfort and controls. These options never reduce rewards.", "ปรับการควบคุมและความสบายตาได้ รางวัลจะไม่ลดลง")}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="game-settings__body">
          <SettingsGroup icon={Languages} title={tr("Language", "ภาษา")} description={tr("Change language anytime.", "เปลี่ยนภาษาได้ตลอดเวลา")}>
            <SettingRow label={tr("Website language", "ภาษาของเกม")} detail={tr("Names stay the same; instructions change language.", "ชื่อเฉพาะจะเหมือนเดิม แต่คำอธิบายจะเปลี่ยนภาษา")}>
              <LanguageToggle />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup icon={Gauge} title={tr("Gameplay", "การเล่น")} description={tr("Set a comfortable pace for action modes.", "ปรับความเร็วของโหมดแอ็กชันให้เล่นสบาย")}>
            <SettingRow label={tr("Combat pace", "ความเร็วการต่อสู้")} detail={tr("Changes the speed of Swarm and Arcade.", "ปรับความเร็วของโหมด Swarm และ Arcade")}>
              <SegmentedControl value={String(settings.combatSpeed)} options={[
                { value: "0.75", label: tr("Calm", "ช้า") },
                { value: "1", label: tr("Standard", "ปกติ") },
                { value: "1.15", label: tr("Fast", "เร็ว") },
              ]} onChange={(value) => onChange({ ...settings, combatSpeed: Number(value) as GameState["accessibility"]["combatSpeed"] })} />
            </SettingRow>
            <SettingRow label={tr("Aim help", "ช่วยเล็ง")} detail={tr("Wide makes Arcade targets easier to click.", "แบบกว้างจะกดโดนเป้าใน Arcade ง่ายขึ้น")}>
              <SegmentedControl value={settings.aimHelp} options={[
                { value: "standard", label: tr("Standard", "ปกติ") },
                { value: "wide", label: tr("Wide", "กว้าง") },
              ]} onChange={(aimHelp) => onChange({ ...settings, aimHelp: aimHelp as GameState["accessibility"]["aimHelp"] })} />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup icon={Volume2} title={tr("Audio & vibration", "เสียงและการสั่น")} description={tr("Control game sounds and controller vibration.", "ปรับเสียงเกมและการสั่นของจอย")}>
            <SettingRow label={tr("Game audio", "เสียงเกม")} detail={tr("Quiet keeps cues soft. Off mutes the game.", "เบาจะลดเสียงลง ปิดจะปิดเสียงเกมทั้งหมด")}>
              <SegmentedControl value={settings.sound} options={[
                { value: "full", label: tr("Full", "เต็ม") },
                { value: "quiet", label: tr("Quiet", "เบา") },
                { value: "off", label: tr("Off", "ปิด") },
              ]} onChange={(sound) => onChange({ ...settings, sound: sound as GameState["accessibility"]["sound"] })} />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup icon={Sparkles} title={tr("Visual comfort", "ความสบายตา")} description={tr("Reduce motion or make the interface clearer.", "ลดการเคลื่อนไหวหรือทำให้หน้าจอชัดขึ้น")}>
            <SettingRow label={tr("Screen effects", "เอฟเฟกต์หน้าจอ")} detail={tr("Reduced removes extra motion and glow.", "แบบลดจะตัดแสงและการขยับที่ไม่จำเป็น")}>
              <SegmentedControl value={settings.effects} options={[
                { value: "full", label: tr("Full", "เต็ม") },
                { value: "reduced", label: tr("Reduced", "ลดลง") },
              ]} onChange={(effects) => onChange({ ...settings, effects: effects as GameState["accessibility"]["effects"] })} />
            </SettingRow>
            <SettingRow label={tr("Contrast", "ความชัด")} detail={tr("High makes panels and controls easier to see.", "แบบสูงจะทำให้ปุ่มและกรอบเห็นง่ายขึ้น")}>
              <SegmentedControl value={settings.contrast} options={[
                { value: "standard", label: tr("Standard", "ปกติ") },
                { value: "high", label: tr("High", "สูง") },
              ]} onChange={(contrast) => onChange({ ...settings, contrast: contrast as GameState["accessibility"]["contrast"] })} />
            </SettingRow>
            <SettingRow label={tr("Screen shake", "หน้าจอสั่น")} detail={tr("Turn off impact jolts without removing other effects.", "ปิดแรงสั่นตอนโจมตี โดยเอฟเฟกต์อื่นยังอยู่")}>
              <SegmentedControl value={settings.screenShake} options={[
                { value: "full", label: tr("On", "เปิด") },
                { value: "off", label: tr("Off", "ปิด") },
              ]} onChange={(screenShake) => onChange({ ...settings, screenShake: screenShake as GameState["accessibility"]["screenShake"] })} />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup icon={Keyboard} title={tr("Desktop controls", "ปุ่มควบคุมบนคอม")} description={tr("Keyboard, mouse, and display controls.", "ดูปุ่มคีย์บอร์ด เมาส์ และหน้าจอ")}>
            <SettingRow label={tr("Movement", "เคลื่อนที่")} detail={tr("WASD or arrows · hold Shift and a direction to dash in Story.", "ใช้ WASD หรือปุ่มลูกศร · กด Shift พร้อมทิศทางเพื่อพุ่งใน Story")}>
              <span className="text-xs font-bold text-cosmic-cyan">WASD</span>
            </SettingRow>
            <SettingRow label={tr("Combat", "ต่อสู้")} detail={tr("Space uses Swarm pulse · R reloads Arcade · Escape pauses.", "Space ใช้พลังใน Swarm · R เติมกระสุน Arcade · Escape หยุดเกม")}>
              <span className="text-xs font-bold text-cosmic-cyan">Space · R · Esc</span>
            </SettingRow>
            <SettingRow label={tr("Display", "หน้าจอ")} detail={tr("Fullscreen keeps important controls visible.", "เต็มจอช่วยให้เห็นปุ่มสำคัญครบ")}>
              <button className="rounded-lg border border-border/60 px-3 py-2 text-xs font-bold" onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else void document.documentElement.requestFullscreen();
              }}><Maximize2 className="mr-1 inline h-3.5 w-3.5" /> {tr("Toggle fullscreen", "สลับเต็มจอ")}</button>
            </SettingRow>
          </SettingsGroup>

          <section className="game-settings__section">
            <div className="game-settings__section-title"><Users className="h-4 w-4" /><div><strong>{tr("Profile & progress", "โปรไฟล์และความคืบหน้า")}</strong><small>{tr("Manage the current faction save.", "จัดการเซฟของฝ่ายที่กำลังเล่น")}</small></div></div>
            <div className="game-settings__profile-actions">
              <button onClick={onSwitchFaction}><Users className="h-4 w-4" /><span>{tr("Switch faction", "เปลี่ยนฝ่าย")}<small>{tr(`Your ${factionName} save stays safe`, `เซฟ ${factionName} จะไม่หาย`)}</small></span></button>
              <button onClick={onReplayOnboarding}><Sparkles className="h-4 w-4" /><span>{tr("Replay guided flight", "ดูวิธีเริ่มเล่นอีกครั้ง")}<small>{tr("Review the first-session path", "ทบทวนขั้นตอนเริ่มเกม")}</small></span></button>
              <button onClick={onExportSave}><Download className="h-4 w-4" /><span>{tr("Download save", "ดาวน์โหลดเซฟ")}<small>{tr("Keep a backup on this computer", "สำรองเซฟไว้ในเครื่อง")}</small></span></button>
              <button onClick={() => importInput.current?.click()}><Upload className="h-4 w-4" /><span>{tr("Import save", "นำเข้าเซฟ")}<small>{tr("Restore a downloaded save file", "กู้คืนจากไฟล์เซฟที่ดาวน์โหลดไว้")}</small></span></button>
              <input ref={importInput} hidden type="file" accept="application/json,.json" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImportSave(file);
                event.currentTarget.value = "";
              }} />
              <button className="is-danger" onClick={onResetProgress}><RotateCcw className="h-4 w-4" /><span>{tr(`Reset ${factionName} progress`, `ล้างความคืบหน้า ${factionName}`)}<small>{tr("Requires confirmation", "ต้องกดยืนยัน")}</small></span></button>
            </div>
          </section>

          <div className="game-settings__note"><Contrast className="h-4 w-4" /><span>{tr("Settings save automatically and can be changed anytime.", "การตั้งค่าจะบันทึกอัตโนมัติและเปลี่ยนได้ตลอด")}</span></div>
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
