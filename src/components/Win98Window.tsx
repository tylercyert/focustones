import type { ReactNode } from "react";

type Props = {
  title: string;
  icon?: string;
  onClose?: () => void;
  children: ReactNode;
  statusBar?: ReactNode;
  className?: string;
};

export default function Win98Window({ title, icon, onClose, children, statusBar, className = "" }: Props) {
  return (
    <div className={`win98-window ${className}`}>
      {/* Title Bar */}
      <div className="win98-titlebar">
        {icon && <span className="win98-titlebar-icon">{icon}</span>}
        <span className="win98-titlebar-text">{title}</span>
        <div className="win98-titlebar-buttons">
          {onClose && (
            <button
              className="win98-titlebar-btn"
              onClick={onClose}
              aria-label={`Close ${title}`}
              title="Close"
            >
              <svg width="8" height="7" viewBox="0 0 8 7" fill="none" style={{ display: 'block' }}>
                <path d="M0 0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H5v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1V5h1V4h1V3H2V2H1V1H0V0z" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="win98-window-body">
        {children}
      </div>

      {/* Optional Status Bar */}
      {statusBar && (
        <div className="win98-statusbar">
          {statusBar}
        </div>
      )}
    </div>
  );
}
