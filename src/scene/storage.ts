import type { Layout, Settings } from './ApartmentView';
import { MODEL_CUT } from './ApartmentView';
import { STYLE_DEFAULT, STYLES } from './decor';
import { PALETTES } from './materials';
import type { PaletteKey, PaletteSelection } from './materials';
import { CEILING_DEFAULT, ITEMS } from './plan';
import type { ItemBuild } from './plan';

const STORAGE_KEY = 'luna-house-v1';

// Starting positions from earlier versions: items that were never moved get the new position.
const OLD_HOME_Y: Partial<Record<ItemBuild, number[]>> = { island: [221], stool: [162, 186] };

// Earlier versions saved palettes under Portuguese keys and names.
const LEGACY_PALETTE: Record<PaletteKey, { key: string; names: Record<string, string> }> = {
  cabinetry: {
    key: 'marcenaria',
    names: {
      'Preto + madeira': 'Black + wood',
      'Branco + madeira': 'White + wood',
      'Grafite + madeira': 'Graphite + wood',
      'Verde + madeira': 'Green + wood',
    },
  },
  walls: {
    key: 'paredes',
    names: {
      Creme: 'Cream',
      Areia: 'Sand',
      'Off-white': 'Off-white',
      'Cinza quente': 'Warm gray',
      'Verde sálvia': 'Sage green',
    },
  },
  sofa: {
    key: 'sofa',
    names: { Azul: 'Blue', Cinza: 'Gray', Bege: 'Beige', Preto: 'Black', Verde: 'Green' },
  },
  granite: {
    key: 'granito',
    names: {
      'Preto São Gabriel': 'São Gabriel Black',
      'Cinza Corumbá': 'Corumbá Gray',
      'Branco Dallas': 'Dallas White',
      'Verde Ubatuba': 'Ubatuba Green',
    },
  },
  floor: {
    key: 'piso',
    names: {
      'Madeira clara': 'Light wood',
      'Madeira escura': 'Dark wood',
      'Porcelanato cinza': 'Gray porcelain',
    },
  },
};

export interface SavedState {
  settings: Settings;
  layout: Layout;
}

type StoredState = Partial<Omit<Settings, 'palette'>> & {
  palette?: Record<string, string>;
  layout?: Layout;
};

function read(): StoredState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as StoredState;
  } catch {
    return {};
  }
}

export function loadState(): SavedState {
  const saved = read();
  const palette = Object.fromEntries(
    (Object.keys(PALETTES) as PaletteKey[]).map((key) => {
      const legacy = LEGACY_PALETTE[key];
      const stored = saved.palette?.[key] ?? saved.palette?.[legacy.key];
      const name = stored && (legacy.names[stored] ?? stored);
      return [key, name && name in PALETTES[key].options ? name : PALETTES[key].default];
    }),
  ) as PaletteSelection;

  const layout: Layout = Object.fromEntries(ITEMS.map((base) => {
    const pos = saved.layout?.[base.id];
    const moved = pos && !OLD_HOME_Y[base.build]?.includes(pos.y);
    return [base.id, { x: pos?.x ?? base.x, y: moved ? pos.y : base.y, rot: pos?.rot ?? 0 }];
  }));

  return {
    layout,
    settings: {
      ceil: saved.ceil ?? CEILING_DEFAULT,
      cut: saved.cut ?? MODEL_CUT,
      led: saved.led ?? true,
      night: saved.night ?? false,
      doorsOpen: saved.doorsOpen ?? true,
      roomsOn: saved.roomsOn ?? true,
      projector: saved.projector ?? true,
      style: saved.style && saved.style in STYLES ? saved.style : STYLE_DEFAULT,
      palette,
    },
  };
}

export function saveState({ settings, layout }: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, layout }));
}
