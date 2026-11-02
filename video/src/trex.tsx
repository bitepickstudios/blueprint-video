// Video 2 "¿Podrías escapar de un T-Rex?": ilustración 2D dibujada en código (SVG).
import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {ANTON, MONT, stroke} from './art';

type Pt = [number, number];
const deg = Math.PI / 180;
const W = 1080;
const H = 1920;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const poly = (pts: Pt[]) => pts.map((p) => p.join(',')).join(' ');
const affine = (A: Pt, B: Pt, C: Pt, w: number, h: number) =>
  `matrix(${(B[0] - A[0]) / w},${(B[1] - A[1]) / w},${(C[0] - A[0]) / h},${(C[1] - A[1]) / h},${A[0]},${A[1]})`;

// Filtros compartidos (cada <svg> los incluye).
export const FX: React.FC = () => (
  <defs>
    <filter id="b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
    <filter id="b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
    <filter id="b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
    <filter id="mblur" x="-5%" y="0%" width="110%" height="100%"><feGaussianBlur stdDeviation="9 0" /></filter>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.45" /></filter>
  </defs>
);

// ---------- cielo de atardecer ----------
const HAZE = '#f0a07c';
export const Sky: React.FC<{sunY?: number; rays?: boolean}> = ({sunY = 950, rays = true}) => (
  <>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#141c38" />
        <stop offset="0.36" stopColor="#56386e" />
        <stop offset="0.5" stopColor="#c45f72" />
        <stop offset="0.6" stopColor="#ffb37a" />
        <stop offset="1" stopColor="#ffd9a0" />
      </linearGradient>
      <radialGradient id="sun">
        <stop offset="0" stopColor="#fff4cf" stopOpacity="1" />
        <stop offset="0.22" stopColor="#ffd08a" stopOpacity="0.75" />
        <stop offset="1" stopColor="#ff9a6a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffc59a" />
        <stop offset="1" stopColor="#8a4f86" />
      </linearGradient>
      <linearGradient id="ray" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#fff1c8" stopOpacity="0.5" />
        <stop offset="1" stopColor="#fff1c8" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky)" />
    {Array.from({length: 120}, (_, i) => (
      <circle key={i} cx={random(`st${i}`) * W} cy={random(`sy${i}`) * 520} r={0.6 + random(`sr${i}`) * 1.6} fill="#fff" opacity={0.25 + random(`so${i}`) * 0.5 * (1 - random(`sy${i}`))} />
    ))}
    <circle cx={540} cy={sunY} r={560} fill="url(#sun)" />
    {rays &&
      Array.from({length: 9}, (_, i) => {
        const a = (-150 + i * 15 + random(`ra${i}`) * 6) * deg;
        const L = 1100;
        const w = 0.035 + random(`rw${i}`) * 0.03;
        return <polygon key={i} points={poly([[540, sunY], [540 + Math.cos(a - w) * L, sunY + Math.sin(a - w) * L], [540 + Math.cos(a + w) * L, sunY + Math.sin(a + w) * L]])} fill="url(#ray)" opacity={0.35} />;
      })}
    <g filter="url(#b6)">
      {[
        [180, 640, 330, 34],
        [760, 590, 380, 40],
        [420, 520, 260, 26],
        [930, 700, 260, 30],
        [120, 760, 240, 26],
        [620, 770, 300, 22],
      ].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="url(#cloud)" opacity={0.75} />
      ))}
    </g>
    <circle cx={540} cy={sunY} r={66} fill="#fff3d0" />
    {Array.from({length: 5}, (_, i) => {
      const x = 640 + i * 46 + random(`bx${i}`) * 30;
      const y = 470 + random(`by${i}`) * 80;
      return <path key={i} d={`M${x - 12},${y} q6,-7 12,0 q6,-7 12,0`} stroke="#1b1426" strokeWidth={3} fill="none" strokeLinecap="round" />;
    })}
  </>
);

// ---------- calle en perspectiva (un punto de fuga) ----------
const VP: Pt = [540, 980];
const F = 1250;
const EYE = 1.6;
export const P = (X: number, Y: number, Z: number): Pt => [VP[0] + (F * X) / Z, VP[1] + (F * (EYE - Y)) / Z];
const fogT = (Z: number) => Math.min(0.85, Math.max(0, (Z - 8) / 70));

const WALLS = ['#2f8f8a', '#c98a3c', '#c75a6e', '#5b7fb8', '#d7b25a', '#7a5c9e', '#3f9a6b'];
const SIGNS = ['DESPENSA', 'COPETÍN', 'FARMACIA', 'FERRETERÍA', 'PANADERÍA', 'LIBRERÍA', 'MINIMARKET', 'PELUQUERÍA'];
const SIGNC = ['#d64545', '#2e8b57', '#2f6fb3', '#e0a03a', '#7a3fb0', '#1b8a8a'];

const buildings = (side: number) => {
  const out: {z1: number; z2: number; h: number; c: string; seed: string; i: number}[] = [];
  let z = 3;
  let i = 0;
  while (z < 110) {
    const len = 6 + random(`len${side}${i}`) * 7;
    out.push({z1: z, z2: z + len, h: 6 + random(`h${side}${i}`) * 6.5, c: WALLS[(i * 3 + (side > 0 ? 2 : 0)) % WALLS.length], seed: `${side}${i}`, i});
    z += len;
    i++;
  }
  return out.reverse();
};

const Building: React.FC<{b: ReturnType<typeof buildings>[number]; side: number}> = ({b, side}) => {
  const X = side * 6.5;
  const f = fogT(b.z1);
  const c = (col: string) => mix(col, HAZE, f);
  const wall = mix(b.c, '#3a2a48', 0.32);
  const lit = mix(b.c, '#ffd2a0', 0.2);
  const floors = Math.floor(b.h / 3);
  const q = (pts: Pt[], col: string, k: string, o = 1) => <polygon key={k} points={poly(pts)} fill={c(col)} opacity={o} />;
  const els: React.ReactNode[] = [];
  for (let fl = 1; fl < floors; fl++)
    for (let zz = b.z1 + 0.9; zz + 1.3 < b.z2; zz += 2.6) {
      const r = random(`w${b.seed}${fl}${zz}`);
      const on = r > 0.55;
      const y0 = fl * 3 + 1;
      els.push(q([P(X, y0 - 0.1, zz - 0.1), P(X, y0 + 1.5, zz - 0.1), P(X, y0 + 1.5, zz + 1.4), P(X, y0 - 0.1, zz + 1.4)], mix(wall, '#000000', 0.25), `f${fl}${zz}`));
      els.push(q([P(X, y0, zz), P(X, y0 + 1.4, zz), P(X, y0 + 1.4, zz + 1.3), P(X, y0, zz + 1.3)], on ? '#ffd58e' : '#283048', `w${fl}${zz}`));
      if (on) els.push(q([P(X, y0, zz), P(X, y0 + 1.4, zz), P(X, y0 + 1.4, zz + 0.5), P(X, y0, zz + 0.5)], '#fff1c8', `wl${fl}${zz}`, 0.5));
      if (random(`b${b.seed}${fl}${zz}`) > 0.62) {
        els.push(q([P(X, y0 - 0.1, zz - 0.2), P(X - side * 0.8, y0 - 0.1, zz - 0.2), P(X - side * 0.8, y0 - 0.1, zz + 1.5), P(X, y0 - 0.1, zz + 1.5)], '#1f1a28', `bal${fl}${zz}`));
        els.push(q([P(X - side * 0.8, y0 - 0.1, zz - 0.2), P(X - side * 0.8, y0 + 0.6, zz - 0.2), P(X - side * 0.8, y0 + 0.6, zz + 1.5), P(X - side * 0.8, y0 - 0.1, zz + 1.5)], '#1f1a28', `rail${fl}${zz}`, 0.55));
      } else if (r < 0.25) {
        els.push(q([P(X - side * 0.05, y0 + 0.2, zz + 1.5), P(X - side * 0.5, y0 + 0.2, zz + 1.5), P(X - side * 0.5, y0 + 0.75, zz + 1.5), P(X - side * 0.05, y0 + 0.75, zz + 1.5)], '#c9c6d0', `ac${fl}${zz}`));
        els.push(q([P(X - side * 0.5, y0 + 0.2, zz + 1.5), P(X - side * 0.5, y0 + 0.75, zz + 1.5), P(X - side * 0.5, y0 + 0.75, zz + 2.2), P(X - side * 0.5, y0 + 0.2, zz + 2.2)], '#9a97a6', `acs${fl}${zz}`));
      }
    }
  const shop = random(`s${b.seed}`) > 0.35;
  const sign = SIGNS[(b.i + (side > 0 ? 3 : 0)) % SIGNS.length];
  const sc = SIGNC[(b.i * 2 + (side > 0 ? 1 : 0)) % SIGNC.length];
  const za = b.z1 + 0.6;
  const zb = Math.min(b.z2 - 0.6, za + 4.2);
  const tank = random(`t${b.seed}`) > 0.45;
  const [tx, ty] = P(side * 9.5, b.h, b.z1 + 2.5);
  const tk = F / (b.z1 + 2.5);
  return (
    <g>
      <polygon points={poly([P(X, 0, b.z1), P(X, b.h, b.z1), P(side * 18, b.h, b.z1), P(side * 18, 0, b.z1)])} fill={c(lit)} />
      <polygon points={poly([P(X, 0, b.z1), P(X, b.h, b.z1), P(X, b.h, b.z2), P(X, 0, b.z2)])} fill={c(wall)} />
      <polygon points={poly([P(X, 0, b.z1), P(X, 0.6, b.z1), P(X, 0.6, b.z2), P(X, 0, b.z2)])} fill={c(mix(wall, '#000000', 0.3))} />
      <polygon points={poly([P(X, b.h, b.z1), P(X, b.h + 0.5, b.z1), P(X, b.h + 0.5, b.z2), P(X, b.h, b.z2)])} fill={c(mix(wall, '#000000', 0.35))} />
      {tank && (
        <g>
          <rect x={tx - 0.75 * tk} y={ty - 1.9 * tk} width={1.5 * tk} height={1.6 * tk} rx={0.35 * tk} fill={c('#2f5fae')} />
          <rect x={tx - 0.75 * tk} y={ty - 1.4 * tk} width={1.5 * tk} height={0.08 * tk} fill={c('#1e3f78')} />
          <ellipse cx={tx} cy={ty - 1.9 * tk} rx={0.6 * tk} ry={0.12 * tk} fill={c('#5a86d0')} />
          <rect x={tx - 0.7 * tk} y={ty - 0.3 * tk} width={1.4 * tk} height={0.3 * tk} fill={c('#2a2232')} />
        </g>
      )}
      {els}
      {shop ? (
        <>
          <polygon points={poly([P(X, 0.6, b.z1 + 0.6), P(X, 2.7, b.z1 + 0.6), P(X, 2.7, b.z2 - 0.6), P(X, 0.6, b.z2 - 0.6)])} fill={c('#ffcf8a')} opacity={0.92} />
          {[1.3, 2.0].map((y) => (
            <polygon key={y} points={poly([P(X, y, b.z1 + 0.6), P(X, y + 0.06, b.z1 + 0.6), P(X, y + 0.06, b.z2 - 0.6), P(X, y, b.z2 - 0.6)])} fill={c('#b0703a')} />
          ))}
          <polygon points={poly([P(X, 3.1, b.z1 + 0.3), P(X - side * 1.3, 2.6, b.z1 + 0.3), P(X - side * 1.3, 2.6, b.z2 - 0.3), P(X, 3.1, b.z2 - 0.3)])} fill={c(sc)} />
          <polygon points={poly([P(X - side * 1.3, 2.6, b.z1 + 0.3), P(X - side * 1.3, 2.45, b.z1 + 0.3), P(X - side * 1.3, 2.45, b.z2 - 0.3), P(X - side * 1.3, 2.6, b.z2 - 0.3)])} fill={c(mix(sc, '#000000', 0.3))} />
          <g transform={affine(P(X, 4.1, za), P(X, 4.1, zb), P(X, 3.25, za), 100, 24)}>
            <rect width={100} height={24} fill={c('#f4ecd8')} />
            <rect x={2} y={2} width={96} height={20} fill={c(sc)} />
            <text x={50} y={18} textAnchor="middle" fontFamily={ANTON} fontSize={15} fill={c('#ffffff')}>
              {sign}
            </text>
          </g>
        </>
      ) : (
        <polygon points={poly([P(X, 0, b.z1 + 1.5), P(X, 2.3, b.z1 + 1.5), P(X, 2.3, b.z1 + 2.6), P(X, 0, b.z1 + 2.6)])} fill={c('#4a2e22')} />
      )}
    </g>
  );
};

const Lapacho: React.FC<{X: number; Z: number}> = ({X, Z}) => {
  const [x, y] = P(X, 0, Z);
  const k = F / Z;
  const f = fogT(Z);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={1.3 * k} ry={0.18 * k} fill="#000" opacity={0.25} />
      <path d={`M${x},${y} C${x + 0.1 * k},${y - 1.5 * k} ${x - 0.2 * k},${y - 2.4 * k} ${x + 0.05 * k},${y - 3.3 * k} M${x},${y - 2.2 * k} L${x + 0.6 * k},${y - 3.1 * k}`} stroke={mix('#3a2620', HAZE, f)} strokeWidth={0.26 * k} strokeLinecap="round" fill="none" />
      {Array.from({length: 16}, (_, i) => (
        <circle key={i} cx={x + (random(`lx${X}${Z}${i}`) - 0.5) * 3.6 * k} cy={y - (3.3 + random(`ly${X}${Z}${i}`) * 1.9) * k} r={(0.55 + random(`lr${X}${Z}${i}`) * 0.6) * k} fill={mix(['#e2629f', '#f08cbf', '#c74c8c', '#ffb0d6'][i % 4], HAZE, f)} />
      ))}
    </g>
  );
};

// Auto estacionado, visto de atrás y del costado que da a la calle.
const ParkedCar: React.FC<{Z: number; col: string; X0?: number}> = ({Z, col, X0 = 3.0}) => {
  const f = fogT(Z);
  const c = (k: string) => mix(k, HAZE, f);
  const x1 = X0 + 1.7;
  const z2 = Z + 4.2;
  const k = F / Z;
  const side = X0 > 0 ? X0 : x1;
  const wheel = (zz: number) => {
    const [wx, wy] = P(side, 0.32, zz);
    const kk = F / zz;
    return <ellipse cx={wx} cy={wy} rx={0.12 * kk} ry={0.32 * kk} fill={c('#121016')} />;
  };
  return (
    <g>
      <ellipse cx={P(X0 + 0.85, 0, Z + 2)[0]} cy={P(X0 + 0.85, 0, Z + 2)[1]} rx={1.4 * k} ry={0.12 * k} fill="#000" opacity={0.35} />
      <polygon points={poly([P(side, 0.25, Z), P(side, 1.0, Z), P(side, 1.0, z2), P(side, 0.25, z2)])} fill={c(mix(col, '#000000', 0.35))} />
      <polygon points={poly([P(X0, 1.0, Z), P(x1, 1.0, Z), P(x1, 1.0, z2), P(X0, 1.0, z2)])} fill={c(mix(col, '#ffffff', 0.15))} />
      <polygon points={poly([P(X0 + 0.3, 1.5, Z + 1.6), P(x1 - 0.3, 1.5, Z + 1.6), P(x1 - 0.3, 1.5, Z + 3.0), P(X0 + 0.3, 1.5, Z + 3.0)])} fill={c(col)} />
      <polygon points={poly([P(X0 + 0.15, 1.0, Z + 1.3), P(x1 - 0.15, 1.0, Z + 1.3), P(x1 - 0.3, 1.5, Z + 1.6), P(X0 + 0.3, 1.5, Z + 1.6)])} fill={c('#3a4a66')} />
      <polygon points={poly([P(X0 + 0.15, 1.0, Z + 1.3), P(X0 + 0.5, 1.0, Z + 1.3), P(X0 + 0.55, 1.5, Z + 1.6), P(X0 + 0.3, 1.5, Z + 1.6)])} fill="#ffffff" opacity={0.15} />
      <polygon points={poly([P(X0, 0.25, Z), P(X0, 1.0, Z), P(x1, 1.0, Z), P(x1, 0.25, Z)])} fill={c(col)} />
      {wheel(Z + 0.8)}
      {wheel(Z + 3.4)}
      {[X0 + 0.15, x1 - 0.45].map((x) => (
        <g key={x}>
          <polygon points={poly([P(x, 0.75, Z), P(x, 0.92, Z), P(x + 0.3, 0.92, Z), P(x + 0.3, 0.75, Z)])} fill="#ff4a3a" />
          <circle cx={P(x + 0.15, 0.83, Z)[0]} cy={P(x + 0.15, 0.83, Z)[1]} r={0.35 * k} fill="#ff4a3a" opacity={0.3} filter="url(#b3)" />
        </g>
      ))}
      <polygon points={poly([P(X0 + 0.6, 0.4, Z), P(X0 + 0.6, 0.55, Z), P(x1 - 0.6, 0.55, Z), P(x1 - 0.6, 0.4, Z)])} fill="#e8e4da" />
    </g>
  );
};

const POLES = [6, 17, 28, 39, 50, 61, 72];
const Poles: React.FC<{near: boolean; split: number}> = ({near, split}) => (
  <g>
    {[-1, 1].map((s) =>
      POLES.filter((z) => (near ? z <= split : z > split)).map((z, i) => {
        const X = s * 5.6;
        const top = P(X, 8.2, z);
        const base = P(X, 0, z);
        const w = (F * 0.17) / z;
        const col = mix('#1c1620', HAZE, fogT(z));
        const next = POLES[POLES.indexOf(z) + 1];
        const lw = Math.max(1.2, (F * 0.025) / z);
        return (
          <g key={`${s}${z}`}>
            <line x1={base[0]} y1={base[1]} x2={top[0]} y2={top[1]} stroke={col} strokeWidth={w} />
            <line x1={P(X - 0.6, 7.9, z)[0]} y1={P(X - 0.6, 7.9, z)[1]} x2={P(X + 0.6, 7.9, z)[0]} y2={P(X + 0.6, 7.9, z)[1]} stroke={col} strokeWidth={w * 0.5} />
            {next &&
              [8.0, 7.5, 7.0].map((Y) => {
                const a = P(X, Y, z);
                const b = P(X, Y, next);
                const m = P(X, Y - 0.9, (z + next) / 2);
                return <path key={Y} d={`M${a[0]},${a[1]} Q${m[0]},${m[1] + (m[1] - (a[1] + b[1]) / 2)} ${b[0]},${b[1]}`} fill="none" stroke={col} strokeWidth={lw} />;
              })}
            {s > 0 && (
              <>
                <line x1={top[0]} y1={top[1]} x2={P(3.6, 8.4, z)[0]} y2={P(3.6, 8.4, z)[1]} stroke={col} strokeWidth={w * 0.5} />
                <circle cx={P(3.6, 8.2, z)[0]} cy={P(3.6, 8.2, z)[1]} r={(F * 1.4) / z} fill="url(#lamp)" />
                <ellipse cx={P(3.2, 0, z)[0]} cy={P(3.2, 0, z)[1]} rx={(F * 2.4) / z} ry={(F * 0.5) / z} fill="url(#lamp)" opacity={0.45} />
              </>
            )}
            {s < 0 && i % 2 === 0 && <path d={`M${P(-5.6, 7.8, z).join(',')} Q${P(0, 6.2, z).join(',')} ${P(5.6, 7.8, z).join(',')}`} fill="none" stroke={col} strokeWidth={lw} />}
          </g>
        );
      }),
    )}
  </g>
);

export const PerspStreet: React.FC<{layer: 'back' | 'front'; split?: number}> = ({layer, split = 14}) => {
  if (layer === 'front')
    return (
      <g>
        <ParkedCar Z={7.5} col="#c0392b" />
        <Poles near split={split} />
        <Lapacho X={-5.2} Z={8} />
      </g>
    );
  const far = 220;
  const dash = Array.from({length: 40}, (_, i) => 13 + i * 4).filter((z) => z < 140);
  return (
    <g>
      <defs>
        <radialGradient id="lamp">
          <stop offset="0" stopColor="#fff2c8" stopOpacity="1" />
          <stop offset="0.2" stopColor="#ffd38a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={HAZE} stopOpacity="0" />
          <stop offset="0.5" stopColor={HAZE} stopOpacity="0.5" />
          <stop offset="1" stopColor={HAZE} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a7478" />
          <stop offset="0.22" stopColor="#3e3444" />
          <stop offset="1" stopColor="#221e28" />
        </linearGradient>
      </defs>
      {[-1, 1].map((s) => buildings(s).map((b) => <Building key={`${s}${b.z1}`} b={b} side={s} />))}
      <polygon points={poly([P(-6.5, 0, 2), P(-6.5, 0, far), P(6.5, 0, far), P(6.5, 0, 2)])} fill="#5a4e58" />
      {[-1, 1].map((s) =>
        Array.from({length: 60}, (_, i) => 2.5 + i * 1.3).map((z) => (
          <line key={`${s}${z}`} x1={P(s * 4.35, 0, z)[0]} y1={P(s * 4.35, 0, z)[1]} x2={P(s * 6.5, 0, z)[0]} y2={P(s * 6.5, 0, z)[1]} stroke="#7a6e78" strokeWidth={Math.max(0.6, 30 / z)} opacity={0.5} />
        )),
      )}
      <polygon points={poly([P(-4.2, 0, 2), P(-4.2, 0, far), P(4.2, 0, far), P(4.2, 0, 2)])} fill="url(#road)" />
      {[-4.2, 4.05].map((X, k) => (
        <polygon key={X} points={poly([P(X, 0, 2), P(X, 0, far), P(X + 0.15, 0, far), P(X + 0.15, 0, 2)])} fill={k ? '#e2c14a' : '#d8cfc4'} opacity={0.75} />
      ))}
      {Array.from({length: 7}, (_, i) => -3.6 + i * 1.2).map((x) => (
        <polygon key={x} points={poly([P(x, 0, 6.5), P(x + 0.6, 0, 6.5), P(x + 0.6, 0, 9.5), P(x, 0, 9.5)])} fill="#ece6da" opacity={0.85} />
      ))}
      {dash.map((z) => (
        <polygon key={z} points={poly([P(-0.08, 0, z), P(-0.08, 0, z + 2), P(0.08, 0, z + 2), P(0.08, 0, z)])} fill={mix('#f2d27a', HAZE, fogT(z))} />
      ))}
      <ellipse cx={P(-1.6, 0, 11)[0]} cy={P(-1.6, 0, 11)[1]} rx={(F * 0.45) / 11} ry={(F * 0.08) / 11} fill="#1a1620" />
      {[22, 36, 52].map((z, i) => <Lapacho key={z} X={i % 2 ? 5.1 : -5.1} Z={z} />)}
      <ParkedCar Z={26} col="#2e86de" />
      <ParkedCar Z={20} col="#f1c40f" X0={-4.7} />
      <Poles near={false} split={split} />
      <rect x={0} y={760} width={W} height={440} fill="url(#haze)" />
      {Array.from({length: 40}, (_, i) => (
        <circle key={i} cx={300 + random(`d${i}`) * 480} cy={640 + random(`e${i}`) * 560} r={1 + random(`f${i}`) * 2.2} fill="#fff2c8" opacity={0.25 + random(`g${i}`) * 0.35} />
      ))}
    </g>
  );
};

// ---------- calle de costado (persecución) ----------
export const SideStreet: React.FC<{shift?: number; base?: number; blur?: boolean; day?: boolean; w?: number}> = ({shift = 0, base = 1240, blur = false, day = false, w: SW = W}) => {
  const D = day
    ? {tint: '#ffffff', tintK: 0.06, lit: '#a9d4f0', unlit: '#3a4a66', glass: '#e8f6ff', shopIn: '#f2e6cc', far: mix('#8aa4c8', '#dfeefa', 0.35), haze: '#cfe6ff', shadeTop: '#ffffff', shadeBot: '#203050', shadeBotO: 0.18}
    : {tint: '#3a2a48', tintK: 0.28, lit: '#ffd58e', unlit: '#283048', glass: '#fff1c8', shopIn: '#ffcf8a', far: mix('#4a3a6a', HAZE, 0.45), haze: HAZE, shadeTop: '#ffd2a0', shadeBot: '#1a1030', shadeBotO: 0.35};
  const houses = Array.from({length: 9}, (_, i) => ({w: 230 + random(`hw${i}`) * 130, h: 520 + random(`hh${i}`) * 300, c: WALLS[i % WALLS.length], seed: i}));
  const total = houses.reduce((a, h) => a + h.w, 0);
  let x = -(((shift % total) + total) % total);
  const row: React.ReactNode[] = [];
  for (let rep = 0; rep < 2; rep++)
    houses.forEach((hs) => {
      const x0 = x;
      const top = base - hs.h;
      const wall = mix(hs.c, D.tint, D.tintK);
      const shop = random(`sh${hs.seed}`) > 0.35;
      const sc = SIGNC[hs.seed % SIGNC.length];
      const id = `aw${rep}${hs.seed}`;
      const floors = Math.floor((hs.h - 300) / 170) + 1;
      row.push(
        <g key={`${rep}-${hs.seed}`}>
          <rect x={x0} y={top} width={hs.w} height={hs.h} fill={wall} />
          <rect x={x0} y={top} width={hs.w} height={hs.h} fill="url(#wallShade)" />
          <rect x={x0 + hs.w - 10} y={top} width={10} height={hs.h} fill="#000" opacity={0.18} />
          <rect x={x0 - 6} y={top - 18} width={hs.w + 12} height={22} fill={mix(wall, '#000000', 0.35)} />
          {hs.seed % 2 === 0 && (
            <g>
              <rect x={x0 + hs.w * 0.55} y={top - 98} width={78} height={82} rx={14} fill="#2f5fae" />
              <rect x={x0 + hs.w * 0.55} y={top - 70} width={78} height={6} fill="#1e3f78" />
              <ellipse cx={x0 + hs.w * 0.55 + 39} cy={top - 98} rx={30} ry={6} fill="#5a86d0" />
            </g>
          )}
          {Array.from({length: floors}, (_, r) =>
            [0, 1].map((cc) => {
              const wx = x0 + 30 + cc * (hs.w / 2);
              const wy = top + 50 + r * 170;
              const ww = hs.w / 2 - 60;
              const on = random(`sw${hs.seed}${r}${cc}`) > 0.5;
              const bal = random(`sb${hs.seed}${r}${cc}`) > 0.7;
              const ac = !bal && random(`sa${hs.seed}${r}${cc}`) > 0.75;
              return (
                <g key={`${r}${cc}`}>
                  <rect x={wx - 6} y={wy - 6} width={ww + 12} height={107} fill={mix(wall, '#000000', 0.25)} />
                  <rect x={wx} y={wy} width={ww} height={95} fill={on ? D.lit : D.unlit} />
                  {on && <rect x={wx} y={wy} width={ww * 0.45} height={95} fill={D.glass} opacity={0.45} />}
                  {!on && <rect x={wx} y={wy} width={ww} height={30} fill={['#c75a6e', '#2f8f8a', '#d7b25a'][(r + cc) % 3]} opacity={0.7} />}
                  {[1, 2, 3].map((k) => (
                    <line key={k} x1={wx + (k * ww) / 4} y1={wy} x2={wx + (k * ww) / 4} y2={wy + 95} stroke="#1a1620" strokeWidth={4} />
                  ))}
                  <rect x={wx - 8} y={wy + 95} width={ww + 16} height={10} fill="#1a1620" />
                  {bal && (
                    <g>
                      <rect x={wx - 14} y={wy + 70} width={ww + 28} height={6} fill="#1a1620" />
                      {Array.from({length: 7}, (_, k) => (
                        <rect key={k} x={wx - 12 + (k * (ww + 24)) / 6} y={wy + 70} width={3} height={36} fill="#1a1620" />
                      ))}
                      {[0.2, 0.75].map((t) => (
                        <g key={t}>
                          <rect x={wx + ww * t - 10} y={wy + 52} width={20} height={18} fill="#b5603a" />
                          <circle cx={wx + ww * t} cy={wy + 46} r={14} fill="#3f9a4b" />
                        </g>
                      ))}
                    </g>
                  )}
                  {ac && (
                    <g>
                      <rect x={wx + ww + 8} y={wy + 40} width={56} height={40} fill="#d4d1da" />
                      {[0, 1, 2, 3].map((k) => (
                        <line key={k} x1={wx + ww + 14} y1={wy + 48 + k * 8} x2={wx + ww + 58} y2={wy + 48 + k * 8} stroke="#9a97a6" strokeWidth={2} />
                      ))}
                      <rect x={wx + ww + 8} y={wy + 80} width={56} height={6} fill="#000" opacity={0.25} />
                    </g>
                  )}
                </g>
              );
            }),
          )}
          <rect x={x0} y={base - 40} width={hs.w} height={40} fill={mix(wall, '#000000', 0.3)} />
          {shop ? (
            <g>
              <rect x={x0 + hs.w * 0.1} y={base - 236} width={hs.w * 0.8} height={196} fill={D.shopIn} />
              {[0.45, 0.72].map((t) => (
                <rect key={t} x={x0 + hs.w * 0.1} y={base - 236 + 196 * t} width={hs.w * 0.8} height={7} fill="#b0703a" />
              ))}
              {Array.from({length: 8}, (_, k) => (
                <rect key={k} x={x0 + hs.w * 0.13 + k * hs.w * 0.09} y={base - 236 + 196 * 0.45 - 26} width={hs.w * 0.06} height={26} fill={['#d64545', '#2e8b57', '#2f6fb3', '#e0a03a'][k % 4]} />
              ))}
              <rect x={x0 + hs.w * 0.08} y={base - 330} width={hs.w * 0.84} height={62} rx={6} fill={sc} stroke="#f4ecd8" strokeWidth={5} />
              <text x={x0 + hs.w / 2} y={base - 284} textAnchor="middle" fontFamily={ANTON} fontSize={40} fill="#fff">
                {SIGNS[hs.seed % SIGNS.length]}
              </text>
              <clipPath id={id}>
                <path d={`M${x0 + hs.w * 0.05},${base - 262} L${x0 + hs.w * 0.95},${base - 262} L${x0 + hs.w},${base - 214} L${x0},${base - 214} Z`} />
              </clipPath>
              <g clipPath={`url(#${id})`}>
                {Array.from({length: 12}, (_, k) => (
                  <rect key={k} x={x0 + (k * hs.w) / 11} y={base - 262} width={hs.w / 22} height={50} fill={k % 2 ? '#f4ecd8' : sc} />
                ))}
              </g>
              {Array.from({length: 10}, (_, k) => (
                <circle key={k} cx={x0 + (k + 0.5) * (hs.w / 10)} cy={base - 214} r={hs.w / 20} fill={k % 2 ? '#f4ecd8' : sc} />
              ))}
              <rect x={x0 + hs.w * 0.05} y={base - 205} width={hs.w * 0.9} height={30} fill="#000" opacity={0.18} />
            </g>
          ) : (
            <g>
              <rect x={x0 + hs.w * 0.35} y={base - 230} width={hs.w * 0.3} height={230} fill="#5a3424" />
              <rect x={x0 + hs.w * 0.38} y={base - 215} width={hs.w * 0.24} height={90} fill="none" stroke="#3e2218" strokeWidth={6} />
              <rect x={x0 + hs.w * 0.38} y={base - 110} width={hs.w * 0.24} height={90} fill="none" stroke="#3e2218" strokeWidth={6} />
              <circle cx={x0 + hs.w * 0.59} cy={base - 120} r={6} fill="#e0b050" />
            </g>
          )}
        </g>,
      );
      x += hs.w;
    });
  const props = (
    <g>
      {Array.from({length: 4}, (_, i) => {
        const px = ((((i * 560 + 180 - shift * 1.1) % 2240) + 2240) % 2240) - 300;
        return i % 2 === 0 ? (
          <g key={i}>
            <rect x={px} y={base - 760} width={14} height={760} fill="#1c1620" />
            <path d={`M${px + 7},${base - 750} q60,-20 110,10`} stroke="#1c1620" strokeWidth={10} fill="none" />
            <rect x={px + 98} y={base - 742} width={46} height={18} rx={6} fill="#1c1620" />
            {!day && <circle cx={px + 121} cy={base - 720} r={90} fill="url(#lampS)" />}
          </g>
        ) : (
          <g key={i}>
            <path d={`M${px},${base} C${px + 6},${base - 160} ${px - 14},${base - 260} ${px + 10},${base - 380}`} stroke="#3a2620" strokeWidth={26} fill="none" strokeLinecap="round" />
            {Array.from({length: 22}, (_, k) => (
              <circle key={k} cx={px + (random(`tx${i}${k}`) - 0.5) * 300} cy={base - 380 - random(`ty${i}${k}`) * 180} r={34 + random(`tr${i}${k}`) * 30} fill={['#e2629f', '#f08cbf', '#c74c8c', '#ffb0d6'][k % 4]} />
            ))}
          </g>
        );
      })}
      <g transform={`translate(${((((900 - shift * 1.1) % 2240) + 2240) % 2240) - 300},${base + 6})`}>
        <rect x={0} y={-90} width={64} height={90} rx={8} fill="#2e6b4a" />
        <rect x={-4} y={-98} width={72} height={14} rx={6} fill="#245a3d" />
      </g>
    </g>
  );
  const scene = (
    <g>
      {Array.from({length: Math.ceil(SW / 70)}, (_, i) => {
        const fx = ((((i * 80 - shift * 0.3) % (SW + 200)) + SW + 200) % (SW + 200)) - 100;
        const fh = 260 + random(`fh${i}`) * 320;
        return <rect key={i} x={fx} y={base - 520 - fh + 200} width={70 + random(`fw${i}`) * 40} height={fh + 400} fill={D.far} />;
      })}
      <rect x={0} y={base - 1000} width={SW} height={1000} fill={D.haze} opacity={0.12} />
      {row}
      {props}
      <rect x={0} y={base} width={SW} height={84} fill="#6a5e68" />
      {Array.from({length: 20}, (_, i) => {
        const lx = ((((i * 70 - shift) % (SW + 320)) + SW + 320) % (SW + 320)) - 100;
        return <line key={i} x1={lx} y1={base} x2={lx} y2={base + 74} stroke="#544a54" strokeWidth={3} />;
      })}
      <line x1={0} y1={base + 36} x2={SW} y2={base + 36} stroke="#544a54" strokeWidth={3} />
      {Array.from({length: 12}, (_, i) => (
        <rect key={i} x={((((i * 120 - shift) % (SW + 360)) + SW + 360) % (SW + 360)) - 120} y={base + 74} width={60} height={12} fill={i % 2 ? '#e2c14a' : '#d8d0c4'} />
      ))}
      <rect x={0} y={base + 86} width={SW} height={H - base} fill="#2a2530" />
      {Array.from({length: 14}, (_, i) => (
        <ellipse key={i} cx={((((i * 160 + random(`rx${i}`) * 80 - shift) % 2240) + 2240) % 2240) - 200} cy={base + 140 + random(`ry${i}`) * 500} rx={60 + random(`rr${i}`) * 80} ry={8 + random(`rq${i}`) * 10} fill="#221e27" />
      ))}
      {Array.from({length: 6}, (_, i) => (
        <rect key={i} x={((((i * 260 - shift * 1.6) % (SW + 480)) + SW + 480) % (SW + 480)) - 240} y={base + 270} width={150} height={16} fill="#f2d27a" opacity={0.75} />
      ))}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={D.shadeTop} stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor={D.shadeBot} stopOpacity={D.shadeBotO} />
        </linearGradient>
        <radialGradient id="lampS">
          <stop offset="0" stopColor="#fff2c8" stopOpacity="0.9" />
          <stop offset="0.3" stopColor="#ffd38a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
        </radialGradient>
      </defs>
      {blur ? <g filter="url(#mblur)">{scene}</g> : scene}
    </g>
  );
};

// ---------- T-Rex ilustrado (mira a la izquierda; pies en y≈350) ----------
const BODY =
  'M30,96 C36,86 46,82 58,80 C85,74 105,66 128,62 C140,58 152,58 162,62 C175,66 182,74 192,82 C215,96 240,100 268,94 C305,84 340,72 380,74 C420,76 455,92 490,110 C530,130 565,150 598,166 C565,166 530,166 495,160 C460,156 430,160 405,172 C385,182 372,196 352,206 C320,222 280,226 248,214 C226,206 212,192 204,176 C198,164 186,150 170,140 L150,124 C120,118 80,112 48,110 C40,108 32,104 30,96 Z';
const JAW = 'M150,124 C125,127 95,130 62,132 C55,133 49,138 51,145 C80,150 122,150 170,142 Z';
const THIGH = 'M330,150 C378,138 410,172 402,218 C396,252 366,264 344,252 C318,236 310,190 330,150 Z';
const SHIN = 'M352,238 L382,252 L344,326 L318,318 Z';
const FOOT = 'M316,312 L348,326 L322,344 L300,352 L262,351 L264,339 Z';
const BACK: Pt[] = [[192, 82], [230, 97], [268, 94], [305, 84], [340, 74], [380, 74], [420, 77], [455, 92], [490, 110], [530, 130], [565, 150], [598, 166]];
const backY = (x: number) => {
  for (let i = 0; i < BACK.length - 1; i++) {
    const [x0, y0] = BACK[i];
    const [x1, y1] = BACK[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return BACK[BACK.length - 1][1];
};
const rot = ([x, y]: Pt, a: number, [cx, cy]: Pt): Pt => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};
const BUMPS = BACK.slice(1, -2).flatMap((_, i) => [0, 0.5].map((t) => ({x: BACK[i + 1][0] + (BACK[i + 2][0] - BACK[i + 1][0]) * t, r: 6 - i * 0.35})));

export const REX = {g0: '#2c4624', g1: '#557a35', g2: '#9a9a5c', g3: '#d0c182', l0: '#4a6e2e', l1: '#3b5d27', l2: '#2b461c', f0: '#2c4522', f1: '#1f3218', stripe: '#1e3317', bump: '#2a4220', arm: '#4c6c2f', hi: '#c4e48e', cheek: '#9cc466', line: '#1d2a14'};
export const MAPU: typeof REX = {g0: '#4a2416', g1: '#8a4a2a', g2: '#b07a4e', g3: '#d8b98a', l0: '#7a3f22', l1: '#63321a', l2: '#4a2412', f0: '#4a2614', f1: '#331a0e', stripe: '#2e140a', bump: '#3e1e10', arm: '#7a3f22', hi: '#f0b88a', cheek: '#c88a5a', line: '#2a120a'};
export const TRex2: React.FC<{x: number; y: number; s: number; open?: number; step?: number; id?: string; dim?: number; shadow?: boolean; pal?: typeof REX}> = ({
  x,
  y,
  s,
  open = 0,
  step = 0,
  id = 'r',
  dim = 0,
  shadow = true,
  pal = REX,
}) => {
  const a = Math.sin(step) * 14;
  const jawA = -open * 24;
  const hinge: Pt = [150, 124];
  const chin = rot([54, 142], jawA * deg, hinge);
  const leg = (r: number, far: boolean) => (
    <g transform={`rotate(${r} 355 175)`}>
      <g fill={far ? `url(#${id}farg)` : `url(#${id}leg)`}>
        <path d={THIGH} />
        <path d={SHIN} />
        <path d={FOOT} />
      </g>
      {!far && <ellipse cx={366} cy={182} rx={16} ry={26} fill="#a8cf7a" opacity={0.1} />}
      {!far && <path d="M336,160 C322,190 326,226 346,248" stroke={pal.f1} strokeWidth={4} fill="none" opacity={0.35} />}
      {[[262, 345], [278, 350], [296, 352]].map(([cx, cy], i) => (
        <path key={i} d={`M${cx + 2},${cy - 5} q-12,1 -16,9 q8,-3 16,-2 Z`} fill="#efe3c6" />
      ))}
      <path d="M300,352 L304,342 M282,351 L285,340" stroke={pal.f1} strokeWidth={2.5} opacity={0.5} />
    </g>
  );
  const teeth = (pts: Pt[], dir: 1 | -1) =>
    pts.map(([tx, ty], i) => {
      const L = 8 + (i % 3 === 1 ? 6 : 0) + random(`${id}t${i}${dir}`) * 3;
      return <path key={i} d={`M${tx - 4},${ty} Q${tx - 3},${ty + dir * L * 0.75} ${tx + 1},${ty + dir * L} Q${tx + 3},${ty + dir * L * 0.55} ${tx + 4},${ty} Z`} fill={`url(#${id}tooth)`} />;
    });
  const upper = Array.from({length: 11}, (_, i): Pt => {
    const tx = 54 + i * 9;
    return [tx, 109 + (tx - 52) * 0.15];
  });
  const lower = Array.from({length: 9}, (_, i): Pt => {
    const tx = 66 + i * 9;
    return [tx, 131 - (tx - 64) * 0.07];
  });
  return (
    <g transform={`translate(${x - 330 * s},${y - 350 * s}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.g0} />
          <stop offset="0.45" stopColor={pal.g1} />
          <stop offset="0.78" stopColor={pal.g2} />
          <stop offset="1" stopColor={pal.g3} />
        </linearGradient>
        <linearGradient id={`${id}farg`} gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="360">
          <stop offset="0" stopColor={pal.f0} />
          <stop offset="1" stopColor={pal.f1} />
        </linearGradient>
        <linearGradient id={`${id}leg`} gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="360">
          <stop offset="0" stopColor={pal.l0} />
          <stop offset="0.6" stopColor={pal.l1} />
          <stop offset="1" stopColor={pal.l2} />
        </linearGradient>
        <linearGradient id={`${id}tooth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#d8caa8" />
        </linearGradient>
        <radialGradient id={`${id}eye`} cx="45%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fff07a" />
          <stop offset="0.6" stopColor="#ffb52e" />
          <stop offset="1" stopColor="#d9601a" />
        </radialGradient>
        <linearGradient id={`${id}mouth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a1820" />
          <stop offset="1" stopColor="#2a0608" />
        </linearGradient>
        <pattern id={`${id}sc`} width="12" height="10" patternUnits="userSpaceOnUse">
          <path d="M0,10 Q6,2 12,10" fill="none" stroke="#000" strokeWidth="1.6" opacity="0.16" />
        </pattern>
        <clipPath id={`${id}clip`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {shadow && <ellipse cx={330} cy={356} rx={170} ry={16} fill="#000" opacity={0.32} filter="url(#b6)" />}
      {leg(-a, true)}
      <path d={JAW} transform={`translate(4,-4) rotate(${jawA} 150 124)`} fill="#ffcf8a" opacity={0.9} />
      <path d={BODY} transform="translate(4,-5)" fill="#ffc98a" opacity={0.95} />
      {BUMPS.map((b, i) => (
        <circle key={i} cx={b.x + 4} cy={backY(b.x) - 2} r={b.r} fill="#ffc98a" opacity={0.9} />
      ))}
      <path d={`M150,124 L46,110 L${chin[0]},${chin[1]} Z`} fill={`url(#${id}mouth)`} />
      <g transform={`rotate(${jawA} 150 124)`}>
        <path d={JAW} fill={`url(#${id}g)`} />
        <path d="M150,126 C120,128 92,131 70,133" stroke="#9a2f3a" strokeWidth={5} fill="none" />
        <path d="M144,128 C120,124 96,128 82,134 C100,136 126,136 146,132 Z" fill="#c95a6a" />
        {teeth(lower, -1)}
        <path d="M51,145 C80,150 122,150 170,142" stroke={pal.line} strokeWidth={3} fill="none" opacity={0.4} />
      </g>
      {open > 0.25 &&
        [[84, 0.3], [112, 0.6]].map(([sx, t], i) => {
          const tp: Pt = [sx, 109 + (sx - 52) * 0.15 + 6];
          const bt = rot([sx + 4, 131 - (sx - 60) * 0.07], jawA * deg, hinge);
          return <path key={i} d={`M${tp[0]},${tp[1]} Q${(tp[0] + bt[0]) / 2 + 3},${(tp[1] + bt[1]) / 2 + 10 * t} ${bt[0]},${bt[1]}`} stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.5} />;
        })}
      <path d={BODY} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}clip)`}>
        <rect x={0} y={0} width={600} height={360} fill={`url(#${id}sc)`} />
        {[215, 250, 288, 326, 366, 404, 442, 480, 518, 556].map((sx, i) => {
          const t = backY(sx) - 6;
          const L = 46 * (1 - i * 0.06);
          return <path key={i} d={`M${sx},${t} Q${sx + 12},${t + L * 0.5} ${sx + 4},${t + L} L${sx + 13},${t + L - 2} Q${sx + 21},${t + L * 0.45} ${sx + 13},${t} Z`} fill={pal.stripe} opacity={0.5} />;
        })}
        <path d={BODY} fill="none" stroke="#0e1a08" strokeWidth={44} opacity={0.42} transform="translate(0,18)" filter="url(#b6)" />
        <path d={BODY} fill="none" stroke={pal.hi} strokeWidth={16} opacity={0.32} transform="translate(0,-9)" filter="url(#b3)" />
        <ellipse cx={150} cy={102} rx={24} ry={12} fill={pal.cheek} opacity={0.3} />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${194 + k * 10},${148 + k * 8} q-7,12 2,24`} stroke={pal.f1} strokeWidth={3} fill="none" opacity={0.35} />
        ))}
      </g>
      {BUMPS.map((b, i) => (
        <circle key={`o${i}`} cx={b.x} cy={backY(b.x) + 2} r={b.r - 0.5} fill={pal.bump} />
      ))}
      <path d="M48,110 C80,112 120,118 150,124" stroke="#9a2f3a" strokeWidth={4} fill="none" />
      {teeth(upper, 1)}
      <ellipse cx={140} cy={77} rx={14} ry={11} fill={pal.line} opacity={0.55} />
      <path d="M126,64 L134,53 L146,61 Z" fill={pal.bump} />
      <ellipse cx={140} cy={77} rx={8.5} ry={6.5} fill={`url(#${id}eye)`} />
      <ellipse cx={140} cy={77} rx={2.2} ry={5.6} fill="#111" />
      <circle cx={143} cy={74} r={2} fill="#fff" />
      <path d="M128,71 Q140,66 153,72" stroke={pal.line} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <ellipse cx={48} cy={88} rx={4.5} ry={2.6} fill={pal.line} />
      <circle cx={47} cy={87} r={1} fill="#fff" opacity={0.6} />
      <path d="M232,190 C222,200 214,210 208,222 L214,226 C222,214 232,206 242,198 Z" fill={pal.arm} />
      <path d="M208,222 l-8,7 l9,-3 Z M213,226 l-6,8 l9,-5 Z" fill="#efe3c6" />
      {leg(a, false)}
      {dim > 0 && <path d={BODY} fill="#1a1030" opacity={dim} />}
    </g>
  );
};

// ---------- protagonista (estilo plano, mira a la izquierda) ----------
const seg = (a: Pt, ang: number, L: number): Pt => [a[0] + L * Math.sin(ang * deg), a[1] + L * Math.cos(ang * deg)];
const ik = (a: Pt, c: Pt, L1: number, L2: number): Pt => {
  const dx = c[0] - a[0];
  const dy = c[1] - a[1];
  const d = Math.min(L1 + L2 - 0.01, Math.hypot(dx, dy));
  const t = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const base = Math.atan2(dy, dx) + t;
  return [a[0] + L1 * Math.cos(base), a[1] + L1 * Math.sin(base)];
};

const SK = {hood: '#1fa39a', hoodD: '#14756e', hoodL: '#3fc4b8', pant: '#2c3554', pantD: '#1d2438', skin: '#c58c6a', skinD: '#a8714f', hair: '#2b1d16', shoe: '#f4f1ea', sole: '#e94b3c'};

export type Pose = 'run' | 'crouch' | 'bike';
export type Face = 'scared' | 'focus' | 'happy';

export const Head: React.FC<{h: Pt; face: Face}> = ({h, face}) => {
  const [x, y] = h;
  return (
    <g>
      <circle cx={x + 12} cy={y + 6} r={8} fill={SK.skinD} />
      <circle cx={x} cy={y} r={34} fill={SK.skin} />
      <path d={`M${x + 4},${y + 30} A34,34 0 0 0 ${x + 30},${y - 14} A40,40 0 0 1 ${x + 4},${y + 30} Z`} fill={SK.skinD} opacity={0.5} />
      <circle cx={x - 34} cy={y + 5} r={6.5} fill={SK.skin} />
      <circle cx={x - 8} cy={y + 12} r={6} fill="#ff8a8a" opacity={0.3} />
      <path
        d={`M${x - 31},${y - 6} C${x - 32},${y - 44} ${x + 32},${y - 48} ${x + 37},${y - 4} C${x + 38},${y + 16} ${x + 24},${y + 22} ${x + 12},${y + 16} C${x + 8},${y - 2} ${x - 4},${y - 12} ${x - 31},${y - 6} Z M${x - 24},${y - 28} l-12,-10 l16,2 Z M${x - 6},${y - 38} l-6,-14 l14,8 Z M${x + 14},${y - 38} l2,-14 l8,12 Z`}
        fill={SK.hair}
      />
      <ellipse cx={x - 18} cy={y - 1} rx={7.5} ry={face === 'scared' ? 8.5 : 6} fill="#fff" />
      <circle cx={x - 21} cy={y} r={face === 'scared' ? 3 : 3.8} fill="#1b1210" />
      <circle cx={x - 22} cy={y - 2} r={1.2} fill="#fff" />
      {face === 'scared' ? (
        <path d={`M${x - 29},${y - 14} Q${x - 20},${y - 22} ${x - 9},${y - 16}`} stroke={SK.hair} strokeWidth={4} fill="none" strokeLinecap="round" />
      ) : (
        <path d={`M${x - 29},${y - 15} L${x - 9},${y - 10}`} stroke={SK.hair} strokeWidth={4.5} strokeLinecap="round" />
      )}
      {face === 'scared' && <ellipse cx={x - 22} cy={y + 18} rx={6} ry={8} fill="#5a1a1e" />}
      {face === 'happy' && <path d={`M${x - 31},${y + 12} Q${x - 22},${y + 24} ${x - 11},${y + 15}`} stroke="#5a1a1e" strokeWidth={4} fill="none" strokeLinecap="round" />}
      {face === 'focus' && <path d={`M${x - 30},${y + 17} L${x - 14},${y + 15}`} stroke="#5a1a1e" strokeWidth={4} strokeLinecap="round" />}
      {face === 'scared' && <path d={`M${x + 22},${y - 22} q4,8 0,12 q-4,-4 0,-12 Z`} fill="#bfe6ff" />}
    </g>
  );
};

export const Guy: React.FC<{x: number; y: number; s: number; pose: Pose; p?: number; face?: Face}> = ({x, y, s, pose, p = 0, face = 'scared'}) => {
  const hip: Pt = [0, 0];
  let torso = 195;
  let legs: [Pt, Pt][] = [];
  let arms: [Pt, Pt][] = [];
  let neck: Pt;
  let bike: React.ReactNode = null;
  const limbs = (th: number, sh: number): [Pt, Pt] => {
    const k = seg(hip, th, 86);
    return [k, seg(k, sh, 86)];
  };
  if (pose === 'run') {
    const sn = Math.sin(p);
    legs = [limbs(-8 + 42 * sn, -8 + 42 * sn + (sn > 0 ? 75 * sn : 12)), limbs(-8 - 42 * sn, -8 - 42 * sn + (sn < 0 ? -75 * sn : 12))];
    neck = seg(hip, torso, 120);
    arms = [
      [seg(neck, 10 - 45 * sn, 66), seg(seg(neck, 10 - 45 * sn, 66), -70 - 45 * sn, 60)],
      [seg(neck, 10 + 45 * sn, 66), seg(seg(neck, 10 + 45 * sn, 66), -70 + 45 * sn, 60)],
    ];
  } else if (pose === 'crouch') {
    torso = 188;
    legs = [limbs(-100, 12), limbs(-92, 18)];
    neck = seg(hip, torso, 115);
    arms = [
      [seg(neck, -35, 66), seg(seg(neck, -35, 66), -105, 60)],
      [seg(neck, -25, 66), seg(seg(neck, -25, 66), -100, 60)],
    ];
  } else {
    torso = 222;
    neck = seg(hip, torso, 120);
    const bb: Pt = [-8, 118];
    legs = [0, Math.PI].map((o) => {
      const pd: Pt = [bb[0] + 40 * Math.cos(p + o), bb[1] + 40 * Math.sin(p + o)];
      return [ik(hip, pd, 86, 86), pd] as [Pt, Pt];
    });
    const bar: Pt = [-150, -60];
    arms = [0, 1].map(() => [ik(neck, bar, 66, 62), bar] as [Pt, Pt]);
    const R: Pt = [70, 150];
    const Fw: Pt = [-175, 150];
    const S: Pt = [8, 14];
    const Hd: Pt = [-140, -40];
    const wheel = (c: Pt) => (
      <g>
        <circle cx={c[0]} cy={c[1]} r={66} fill="none" stroke="#14141c" strokeWidth={13} />
        <circle cx={c[0]} cy={c[1]} r={58} fill="none" stroke="#9aa2b0" strokeWidth={3} />
        {Array.from({length: 8}, (_, i) => {
          const an = p * 0.6 + (i * Math.PI) / 4;
          return <line key={i} x1={c[0]} y1={c[1]} x2={c[0] + 57 * Math.cos(an)} y2={c[1] + 57 * Math.sin(an)} stroke="#cfd6e0" strokeWidth={2} opacity={0.7} />;
        })}
        <circle cx={c[0]} cy={c[1]} r={8} fill="#cfd6e0" />
      </g>
    );
    bike = (
      <g>
        <ellipse cx={-50} cy={222} rx={170} ry={12} fill="#000" opacity={0.3} filter="url(#b6)" />
        {wheel(R)}
        {wheel(Fw)}
        <path d={`M${R.join(',')} L${bb.join(',')} L${S.join(',')} Z M${bb.join(',')} L${Hd.join(',')} L${S.join(',')} M${Hd.join(',')} L${Fw.join(',')}`} fill="none" stroke="#e94b3c" strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
        <path d={`M${R.join(',')} L${bb.join(',')}`} stroke="#14141c" strokeWidth={4} strokeDasharray="4 4" />
        <path d="M-140,-40 L-150,-64 L-128,-70" stroke="#14141c" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={bb[0]} cy={bb[1]} r={16} fill="#14141c" />
        <rect x={-14} y={4} width={52} height={14} rx={7} fill="#14141c" />
      </g>
    );
  }
  const head = seg(neck, torso, 44);
  const L = (a: Pt, b: Pt, c: Pt, col: string, w: number) => (
    <path d={`M${a.join(',')} L${b.join(',')} L${c.join(',')}`} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const shoe = (a: Pt, col: string) => (
    <g>
      <path d={`M${a[0] + 8},${a[1] - 2} L${a[0] - 30},${a[1] + 2}`} stroke={col} strokeWidth={24} strokeLinecap="round" />
      <path d={`M${a[0] + 16},${a[1] + 10} L${a[0] - 40},${a[1] + 12}`} stroke={SK.sole} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
  const cuff = (e: Pt, h: Pt) => {
    const c: Pt = [e[0] + (h[0] - e[0]) * 0.78, e[1] + (h[1] - e[1]) * 0.78];
    return <path d={`M${c.join(',')} L${h.join(',')}`} stroke={SK.hoodD} strokeWidth={22} strokeLinecap="round" />;
  };
  const dx = neck[0] - hip[0];
  const dy = neck[1] - hip[1];
  const len = Math.hypot(dx, dy);
  const sg = -dy / len > 0 ? 1 : -1;
  const back: Pt = [(-dy / len) * sg, (dx / len) * sg];
  const shadeA: Pt = [hip[0] + back[0] * 18, hip[1] + back[1] * 18];
  const shadeB: Pt = [neck[0] + back[0] * 18, neck[1] + back[1] * 18];
  const pocket: Pt = [hip[0] + dx * 0.28 - back[0] * 14, hip[1] + dy * 0.28 - back[1] * 14];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {pose !== 'bike' && <ellipse cx={-10} cy={pose === 'crouch' ? 82 : 176} rx={90} ry={12} fill="#000" opacity={0.3} filter="url(#b6)" />}
      {L(neck, arms[1][0], arms[1][1], SK.hoodD, 24)}
      {cuff(arms[1][0], arms[1][1])}
      <circle cx={arms[1][1][0]} cy={arms[1][1][1]} r={12} fill={SK.skinD} />
      {L(hip, legs[1][0], legs[1][1], SK.pantD, 31)}
      {shoe(legs[1][1], '#d9d4c8')}
      {bike}
      <path d={`M${hip.join(',')} L${neck.join(',')}`} stroke={SK.hood} strokeWidth={66} strokeLinecap="round" />
      <path d={`M${shadeA.join(',')} L${shadeB.join(',')}`} stroke={SK.hoodD} strokeWidth={24} strokeLinecap="round" opacity={0.85} />
      <path d={`M${hip[0] - back[0] * 22},${hip[1] - back[1] * 22} L${neck[0] - back[0] * 22},${neck[1] - back[1] * 22}`} stroke={SK.hoodL} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
      <circle cx={pocket[0]} cy={pocket[1]} r={14} fill={SK.hoodD} opacity={0.7} />
      <circle cx={neck[0] + back[0] * 18} cy={neck[1] + back[1] * 18 - 4} r={25} fill={SK.hoodD} />
      {[-8, 2].map((o) => (
        <path key={o} d={`M${neck[0] - back[0] * 10 + o * 0.3},${neck[1] - back[1] * 10 + 4} l${-back[0] * 2},28`} stroke="#f4f1ea" strokeWidth={3} strokeLinecap="round" />
      ))}
      {L(hip, legs[0][0], legs[0][1], SK.pant, 31)}
      <circle cx={legs[0][0][0]} cy={legs[0][0][1]} r={9} fill="#3a4568" opacity={0.6} />
      {shoe(legs[0][1], SK.shoe)}
      {L(neck, arms[0][0], arms[0][1], SK.hood, 24)}
      {cuff(arms[0][0], arms[0][1])}
      <circle cx={arms[0][1][0]} cy={arms[0][1][1]} r={12} fill={SK.skin} />
      <Head h={head} face={face} />
    </g>
  );
};

// Persona de espaldas (primer plano) con el brazo levantado hacia el celular.
export const BackView: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-180,300 C-170,120 -110,60 0,52 C110,60 170,120 180,300 Z" fill={SK.hood} />
    <path d="M40,60 C110,70 160,120 180,300 L80,300 C90,180 70,100 40,60 Z" fill={SK.hoodD} opacity={0.6} />
    <path d="M-70,80 C-60,10 60,10 70,80 C40,104 -40,104 -70,80 Z" fill={SK.hoodD} />
    <circle cx={0} cy={-14} r={74} fill={SK.hair} />
    <path d="M-50,-60 l-10,-30 l24,18 Z M-10,-80 l0,-30 l18,26 Z M30,-74 l12,-28 l4,32 Z" fill={SK.hair} />
    <ellipse cx={-72} cy={4} rx={12} ry={18} fill={SK.skinD} />
    <ellipse cx={72} cy={4} rx={12} ry={18} fill={SK.skinD} />
    <path d="M-180,300 C-170,120 -110,60 0,52 C110,60 170,120 180,300" fill="none" stroke="#ffcf8a" strokeWidth={6} opacity={0.65} />
    <path d="M-62,-70 C-30,-98 30,-98 62,-70" stroke="#ffcf8a" strokeWidth={6} fill="none" opacity={0.6} />
    <path d="M120,110 C220,60 300,-10 360,-90" stroke={SK.hood} strokeWidth={64} strokeLinecap="round" fill="none" />
    <path d="M130,122 C228,72 306,0 366,-80" stroke={SK.hoodD} strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.6} />
  </g>
);

export const Phone: React.FC<{cx: number; cy: number; w: number; h: number; r?: number; children?: React.ReactNode}> = ({cx, cy, w, h, r = -7, children}) => (
  <g transform={`rotate(${r} ${cx} ${cy})`}>
    <rect x={cx - w / 2 - 10} y={cy - h / 2 - 10} width={w + 20} height={h + 20} rx={34} fill="#111118" filter="url(#drop)" />
    <clipPath id="phoneScreen">
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={26} />
    </clipPath>
    <g clipPath="url(#phoneScreen)">
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="#e88a6a" />
      {children}
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="#fff" opacity={0.06} />
    </g>
    <circle cx={cx - w / 2 + 30} cy={cy - h / 2 + 36} r={9} fill="#ff3030" />
    <text x={cx - w / 2 + 46} y={cy - h / 2 + 45} fontFamily={MONT} fontWeight={900} fontSize={24} fill="#fff">
      REC 0:03
    </text>
    <rect x={cx - 40} y={cy + h / 2 - 22} width={80} height={6} rx={3} fill="#fff" opacity={0.7} />
    <path d={`M${cx + w / 2 + 6},${cy + 30} q40,10 30,90 q-34,-6 -40,-50 Z`} fill={SK.skin} />
    <rect x={cx + w / 2 - 4} y={cy - 30} width={30} height={58} rx={14} fill={SK.skin} />
    <rect x={cx - w / 2 - 26} y={cy - 10} width={30} height={58} rx={14} fill={SK.skinD} />
  </g>
);

// ---------- gráficos ----------
export const Stopwatch: React.FC<{cx: number; cy: number; r: number; p: number; n: string}> = ({cx, cy, r, p, n}) => {
  const C = 2 * Math.PI * (r - 34);
  return (
    <g>
      <defs>
        <radialGradient id="swGlow">
          <stop offset="0" stopColor="#ff3b30" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff3b30" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="swMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2eef8" />
          <stop offset="0.5" stopColor="#a69cbc" />
          <stop offset="1" stopColor="#5a5070" />
        </linearGradient>
        <radialGradient id="swFace" cx="40%" cy="35%">
          <stop offset="0" stopColor="#2c2438" />
          <stop offset="1" stopColor="#0f0b16" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.7} fill="url(#swGlow)" />
      <rect x={cx - 24} y={cy - r - 62} width={48} height={40} rx={8} fill="url(#swMetal)" />
      <rect x={cx - 40} y={cy - r - 78} width={80} height={22} rx={10} fill="url(#swMetal)" />
      <rect x={cx + r * 0.62} y={cy - r * 0.95} width={34} height={44} rx={8} fill="url(#swMetal)" transform={`rotate(40 ${cx + r * 0.62 + 17} ${cy - r * 0.95 + 22})`} />
      <circle cx={cx} cy={cy} r={r} fill="url(#swMetal)" filter="url(#drop)" />
      <circle cx={cx} cy={cy} r={r - 14} fill="url(#swFace)" />
      {Array.from({length: 60}, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const r0 = r - 18;
        const r1 = r0 - (i % 5 === 0 ? 16 : 7);
        return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke="#fff" strokeWidth={i % 5 === 0 ? 4 : 2} opacity={0.55} />;
      })}
      <circle cx={cx} cy={cy} r={r - 40} fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={18} />
      <circle cx={cx} cy={cy} r={r - 40} fill="none" stroke="#ff3b30" strokeWidth={18} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * (r - 40) * p} ${C * 2}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + r * 0.36} textAnchor="middle" fontFamily={ANTON} fontSize={r * 1.0} fill="#fff">
        {n}
      </text>
      <path d={`M${cx - r * 0.55},${cy - r * 0.62} A${r - 20},${r - 20} 0 0 1 ${cx + r * 0.2},${cy - r + 22}`} stroke="#fff" strokeWidth={8} fill="none" opacity={0.18} strokeLinecap="round" />
    </g>
  );
};

export const Icon: React.FC<{k: 'run' | 'door' | 'bike'}> = ({k}) =>
  k === 'run' ? (
    <g stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none">
      <circle cx={8} cy={-26} r={9} fill="#fff" stroke="none" />
      <path d="M4,-14 L-4,10 L-20,26 M-4,10 L12,22 L10,36 M2,-8 L-16,-2 M2,-8 L20,0" />
    </g>
  ) : k === 'door' ? (
    <g>
      <rect x={-22} y={-34} width={44} height={68} rx={4} fill="none" stroke="#fff" strokeWidth={7} />
      <circle cx={10} cy={2} r={4.5} fill="#fff" />
    </g>
  ) : (
    <g stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx={-22} cy={14} r={16} />
      <circle cx={24} cy={14} r={16} />
      <path d="M-22,14 L-4,-8 L16,-8 L24,14 M-4,-8 L4,14 L16,-8 M-8,-16 L2,-16" />
    </g>
  );

export const Choice: React.FC<{y: number; k: 'run' | 'door' | 'bike'; label: string; col: string; letter: string}> = ({y, k, label, col, letter}) => (
  <g transform={`translate(120,${y})`} filter="url(#drop)">
    <defs>
      <linearGradient id={`ch${k}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={mix(col, '#ffffff', 0.25)} />
        <stop offset="1" stopColor={col} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={840} height={140} rx={34} fill="#17121f" opacity={0.92} />
    <rect x={3} y={3} width={834} height={134} rx={32} fill="none" stroke={col} strokeWidth={6} />
    <rect x={14} y={10} width={812} height={46} rx={22} fill="#fff" opacity={0.05} />
    <circle cx={82} cy={70} r={52} fill={`url(#ch${k})`} />
    <g transform="translate(82,70)">
      <Icon k={k} />
    </g>
    <text x={166} y={96} fontFamily={ANTON} fontSize={80} fill="#fff">
      {label}
    </text>
    <circle cx={772} cy={70} r={34} fill="none" stroke={col} strokeWidth={5} />
    <text x={772} y={85} textAnchor="middle" fontFamily={ANTON} fontSize={42} fill={col}>
      {letter}
    </text>
  </g>
);

export const Gauge: React.FC<{cx: number; cy: number; r: number; v: number; max?: number}> = ({cx, cy, r, v, max = 50}) => {
  const ang = (t: number) => Math.PI + (t / max) * Math.PI;
  const pt = (t: number, rr: number): Pt => [cx + rr * Math.cos(ang(t)), cy + rr * Math.sin(ang(t))];
  const arc = (t0: number, t1: number, rr: number) => `M${pt(t0, rr).join(',')} A${rr},${rr} 0 0 1 ${pt(t1, rr).join(',')}`;
  const [nx, ny] = pt(v, r - 46);
  return (
    <g>
      <defs>
        <radialGradient id="gFace" cx="50%" cy="90%" r="90%">
          <stop offset="0" stopColor="#2e2640" />
          <stop offset="1" stopColor="#0f0b16" />
        </radialGradient>
        <linearGradient id="gRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2eef8" />
          <stop offset="1" stopColor="#5a5070" />
        </linearGradient>
      </defs>
      <path d={`M${cx - r - 46},${cy + 34} A${r + 46},${r + 46} 0 0 1 ${cx + r + 46},${cy + 34} Z`} fill="url(#gRim)" filter="url(#drop)" />
      <path d={`M${cx - r - 34},${cy + 26} A${r + 34},${r + 34} 0 0 1 ${cx + r + 34},${cy + 26} Z`} fill="url(#gFace)" />
      <path d={arc(0, 15, r)} stroke="#21b573" strokeWidth={14} fill="none" />
      <path d={arc(15, 30, r)} stroke="#ffd60a" strokeWidth={14} fill="none" />
      <path d={arc(30, 50, r)} stroke="#ff3b30" strokeWidth={14} fill="none" />
      {Array.from({length: 26}, (_, i) => {
        const t = i * 2;
        const big = t % 10 === 0;
        const [x0, y0] = pt(t, r - 14);
        const [x1, y1] = pt(t, r - (big ? 40 : 26));
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeWidth={big ? 5 : 2.5} opacity={0.8} />;
      })}
      {Array.from({length: 6}, (_, i) => {
        const [lx, ly] = pt(i * 10, r - 70);
        return (
          <text key={i} x={lx} y={ly + 11} textAnchor="middle" fontFamily={MONT} fontWeight={800} fontSize={28} fill="#e9e4f0">
            {i * 10}
          </text>
        );
      })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ff3b30" strokeWidth={16} strokeLinecap="round" opacity={0.5} filter="url(#b6)" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ff3b30" strokeWidth={10} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={20} fill="#2a2234" stroke="#ff3b30" strokeWidth={6} />
    </g>
  );
};

export const Bone: React.FC<{x: number; y: number; s: number; crack: number}> = ({x, y, s, crack}) => {
  const half = (side: number) => (
    <g transform={`translate(${side * crack * 26},${crack * 12}) rotate(${side * crack * 18})`}>
      <path d={side < 0 ? 'M-110,-15 L-6,-15 L4,-7 L-8,1 L4,9 L-6,15 L-110,15 Z' : 'M110,-15 L6,-15 L-4,-7 L8,1 L-4,9 L6,15 L110,15 Z'} fill="url(#boneG)" />
      <circle cx={side * 112} cy={-16} r={21} fill="url(#boneG)" />
      <circle cx={side * 112} cy={17} r={21} fill="url(#boneG)" />
      <path d={`M${side * 40},-8 l${side * 14},4 M${side * 70},6 l${side * 10},-6`} stroke="#b8a47a" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs>
        <linearGradient id="boneG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaeb" />
          <stop offset="1" stopColor="#d6c49c" />
        </linearGradient>
      </defs>
      {half(-1)}
      {half(1)}
      {crack > 0 &&
        Array.from({length: 12}, (_, i) => (
          <path key={i} d={`M0,0 l${(random(`sp${i}`) - 0.5) * 14},${4 + random(`sq${i}`) * 10} l6,-3 Z`} fill="#efe3c6" transform={`translate(${(random(`cr${i}`) - 0.5) * 90 * crack},${10 + random(`cy${i}`) * 70 * crack}) rotate(${random(`ct${i}`) * 360})`} />
        ))}
    </g>
  );
};

export const Burst: React.FC<{cx: number; cy: number; r: number; text: string; rotate?: number}> = ({cx, cy, r, text, rotate = -9}) => {
  const pts: Pt[] = Array.from({length: 36}, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const rr = i % 2 ? r * (0.68 + random(`bu${i}`) * 0.08) : r * (1 + random(`bv${i}`) * 0.12);
    return [cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.8];
  });
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <polygon points={poly(pts)} fill="#d32f2f" transform="translate(10,12)" />
      <polygon points={poly(pts)} fill="#FFD60A" stroke="#1a0608" strokeWidth={8} strokeLinejoin="round" />
      <text x={cx} y={cy + r * 0.27} textAnchor="middle" fontFamily={ANTON} fontSize={r * 0.78} fill="#d32f2f" stroke="#1a0608" strokeWidth={6} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

export const Radial: React.FC<{cx: number; cy: number; a: string; b: string; n?: number}> = ({cx, cy, a, b, n = 40}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const R = 2400;
      return <polygon key={i} points={poly([[cx, cy], [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R]])} fill={i % 2 ? a : b} />;
    })}
  </g>
);

export const StaticCap: React.FC<{words: string[]; hi: number; top?: number}> = ({words, hi, top = 1330}) => (
  <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center'}}>
    {words.map((w, i) => (
      <span key={i} style={{display: 'inline-block', margin: '0 12px', fontFamily: MONT, fontWeight: 900, fontSize: 96, lineHeight: 1.1, color: i === hi ? '#FFD60A' : '#fff', textShadow: '0 8px 20px rgba(0,0,0,.6)', ...stroke(16)}}>
        {w}
      </span>
    ))}
  </div>
);

export const Title: React.FC<{lines: string[]; top?: number; size?: number; colors?: string[]}> = ({lines, top = 170, size = 104, colors = ['#fff', '#FFD60A']}) => (
  <div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center'}}>
    {lines.map((l, i) => (
      <div key={i} style={{fontFamily: ANTON, fontSize: size, lineHeight: 1.08, color: colors[i % colors.length], ...stroke(16), textShadow: '0 10px 24px rgba(0,0,0,.55)'}}>
        {l}
      </div>
    ))}
  </div>
);

export const Pill: React.FC<{text: string; y: number; bg: string; color?: string; size?: number}> = ({text, y, bg, color = '#111', size = 58}) => (
  <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{background: bg, color, fontFamily: MONT, fontWeight: 900, fontSize: size, padding: '12px 30px', borderRadius: 14, boxShadow: '0 12px 30px rgba(0,0,0,.45), inset 0 -6px 0 rgba(0,0,0,.18)'}}>{text}</div>
  </div>
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.12}}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 7} />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Gradación de color final: sombras frías arriba, luz cálida abajo, viñeta.
export const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,20,90,.22) 0%, rgba(0,0,0,0) 40%, rgba(255,150,80,.10) 100%)', mixBlendMode: 'soft-light'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(10,4,20,.55) 100%)'}} />
  </>
);
export const Vignette = Grade;
