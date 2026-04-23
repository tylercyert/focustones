import Win98Window from "./Win98Window";
import { articlesById, articleWindowId } from "../content/articles";

type Props = {
  articleId: string;
};

export default function ArticleWindow({ articleId }: Props) {
  const article = articlesById[articleId];
  if (!article) return null;

  const id = articleWindowId(articleId);

  return (
    <Win98Window
      id={id}
      title={`${article.shortTitle} - The Zine`}
      icon="&#128196;"
      statusBar={
        <>
          <div className="win98-statusbar-section" style={{ flex: 2 }}>
            {article.icon} {article.title}
          </div>
          <div className="win98-statusbar-section" style={{ flex: 0, minWidth: 100, textAlign: "center" }}>
            <span className="retro-construction">&#128679;</span> Under Construction
          </div>
        </>
      }
    >
      {/* Address bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginBottom: 4,
        padding: "2px 4px",
        background: "var(--win98-window-bg)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>Address:</span>
        <div className="win98-input" style={{ flex: 1, fontSize: 11, padding: "1px 4px" }}>
          C:\FocusTones\zine\{article.id}.html
        </div>
      </div>

      {/* Article content area */}
      <div style={{
        background: "#fff",
        border: "2px solid",
        borderColor: "#808080 #fff #fff #808080",
        boxShadow: "inset 1px 1px 0 #000, inset -1px -1px 0 #C0C0C0",
        padding: 12,
        maxHeight: "calc(100vh - 220px)",
        overflowY: "auto",
        color: "#000",
      }}>
        {/* Retro page header */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#000080", marginBottom: 2 }}>
            ~ The FocusTones Zine ~
          </div>
          <div className="retro-hr" />
          <div style={{ overflow: "hidden", whiteSpace: "nowrap", marginBottom: 4 }}>
            <div className="retro-marquee-inner" style={{ fontSize: 11, color: "#800080" }}>
              *** Welcome to The Zine *** Essays on sound, focus, and the frequencies that move us *** Best viewed at 800x600 ***
            </div>
          </div>
          <div className="retro-hr" />
        </div>

        {/* Article title */}
        <h2 style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#000080",
          marginBottom: 8,
          fontFamily: "'Pixelify Sans', 'MS Sans Serif', 'Tahoma', sans-serif",
        }}>
          {article.icon} {article.title}
        </h2>

        {article.content}

        <div className="retro-hr" style={{ marginTop: 12 }} />
        <div style={{ textAlign: "center", fontSize: 10, color: "#808080" }}>
          <div style={{ marginBottom: 4 }}>
            <span className="retro-construction">&#128679;</span>
            {" "}This page is under construction{" "}
            <span className="retro-construction">&#128679;</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            You are visitor #{" "}
            <span className="retro-counter">
              <span className="retro-counter-digit">0</span>
              <span className="retro-counter-digit">0</span>
              <span className="retro-counter-digit">4</span>
              <span className="retro-counter-digit">2</span>
              <span className="retro-counter-digit">0</span>
            </span>
          </div>
          <div>
            <a href="https://tylercyert.com" target="_blank" rel="noopener noreferrer" className="retro-link" style={{ fontSize: 10 }}>
              tylercyert.com
            </a>
            {" "}&bull; Last updated: January 1999
          </div>
        </div>
      </div>
    </Win98Window>
  );
}
