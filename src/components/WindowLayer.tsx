import { useWindowState } from "../state/windowState";
import SettingsWindow from "./SettingsWindow";
import AboutWindow from "./AboutWindow";
import WelcomeWindow from "./WelcomeWindow";
import ArticleWindow from "./ArticleWindow";
import MediaPlayerWindow from "./MediaPlayerWindow";

type Props = {
  onToggle: () => void;
};

export default function WindowLayer({ onToggle }: Props) {
  const windows = useWindowState((s) => s.windows);

  return (
    <>
      {Object.values(windows).map((win) => {
        switch (win.kind) {
          case "settings":
            return <SettingsWindow key={win.id} onToggle={onToggle} />;
          case "about":
            return <AboutWindow key={win.id} />;
          case "welcome":
            return <WelcomeWindow key={win.id} />;
          case "mediaPlayer":
            return <MediaPlayerWindow key={win.id} onToggle={onToggle} />;
          case "article":
            return win.payload?.articleId ? (
              <ArticleWindow key={win.id} articleId={win.payload.articleId} />
            ) : null;
          default:
            return null;
        }
      })}
    </>
  );
}
