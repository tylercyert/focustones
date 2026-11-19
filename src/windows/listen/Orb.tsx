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
const MESH = 72; // the mesh is computed on a 72×72 grid and drawn smoothed
const SIGMA = 0.21;

const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

/** Shades the 72×72 mesh: a smooth blend of the nine colours, each weighted by distance to its (moving) mesh point. */
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
  const state = useRef({ playback: new OrbPlayback(playing), morph: new OrbMorph(BAND_HUES[band]), wake: () => {}, still: false, band });

  useEffect(() => {
    const s = state.current;
    const el = canvas.current!;
    const hostEl = host.current!;
    const ctx = el.getContext('2d')!;
    const mesh = document.createElement('canvas');
    mesh.width = mesh.height = MESH;
    const mctx = mesh.getContext('2d')!;
    const image = mctx.createImageData(MESH, MESH);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true, raf = 0, last = -Infinity;
    s.still = motionQuery.matches;

    const span = Math.ceil(size * (GLOW_REACH * 2 + 0.04));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = el.height = Math.round(span * dpr);

    const draw = (t: number) => {
      const level = s.playback.level(t);
      const b = breath(t, level, s.still);
      const hues = s.morph.hues(t);
      paintMesh(image, points(t, s.still), colors(hues, b.brightness));
      mctx.putImageData(image, 0, 0);

      ctx.setTransform(el.width / span, 0, 0, el.height / span, 0, 0);
      ctx.clearRect(0, 0, span, span);
      const c = span / 2;
      const r = size / 2;
      // Halo: starts at the sphere's rim and fades out.
      const halo = ctx.createRadialGradient(c, c, 0, c, c, size * GLOW_REACH);
      halo.addColorStop(0.46, css(hues.base, 0.6));
      halo.addColorStop(0.56, css(hues.base, 0.42));
      halo.addColorStop(0.74, css(hues.cross, 0.18));
      halo.addColorStop(1, css(hues.cross, 0));
      ctx.globalAlpha = b.glow;
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, span, span);
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.translate(c, c);
      ctx.scale(b.scale, b.scale);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(mesh, -r, -r, size, size);
      // Soft highlight at the upper left.
      ctx.save();
      ctx.translate(-r + size * 0.38, -r + size * 0.22);
      ctx.scale(1, 0.9);
      const spec = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.36);
      spec.addColorStop(0, 'rgba(255,255,255,0.38)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.restore();
      // Darkening toward the rim that makes a disc read as a sphere.
      const shade = ctx.createRadialGradient(-r + size * 0.46, -r + size * 0.4, 0, -r + size * 0.46, -r + size * 0.4, size * 0.81);
      shade.addColorStop(0.58, css(INK, 0));
      shade.addColorStop(0.9, css(INK, 0.12));
      shade.addColorStop(1, css(INK, 0.22));
      ctx.fillStyle = shade;
      ctx.fillRect(-r, -r, size, size);
      // Light rim.
      const rim = ctx.createRadialGradient(0, 0, r * 0.84, 0, 0, r);
      rim.addColorStop(0, css(hues.light, 0));
      rim.addColorStop(1, css(mix(hues.light, hues.base, 0.2), 0.5));
      ctx.fillStyle = rim;
      ctx.fillRect(-r, -r, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(c, c, r * b.scale - 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.13)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    const now = () => performance.now() / 1000;
    const tick = () => {
      raf = 0;
      const t = now();
      const transitioning = s.playback.remaining(t) > 0 || s.morph.remaining(t) > 0;
      if (t - last >= 1 / MOTION.framesPerSecond - 0.002) {
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
      <canvas ref={canvas} style={{ width: Math.ceil(size * (GLOW_REACH * 2 + 0.04)), height: Math.ceil(size * (GLOW_REACH * 2 + 0.04)) }} />
    </div>
  );
}
