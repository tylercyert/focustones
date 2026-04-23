import { useWindowState, type WindowInstance } from "../state/windowState";
import { useAppState } from "../state/appState";

type Props = {
  isStartMenuOpen: boolean;
  onToggleStart: () => void;
  clock: string;
};

export default function Taskbar({ isStartMenuOpen, onToggleStart, clock }: Props) {
  const windows = useWindowState((s) => s.windows);
  const topZ = useWindowState((s) => s.nextZ);
  const toggleFromTaskbar = useWindowState((s) => s.toggleFromTaskbar);
  const isPlaying = useAppState((s) => s.isPlaying);

  // Stable display order: sort by id so items don't jump around when focused/minimized.
  const items: WindowInstance[] = Object.values(windows).sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return (
    <div className="win98-taskbar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9000 }}>
      <button
        className={`win98-start-btn ${isStartMenuOpen ? "active" : ""}`}
        onClick={onToggleStart}
      >
        <span style={{ fontSize: 14 }}>&#127988;</span>
        <span>Start</span>
      </button>

      <div className="win98-taskbar-divider" />

      {items.map((win) => {
        const isTop = !win.isMinimized && win.zIndex === topZ;
        const classes = [
          "win98-taskbar-item",
          isTop ? "active" : "",
          win.isMinimized ? "minimized" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={win.id}
            className={classes}
            onClick={() => toggleFromTaskbar(win.id)}
            title={win.title}
          >
            <span>{win.icon}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {win.title}
            </span>
          </button>
        );
      })}

      <div className="win98-systray">
        {isPlaying && <span title="Audio playing" style={{ fontSize: 12 }}>&#128266;</span>}
        <span>{clock}</span>
      </div>
    </div>
  );
}
