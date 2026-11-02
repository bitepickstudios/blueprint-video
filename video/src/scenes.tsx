import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, interpolateColors, random, staticFile, useCurrentFrame} from 'remotion';
import {
  Arc, Asteroid, BigNumber, FPS, Fern, Globe, Headline, MONT, SceneProps, Sauropod, Stars, TRex, Tag, Thermo, Volcano,
  clamp, ramp, wordFrame,
} from './art';

const Sfx: React.FC<{at: number; name: string; vol?: number}> = ({at, name, vol = 0.8}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={90}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
  </Sequence>
);

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>{children}</svg>
);

// 1. Gancho: asteroide cayendo sobre un horizonte con dinosaurios.
const S1: React.FC<SceneProps> = ({len}) => {
  const f = useCurrentFrame();
  const ax = interpolate(f, [0, len], [1000, 610]);
  const ay = interpolate(f, [0, len], [430, 980]);
  const ar = interpolate(f, [0, len], [40, 100]);
  const glow = interpolate(f, [0, len], [0.3, 0.95]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#0d0a1f 0%,#2a1338 42%,#7a2a2a 70%,#ff7a2b 100%)'}} />
      <Stars n={90} h={900} />
      <AbsoluteFill style={{background: `radial-gradient(circle at ${ax}px ${ay}px, rgba(255,170,60,${glow * 0.6}) 0, rgba(255,120,40,0) 560px)`}} />
      <Svg>
        <g transform={`translate(${ax},${ay})`}><Asteroid r={ar} angle={125} /></g>
        <Volcano x={190} y={1570} w={440} h={270} fill="#2e1836" />
        <Volcano x={850} y={1585} w={320} h={180} fill="#2e1836" />
        <path d="M0,1560 C200,1530 380,1580 560,1550 C760,1515 900,1560 1080,1540 L1080,1920 L0,1920 Z" fill="#0a0710" />
        <g transform="translate(60,1318) scale(1.08)"><Sauropod /></g>
        <g transform="translate(600,1418) scale(0.6)"><Sauropod /></g>
        <g transform="translate(840,1462) scale(0.36)"><Sauropod /></g>
      </Svg>
      <Headline lines={['¿Y SI EL ASTEROIDE', 'HUBIERA FALLADO?']} />
    </AbsoluteFill>
  );
};

// 2. Impacto en México, hace 66 millones de años.
const S2: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const hit = wordFrame(words, 'choc');
  const ease = {...clamp, easing: Easing.inOut(Easing.cubic)};
  const lon = interpolate(f, [0, hit - 6], [-35, -89.5], ease);
  const lat = interpolate(f, [0, hit - 6], [0, 21.3], ease);
  const size = interpolate(f, [0, len], [1200, 1450]);
  const shake = f >= hit ? 22 * Math.exp(-(f - hit) / 6) : 0;
  const sx = (random(`x${f}`) - 0.5) * 2 * shake;
  const sy = (random(`y${f}`) - 0.5) * 2 * shake;
  const count = Math.round(interpolate(f, [0, 28], [0, 66e6], {...clamp, easing: Easing.out(Easing.cubic)})).toLocaleString('es-ES');
  return (
    <AbsoluteFill style={{background: '#04060d', transform: `translate(${sx}px,${sy}px)`}}>
      <Stars />
      <div style={{position: 'absolute', left: 540 - size / 2, top: 860 - size / 2}}>
        <Globe size={size} lon={lon} lat={lat}>
          {(p) => {
            const [mx, my] = p([-89.5, 21.3]) ?? [0, 0];
            const t = ramp(f, hit - 20, hit);
            const ax = mx - 900 * (1 - t);
            const ay = my - 1100 * (1 - t);
            const k = f - hit;
            return (
              <g>
                {f < hit && <circle cx={mx} cy={my} r={14} fill="#ff3b30" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 3))} />}
                {f >= hit - 20 && f < hit && (
                  <g transform={`translate(${ax},${ay})`}><Asteroid r={34} angle={51} trail={9} /></g>
                )}
                {k >= 0 && (
                  <g>
                    <circle cx={mx} cy={my} r={40 + k * 9} fill="#ffb347" opacity={Math.max(0, 0.9 - k / 40)} />
                    {[0, 6, 12].map((d) => (
                      <circle key={d} cx={mx} cy={my} r={Math.max(0, (k - d) * 26)} fill="none" stroke="#ffd27a" strokeWidth={10} opacity={Math.max(0, 1 - (k - d) / 30)} />
                    ))}
                  </g>
                )}
                {k >= 8 && (
                  <g transform={`translate(${mx + 70},${my - 90})`}>
                    <rect x={0} y={-44} width={290} height={70} rx={10} fill="#FFD60A" />
                    <text x={145} y={6} textAnchor="middle" fontFamily={MONT} fontWeight={900} fontSize={44} fill="#111">MÉXICO</text>
                  </g>
                )}
              </g>
            );
          }}
        </Globe>
      </div>
      {f >= hit && f < hit + 10 && <AbsoluteFill style={{background: '#fff', opacity: 1 - (f - hit) / 10}} />}
      <Headline lines={['HACE', `${count} DE AÑOS`]} top={150} size={96} colors={['#fff', '#FFD60A']} />
      {Array.from({length: 9}, (_, i) => <Sfx key={i} at={i * 3} name="tick" vol={0.35} />)}
      <Sfx at={hit} name="boom" vol={1} />
    </AbsoluteFill>
  );
};

const wavy = (y: number, amp: number, ph: number) => {
  let d = `M0,${y}`;
  for (let x = 0; x <= 1080; x += 40) d += ` L${x},${y + Math.sin(x / 90 + ph) * amp}`;
  return d;
};
const band = (y0: number, y1: number, ph: number) =>
  `${wavy(y0, 14, ph)} L1080,${y1} ${Array.from({length: 28}, (_, i) => {
    const x = 1080 - i * 40;
    return `L${x},${y1 + Math.sin(x / 90 + ph + 1) * 14}`;
  }).join(' ')} Z`;

// 3. Corte del suelo: la capa con petróleo.
const S3: React.FC<SceneProps> = ({words}) => {
  const f = useCurrentFrame();
  const oil = wordFrame(words, 'petrol');
  const layers = [
    {y0: 470, y1: 620, c: '#d6c39b'},
    {y0: 620, y1: 790, c: '#121014'},
    {y0: 790, y1: 950, c: '#b9874f'},
    {y0: 950, y1: 1920, c: '#4d4652'},
  ];
  const pulse = 0.35 + 0.35 * Math.abs(Math.sin(f / 6));
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#2a0d0a 0%,#7a2614 100%)'}}>
      <Svg>
        {layers.map((l, i) => (
          <path key={i} d={band(l.y0, l.y1, i)} fill={l.c} transform={`translate(${interpolate(f, [i * 3, i * 3 + 12], [-1100, 0], {...clamp, easing: Easing.out(Easing.cubic)})},0)`} />
        ))}
        <path d={band(632, 778, 1)} fill="#ff8a2a" opacity={f >= oil ? pulse : 0} style={{mixBlendMode: 'screen'}} />
        {Array.from({length: 10}, (_, i) => {
          const x = 90 + i * 100 + random(`dx${i}`) * 40;
          const y = 790 + ((f * 3 + random(`dy${i}`) * 160) % 160);
          return <ellipse key={i} cx={x} cy={y} rx={9} ry={14} fill="#121014" />;
        })}
        <path d="M290,470 C360,470 400,590 540,590 C680,590 720,470 790,470 Z" fill="#1a0806" />
        <path d="M290,470 C360,470 400,590 540,590 C680,590 720,470 790,470" fill="none" stroke="#ff7a1a" strokeWidth={10} opacity={0.9} />
        {Array.from({length: 18}, (_, i) => {
          const t = (f * 2 + i * 9) % 60;
          return <circle key={i} cx={330 + i * 24 + Math.sin(t / 5 + i) * 10} cy={500 - t * 6} r={18 - t / 4} fill={i % 2 ? '#ffb347' : '#ff5a1a'} opacity={1 - t / 60} />;
        })}
      </Svg>
      <Tag text="ROCAS CON PETRÓLEO" x={540} y={705} from={oil} bg="#ff8a2a" />
      <Sfx at={oil} name="hit" vol={0.7} />
    </AbsoluteFill>
  );
};

// 4. Hollín negro tapando el cielo.
const S4: React.FC<SceneProps> = ({len}) => {
  const f = useCurrentFrame();
  const sunC = interpolateColors(f, [0, len], ['#ffd36b', '#7a1a10']);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#3b0f0a 0%,#a8331a 75%,#ff7a2b 100%)'}}>
      <Svg>
        <defs>
          <filter id="blur"><feGaussianBlur stdDeviation="16" /></filter>
        </defs>
        <circle cx={770} cy={360} r={120} fill={sunC} />
        <circle cx={770} cy={360} r={220} fill={sunC} opacity={ramp(f, 0, len, 0.35, 0)} />
        <g filter="url(#blur)">
          {Array.from({length: 46}, (_, i) => {
            const t = f - i * 1.3;
            if (t < 0) return null;
            const v = 7 + random(`v${i}`) * 7;
            const x = 540 + (random(`x${i}`) - 0.5) * 380 + Math.sin(t / 12 + i) * 40 + t * (random(`d${i}`) - 0.5) * 6;
            const y = 1650 - t * v;
            const r = 70 + t * 3.2;
            return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#0c0a0a' : '#2a2422'} opacity={0.9} />;
          })}
        </g>
        <ellipse cx={540} cy={1700} rx={700} ry={140} fill="#ff6a1a" opacity={0.45 + 0.15 * Math.sin(f / 3)} />
        <path d="M0,1650 L1080,1650 L1080,1920 L0,1920 Z" fill="#0a0606" />
        {Array.from({length: 12}, (_, i) => (
          <rect key={i} x={30 + i * 90} y={1520 + random(`t${i}`) * 60} width={10} height={150} fill="#0a0606" />
        ))}
      </Svg>
      <AbsoluteFill style={{background: '#000', opacity: ramp(f, 0, len, 0, 0.25)}} />
      <Sfx at={0} name="rumble" vol={0.9} />
    </AbsoluteFill>
  );
};

// 5. El planeta se enfría.
const S5: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const cool = wordFrame(words, 'enfri');
  const study = wordFrame(words, 'estudio');
  const lvl = interpolate(f, [cool, cool + 36], [0.82, 0.14], {...clamp, easing: Easing.inOut(Easing.quad)});
  const col = interpolateColors(lvl, [0.14, 0.82], ['#6ec3ff', '#ff4d3d']);
  return (
    <AbsoluteFill style={{background: '#04060d'}}>
      <Stars />
      <div style={{position: 'absolute', left: 430 - 380, top: 820 - 380}}>
        <Globe size={760} lon={-90 + f * 0.4} lat={15} dim={ramp(f, 0, len * 0.55, 0, 0.75)} />
      </div>
      <Svg>
        <g transform="translate(905,330) scale(0.95)"><Thermo level={lvl} color={col} /></g>
      </Svg>
      <Tag text="ESTUDIO 2017 · TOHOKU UNIV." x={540} y={150} from={study} bg="#e9eef5" size={40} />
      {f >= cool + 20 && <Headline lines={['−8 °C a −11 °C']} top={215} size={120} colors={['#8fd3ff']} />}
      {Array.from({length: 10}, (_, i) => <Sfx key={i} at={cool + i * 3} name="tick" vol={0.35} />)}
    </AbsoluteFill>
  );
};

// 6. Cadena alimentaria que se cae.
const Dead: React.FC<{at: number; children: React.ReactNode; x: number; label: string}> = ({at, children, x, label}) => {
  const f = useCurrentFrame();
  const k = ramp(f, at, at + 10);
  return (
    <g transform={`translate(${x},0)`}>
      <g transform={`translate(0,${k * 30}) rotate(${-k * 14} 0 820)`} style={{filter: `grayscale(${k})`}} opacity={1 - k * 0.45}>
        {children}
      </g>
      <text x={0} y={900} textAnchor="middle" fontFamily={MONT} fontWeight={900} fontSize={40} fill="#e9eef5">{label}</text>
      {f >= at && (
        <g stroke="#ff3b30" strokeWidth={22} strokeLinecap="round" transform={`translate(0,700) scale(${Math.min(1, (f - at) / 5)})`}>
          <line x1={-90} y1={-90} x2={90} y2={90} />
          <line x1={90} y1={-90} x2={-90} y2={90} />
        </g>
      )}
    </g>
  );
};

const S6: React.FC<SceneProps> = ({words}) => {
  const f = useCurrentFrame();
  const a = wordFrame(words, 'murieron');
  const b = wordFrame(words, 'comian', 0);
  const c = wordFrame(words, 'esos');
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#0e1724 0%,#26364a 100%)'}}>
      <Svg>
        <path d={`${wavy(1420, 18, 0)} L1080,1920 L0,1920 Z`} fill="#dfe8f2" opacity={ramp(f, 0, a + 20, 0.2, 0.6)} />
        <g transform="translate(540 650) scale(1.06) translate(-540 -720)">
        <Dead at={a} x={200} label="PLANTAS">
          <g transform="translate(-100,560) scale(1)"><Fern fill="#4caf50" /></g>
        </Dead>
        <Dead at={b} x={540} label="HERBÍVOROS">
          <g transform="translate(-145,640) scale(0.72)"><Sauropod fill="#8fae6a" far="#6d8a4f" /></g>
        </Dead>
        <Dead at={c} x={880} label="CARNÍVOROS">
          <g transform="translate(-140,640) scale(0.7)"><TRex fill="#b5774a" far="#8a5634" /></g>
        </Dead>
        {[365, 715].map((x) => (
          <path key={x} d={`M${x - 30},720 L${x + 20},720 M${x + 4},700 L${x + 26},720 L${x + 4},740`} stroke="#e9eef5" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
        ))}
        </g>
        {Array.from({length: 70}, (_, i) => (
          <circle key={i} cx={(random(`sx${i}`) * 1080 + Math.sin(f / 20 + i) * 30) % 1080} cy={(random(`sy${i}`) * 1920 + f * (2 + random(`sv${i}`) * 3)) % 1920} r={2 + random(`sr${i}`) * 4} fill="#fff" opacity={0.7} />
        ))}
      </Svg>
      <Sfx at={a} name="hit" />
      <Sfx at={b} name="hit" />
      <Sfx at={c} name="hit" />
    </AbsoluteFill>
  );
};

// 7 y 8. El 13% y el 87%.
const Ring: React.FC<{red: number; green: number; f: number}> = ({red, green, f}) => (
  <>
    <div style={{position: 'absolute', left: 540 - 300, top: 720 - 300}}>
      <Globe size={600} lon={-100 + f * 0.5} lat={15} />
    </div>
    <Svg>
      <g transform="translate(540,720)">
        <circle r={380} fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={40} />
        <Arc r={380} p0={0} p1={0.13 * red} color="#ff3b30" />
        <Arc r={380} p0={0.13} p1={0.13 + 0.87 * green} color="#34d399" />
      </g>
    </Svg>
  </>
);

const S7: React.FC<SceneProps> = ({words}) => {
  const f = useCurrentFrame();
  const at = wordFrame(words, '13');
  return (
    <AbsoluteFill style={{background: '#04060d'}}>
      <Stars />
      <Ring red={ramp(f, at, at + 15)} green={0} f={f} />
      <BigNumber text="13%" color="#ff3b30" from={at} top={110} />
      <Sfx at={at - 54} name="riser" vol={0.6} />
      <Sfx at={at} name="hit" vol={0.9} />
    </AbsoluteFill>
  );
};

const S8: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const at = wordFrame(words, '87');
  const ext = wordFrame(words, 'extinc');
  return (
    <AbsoluteFill style={{background: '#04060d'}}>
      <Stars />
      <Ring red={1} green={ramp(f, at, at + 24)} f={f + 200} />
      <BigNumber text="87%" color="#34d399" from={at} top={110} />
      <Tag text="= SIN EXTINCIÓN" x={540} y={720} from={ext} bg="#34d399" size={52} />
      <Svg>
        <g transform={`translate(${430 + ramp(f, at, len, 0, 40)},${330}) scale(0.5)`} opacity={ramp(f, at + 10, at + 20)}>
          <Sauropod fill="#34d399" far="#22a374" phase={f / 4} />
        </g>
      </Svg>
      <Sfx at={at} name="chime" vol={0.6} />
    </AbsoluteFill>
  );
};

// 9. Hoy: un T-Rex caminando por una avenida.
const S9: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const end = Math.round(words[words.length - 1].e * FPS) + 6;
  const bld = (seed: string, n: number, minH: number, maxH: number, color: string, lit: boolean) =>
    Array.from({length: n}, (_, i) => {
      const w = 90 + random(`${seed}w${i}`) * 90;
      const x = i * (1080 / n) - 20;
      const h = minH + random(`${seed}h${i}`) * (maxH - minH);
      return (
        <g key={i}>
          <rect x={x} y={1500 - h} width={w} height={h} fill={color} />
          {lit &&
            Array.from({length: Math.floor(h / 60)}, (_, r) =>
              Array.from({length: 3}, (_, c) =>
                random(`${seed}${i}${r}${c}`) > 0.55 ? (
                  <rect key={`${r}-${c}`} x={x + 14 + c * (w - 28) / 3} y={1500 - h + 24 + r * 60} width={(w - 28) / 3 - 10} height={26} fill="#ffd27a" opacity={0.75} />
                ) : null,
              ),
            )}
        </g>
      );
    });
  // T-Rex gigante mirando a la izquierda (escala -3.2): la cabeza queda arriba de los subtítulos.
  const tx = interpolate(f, [0, len], [1420, 1300]);
  const rex = `translate(${tx},${1565 - 236 * 3.2}) scale(-3.2,3.2)`;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#1b1035 0%,#5c2a5a 45%,#ff8a4c 78%)'}}>
      <Svg>
        <defs>
          <filter id="rim"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {bld('far', 9, 380, 760, '#4a2a63', false)}
        {bld('near', 7, 100, 240, '#140b22', true)}
        <rect x={0} y={1500} width={1080} height={420} fill="#0b0712" />
        {Array.from({length: 6}, (_, i) => (
          <rect key={i} x={((((i * 220 - f * 14) % 1320) + 1320) % 1320) - 120} y={1690} width={120} height={14} fill="#ffd27a" opacity={0.5} />
        ))}
        <g transform={rex} filter="url(#rim)" opacity={0.85}>
          <TRex fill="#ff9a5c" far="#ff9a5c" phase={f / 4.5} />
        </g>
        <g transform={rex}>
          <TRex fill="#07040c" far="#1a1024" phase={f / 4.5} eye="#ffb347" />
        </g>
        {Array.from({length: 5}, (_, i) => {
          const x = 1100 - ((f * (10 + i * 2) + i * 230) % 1300);
          const y = 1585 + (i % 2) * 40;
          const leg = Math.sin(f / 2 + i) * 10;
          return (
            <g key={i} fill="#05030a">
              <circle cx={x} cy={y - 62} r={11} />
              <rect x={x - 9} y={y - 50} width={18} height={34} rx={6} />
              <line x1={x} y1={y - 18} x2={x - leg} y2={y + 6} stroke="#05030a" strokeWidth={8} strokeLinecap="round" />
              <line x1={x} y1={y - 18} x2={x + leg} y2={y + 6} stroke="#05030a" strokeWidth={8} strokeLinecap="round" />
            </g>
          );
        })}
      </Svg>
      {Array.from({length: Math.ceil(len / 21)}, (_, i) => <Sfx key={i} at={i * 21 + 4} name="step" vol={0.9} />)}
      {f >= end && <Headline lines={['¿QUÉ DINOSAURIO', 'REVIVIRÍAS? 👇']} top={230} size={104} />}
      <Sfx at={end} name="hit" vol={0.7} />
    </AbsoluteFill>
  );
};

export const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];
