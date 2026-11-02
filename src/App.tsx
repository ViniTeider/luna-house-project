import { useEffect, useRef } from "react";
import { Inspector } from "./components/Inspector";
import { SidePanel } from "./components/SidePanel";
import { TopBar } from "./components/TopBar";
import { useApartment } from "./hooks/useApartment";
import type { Mode } from "./scene/ApartmentView";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const apartment = useApartment(canvasRef, labelsRef);
  const { mode, selection, walkLocked } = apartment;
  const walking = mode === "walk";

  useEffect(() => {
    document.body.classList.toggle("walking", walking);
  }, [walking]);

  const chooseMode = (next: Mode) => {
    if (next === "orbit") apartment.goToOverview();
    else apartment.setMode(next);
  };

  return (
    <>
      <canvas id="scene" ref={canvasRef} />
      <div id="labels" ref={labelsRef} />

      <TopBar
        mode={mode}
        canUndo={apartment.canUndo}
        canRedo={apartment.canRedo}
        onMode={chooseMode}
        onView={apartment.goToView}
        onUndo={apartment.undo}
        onRedo={apartment.redo}
      />

      <SidePanel
        settings={apartment.settings}
        onPalette={apartment.setPalette}
        onStyle={apartment.setStyle}
        onCeiling={apartment.setCeiling}
        onCut={apartment.setCut}
        onToggle={apartment.setToggle}
        onReset={apartment.resetLayout}
      />

      {selection && !walking && (
        <Inspector
          selection={selection}
          onRotate={apartment.rotateSelected}
          onClose={apartment.clearSelection}
        />
      )}

      {!selection && !walking && (
        <div className="tip">
          Drag a piece of furniture to move it and see distances. Arrow keys
          adjust by 1 cm. Ctrl/⌘ + Z undoes.
        </div>
      )}

      {walking && !walkLocked && (
        <div className="walkhint">
          <strong>Click to walk</strong>W A S D to move, mouse to look, Shift to
          speed up, N for day/night and Esc to exit
        </div>
      )}
    </>
  );
}
