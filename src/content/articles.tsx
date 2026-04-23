import type { ReactNode } from "react";

// To add a new article, append an entry to the `articles` array below.
// A desktop icon and window are generated automatically — nothing else to wire up.
// See CLAUDE.md ("Articles" section) for field-by-field guidance.

export type Article = {
  id: string;
  title: string;
  shortTitle: string;
  desktopLabel: string;
  icon: string;
  content: ReactNode;
};

export const articles: Article[] = [
  {
    id: "binaural",
    title: "Binaural Beats: Your Brain on Frequencies",
    shortTitle: "Binaural Beats",
    desktopLabel: "Binaural\nBeats",
    icon: "🎵",
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
];

export const articlesById: Record<string, Article> = Object.fromEntries(
  articles.map((a) => [a.id, a]),
);

export const articleWindowId = (articleId: string) => `article:${articleId}`;
