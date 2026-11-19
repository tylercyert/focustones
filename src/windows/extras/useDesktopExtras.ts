import { useMemo, type CSSProperties } from 'react';
import { strings } from '../../content/strings.ts';
import type { MenuDef, MenuItem } from '../../desktop/MenuBar.tsx';
import { emptyTrash, markTrash, moveToTrash, startSaver, trashAt } from './actions.ts';
import { patternStyle } from './patterns.ts';
import { FOLDER, folderSelection, present, settingsStore, updateSettings, useFolderSelection, useSettings, useTrash, type Offset } from './store.ts';
import { useBand } from './useBand.ts';

const m = strings.delights.menu;

interface Args {
  selected: readonly string[];
  active: string | null;
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
}

/** What the desktop shell needs from the delights: hidden icons, the Trash's look, menu items, icon positions, the pattern. */
export function useDesktopExtras({ selected, active, openWindow, closeWindow }: Args) {
  const trash = useTrash();
  const settings = useSettings();
  const folderItem = useFolderSelection();
  const band = useBand();

  const target = active === FOLDER && folderItem && present(trash, folderItem) ? folderItem
    : selected.includes(FOLDER) && present(trash, FOLDER) ? FOLDER : null;

  const appItems: MenuItem[] = [
    { kind: 'item', label: m.aboutDesktop, onSelect: () => openWindow('about-desktop') },
    { kind: 'sep' },
    { kind: 'item', label: m.beatCalculator, onSelect: () => openWindow('beat-calculator') },
    { kind: 'item', label: m.note, onSelect: () => openWindow('note') },
    { kind: 'sep' },
    { kind: 'item', label: m.patterns, onSelect: () => openWindow('desktop-patterns') },
    { kind: 'item', label: m.screenSaver, onSelect: () => openWindow('screen-saver') },
  ];
  const fileItems: MenuItem[] = [
    { kind: 'item', label: m.moveToTrash, shortcut: 'Delete', disabled: !target, onSelect: () => target && moveToTrash([target], closeWindow) },
  ];
  const specialMenu: MenuDef = {
    id: 'special', label: m.special, items: [
      { kind: 'item', label: m.emptyTrash, disabled: trash.trashed.length === 0, onSelect: () => emptyTrash(strings.delights.trash.emptied) },
      { kind: 'sep' },
      { kind: 'item', label: m.startSaver, onSelect: startSaver },
    ],
  };

  const pattern = settings.pattern;
  const surface = useMemo(() => {
    const style = patternStyle(pattern, band);
    return style ? { 'data-pattern': pattern, style } : {};
  }, [pattern, band]) as { 'data-pattern'?: string; style?: CSSProperties };

  return {
    hidden: present(trash, FOLDER) ? [] : [FOLDER],
    trashFull: trash.trashed.length > 0,
    appItems, fileItems, specialMenu, surface,
    offsets: settings.icons,
    cleanUpIcons: () => updateSettings({ icons: {} }),
    /** While an icon is dragged: light the Trash when the pointer is over it. */
    onIconDrag: (_id: string, x: number, y: number) => markTrash(!!trashAt(x, y)),
    /** An icon was dropped: on the Trash, the folder goes in (other icons spring back); elsewhere it stays where it lands. */
    onIconDrop: (id: string, offset: Offset, x: number, y: number) => {
      markTrash(false);
      if (trashAt(x, y)) {
        if (id === FOLDER) { moveToTrash([FOLDER], closeWindow); folderSelection.set(null); }
        return;
      }
      updateSettings({ icons: { ...settingsStore.get().icons, [id]: offset } });
    },
  };
}
