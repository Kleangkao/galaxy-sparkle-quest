import { useState, type MouseEvent, type ReactNode } from "react";
import { CircleHelp, Play } from "lucide-react";
import { hasSeenModeGuide, markModeGuideSeen, type ModeGuide } from "@/lib/onboarding";
import { useI18n } from "@/lib/i18n";

interface Props {
  mode: ModeGuide;
  icon?: ReactNode;
  kicker: string;
  title: string;
  summary: string;
  steps: string[];
  note?: string;
  primaryLabel: string;
  onStart: () => void;
}

export default function ModeStartOverlay({
  mode,
  icon,
  kicker,
  title,
  summary,
  steps,
  note,
  primaryLabel,
  onStart,
}: Props) {
  const { tr } = useI18n();
  const [expanded, setExpanded] = useState(() => !hasSeenModeGuide(mode));

  const start = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    markModeGuideSeen(mode);
    setExpanded(false);
    onStart();
  };

  return (
    <div className={`mode-start-overlay ${expanded ? "is-expanded" : "is-compact"}`}>
      {icon && <span className="mode-start-overlay__icon" aria-hidden="true">{icon}</span>}
      <div className="command-kicker">{kicker}</div>
      <h2>{title}</h2>
      <p>{summary}</p>
      {expanded && (
        <>
          <ol>
            {steps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}
          </ol>
          {note && <small>{note}</small>}
        </>
      )}
      <div className="mode-start-overlay__actions">
        <button className="is-primary" onClick={start}><Play className="h-4 w-4" /> {primaryLabel}</button>
        <button
          className="is-help"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          aria-expanded={expanded}
        >
          <CircleHelp className="h-4 w-4" />
          {expanded ? tr("Show less", "ซ่อนวิธีเล่น") : tr("How to play", "วิธีเล่น")}
        </button>
      </div>
    </div>
  );
}
