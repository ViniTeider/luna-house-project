import type { Mode } from "../scene/ApartmentView";
import { VIEWS } from "../scene/plan";

const MODES: { id: Mode; label: string }[] = [
  { id: "orbit", label: "Model" },
  { id: "plan", label: "Plan" },
  { id: "walk", label: "Walk" },
];

interface TopBarProps {
  mode: Mode;
  canUndo: boolean;
  canRedo: boolean;
  onMode: (mode: Mode) => void;
  onView: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({
  mode,
  canUndo,
  canRedo,
  onMode,
  onView,
  onUndo,
  onRedo,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="modes" role="group" aria-label="View mode">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            data-mode={id}
            className={mode === id ? "active" : ""}
            onClick={() => onMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="views">
        {Object.keys(VIEWS).map((name) => (
          <button key={name} onClick={() => onView(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="modes" role="group" aria-label="History">
        <button
          id="undo"
          title="Undo (Ctrl/⌘ + Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          id="redo"
          title="Redo (Ctrl/⌘ + Shift + Z)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          Redo
        </button>
      </div>
    </header>
  );
}
