import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { useWindowState } from "../state/windowState";

type Props = {
  id: string;
  title: string;
  icon?: string;
  children: ReactNode;
  statusBar?: ReactNode;
  className?: string;
  closable?: boolean;
  minimizable?: boolean;
};

const MIN_VISIBLE = 32;

export default function Win98Window({
  id,
  title,
  icon,
  children,
  statusBar,
  className = "",
  closable = true,
  minimizable = true,
}: Props) {
  const win = useWindowState((s) => s.windows[id]);
  const topZ = useWindowState((s) => s.nextZ);
  const focusWindow = useWindowState((s) => s.focusWindow);
  const closeWindow = useWindowState((s) => s.closeWindow);
  const minimizeWindow = useWindowState((s) => s.minimizeWindow);
  const moveWindow = useWindowState((s) => s.moveWindow);

  const elRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Clamp position on viewport resize so windows never go off-screen.
  useEffect(() => {
    const clamp = () => {
      const el = elRef.current;
      if (!el) return;
      const current = useWindowState.getState().windows[id];
      if (!current) return;
      const { offsetWidth } = el;
      const maxX = window.innerWidth - MIN_VISIBLE;
      const maxY = window.innerHeight - MIN_VISIBLE - 30;
      const minX = -(offsetWidth - MIN_VISIBLE);
      const minY = 0;
      const nextX = Math.min(Math.max(current.position.x, minX), maxX);
      const nextY = Math.min(Math.max(current.position.y, minY), maxY);
      if (nextX !== current.position.x || nextY !== current.position.y) {
        moveWindow(id, { x: nextX, y: nextY });
      }
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [id, moveWindow]);

  if (!win || win.isMinimized) return null;

  const isFocused = win.zIndex === topZ;

  const onTitlebarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".win98-titlebar-btn")) return;
    focusWindow(id);
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    e.preventDefault();
  };

  const onTitlebarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const el = elRef.current;
    if (!el) return;
    const nextX = e.clientX - drag.offsetX;
    const nextY = e.clientY - drag.offsetY;
    const { offsetWidth } = el;
    const maxX = window.innerWidth - MIN_VISIBLE;
    const maxY = window.innerHeight - MIN_VISIBLE - 30;
    const minX = -(offsetWidth - MIN_VISIBLE);
    const minY = 0;
    const x = Math.min(Math.max(nextX, minX), maxX);
    const y = Math.min(Math.max(nextY, minY), maxY);
    moveWindow(id, { x, y });
  };

  const onTitlebarPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  };

  const style: CSSProperties = {
    position: "fixed",
    left: win.position.x,
    top: win.position.y,
    zIndex: win.zIndex,
    width: win.size?.width,
    height: win.size?.height,
  };

  return (
    <div
      ref={elRef}
      className={`win98-window ${className}`}
      style={style}
      onMouseDownCapture={() => focusWindow(id)}
    >
      <div
        className={`win98-titlebar ${isFocused ? "" : "win98-titlebar-inactive"}`}
        onPointerDown={onTitlebarPointerDown}
        onPointerMove={onTitlebarPointerMove}
        onPointerUp={onTitlebarPointerUp}
        onPointerCancel={onTitlebarPointerUp}
        onDoubleClick={() => minimizable && minimizeWindow(id)}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        {icon && <span className="win98-titlebar-icon">{icon}</span>}
        <span className="win98-titlebar-text">{title}</span>
        <div className="win98-titlebar-buttons">
          {minimizable && (
            <button
              className="win98-titlebar-btn"
              onClick={(e) => {
                e.stopPropagation();
                minimizeWindow(id);
              }}
              aria-label={`Minimize ${title}`}
              title="Minimize"
            >
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none" style={{ display: "block" }}>
                <path d="M0 5h6v2h-6z" fill="currentColor" />
              </svg>
            </button>
          )}
          {closable && (
            <button
              className="win98-titlebar-btn"
              onClick={(e) => {
                e.stopPropagation();
                closeWindow(id);
              }}
              aria-label={`Close ${title}`}
              title="Close"
            >
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none" style={{ display: "block" }}>
                <path d="M0 0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H5v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1V5h1V4h1V3H2V2H1V1H0V0z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="win98-window-body">{children}</div>

      {statusBar && <div className="win98-statusbar">{statusBar}</div>}
    </div>
  );
}
