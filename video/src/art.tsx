// Elementos dibujados a mano en SVG. Nada generado por IA ni bajado de bancos de imágenes.
import React from 'react';
import {interpolate, random, useCurrentFrame, spring, useVideoConfig} from 'remotion';
import {geoOrthographic, geoPath, geoGraticule10, GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
import land50 from 'world-atlas/land-50m.json';
import {loadFont as loadMont} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';

export const MONT = loadMont('normal', {weights: ['800', '900'], subsets: ['latin', 'latin-ext']}).fontFamily;
export const ANTON = loadAnton('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']}).fontFamily;

export const FPS = 30;
export type Word = {w: string; s: number; e: number};
export type SceneProps = {words: Word[]; len: number};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ramp = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], clamp);

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Frame (dentro de la escena) en que la voz dice la palabra que contiene `key`.
export const wordFrame = (words: Word[], key: string, nth = 0) => {
  const hits = words.filter((w) => norm(w.w).includes(norm(key)));
  const w = hits[nth] ?? hits[0] ?? words[words.length - 1];
  return Math.round(w.s * FPS);
};

const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px #000`,
  paintOrder: 'stroke fill',
});

export const Stars: React.FC<{n?: number; h?: number}> = ({n = 140, h = 1920}) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {Array.from({length: n}, (_, i) => (
        <circle
          key={i}
          cx={random(`sx${i}`) * 1080}
          cy={random(`sy${i}`) * h}
          r={0.6 + random(`sr${i}`) * 2.2}
          fill="#fff"
          opacity={0.25 + 0.6 * Math.abs(Math.sin(f / 14 + i))}
        />
      ))}
    </svg>
  );
};

const LAND = feature(land50 as any, (land50 as any).objects.land) as any;

export const Globe: React.FC<{
  size: number;
  lon: number;
  lat: number;
  dim?: number;
  children?: (p: GeoProjection) => React.ReactNode;
}> = ({size, lon, lat, dim = 0, children}) => {
  const r = size / 2;
  const p = geoOrthographic().scale(r - 4).translate([r, r]).rotate([-lon, -lat]).clipAngle(90);
  const path = geoPath(p);
  return (
    <svg width={size} height={size} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="gOcean" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#3b8fdc" />
          <stop offset="1" stopColor="#0a2550" />
        </radialGradient>
        <radialGradient id="gShade" cx="35%" cy="30%" r="80%">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="gAir">
          <stop offset="0.86" stopColor="#7cc8ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#7cc8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r * 1.12} fill="url(#gAir)" />
      <circle cx={r} cy={r} r={r - 4} fill="url(#gOcean)" />
      <path d={path(geoGraticule10()) ?? ''} fill="none" stroke="#a8d8ff" strokeOpacity={0.12} strokeWidth={1.5} />
      <path d={path(LAND) ?? ''} fill="#5a9e5e" stroke="#2e6a3a" strokeWidth={2} />
      <circle cx={r} cy={r} r={r - 4} fill="url(#gShade)" />
      {dim > 0 && <circle cx={r} cy={r} r={r - 3} fill="#262a33" opacity={dim} />}
      {children?.(p)}
    </svg>
  );
};

// Asteroide con estela. `angle` = dirección del movimiento en grados (la estela va hacia atrás).
export const Asteroid: React.FC<{r: number; angle: number; trail?: number}> = ({r, angle, trail = 6}) => {
  const f = useCurrentFrame();
  const pts = Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const rr = r * (0.8 + random(`ast${i}`) * 0.28);
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  }).join(' ');
  const L = r * trail * (1 + 0.07 * Math.sin(f * 1.9));
  return (
    <g transform={`rotate(${angle})`}>
      <defs>
        <linearGradient id="trail" gradientUnits="userSpaceOnUse" x1={-L} y1={0} x2={0} y2={0}>
          <stop offset="0" stopColor="#ff3d00" stopOpacity="0" />
          <stop offset="0.6" stopColor="#ff7a1a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff4b0" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="astGlow">
          <stop offset="0" stopColor="#fff1b0" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#ff8a2a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff5a00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rock" cx="35%" cy="35%">
          <stop offset="0" stopColor="#9a8672" />
          <stop offset="1" stopColor="#3a2d26" />
        </radialGradient>
      </defs>
      <polygon points={`${-L},0 0,${-r * 1.1} 0,${r * 1.1}`} fill="url(#trail)" />
      <polygon points={`${-L * 0.55},0 0,${-r * 0.55} 0,${r * 0.55}`} fill="#fff6c8" opacity={0.7} />
      <circle r={r * 2.1} fill="url(#astGlow)" />
      <polygon points={pts} fill="url(#rock)" />
      <circle cx={-r * 0.25} cy={-r * 0.2} r={r * 0.18} fill="#2b211c" opacity={0.6} />
      <circle cx={r * 0.3} cy={r * 0.25} r={r * 0.12} fill="#2b211c" opacity={0.6} />
      <circle cx={r * 0.2} cy={-r * 0.35} r={r * 0.08} fill="#2b211c" opacity={0.6} />
    </g>
  );
};

// Saurópodo mirando a la derecha. Caja 400x230, patas apoyadas en y=228.
export const Sauropod: React.FC<{fill?: string; phase?: number; far?: string}> = ({
  fill = '#0a0710',
  far,
  phase = 0,
}) => {
  const sw = Math.sin(phase) * 7;
  const leg = (x: number, c: string, d: number) => (
    <rect x={x + d} y={148} width={28} height={80} rx={12} fill={c} />
  );
  return (
    <g>
      {leg(186, far ?? fill, -sw)}
      {leg(292, far ?? fill, sw)}
      <path
        d="M5,170 C60,140 110,110 150,105 C190,85 250,85 280,105 C300,90 320,40 345,22 C352,15 372,15 380,22 L390,30 C387,37 372,39 360,36 C345,45 332,95 318,135 C308,152 292,160 272,163 C232,171 192,171 160,161 C110,151 60,161 5,170 Z"
        fill={fill}
      />
      {leg(160, fill, sw)}
      {leg(266, fill, -sw)}
    </g>
  );
};

// T-Rex mirando a la derecha. Caja 400x240, pies en y=236.
export const TRex: React.FC<{fill?: string; far?: string; phase?: number; eye?: string}> = ({
  fill = '#07040c',
  far,
  phase = 0,
  eye,
}) => {
  const a = Math.sin(phase) * 20;
  const leg = (rot: number, c: string, dx: number) => (
    <g transform={`translate(${dx},0) rotate(${rot} 200 125)`} fill={c}>
      <ellipse cx={200} cy={140} rx={36} ry={46} transform="rotate(-15 200 140)" />
      <polygon points="186,162 218,162 240,222 222,229" />
      <polygon points="214,222 266,225 266,237 210,237" />
    </g>
  );
  return (
    <g transform={`translate(0,${-Math.abs(Math.sin(phase)) * 5})`}>
      {leg(-a, far ?? fill, -22)}
      <path
        d="M10,95 C80,80 150,60 205,62 C240,63 265,70 285,78 C295,70 300,58 312,52 L372,50 C385,50 391,58 389,66 L387,78 L346,81 L381,89 C376,97 361,101 341,101 C321,103 306,113 296,126 C281,146 246,156 216,153 C191,151 166,141 151,131 C111,119 61,106 10,95 Z"
        fill={fill}
      />
      <polygon points="300,124 320,138 325,133 307,119" fill={fill} />
      {leg(a, fill, 0)}
      {eye && <circle cx={356} cy={62} r={4.5} fill={eye} />}
    </g>
  );
};

export const Volcano: React.FC<{x: number; y: number; w: number; h: number; fill?: string}> = ({
  x,
  y,
  w,
  h,
  fill = '#0a0710',
}) => {
  const f = useCurrentFrame();
  return (
    <g>
      <ellipse cx={x} cy={y - h} rx={w * 0.18} ry={30 + 6 * Math.sin(f / 4)} fill="#ff7a2b" opacity={0.35} />
      <polygon points={`${x - w / 2},${y} ${x - w * 0.09},${y - h} ${x + w * 0.09},${y - h} ${x + w / 2},${y}`} fill={fill} />
    </g>
  );
};

export const Fern: React.FC<{fill: string}> = ({fill}) => (
  <g fill={fill} stroke={fill}>
    {[-1, 0, 1].map((k) => (
      <g key={k} transform={`translate(${100 + k * 55},230) rotate(${k * 22})`}>
        <path d="M0,0 C-5,-60 5,-120 0,-180" fill="none" strokeWidth={7} />
        {Array.from({length: 7}, (_, i) => (
          <g key={i}>
            <ellipse cx={-22} cy={-30 - i * 22} rx={24 - i * 2.5} ry={8} transform={`rotate(-25 -22 ${-30 - i * 22})`} />
            <ellipse cx={22} cy={-30 - i * 22} rx={24 - i * 2.5} ry={8} transform={`rotate(25 22 ${-30 - i * 22})`} />
          </g>
        ))}
      </g>
    ))}
  </g>
);

export const Thermo: React.FC<{level: number; color: string}> = ({level, color}) => (
  <g>
    <rect x={-40} y={0} width={80} height={680} rx={40} fill="#e9eef5" />
    <circle cx={0} cy={720} r={78} fill="#e9eef5" />
    <rect x={-22} y={20 + 640 * (1 - level)} width={44} height={640 * level + 60} rx={22} fill={color} />
    <circle cx={0} cy={720} r={58} fill={color} />
    {Array.from({length: 9}, (_, i) => (
      <rect key={i} x={46} y={40 + i * 75} width={i % 2 ? 22 : 38} height={7} fill="#e9eef5" />
    ))}
  </g>
);

// Anillo de porcentaje alrededor de un centro. p0..p1 = tramo pintado (0..1).
export const Arc: React.FC<{r: number; p0: number; p1: number; color: string; w?: number}> = ({
  r,
  p0,
  p1,
  color,
  w = 40,
}) => {
  const C = 2 * Math.PI * r;
  return (
    <circle
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="butt"
      strokeDasharray={`${Math.max(0, p1 - p0) * C} ${C}`}
      strokeDashoffset={-p0 * C}
      transform="rotate(-90)"
    />
  );
};

export const Headline: React.FC<{lines: string[]; top?: number; colors?: string[]; size?: number}> = ({
  lines,
  top = 200,
  colors = ['#fff', '#FFD60A'],
  size = 112,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 11, stiffness: 200}, durationInFrames: 10});
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', transform: `scale(${0.85 + 0.15 * s})`}}>
      {lines.map((l, i) => (
        <div key={i} style={{fontFamily: ANTON, fontSize: size, lineHeight: 1.08, color: colors[i % colors.length], ...stroke(16), textShadow: '0 10px 24px rgba(0,0,0,.55)'}}>
          {l}
        </div>
      ))}
    </div>
  );
};

export const Tag: React.FC<{text: string; x: number; y: number; from: number; bg?: string; color?: string; size?: number}> = ({
  text,
  x,
  y,
  from,
  bg = '#FFD60A',
  color = '#111',
  size = 46,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from) return null;
  const s = spring({frame: f - from, fps, config: {damping: 10, stiffness: 220}, durationInFrames: 9});
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: bg, color, fontFamily: MONT, fontWeight: 900, fontSize: size, padding: '10px 22px', borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,.45)'}}>
      {text}
    </div>
  );
};

export const BigNumber: React.FC<{text: string; color: string; from: number; top?: number; size?: number}> = ({
  text,
  color,
  from,
  top = 150,
  size = 230,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from) return null;
  const s = spring({frame: f - from, fps, config: {damping: 9, stiffness: 240}, durationInFrames: 10});
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', fontFamily: ANTON, fontSize: size, lineHeight: 1, color, ...stroke(18), transform: `scale(${s})`, textShadow: '0 12px 30px rgba(0,0,0,.5)'}}>
      {text}
    </div>
  );
};

export {stroke};
