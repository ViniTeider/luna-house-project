import type { Settings } from "../scene/ApartmentView";
import { STYLES } from "../scene/decor";
import type { StyleKey } from "../scene/decor";
import { PALETTES } from "../scene/materials";
import type { PaletteKey, PaletteValues } from "../scene/materials";

type ToggleKey = "led" | "night" | "doorsOpen" | "roomsOn" | "projector";

const TOGGLES: { key: ToggleKey; id: string; label: string }[] = [
  { key: "led", id: "led", label: "Wardrobe LED" },
  { key: "projector", id: "projector", label: "Projector" },
  { key: "night", id: "night", label: "Night" },
  { key: "doorsOpen", id: "doors", label: "Open doors" },
  { key: "roomsOn", id: "rooms", label: "Room names on plan" },
];

const meters = (value: number) => `${(value / 100).toFixed(2)} m`;

const swatchColor = (values: PaletteValues) =>
  values.main ??
  values.wall ??
  values.sofa ??
  values.floor ??
  values.granite?.base;

interface SidePanelProps {
  settings: Settings;
  onPalette: (group: PaletteKey, name: string) => void;
  onStyle: (style: StyleKey) => void;
  onCeiling: (value: number) => void;
  onCut: (value: number) => void;
  onToggle: (key: ToggleKey, value: boolean) => void;
  onReset: () => void;
}

export function SidePanel({
  settings,
  onPalette,
  onStyle,
  onCeiling,
  onCut,
  onToggle,
  onReset,
}: SidePanelProps) {
  return (
    <aside className="panel">
      <h1>Luna House</h1>

      <section id="styles">
        <h2>Decoration style</h2>
        <div className="chips">
          {(Object.keys(STYLES) as StyleKey[]).map((style) => (
            <button
              key={style}
              className={settings.style === style ? "active" : ""}
              onClick={() => onStyle(style)}
            >
              <span
                className="swatch"
                style={{ background: STYLES[style].swatch }}
              />
              {style}
            </button>
          ))}
        </div>
        <p className="hint">
          Sets its own palettes; you can still change them below.
        </p>
      </section>

      <section id="palettes">
        <h2>Palettes</h2>
        {(Object.keys(PALETTES) as PaletteKey[]).map((key) => (
          <div className="palette" key={key}>
            <div className="hint">{PALETTES[key].label}</div>
            <div className="chips">
              {Object.entries(PALETTES[key].options).map(([name, values]) => (
                <button
                  key={name}
                  className={settings.palette[key] === name ? "active" : ""}
                  onClick={() => onPalette(key, name)}
                >
                  <span
                    className="swatch"
                    style={{ background: swatchColor(values) }}
                  />
                  {name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Environment</h2>
        <label className="row">
          Ceiling height <output>{meters(settings.ceil)}</output>
          <input
            id="ceil"
            type="range"
            min={230}
            max={280}
            step={5}
            value={settings.ceil}
            onChange={(e) => onCeiling(Number(e.target.value))}
          />
        </label>
        <p className="hint">
          The plan does not show the height. The wardrobe follows it.
        </p>
        <label className="row">
          Wall cut{" "}
          <output>
            {settings.cut >= settings.ceil ? "no cut" : meters(settings.cut)}
          </output>
          <input
            id="cut"
            type="range"
            min={100}
            max={280}
            step={10}
            value={settings.cut}
            onChange={(e) => onCut(Number(e.target.value))}
          />
        </label>
        {TOGGLES.map(({ key, id, label }) => (
          <label className="check" key={key}>
            <input
              id={id}
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => onToggle(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </section>

      <button id="reset" className="ghost" onClick={onReset}>
        Reset furniture
      </button>
    </aside>
  );
}
