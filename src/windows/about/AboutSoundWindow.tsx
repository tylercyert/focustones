import { strings } from '../../content/strings.ts';

const A = strings.aboutSound;

/** How the sound is made, honestly: no outcome claims (focustones-ios ADR 0006). */
export function AboutSoundWindow() {
  return (
    <section className="ft-win ft-about" aria-label={A.title}>
      <div className="ft-sec">
        <div className="ft-sec-head"><h2 className="ft-h2">{A.binauralHeading}</h2><span className="ft-tag">{A.binauralTag}</span></div>
        <div className="ft-sound-card ft-well">
          <p className="ft-ear"><span className="ft-ear-left">{A.leftEar}</span><span>{A.leftHz}</span></p>
          <p className="ft-ear"><span className="ft-ear-right">{A.rightEar}</span><span>{A.rightHz}</span></p>
          <svg className="ft-wave" viewBox="0 0 240 28" aria-hidden="true">
            <path d="M0 14 Q 10 0 20 14 T 40 14 T 60 14 T 80 14 T 100 14 T 120 14 T 140 14 T 160 14 T 180 14 T 200 14 T 220 14 T 240 14" fill="none" stroke="#00756e" strokeWidth="1.6" opacity=".6" />
            <path d="M0 14 Q 12 -2 24 14 T 48 14 T 72 14 T 96 14 T 120 14 T 144 14 T 168 14 T 192 14 T 216 14 T 240 14" fill="none" stroke="#7a4f00" strokeWidth="1.6" />
          </svg>
          <p className="ft-small">{A.difference}</p>
        </div>
        <p className="ft-p">{A.binauralBody}</p>
      </div>
      <div className="ft-sec">
        <div className="ft-sec-head"><h2 className="ft-h2">{A.isochronicHeading}</h2><span className="ft-tag">{A.isochronicTag}</span></div>
        <div className="ft-pulses ft-well" role="img" aria-label={A.isochronicAlt}>
          {[0.35, 0.8, 1, 0.8, 0.35, 0.8, 1].map((o, i) => <span key={i} style={{ opacity: o }} />)}
        </div>
        <p className="ft-p">{A.isochronicBody}</p>
      </div>
      <div className="ft-sec">
        <h2 className="ft-h2">{A.researchHeading}</h2>
        <p className="ft-p">{A.researchBody}</p>
        <p className="ft-p">{A.researchPromise}</p>
      </div>
      <div className="ft-sec">
        <h2 className="ft-h2">{A.safetyHeading}</h2>
        <ul className="ft-plain">
          <li>{A.safetyDriving}</li>
          <li>{A.safetyMedical}</li>
          <li>{A.safetyVolume}</li>
        </ul>
      </div>
    </section>
  );
}
