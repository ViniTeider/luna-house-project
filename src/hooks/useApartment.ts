import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { ApartmentView, MODEL_CUT } from "../scene/ApartmentView";
import type {
  Layout,
  Mode,
  SelectionInfo,
  Settings,
} from "../scene/ApartmentView";
import { STYLES } from "../scene/decor";
import type { StyleKey } from "../scene/decor";
import { PALETTES } from "../scene/materials";
import type { PaletteKey, PaletteSelection } from "../scene/materials";
import { loadState, saveState } from "../scene/storage";

const HISTORY_LIMIT = 100;
const MERGE_MS = 800;
const FULL_HEIGHT_CUT = 280;

type Snapshot = Omit<Settings, "cut"> & { layout: Layout };

function toSnapshot(
  { cut: _cut, ...settings }: Settings,
  layout: Layout,
): Snapshot {
  return { ...settings, layout };
}

export function useApartment(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  labelsRef: RefObject<HTMLDivElement | null>,
) {
  const [saved] = useState(loadState);
  const [settings, setSettings] = useState(saved.settings);
  const [mode, setModeState] = useState<Mode>("orbit");
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [walkLocked, setWalkLocked] = useState(false);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

  const viewRef = useRef<ApartmentView | null>(null);
  const settingsRef = useRef(settings);
  const layoutRef = useRef(saved.layout);
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const currentRef = useRef(toSnapshot(saved.settings, saved.layout));
  const lastMerge = useRef(0);

  const syncHistory = useCallback(() => {
    setHistory({
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    });
  }, []);

  const persist = useCallback(() => {
    saveState({ settings: settingsRef.current, layout: layoutRef.current });
  }, []);

  // merge: consecutive arrow presses and slider moves count as a single action.
  const commit = useCallback(
    (merge = false) => {
      persist();
      const next = toSnapshot(settingsRef.current, layoutRef.current);
      if (JSON.stringify(next) === JSON.stringify(currentRef.current)) return;
      const now = performance.now();
      if (!(merge && now - lastMerge.current < MERGE_MS))
        undoStack.current.push(currentRef.current);
      lastMerge.current = merge ? now : 0;
      if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
      redoStack.current.length = 0;
      currentRef.current = next;
      syncHistory();
    },
    [persist, syncHistory],
  );

  const applySettings = useCallback((next: Settings) => {
    settingsRef.current = next;
    setSettings(next);
    viewRef.current?.update(next);
  }, []);

  const change = useCallback(
    (partial: Partial<Settings>, merge = false) => {
      applySettings({ ...settingsRef.current, ...partial });
      commit(merge);
    },
    [applySettings, commit],
  );

  const setCut = useCallback(
    (cut: number) => {
      applySettings({ ...settingsRef.current, cut });
      persist();
    },
    [applySettings, persist],
  );

  const restore = useCallback(
    ({ layout, ...rest }: Snapshot) => {
      currentRef.current = { ...rest, layout };
      lastMerge.current = 0;
      layoutRef.current = layout;
      viewRef.current?.applyLayout(layout);
      applySettings({ ...rest, cut: settingsRef.current.cut });
      persist();
      syncHistory();
    },
    [applySettings, persist, syncHistory],
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous || viewRef.current?.isDragging) {
      if (previous) undoStack.current.push(previous);
      return;
    }
    redoStack.current.push(currentRef.current);
    restore(previous);
  }, [restore]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next || viewRef.current?.isDragging) {
      if (next) redoStack.current.push(next);
      return;
    }
    undoStack.current.push(currentRef.current);
    restore(next);
  }, [restore]);

  useEffect(() => {
    const canvas = canvasRef.current,
      labels = labelsRef.current;
    if (!canvas || !labels) return;
    const view = new ApartmentView(
      canvas,
      labels,
      { settings: settingsRef.current, layout: layoutRef.current },
      {
        onSelectionChange: setSelection,
        onWalkLockChange: setWalkLocked,
        onLayoutChange: (layout, merge) => {
          layoutRef.current = layout;
          commit(merge);
        },
      },
    );
    viewRef.current = view;
    (window as unknown as { __luna: object }).__luna = view.debugApi();
    return () => {
      viewRef.current = null;
      view.dispose();
    };
  }, [canvasRef, labelsRef, commit]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const redoKey = e.code === "KeyY" || (e.code === "KeyZ" && e.shiftKey);
      if (e.code !== "KeyZ" && !redoKey) return;
      e.preventDefault();
      if (redoKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyN" || e.repeat || e.metaKey || e.ctrlKey) return;
      change({ night: !settingsRef.current.night });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, change]);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    setWalkLocked(false);
    viewRef.current?.setMode(next);
  }, []);

  const goToOverview = useCallback(() => {
    setMode("orbit");
    setCut(MODEL_CUT);
    viewRef.current?.resetCamera();
  }, [setCut, setMode]);

  const goToView = useCallback(
    (name: string) => {
      setMode("orbit");
      setCut(FULL_HEIGHT_CUT);
      viewRef.current?.goToView(name);
    },
    [setCut, setMode],
  );

  const setPalette = useCallback(
    (group: PaletteKey, name: string) => {
      change({ palette: { ...settingsRef.current.palette, [group]: name } });
    },
    [change],
  );

  const setStyle = useCallback(
    (style: StyleKey) => {
      const defaults = Object.fromEntries(
        (Object.keys(PALETTES) as PaletteKey[]).map((key) => [
          key,
          PALETTES[key].default,
        ]),
      ) as PaletteSelection;
      change({ style, palette: { ...defaults, ...STYLES[style].palette } });
    },
    [change],
  );

  return {
    settings,
    mode,
    selection,
    walkLocked,
    ...history,
    undo,
    redo,
    setMode,
    goToOverview,
    goToView,
    setPalette,
    setStyle,
    setCut,
    setCeiling: useCallback((ceil: number) => change({ ceil }, true), [change]),
    setToggle: useCallback(
      (key: "led" | "night" | "doorsOpen" | "roomsOn", value: boolean) =>
        change({ [key]: value }),
      [change],
    ),
    resetLayout: useCallback(() => viewRef.current?.resetLayout(), []),
    rotateSelected: useCallback(() => viewRef.current?.rotateSelected(), []),
    clearSelection: useCallback(() => viewRef.current?.clearSelection(), []),
  };
}
