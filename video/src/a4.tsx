// Video 3 "Argentinosaurio": capas dibujadas en código para armar y animar en After Effects.
import React from 'react';
import {AbsoluteFill, Freeze, random, useCurrentFrame} from 'remotion';
import {geoGraticule10, geoMercator, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-50m.json';
import {ANTON, MONT, Tag, stroke} from './art';
import {FX, Grade, Head, Icon, MAPU, Pill, SideStreet, Sky, StaticCap, TRex2, Title, mix} from './trex';
import layers from '../public/04/layers.json';

type Pt = [number, number];
const W = 1080;
const H = 1920;
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute'}}>
    <FX />
    {children}
  </svg>
);

// ---------- cielo de mañana ----------
const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <g fill="#ffffff">
      <circle cx={-80} cy={0} r={46} />
      <circle cx={-20} cy={-30} r={62} />
      <circle cx={50} cy={-14} r={52} />
      <circle cx={110} cy={6} r={38} />
      <rect x={-124} y={0} width={270} height={34} rx={17} />
    </g>
    <path d="M-124,22 C-60,40 60,40 146,22 L146,30 C146,40 136,44 126,44 L-108,44 C-118,44 -124,38 -124,30 Z" fill="#c4d8ee" />
  </g>
);

export const SkyDay: React.FC<{sunX?: number; sunY?: number}> = ({sunX = 860, sunY = 430}) => (
  <>
    <defs>
      <linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b86d0" />
        <stop offset="0.42" stopColor="#8fc6ee" />
        <stop offset="0.66" stopColor="#ffe3bd" />
        <stop offset="1" stopColor="#ffd3a2" />
      </linearGradient>
      <radialGradient id="sunD">
        <stop offset="0" stopColor="#fffbe8" stopOpacity="1" />
        <stop offset="0.3" stopColor="#fff0c0" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffe0a0" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#skyD)" />
    <circle cx={sunX} cy={sunY} r={400} fill="url(#sunD)" />
    <circle cx={sunX} cy={sunY} r={58} fill="#fffbe8" />
    <Cloud x={230} y={440} s={1} />
    <Cloud x={690} y={300} s={0.7} />
    <Cloud x={1000} y={600} s={0.8} />
    <Cloud x={430} y={660} s={0.5} />
    {Array.from({length: 4}, (_, i) => {
      const x = 560 + i * 44 + random(`bdx${i}`) * 30;
      const y = 520 + random(`bdy${i}`) * 70;
      return <path key={i} d={`M${x - 12},${y} q6,-7 12,0 q6,-7 12,0`} stroke="#2a3a5a" strokeWidth={3} fill="none" strokeLinecap="round" />;
    })}
  </>
);

// ---------- Argentinosaurio (mira a la izquierda; pies en y≈582) ----------
const SNECK = 'M480,232 C410,182 280,102 150,60 C126,52 102,56 94,70 C90,84 100,96 122,100 C232,140 330,232 420,342 C440,322 470,282 480,232 Z';
const SHEAD = 'M104,54 C84,40 54,42 36,54 C24,62 20,74 26,84 C40,94 72,94 98,88 C114,84 126,74 122,64 C118,58 110,56 104,54 Z';
const SBODY = 'M420,330 C410,260 450,215 520,205 C580,196 640,200 700,214 C760,228 790,270 785,320 C780,380 740,420 680,430 C600,442 500,440 450,420 C430,400 422,370 420,330 Z';
const STAIL = 'M690,212 C790,222 880,290 940,370 C962,400 984,440 1000,470 C968,456 930,430 890,398 C840,360 790,350 745,410 L700,300 Z';
const SC = {g0: '#4e5a38', g1: '#6c7a48', g2: '#95976a', g3: '#cbc197', leg0: '#66734a', leg1: '#4a5634', far: '#3b4529', spot: '#3a4428', hi: '#e4f0b0', line: '#262e18'};

export const Sauropod2: React.FC<{x: number; y: number; s: number; step?: number; neck?: number; tail?: number; id?: string; shadow?: boolean}> = ({
  x,
  y,
  s,
  step = 0,
  neck = 0,
  tail = 0,
  id = 'sp',
  shadow = true,
}) => {
  const nT = `rotate(${neck} 450 270)`;
  const tT = `rotate(${tail} 700 240)`;
  const leg = (lx: number, w: number, top: number, ph: number, far: boolean) => {
    const a = Math.sin(step + ph) * 9;
    const d = `M${lx},${top} L${lx + w},${top} L${lx + w - 6},560 C${lx + w - 4},574 ${lx + w + 8},582 ${lx + w + 10},582 L${lx - 10},582 C${lx - 8},582 ${lx + 4},574 ${lx + 6},560 Z`;
    return (
      <g transform={`rotate(${a} ${lx + w / 2} ${top})`}>
        <path d={d} fill={far ? SC.far : `url(#${id}leg)`} />
        {!far && <path d={`M${lx + w * 0.68},${top + 24} L${lx + w * 0.62},556`} stroke={SC.line} strokeWidth={4} opacity={0.22} />}
        {!far && <path d={`M${lx + 8},${top + 30} L${lx + 12},550`} stroke={SC.hi} strokeWidth={6} opacity={0.18} />}
        {[0, 1, 2].map((k) => (
          <ellipse key={k} cx={lx - 4 + k * 15} cy={578} rx={7} ry={4} fill="#e9dfc4" opacity={far ? 0.45 : 0.9} />
        ))}
      </g>
    );
  };
  const bob = -Math.abs(Math.sin(step)) * 4;
  const spots = Array.from({length: 22}, (_, i) => {
    const t = random(`spt${i}`);
    const px = 440 + t * 520;
    const py = px < 700 ? 215 - (px - 440) * 0.02 + random(`spy${i}`) * 70 : 214 + (px - 700) * 0.7 + random(`spy${i}`) * 50;
    return <ellipse key={i} cx={px} cy={py} rx={10 + random(`spr${i}`) * 14} ry={6 + random(`spq${i}`) * 7} fill={SC.spot} opacity={0.32} />;
  });
  const nspots = Array.from({length: 10}, (_, i) => {
    const t = i / 9;
    return <ellipse key={i} cx={150 + t * 300} cy={82 + t * 150 + random(`nsy${i}`) * 16} rx={9 - t * 2 + 8 * t} ry={5 + t * 4} fill={SC.spot} opacity={0.3} />;
  });
  return (
    <g transform={`translate(${x - 600 * s},${y - 582 * s}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="470">
          <stop offset="0" stopColor={SC.g0} />
          <stop offset="0.45" stopColor={SC.g1} />
          <stop offset="0.78" stopColor={SC.g2} />
          <stop offset="1" stopColor={SC.g3} />
        </linearGradient>
        <linearGradient id={`${id}leg`} gradientUnits="userSpaceOnUse" x1="0" y1="330" x2="0" y2="582">
          <stop offset="0" stopColor={SC.leg0} />
          <stop offset="1" stopColor={SC.leg1} />
        </linearGradient>
        <pattern id={`${id}sc`} width="14" height="11" patternUnits="userSpaceOnUse">
          <path d="M0,11 Q7,2 14,11" fill="none" stroke="#000" strokeWidth="1.6" opacity="0.14" />
        </pattern>
        <clipPath id={`${id}clip`}>
          <path d={SBODY} />
          <path d={STAIL} transform={tT} />
          <path d={SNECK} transform={nT} />
          <path d={SHEAD} transform={nT} />
        </clipPath>
      </defs>
      {shadow && <ellipse cx={600} cy={588} rx={330} ry={18} fill="#000" opacity={0.28} filter="url(#b6)" />}
      {leg(500, 64, 360, Math.PI, true)}
      {leg(705, 74, 360, 0, true)}
      <g transform={`translate(0,${bob})`}>
        <g fill="#fff3c8" opacity={0.85} transform="translate(5,-6)">
          <path d={STAIL} transform={tT} />
          <path d={SBODY} />
          <path d={SNECK} transform={nT} />
          <path d={SHEAD} transform={nT} />
        </g>
        <path d={STAIL} transform={tT} fill={`url(#${id}g)`} />
        <path d={SBODY} fill={`url(#${id}g)`} />
        <g transform={nT}>
          <path d={SNECK} fill={`url(#${id}g)`} />
          <path d={SHEAD} fill={`url(#${id}g)`} />
        </g>
        <g clipPath={`url(#${id}clip)`}>
          <rect x={0} y={0} width={1000} height={600} fill={`url(#${id}sc)`} />
          <g transform={tT}>{spots.slice(11)}</g>
          {spots.slice(0, 11)}
          <g transform={nT}>{nspots}</g>
          <path d={SBODY} fill="none" stroke="#0e1408" strokeWidth={54} opacity={0.38} transform="translate(0,24)" filter="url(#b6)" />
          <path d={STAIL} fill="none" stroke="#0e1408" strokeWidth={36} opacity={0.32} transform={`${tT} translate(0,16)`} filter="url(#b6)" />
          <path d={SNECK} fill="none" stroke="#0e1408" strokeWidth={30} opacity={0.32} transform={`${nT} translate(0,14)`} filter="url(#b6)" />
          <path d={SBODY} fill="none" stroke={SC.hi} strokeWidth={18} opacity={0.28} transform="translate(0,-10)" filter="url(#b3)" />
          <path d={SNECK} fill="none" stroke={SC.hi} strokeWidth={12} opacity={0.26} transform={`${nT} translate(0,-7)`} filter="url(#b3)" />
        </g>
        <g transform={nT}>
          {Array.from({length: 6}, (_, k) => {
            const t = 0.15 + k * 0.13;
            const px = 122 + t * 298;
            const py = 100 + t * 242;
            return <path key={k} d={`M${px},${py} q8,-10 18,-4`} stroke={SC.line} strokeWidth={3} fill="none" opacity={0.3} />;
          })}
          <ellipse cx={58} cy={62} rx={9} ry={7} fill={SC.line} opacity={0.4} />
          <circle cx={58} cy={62} r={5.5} fill="#f6e7b0" />
          <circle cx={57} cy={62} r={3.2} fill="#141008" />
          <circle cx={56} cy={60.5} r={1.2} fill="#fff" />
          <path d="M48,54 Q58,50 68,55" stroke={SC.line} strokeWidth={3} fill="none" strokeLinecap="round" />
          <ellipse cx={30} cy={66} rx={4} ry={2.4} fill={SC.line} />
          <path d="M26,82 Q52,92 86,88" stroke={SC.line} strokeWidth={3} fill="none" opacity={0.6} />
          <ellipse cx={80} cy={76} rx={14} ry={7} fill="#b9c08a" opacity={0.35} />
        </g>
      </g>
      {leg(438, 74, 350, 0, false)}
      {leg(640, 86, 350, Math.PI, false)}
    </g>
  );
};

// ---------- colectivo (mira a la izquierda; ruedas apoyan en y=300) ----------
export const Bus: React.FC<{x: number; y: number; s: number; line: string; c1: string; c2: string}> = ({x, y, s, line, c1, c2}) => (
  <g transform={`translate(${x - 380 * s},${y - 300 * s}) scale(${s})`}>
    <ellipse cx={380} cy={300} rx={400} ry={14} fill="#000" opacity={0.3} filter="url(#b6)" />
    <path d="M30,40 Q30,20 62,20 L728,20 Q760,20 760,50 L760,250 L0,250 L0,104 Q0,44 30,40 Z" fill="#f4f1ea" />
    <rect x={30} y={12} width={700} height={14} rx={6} fill="#d8d4cc" />
    <rect x={0} y={168} width={760} height={32} fill={c1} />
    <rect x={0} y={206} width={760} height={14} fill={c2} />
    <rect x={0} y={228} width={760} height={24} fill="#2a2a33" />
    <path d="M6,64 L64,42 L64,164 L6,164 Z" fill="#2b3a52" />
    <path d="M14,70 L36,62 L18,150 L10,150 Z" fill="#ffffff" opacity={0.25} />
    <rect x={76} y={26} width={170} height={22} rx={4} fill="#111" />
    <text x={161} y={44} textAnchor="middle" fontFamily={ANTON} fontSize={19} fill="#ffb020">
      {`${line} · CENTRO`}
    </text>
    {Array.from({length: 7}, (_, i) => {
      const wx = 130 + i * 88;
      return (
        <g key={i}>
          <rect x={wx} y={58} width={78} height={92} rx={8} fill="#2b3a52" />
          <path d={`M${wx + 6},${150} L${wx + 40},${60} L${wx + 58},${60} L${wx + 24},${150} Z`} fill="#ffffff" opacity={0.16} />
        </g>
      );
    })}
    <rect x={72} y={58} width={50} height={186} rx={4} fill="#22314a" />
    <line x1={97} y1={60} x2={97} y2={242} stroke="#f4f1ea" strokeWidth={3} />
    <rect x={570} y={58} width={50} height={186} rx={4} fill="#22314a" />
    <line x1={595} y1={60} x2={595} y2={242} stroke="#f4f1ea" strokeWidth={3} />
    <text x={330} y={194} textAnchor="middle" fontFamily={ANTON} fontSize={30} fill="#fff">
      {`LÍNEA ${line}`}
    </text>
    {[150, 650].map((cx) => (
      <g key={cx}>
        <path d={`M${cx - 58},252 A58,58 0 0 1 ${cx + 58},252 Z`} fill="#1a1a22" />
        <circle cx={cx} cy={262} r={42} fill="#1b1b22" />
        <circle cx={cx} cy={262} r={20} fill="#c9cdd6" />
        <circle cx={cx} cy={262} r={7} fill="#7a7f8a" />
      </g>
    ))}
    <rect x={2} y={204} width={16} height={14} rx={3} fill="#fff6c8" />
    <path d="M6,66 L-16,60 L-18,82" stroke="#222" strokeWidth={5} fill="none" />
    <rect x={-26} y={78} width={14} height={26} rx={4} fill="#222" />
  </g>
);

// ---------- elefante (ícono, mira a la izquierda) ----------
const Elephant: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[46, 60, 84, 98].map((lx, i) => (
      <rect key={lx} x={lx} y={64} width={13} height={30} rx={5} fill={i % 2 ? '#6b717e' : '#808796'} />
    ))}
    <ellipse cx={74} cy={52} rx={44} ry={30} fill="#8d93a0" />
    <circle cx={30} cy={40} r={22} fill="#8d93a0" />
    <ellipse cx={44} cy={42} rx={14} ry={19} fill="#6b717e" />
    <path d="M12,46 C2,62 4,80 14,88" stroke="#8d93a0" strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M20,54 l-10,6" stroke="#f4ecd8" strokeWidth={4} strokeLinecap="round" />
    <circle cx={24} cy={34} r={2.6} fill="#1d1d24" />
    <path d="M118,50 q10,8 6,20" stroke="#6b717e" strokeWidth={3} fill="none" />
  </g>
);

// ---------- araucaria ----------
const Araucaria: React.FC<{x: number; y: number; s: number; dark?: string}> = ({x, y, s, dark}) => {
  const trunk = dark ?? '#4a3226';
  const leaf = dark ?? '#2f5a34';
  const leaf2 = dark ?? '#3f7040';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-14,0 L-8,-760 L8,-760 L14,0 Z" fill={trunk} />
      {Array.from({length: 6}, (_, i) => {
        const yy = -520 - i * 46;
        const w = 230 - i * 22;
        return (
          <g key={i}>
            {[-1, 1].map((d) => (
              <g key={d}>
                <path d={`M0,${yy} Q${d * w * 0.5},${yy - 30} ${d * w},${yy + 10}`} stroke={trunk} strokeWidth={8} fill="none" />
                <ellipse cx={d * w} cy={yy + 4} rx={40 - i * 3} ry={22} fill={i % 2 ? leaf : leaf2} />
                <ellipse cx={d * w * 0.6} cy={yy - 12} rx={34 - i * 3} ry={18} fill={i % 2 ? leaf2 : leaf} />
              </g>
            ))}
          </g>
        );
      })}
      <ellipse cx={0} cy={-800} rx={60} ry={30} fill={leaf2} />
    </g>
  );
};

const Fern: React.FC<{x: number; y: number; s: number; c?: string; flip?: boolean}> = ({x, y, s, c = '#1c3a20', flip}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} fill={c} stroke={c}>
    {[-50, -20, 10, 40].map((a, k) => (
      <g key={k} transform={`rotate(${a})`}>
        <path d="M0,0 C-10,-120 10,-220 0,-300" fill="none" strokeWidth={8} />
        {Array.from({length: 9}, (_, i) => (
          <g key={i}>
            <ellipse cx={-26} cy={-40 - i * 28} rx={30 - i * 2.5} ry={9} transform={`rotate(-28 -26 ${-40 - i * 28})`} />
            <ellipse cx={26} cy={-40 - i * 28} rx={30 - i * 2.5} ry={9} transform={`rotate(28 26 ${-40 - i * 28})`} />
          </g>
        ))}
      </g>
    ))}
  </g>
);

const CamIcon: React.FC = () => (
  <g fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round">
    <rect x={-32} y={-18} width={64} height={44} rx={9} />
    <path d="M-14,-18 L-8,-30 L8,-30 L14,-18" />
    <circle cx={0} cy={4} r={13} />
  </g>
);

const CTA: React.FC = () => (
  <div style={{position: 'absolute', top: 720, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 22, background: 'linear-gradient(180deg,#ffe24a,#ffc800)', borderRadius: 28, padding: '22px 36px', boxShadow: '0 18px 50px rgba(0,0,0,.55), inset 0 -8px 0 rgba(0,0,0,.15)'}}>
      <svg width={120} height={120} viewBox="0 0 24 24">
        <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#111" />
        <circle cx="8" cy="11" r="1.4" fill="#FFD60A" />
        <circle cx="12" cy="11" r="1.4" fill="#FFD60A" />
        <circle cx="16" cy="11" r="1.4" fill="#FFD60A" />
      </svg>
      <div style={{fontFamily: MONT, fontWeight: 900, color: '#111', lineHeight: 1}}>
        <div style={{fontSize: 60}}>COMENTA</div>
        <div style={{fontFamily: ANTON, fontSize: 150}}>«VIDEO»</div>
      </div>
    </div>
  </div>
);

// ---------- mapa de Sudamérica ----------
const COUNTRIES = feature(world as any, (world as any).objects.countries) as any;
const proj = geoMercator().fitExtent(
  [
    [90, 360],
    [990, 1250],
  ],
  {type: 'MultiPoint', coordinates: [[-82, 13], [-34, -56]]} as any,
);
const gpath = geoPath(proj);
const PY = proj([-58.2, -23.4]) as Pt;
const NQ = proj([-69.2, -38.9]) as Pt;

// ---------- capas por escena ----------
type LayerFn = () => React.ReactElement;
const S: Record<string, Record<string, LayerFn>> = {
  s1: {
    bg: () => (
      <Svg>
        <SkyDay />
        <g transform="translate(0,630) scale(0.5)">
          <SideStreet base={1240} day w={2160} shift={260} />
        </g>
        <rect x={0} y={1290} width={W} height={630} fill="#2a2530" />
        {Array.from({length: 5}, (_, i) => (
          <rect key={i} x={i * 260 - 40} y={1480} width={150} height={14} fill="#f2d27a" opacity={0.75} />
        ))}
      </Svg>
    ),
    dino: () => (
      <Svg>
        <Sauropod2 x={600} y={1372} s={1.05} step={0.6} neck={4} id="s1d" />
      </Svg>
    ),
    buses: () => (
      <Svg>
        <Bus x={200} y={1440} s={0.45} line="30" c1="#d64545" c2="#2f6fb3" />
        <Bus x={545} y={1440} s={0.45} line="27" c1="#2e8b57" c2="#e0a03a" />
        <Bus x={890} y={1440} s={0.45} line="15" c1="#2f6fb3" c2="#d64545" />
      </Svg>
    ),
    measure: () => (
      <AbsoluteFill>
        <Svg>
          {[
            [770, 40, 1050],
            [1462, 29, 1061],
          ].map(([y, a, b], i) => (
            <g key={i} stroke="#fff" strokeWidth={6} strokeLinecap="round">
              <line x1={a} y1={y} x2={b} y2={y} strokeDasharray={i ? '0' : '18 12'} />
              <line x1={a} y1={y - 22} x2={a} y2={y + 22} />
              <line x1={b} y1={y - 22} x2={b} y2={y + 22} />
            </g>
          ))}
        </Svg>
        <Tag text="ARGENTINOSAURIO" x={545} y={770} from={0} bg="#21b573" color="#fff" size={44} />
        <Tag text="= 3 COLECTIVOS" x={545} y={1462} from={0} bg="#FFD60A" size={48} />
      </AbsoluteFill>
    ),
    title: () => <Title lines={['¿UN DINOSAURIO', 'EN TU CUADRA?']} top={120} />,
    cap: () => <StaticCap words={['TRES', 'COLECTIVOS']} hi={1} top={1540} />,
  },
  s2: {
    bg: () => (
      <Svg>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="45%" r="75%">
            <stop offset="0" stopColor="#1d4a78" />
            <stop offset="1" stopColor="#0a1a30" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#ocean)" />
        <path d={gpath(geoGraticule10()) ?? ''} fill="none" stroke="#8fc6ee" strokeOpacity={0.12} strokeWidth={1.5} />
      </Svg>
    ),
    map: () => (
      <Svg>
        <g filter="url(#drop)">
          {COUNTRIES.features.map((f: any) => (
            <path key={f.id ?? f.properties.name} d={gpath(f) ?? ''} fill={f.id === '600' ? '#FFD60A' : f.id === '032' ? '#7fa38a' : '#4f7a68'} stroke="#24433a" strokeWidth={1.6} />
          ))}
        </g>
      </Svg>
    ),
    pin: () => (
      <AbsoluteFill>
        <Svg>
          <path d={`M${PY[0]},${PY[1]} Q${(PY[0] + NQ[0]) / 2 + 160},${(PY[1] + NQ[1]) / 2} ${NQ[0]},${NQ[1]}`} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="14 12" strokeLinecap="round" />
          <circle cx={NQ[0]} cy={NQ[1]} r={46} fill="#ff3b30" opacity={0.25} />
          <circle cx={NQ[0]} cy={NQ[1]} r={16} fill="#ff3b30" stroke="#fff" strokeWidth={5} />
          <circle cx={PY[0]} cy={PY[1]} r={12} fill="#111" stroke="#fff" strokeWidth={4} />
          <Sauropod2 x={NQ[0] + 40} y={NQ[1] - 24} s={0.26} id="s2d" shadow={false} />
        </Svg>
        <Tag text="PARAGUAY" x={PY[0] + 150} y={PY[1] - 50} from={0} bg="#111" color="#FFD60A" size={36} />
        <Tag text="PATAGONIA" x={NQ[0] + 210} y={NQ[1] + 60} from={0} bg="#ff3b30" color="#fff" size={40} />
      </AbsoluteFill>
    ),
    title: () => <Title lines={['HACE 95 MILLONES', 'DE AÑOS']} top={120} size={100} />,
    card: () => <Pill text="ARGENTINOSAURIO" y={1190} bg="#21b573" color="#fff" size={64} />,
    cap: () => <StaticCap words={['ARGENTINOSAURIO']} hi={0} />,
  },
  s3: {
    bg: () => (
      <Svg>
        <SkyDay sunX={180} sunY={260} />
        <defs>
          <linearGradient id="wall3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e09a6a" />
            <stop offset="1" stopColor="#b86e48" />
          </linearGradient>
        </defs>
        <rect x={0} y={380} width={W} height={H - 380} fill="url(#wall3)" />
        {Array.from({length: 40}, (_, i) => (
          <ellipse key={i} cx={random(`wx${i}`) * W} cy={420 + random(`wy${i}`) * 1300} rx={20 + random(`wr${i}`) * 50} ry={6 + random(`wq${i}`) * 10} fill="#9a5a3a" opacity={0.12} />
        ))}
        <rect x={-10} y={350} width={W + 20} height={40} fill="#8a4f34" />
        <rect x={-10} y={386} width={W + 20} height={10} fill="#000" opacity={0.2} />
        <rect x={320} y={530} width={440} height={380} fill="#3a2a30" />
        <rect x={340} y={550} width={400} height={340} fill="#4a3438" />
        <circle cx={420} cy={600} r={60} fill="#ffcf8a" opacity={0.25} />
        <rect x={360} y={1180} width={360} height={540} fill="#5a3424" />
        <rect x={384} y={1210} width={312} height={230} fill="none" stroke="#3e2218" strokeWidth={10} />
        <rect x={384} y={1470} width={312} height={230} fill="none" stroke="#3e2218" strokeWidth={10} />
        <circle cx={680} cy={1460} r={10} fill="#e0b050" />
        <rect x={60} y={1200} width={220} height={260} fill="#283048" />
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={70 + k * 44} y={1200} width={8} height={260} fill="#1a1620" />
        ))}
        <rect x={800} y={1220} width={150} height={110} fill="#d4d1da" />
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1={812} y1={1236 + k * 18} x2={938} y2={1236 + k * 18} stroke="#9a97a6" strokeWidth={4} />
        ))}
        <rect x={0} y={1720} width={W} height={200} fill="#8a8088" />
        {Array.from({length: 9}, (_, k) => (
          <line key={k} x1={k * 130} y1={1720} x2={k * 130} y2={1920} stroke="#6f6670" strokeWidth={4} />
        ))}
        <path d="M-20,330 Q540,430 1100,320" stroke="#1c1620" strokeWidth={6} fill="none" />
        <path d="M-20,300 Q540,400 1100,290" stroke="#1c1620" strokeWidth={5} fill="none" />
      </Svg>
    ),
    person: () => (
      <Svg>
        <g transform="translate(1040,0) scale(-1,1)">
          <path d="M420,890 C420,800 460,770 520,766 C580,770 620,800 620,890 Z" fill="#1fa39a" />
          <path d="M470,780 C480,760 560,760 570,780 C550,796 490,796 470,780 Z" fill="#14756e" />
          <Head h={[520, 712]} face="scared" />
          <rect x={430} y={810} width={46} height={52} rx={10} fill="#f4f1ea" />
          <path d="M476,824 q16,4 0,22" stroke="#f4f1ea" strokeWidth={6} fill="none" />
          {[0, 1].map((k) => (
            <path key={k} d={`M${442 + k * 16},800 q-8,-14 0,-26`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.6} />
          ))}
          <circle cx={436} cy={846} r={14} fill="#c58c6a" />
        </g>
      </Svg>
    ),
    frame: () => (
      <Svg>
        <rect x={300} y={510} width={480} height={30} fill="#f4ecd8" />
        <rect x={300} y={900} width={480} height={40} fill="#f4ecd8" />
        <rect x={292} y={930} width={496} height={14} fill="#000" opacity={0.2} />
        <rect x={300} y={510} width={24} height={420} fill="#f4ecd8" />
        <rect x={756} y={510} width={24} height={420} fill="#f4ecd8" />
        <path d="M324,540 C380,600 360,760 324,900 Z" fill="#ffd34a" />
        <path d="M756,540 C700,600 720,760 756,900 Z" fill="#ffd34a" />
        <path d="M324,540 C360,600 350,760 324,900" stroke="#d9a820" strokeWidth={6} fill="none" />
        <path d="M756,540 C720,600 730,760 756,900" stroke="#d9a820" strokeWidth={6} fill="none" />
        <rect x={290} y={940} width={500} height={40} fill="#3a2a22" />
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <rect x={330 + k * 140} y={918} width={60} height={28} fill="#b5603a" />
            <circle cx={360 + k * 140} cy={906} r={24} fill={k === 1 ? '#e2629f' : '#3f9a4b'} />
          </g>
        ))}
      </Svg>
    ),
    dino: () => (
      <Svg>
        <Sauropod2 x={2290} y={2232} s={3} neck={-2} id="s3d" shadow={false} />
      </Svg>
    ),
    title: () => <Pill text="¡TE ESPÍA POR LA VENTANA!" y={170} bg="#ff3b30" color="#fff" size={56} />,
    cap: () => <StaticCap words={['SEGUNDO', 'PISO']} hi={1} />,
  },
  s4: {
    bg: () => (
      <Svg>
        <defs>
          <radialGradient id="spot4" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="#fff4e2" />
            <stop offset="1" stopColor="#f2b98a" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#spot4)" />
        <rect x={0} y={1240} width={W} height={680} fill="#e0a070" />
        <ellipse cx={540} cy={1250} rx={420} ry={40} fill="#000" opacity={0.12} filter="url(#b12)" />
      </Svg>
    ),
    base: () => (
      <Svg>
        <path d="M400,1250 L680,1250 L630,1180 L450,1180 Z" fill="#5a4a6a" />
        <rect x={522} y={660} width={36} height={530} fill="#6b5a7e" />
        <rect x={540} y={660} width={18} height={530} fill="#000" opacity={0.15} />
        <path d="M510,665 L540,620 L570,665 Z" fill="#4a3a5a" />
      </Svg>
    ),
    beam: () => (
      <Svg>
        <rect x={130} y={628} width={820} height={26} rx={13} fill="#7a6a8e" />
        <rect x={130} y={628} width={820} height={10} rx={5} fill="#fff" opacity={0.2} />
        <circle cx={540} cy={641} r={22} fill="#ffd60a" stroke="#4a3a5a" strokeWidth={6} />
      </Svg>
    ),
    panL: () => (
      <Svg>
        <path d="M150,640 L20,820 M150,640 L280,820" stroke="#4a3a5a" strokeWidth={5} />
        <Sauropod2 x={150} y={822} s={0.26} id="s4d" shadow={false} />
        <path d="M0,820 L300,820 Q290,860 150,866 Q10,860 0,820 Z" fill="#8a7a9e" />
      </Svg>
    ),
    panR: () => (
      <Svg>
        <path d="M930,640 L800,820 M930,640 L1060,820" stroke="#4a3a5a" strokeWidth={5} />
        {[4, 3, 2, 1].map((n, row) =>
          Array.from({length: n}, (_, i) => <Elephant key={`${row}${i}`} x={930 - (n * 66) / 2 + i * 66 - 4} y={820 - (row + 1) * 54} s={0.55} />),
        )}
        <path d="M780,820 L1080,820 Q1070,860 930,866 Q790,860 780,820 Z" fill="#8a7a9e" />
      </Svg>
    ),
    title: () => <Title lines={['¿CUÁNTO PESABA?']} top={140} size={110} />,
    pill: () => <Pill text="MÁS QUE 10 ELEFANTES" y={1090} bg="#FFD60A" size={60} />,
    cap: () => <StaticCap words={['DIEZ', 'ELEFANTES']} hi={1} />,
  },
  s5: {
    bg: () => (
      <Svg>
        <Sky sunY={1020} rays />
        <path d="M600,1180 L760,880 L800,880 L980,1180 Z" fill="#4a2e3e" />
        <ellipse cx={780} cy={860} rx={70} ry={30} fill="#ff7a2b" opacity={0.5} filter="url(#b6)" />
        {Array.from({length: 7}, (_, i) => (
          <circle key={i} cx={760 + i * 22} cy={820 - i * 50} r={40 + i * 10} fill="#5a3a4a" opacity={0.5 - i * 0.05} filter="url(#b6)" />
        ))}
        {Array.from({length: 7}, (_, i) => (
          <Araucaria key={i} x={60 + i * 170 + random(`ax${i}`) * 60} y={1200} s={0.32 + random(`as${i}`) * 0.12} dark="#3a2a3e" />
        ))}
        <rect x={0} y={1150} width={W} height={120} fill="#f0a07c" opacity={0.35} filter="url(#b12)" />
        <defs>
          <linearGradient id="grass5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a6a30" />
            <stop offset="1" stopColor="#24301a" />
          </linearGradient>
        </defs>
        <rect x={0} y={1190} width={W} height={730} fill="url(#grass5)" />
      </Svg>
    ),
    tree: () => (
      <Svg>
        <Araucaria x={150} y={1500} s={1.05} />
      </Svg>
    ),
    dino: () => (
      <Svg>
        <Sauropod2 x={560} y={1250} s={0.62} neck={14} step={0.3} id="s5d" />
      </Svg>
    ),
    mapu: () => (
      <Svg>
        {[
          [1010, 1200, 0.62],
          [1180, 1260, 0.8],
          [860, 1310, 0.98],
        ].map(([x, y, s], i) => (
          <g key={i}>
            <TRex2 x={x} y={y} s={s} open={0.15 + i * 0.1} step={i} id={`mp${i}`} pal={MAPU} dim={0.35} />
            <circle cx={x - (330 - 140) * s} cy={y - (350 - 77) * s} r={14 * s} fill="#ffb020" opacity={0.6} filter="url(#b3)" />
          </g>
        ))}
      </Svg>
    ),
    fg: () => (
      <Svg>
        <Fern x={40} y={1920} s={1.1} />
        <Fern x={1060} y={1920} s={0.9} flip />
        <Fern x={540} y={1960} s={0.7} c="#162e1a" />
      </Svg>
    ),
    title: () => <Title lines={['EL PELIGRO']} top={140} size={120} colors={['#ff5a3a']} />,
    label: () => <Tag text="MAPUSAURIO" x={780} y={880} from={0} bg="#ff3b30" color="#fff" size={52} />,
    cap: () => <StaticCap words={['CAZABA', 'EN GRUPO']} hi={0} />,
  },
  s6: {
    bg: () => (
      <Svg>
        <SkyDay />
        <SideStreet base={1240} day shift={300} />
      </Svg>
    ),
    dino: () => (
      <Svg>
        <Sauropod2 x={2122} y={2734} s={2.4} id="s6d" shadow={false} />
      </Svg>
    ),
    icons: () => (
      <Svg>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${380 + i * 320},500)`}>
            <circle r={110} fill="#17121f" opacity={0.9} />
            <circle r={96} fill={i ? '#ff6b3d' : '#2f8fe0'} />
            <g transform="scale(2)">{i ? <Icon k="run" /> : <CamIcon />}</g>
            <text y={168} textAnchor="middle" fontFamily={ANTON} fontSize={56} fill="#fff" stroke="#000" strokeWidth={8} paintOrder="stroke">
              {i ? 'CORRES' : 'FOTO'}
            </text>
          </g>
        ))}
      </Svg>
    ),
    title: () => <Title lines={['¿FOTO O CORRES?']} top={150} size={110} />,
    cta: () => <CTA />,
    pill: () => <Pill text="Y TE ENSEÑO A HACER VIDEOS ASÍ" y={1030} bg="#fff" size={44} />,
    arrow: () => (
      <Svg>
        <path d="M820,1060 C930,1110 990,1190 1000,1290" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeDasharray="22 18" />
        <path d="M968,1266 L1002,1312 L1030,1262" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    cap: () => <StaticCap words={['COMENTA', 'VIDEO']} hi={1} />,
  },
};

type LayerDef = string | {name: string; anchor?: number[]; pos?: number[]; rot?: number; blur?: number};
const nameOf = (l: LayerDef) => (typeof l === 'string' ? l : l.name);
export const FLAT = (layers.scenes as {id: string; layers: LayerDef[]}[]).flatMap((sc) => sc.layers.map((l) => [sc.id, nameOf(l)] as const));

// Una capa por frame, fondo transparente (para exportar a After Effects).
export const A4Layers: React.FC = () => {
  const f = useCurrentFrame();
  const [sid, lid] = FLAT[Math.min(f, FLAT.length - 1)];
  const C = S[sid][lid];
  return (
    <AbsoluteFill>
      <Freeze frame={90}>
        <C />
      </Freeze>
    </AbsoluteFill>
  );
};

// Vista previa: todas las capas de una escena apiladas, con las mismas transformaciones que After Effects.
export const A4Preview: React.FC = () => {
  const f = useCurrentFrame();
  const sc = (layers.scenes as {id: string; layers: LayerDef[]}[])[Math.min(f, layers.scenes.length - 1)];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {sc.layers.map((l) => {
        const n = nameOf(l);
        const C = S[sc.id][n];
        const o = typeof l === 'string' ? {} : l;
        const a = o.anchor ?? [540, 960];
        const p = o.pos ?? [540, 960];
        return (
          <AbsoluteFill key={n} style={{transformOrigin: '0 0', transform: `translate(${p[0]}px,${p[1]}px) rotate(${o.rot ?? 0}deg) translate(${-a[0]}px,${-a[1]}px)`, filter: o.blur ? `blur(${o.blur / 2}px) brightness(0.45)` : undefined}}>
            <Freeze frame={90}>
              <C />
            </Freeze>
          </AbsoluteFill>
        );
      })}
      <Grade />
    </AbsoluteFill>
  );
};

export const A4_COUNT = FLAT.length;

// Subtítulos del video completo con fondo transparente (se superponen en After Effects).
import {Sequence} from 'remotion';
import {Captions} from './Short';
import data04 from '../public/04/data.json';
const D4 = data04 as {scenes: {dur: number; words: {w: string; s: number; e: number}[]}[]; extra: number[]};
export const lenA4 = (i: number) => Math.ceil((D4.scenes[i].dur + 0.12 + (D4.extra[i] ?? 0)) * 30);
export const A4_TOTAL = D4.scenes.reduce((a, _, i) => a + lenA4(i), 0);
export const A4Caps: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill>
      {D4.scenes.map((s, i) => {
        const len = lenA4(i);
        const el = (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Captions words={s.words} top={i === 0 ? 1540 : 1330} />
          </Sequence>
        );
        from += len;
        return el;
      })}
    </AbsoluteFill>
  );
};
