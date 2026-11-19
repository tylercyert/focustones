import { useEffect, useRef } from 'react';
import { BAND_HUES, INK, MOTION, OrbMorph, OrbPlayback, breath, colors, isAnimating, mix, points, type Band, type RGB } from './orbMotion.ts';

interface OrbProps {
  readonly band: Band;
  /** True while sound is fading in or playing; the orb swells and breathes. */
  readonly playing: boolean;
  /** The sphere's diameter in CSS px; the glow reaches about 40% past it on every side. */
  readonly size: number;
}

const GLOW_REACH = 0.92; // × size, the halo's radius (matches OrbView.swift)
const MESH = 48; // the mesh is computed on a 48×48 grid and drawn smoothed (it is a soft blend: more cells add nothing visible)
const SIGMA = 0.21;

const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

/** Shades the mesh: a smooth blend of the nine colours, each weighted by distance to its (moving) mesh point. */
function paintMesh(img: ImageData, pts: { x: number; y: number }[], cols: RGB[]): void {
  const data = img.data;
  const k = -1 / (2 * SIGMA * SIGMA);
  for (let j = 0; j < MESH; j++) {
    const v = (j + 0.5) / MESH;
    for (let i = 0; i < MESH; i++) {
      const u = (i + 0.5) / MESH;
      let r = 0, g = 0, b = 0, sum = 0;
      for (let n = 0; n < 9; n++) {
        const dx = u - pts[n].x, dy = v - pts[n].y;
        const w = Math.exp((dx * dx + dy * dy) * k);
        r += cols[n][0] * w; g += cols[n][1] * w; b += cols[n][2] * w; sum += w;
      }
      const o = (j * MESH + i) * 4;
      data[o] = (r / sum) * 255; data[o + 1] = (g / sum) * 255; data[o + 2] = (b / sum) * 255; data[o + 3] = 255;
    }
  }
}

/**
 * The orb: a sphere in the band's colours with a soft glow (a canvas port of focustones-ios OrbView.swift). It breathes
 * on a 6 s cycle while playing, swells over 3 s when a session starts, crosses colour over 0.6 s on a band change and
 * holds still with Reduce Motion. Nothing here knows the beat, so it cannot flash at the beat rate.
 */
export function Orb({ band, playing, size }: OrbProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const state = useRef({ playback: new OrbPlayback(playing), morph: new OrbMorph(BAND_HUES[band]), wake: () => {}, still: false, band });

  useEffect(() => {
    const s = state.current;
    const el = canvas.current!;
    const hostEl = host.current!;
    // CPU-backed canvases: a small canvas fed by putImageData each frame costs less there than a GPU round trip.
    const cpu: CanvasRenderingContext2DSettings = { willReadFrequently: true };
    const ctx = el.getContext('2d', cpu)!;
    const mesh = document.createElement('canvas');
    mesh.width = mesh.height = MESH;
    const mctx = mesh.getContext('2d', cpu)!;
    const image = mctx.createImageData(MESH, MESH);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true, raf = 0, last = -Infinity;
    s.still = motionQuery.matches;

    // The canvas holds the sphere only (with room for the breath's swell); the glow is a CSS gradient behind it, so the
    // browser composites it and a frame never repaints the halo's pixels.
    const span = Math.ceil(size * 1.1);
    // Device pixels, at most 3× (2× on a phone, to keep the fill cheap).
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), window.innerWidth < 700 ? 2 : 3);
    el.width = el.height = Math.round(span * dpr);
    // The still layers are drawn once, supersampled (at least 2×), and scaled into place each frame with smoothing.
    const S = Math.round(size * Math.max(dpr, 2));
    const layer = (w: number) => { const c = document.createElement('canvas'); c.width = c.height = w; return [c, c.getContext('2d', cpu)!] as const; };
    const R = S / 2;
    // Highlight and shade: they never change.
    const [still, stillCtx] = layer(S);
    stillCtx.save();
    stillCtx.translate(S * 0.38, S * 0.22);
    stillCtx.scale(1, 0.9);
    const spec = stillCtx.createRadialGradient(0, 0, 0, 0, 0, S * 0.36);
    spec.addColorStop(0, 'rgba(255,255,255,0.38)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    stillCtx.fillStyle = spec;
    stillCtx.fillRect(-S, -S, S * 2, S * 2);
    stillCtx.restore();
    const shade = stillCtx.createRadialGradient(S * 0.46, S * 0.4, 0, S * 0.46, S * 0.4, S * 0.81);
    shade.addColorStop(0.58, css(INK, 0));
    shade.addColorStop(0.9, css(INK, 0.12));
    shade.addColorStop(1, css(INK, 0.22));
    stillCtx.fillStyle = shade;
    stillCtx.fillRect(0, 0, S, S);
    // The soft edge: a canvas clip() is not anti-aliased, so the sphere is masked with about 1.2 CSS px of falloff.
    const [mask, maskCtx] = layer(S);
    const edge = (1.2 * S) / size / R;
    const maskFill = maskCtx.createRadialGradient(R, R, 0, R, R, R);
    maskFill.addColorStop(0, '#000');
    maskFill.addColorStop(Math.max(0, 1 - edge * 1.2), '#000');
    maskFill.addColorStop(1, 'rgba(0,0,0,0)');
    maskCtx.fillStyle = maskFill;
    maskCtx.fillRect(0, 0, S, S);
    // Highlight, shade and the band-coloured rim in one layer, redrawn only when the band's colours change.
    const [dress, dressCtx] = layer(S);
    const glowEl = glow.current!;
    let huesKey = '';
    let glowOpacity = '';
    const paintColours = (hues: ReturnType<typeof s.morph.hues>) => {
      const key = `${hues.base}|${hues.light}|${hues.cross}`;
      if (key === huesKey) return;
      huesKey = key;
      dressCtx.clearRect(0, 0, S, S);
      dressCtx.drawImage(still, 0, 0);
      const rim = dressCtx.createRadialGradient(R, R, R * 0.84, R, R, R);
      rim.addColorStop(0, css(hues.light, 0));
      rim.addColorStop(1, css(mix(hues.light, hues.base, 0.2), 0.5));
      dressCtx.fillStyle = rim;
      dressCtx.fillRect(0, 0, S, S);
      glowEl.style.background = `radial-gradient(closest-side, ${css(hues.base, 0.6)} 46%, ${css(hues.base, 0.42)} 56%, ${css(hues.cross, 0.18)} 74%, ${css(hues.cross, 0)})`;
    };

    const draw = (t: number) => {
      const level = s.playback.level(t);
      const b = breath(t, level, s.still);
      const hues = s.morph.hues(t);
      paintMesh(image, points(t, s.still), colors(hues, b.brightness));
      mctx.putImageData(image, 0, 0);
      paintColours(hues);
      const opacity = b.glow.toFixed(3);
      if (opacity !== glowOpacity) glowEl.style.opacity = glowOpacity = opacity;

      // The sphere, straight into the canvas: mesh, then highlight, shade and rim, then the soft edge mask.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, span, span);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      const c = span / 2;
      const d = size * b.scale;
      const x = c - d / 2;
      ctx.drawImage(mesh, x, x, d, d);
      ctx.drawImage(dress, x, x, d, d);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, x, x, d, d);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(c, c, d / 2 - 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.13)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const now = () => performance.now() / 1000;
    const tick = () => {
      raf = 0;
      const t = now();
      const transitioning = s.playback.remaining(t) > 0 || s.morph.remaining(t) > 0;
      const fps = transitioning || s.playback.level(t) > 0 ? MOTION.framesPerSecond : MOTION.idleFramesPerSecond;
      if (t - last >= 1 / fps - 0.002) {
        draw(t);
        last = t;
      }
      if (isAnimating(visible && !document.hidden, true, s.still, transitioning)) raf = requestAnimationFrame(tick);
    };
    s.wake = () => {
      last = -Infinity;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    draw(now());
    s.wake();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) s.wake(); });
    io.observe(hostEl);
    const onMotion = () => { s.still = motionQuery.matches; s.wake(); };
    motionQuery.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', s.wake);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      motionQuery.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', s.wake);
    };
  }, [size]);

  useEffect(() => {
    const s = state.current;
    s.playback.set(playing, performance.now() / 1000);
    s.wake();
  }, [playing]);

  useEffect(() => {
    const s = state.current;
    s.morph.retarget(BAND_HUES[band], performance.now() / 1000, s.still);
    s.band = band;
    s.wake();
  }, [band]);

  return (
    <div ref={host} className="ft-orb" style={{ width: size, height: size }} data-testid="orb" data-band={band} data-playing={playing} aria-hidden="true">
      <div ref={glow} className="ft-orb-glow" style={{ width: Math.round(size * GLOW_REACH * 2), height: Math.round(size * GLOW_REACH * 2) }} />
      <canvas ref={canvas} style={{ width: Math.ceil(size * 1.1), height: Math.ceil(size * 1.1) }} />
    </div>
  );
}
