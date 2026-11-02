import type { SelectionInfo } from "../scene/ApartmentView";

interface InspectorProps {
  selection: SelectionInfo;
  onRotate: () => void;
  onClose: () => void;
}

export function Inspector({ selection, onRotate, onClose }: InspectorProps) {
  const { label, size, warning } = selection;
  return (
    <aside className="inspector">
      <h2 id="itemName">{label}</h2>
      <p>{size}</p>
      {warning && (
        <p id="itemWarn" className={`warn${warning.danger ? " danger" : ""}`}>
          {warning.text}
        </p>
      )}
      <div className="actions">
        <button onClick={onRotate}>Rotate 90° (R)</button>
        <button className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </aside>
  );
}
