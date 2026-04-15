import { useState } from "react";
import Win98Window from "./Win98Window";

type BlogArticle = {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
};

const articles: BlogArticle[] = [
  {
    id: "binaural",
    title: "Binaural Beats: Your Brain on Frequencies",
    icon: "\uD83C\uDFB5",
    content: (
      <>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          In 1839, Prussian physicist Heinrich Wilhelm Dove discovered something remarkable:
          when two slightly different frequencies are played into each ear through headphones,
          the brain perceives a third, phantom tone -- the difference between the two. He called
          them <b>binaural beats</b>. Over a century later, biophysicist Gerald Oster's 1973 paper
          in <i>Scientific American</i> reignited interest, proposing them as a tool for cognitive research.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          The mechanism is simple and elegant: if your left ear hears 200 Hz and your right ear
          hears 210 Hz, your brain produces a perceived 10 Hz pulse -- right in the <b>Alpha band</b>,
          associated with relaxed focus. Your brain doesn't just passively hear this beat; it actively
          entrains to it, gently nudging your dominant brainwave frequency toward the target.
        </p>

        <div style={{ background: '#fff', border: '2px solid', borderColor: '#808080 #fff #fff #808080', boxShadow: 'inset 1px 1px 0 #000', padding: 8, margin: '8px 0' }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: '#000080' }}>The Five Bands:</div>
          <div style={{ fontSize: 11, lineHeight: 1.8 }}>
            <div><span style={{ color: '#21B5B0', fontWeight: 700 }}>&delta; Delta (0.5-4 Hz)</span> -- Deep sleep. Your brain's recovery mode. Essential for physical restoration and immune function.</div>
            <div><span style={{ color: '#26C3A8', fontWeight: 700 }}>&theta; Theta (4-8 Hz)</span> -- The twilight zone between waking and sleep. Vivid imagery, creative insight, deep meditation.</div>
            <div><span style={{ color: '#7BBE62', fontWeight: 700 }}>&alpha; Alpha (8-12 Hz)</span> -- Calm alertness. The "flow state" frequency. Where focused attention meets relaxed awareness.</div>
            <div><span style={{ color: '#B8A64B', fontWeight: 700 }}>&beta; Beta (12-30 Hz)</span> -- Active thinking. Problem-solving, analysis, engaged conversation.</div>
            <div><span style={{ color: '#F2A23A', fontWeight: 700 }}>&gamma; Gamma (30+ Hz)</span> -- Peak cognition. Cross-brain synchronization. Associated with "aha" moments and advanced meditation.</div>
          </div>
        </div>

        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          Research at the Monroe Institute in the 1980s popularized binaural beats through their
          Hemi-Sync technology, claiming improved focus, relaxation, and even out-of-body experiences.
          While some of these claims remain contested, EEG studies have consistently shown that binaural
          beats can measurably influence brainwave patterns, particularly in the theta and alpha ranges.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          Modern research suggests the most reliable effects for <b>anxiety reduction</b> (theta beats),
          <b> sustained attention</b> (alpha and low beta beats), and <b>pre-sleep relaxation</b> (delta beats).
          The carrier frequency matters too -- lower carriers (around 200-256 Hz) tend to produce
          a warmer, more enveloping sound that many find more pleasant for extended listening.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7 }}>
          FocusTones gives you full control over both the carrier frequency and the binaural offset,
          so you can dial in exactly the state you're reaching for. Pair with headphones, close your
          eyes, and let the frequencies do the work.
        </p>
      </>
    ),
  },
  {
    id: "ambient",
    title: "Ambient Music: The Sound of Thinking",
    icon: "\uD83C\uDF0A",
    content: (
      <>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          In 1978, Brian Eno released <i>Ambient 1: Music for Airports</i> and wrote the manifesto
          that would define a genre: music that must be <b>"as ignorable as it is interesting."</b> Eno
          wasn't inventing silence -- he was inventing a new relationship between listener and sound.
          Music that doesn't demand your attention but rewards it when given.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          What followed was a golden decade. Harold Budd's <i>The Plateaux of Mirror</i> (1980), produced
          by Eno, layered piano in reverb cathedrals. Hiroshi Yoshimura's <i>Music for Nine Post Cards</i>
          (1982) brought Japanese minimalism into the conversation -- sparse, crystalline, deeply patient music
          that the internet would rediscover decades later.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          The 90s saw ambient music split into a dozen dialects. The Orb's <i>Adventures Beyond the
          Ultraworld</i> (1991) brought beatless passages and dub-inflected samples to rave culture.
          Aphex Twin's <i>Selected Ambient Works Volume II</i> (1994) pushed into deeply unsettling,
          dreamlike territory -- tracks with names like mathematical formulas, sourced from lucid
          dream recordings. It remains one of the most influential ambient albums ever made.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          Global Communication's <i>76:14</i> (1994) channeled Tangerine Dream through a UK rave
          sensibility. Biosphere's <i>Substrata</i> (1997) sampled Twin Peaks dialogue over arctic
          sound design, creating what many consider the definitive "cold ambient" album.
          Stars of the Lid pushed drone ambient to symphonic proportions.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          What made 90s ambient special was its relationship to electronic music culture. These
          weren't academics or gallery artists -- they were producers who had come up through
          rave culture and understood that the space <i>between</i> beats could be as powerful as
          the beats themselves. The chill-out room at a club became a laboratory for a new kind
          of deep listening.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7 }}>
          Today, ambient music thrives in the age of focus playlists and study streams. But the
          originals -- those 90s records -- still hit different. They weren't made to be
          productivity tools. They were made to be <i>worlds</i>.
        </p>
      </>
    ),
  },
  {
    id: "dnb",
    title: "Intelligent DnB: The Thinking Person's Jungle",
    icon: "\uD83E\uDD41",
    content: (
      <>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          Sometime around 1995, a branch of jungle music decided it had something to prove.
          While the main scene was getting darker and harder -- the "jump-up" and "techstep"
          movements pushing toward industrial aggression -- a crew of producers went the other
          way entirely. They made drum & bass that was beautiful. Critics called it <b>"intelligent
          drum & bass"</b> (a label many of the artists hated), but the name stuck.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          <b>LTJ Bukem</b> was the architect. His label Good Looking Records and the associated
          Looking Good sublabel became ground zero for what he called "intelligent jungle." Bukem's
          own productions -- tracks like "Music," "Demon's Theme," and "Horizons" -- paired
          170 BPM breakbeats with Rhodes piano chords, jazz samples, and deep sub-bass that felt
          like velvet. His legendary <i>Logical Progression</i> compilations (1996) mapped out the
          entire sound: fast but smooth, complex but accessible, electronic but soulful.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          <b>Goldie</b> pushed the artform further. <i>Timeless</i> (1995) was drum & bass's bid for
          album-length credibility -- a 71-minute opus that opened with a 21-minute orchestral
          breakbeat suite (the title track "Timeless" featuring Diane Charlemagne's devastating
          vocal). Metalheadz, his label, became a home for darker but still deeply musical DnB.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          <b>Photek</b> (Rupert Parkes) was the science division. His productions were forensic
          in their precision -- breakbeats edited at the individual hit level, creating polyrhythmic
          patterns that no human drummer could play. <i>Modus Operandi</i> (1997) was the
          masterclass: "Ni Ten Ichi Ryu" sampled samurai films over clinical breaks; "The Water
          Margin" was jazz fusion at 170 BPM. John Peel called him "the most important electronic
          artist of his generation."
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          <b>4hero</b> (Dego McFarlane and Marc Mac) evolved from hardcore rave into jazz-inflected
          drum & bass and beyond. Their 1998 album <i>Two Pages</i> featured live strings arranged
          by Fila Brazillia's Steve Cobby and pushed DnB into genuinely orchestral territory. Tracks
          like "Star Chasers" proved that 170 BPM could be graceful.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          Other essential names: <b>Peshay</b> (silky, jazz-drenched rollers), <b>Calibre</b>
          (who would carry the torch into the 2000s with devastating emotional depth),
          <b> Makoto</b> (Good Looking's Japanese connection, bridging Tokyo and London),
          <b> DJ Krust</b> and the Bristol crew at Full Cycle, and <b>Adam F</b> whose "Metropolis"
          brought orchestral bombast to the dancefloor.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
          What made intelligent DnB special was the contradiction at its core: music built on
          sampled breakbeats -- the Amen, the Think, the Apache -- that somehow transcended its
          sample-based origins to become genuinely new music. The producers weren't just chopping
          breaks; they were composing with rhythm itself, creating patterns that were simultaneously
          chaotic and hypnotic.
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.7 }}>
          The genre's relationship to focus is no coincidence. At 170+ BPM, intelligent DnB is
          too fast for your conscious mind to follow every hit -- instead, the breaks create a
          rhythmic texture that your brain processes as a unified pulse. Combined with lush pads,
          deep bass, and harmonic sophistication, it creates an ideal environment for deep work:
          energizing without being distracting, complex enough to prevent boredom, too fast to
          consciously follow. Your brain stops trying to track the rhythm and starts <i>riding</i> it.
        </p>
      </>
    ),
  },
];

type Props = {
  onClose: () => void;
};

export default function BlogWindow({ onClose }: Props) {
  const [activeArticle, setActiveArticle] = useState<string>("binaural");
  const current = articles.find((a) => a.id === activeArticle) || articles[0];

  return (
    <Win98Window
      title="The Zine - FocusTones Reader"
      icon="&#128196;"
      onClose={onClose}
      statusBar={
        <>
          <div className="win98-statusbar-section" style={{ flex: 2 }}>
            {current.icon} {current.title}
          </div>
          <div className="win98-statusbar-section" style={{ flex: 0, minWidth: 100, textAlign: 'center' }}>
            <span className="retro-construction">&#128679;</span> Under Construction
          </div>
        </>
      }
    >
      {/* Address bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
        padding: '2px 4px',
        background: 'var(--win98-window-bg)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Address:</span>
        <div className="win98-input" style={{ flex: 1, fontSize: 11, padding: '1px 4px' }}>
          C:\FocusTones\zine\{activeArticle}.html
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 6, flexWrap: 'wrap' }}>
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => setActiveArticle(article.id)}
            className={`win98-btn ${activeArticle === article.id ? 'win98-btn-active' : ''}`}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              ...(activeArticle === article.id
                ? { background: '#fff' }
                : {}),
            }}
          >
            {article.icon} {article.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Article content area */}
      <div style={{
        background: '#fff',
        border: '2px solid',
        borderColor: '#808080 #fff #fff #808080',
        boxShadow: 'inset 1px 1px 0 #000, inset -1px -1px 0 #C0C0C0',
        padding: 12,
        maxHeight: 'calc(100vh - 280px)',
        overflowY: 'auto',
        color: '#000',
      }}>
        {/* Retro page header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#000080', marginBottom: 2 }}>
            ~ The FocusTones Zine ~
          </div>
          <div className="retro-hr" />
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 4 }}>
            <div className="retro-marquee-inner" style={{ fontSize: 11, color: '#800080' }}>
              *** Welcome to The Zine *** Your source for binaural beats, ambient soundscapes, and intelligent drum & bass *** Best viewed at 800x600 ***
            </div>
          </div>
          <div className="retro-hr" />
        </div>

        {/* Article title */}
        <h2 style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#000080',
          marginBottom: 8,
          fontFamily: "'Pixelify Sans', 'MS Sans Serif', 'Tahoma', sans-serif",
        }}>
          {current.icon} {current.title}
        </h2>

        {/* Article body */}
        {current.content}

        {/* Retro footer */}
        <div className="retro-hr" style={{ marginTop: 12 }} />
        <div style={{ textAlign: 'center', fontSize: 10, color: '#808080' }}>
          <div style={{ marginBottom: 4 }}>
            <span className="retro-construction">&#128679;</span>
            {' '}This page is under construction{' '}
            <span className="retro-construction">&#128679;</span>
          </div>
          <div style={{ marginBottom: 4 }}>
            You are visitor #{' '}
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
            {' '}&bull; Last updated: January 1999
          </div>
        </div>
      </div>
    </Win98Window>
  );
}
