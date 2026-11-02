// Storyboard del video 2: un cuadro por escena (frame N = escena N+1).
import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {Bone, BackView, Burst, Choice, FX, Gauge, Grade, Grain, Guy, Icon, P, PerspStreet, Phone, Pill, Radial, SideStreet, Sky, StaticCap, Stopwatch, TRex2, Title} from './trex';
import {ANTON, MONT} from './art';

const W = 1080;
const H = 1920;
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute'}}>
    <FX />
    {children}
  </svg>
);

const StreetScene: React.FC<{open?: number}> = ({open = 0.85}) => (
  <Svg>
    <Sky />
    <PerspStreet layer="back" />
    <TRex2 x={560} y={P(0, 0, 14)[1]} s={1.75} open={open} step={0.6} id="st" />
    <PerspStreet layer="front" />
  </Svg>
);

const Speed: React.FC<{x0: number; x1: number; y0?: number; n?: number}> = ({x0, x1, y0 = 980, n = 9}) => (
  <g>
    {Array.from({length: n}, (_, i) => (
      <line key={i} x1={x0 + (i % 3) * 60} y1={y0 + i * 45} x2={x1 - (i % 2) * 120} y2={y0 + i * 45} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.3} />
    ))}
  </g>
);

const Dust: React.FC<{x: number; y: number; n?: number; s?: number}> = ({x, y, n = 8, s = 1}) => (
  <g filter="url(#b3)">
    {Array.from({length: n}, (_, i) => (
      <circle key={i} cx={x + i * 22 * s + random(`du${x}${i}`) * 20} cy={y - random(`dv${x}${i}`) * 30 * s} r={(14 + random(`dr${x}${i}`) * 18) * s} fill="#b8a8a8" opacity={0.35 - i * 0.03} />
    ))}
  </g>
);

const P1 = () => (
  <AbsoluteFill>
    <StreetScene />
    <Svg>
      <BackView x={200} y={1720} s={1.15} />
      <Phone cx={690} cy={1500} w={230} h={410} r={-6}>
        <rect x={570} y={1290} width={240} height={420} fill="url(#sky)" />
        <rect x={570} y={1560} width={240} height={160} fill="#3e3444" />
        <TRex2 x={760} y={1580} s={0.55} open={0.85} step={0.6} id="ph" shadow={false} />
      </Phone>
    </Svg>
    <Grade />
    <Title lines={['UN T-REX', 'EN TU CALLE']} />
    <StaticCap words={['APARECE', 'EN TU', 'CALLE']} hi={0} top={1150} />
  </AbsoluteFill>
);

const P2 = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{filter: 'blur(10px) brightness(0.42)'}}>
      <StreetScene />
    </AbsoluteFill>
    <Svg>
      <Stopwatch cx={540} cy={480} r={175} p={0.66} n="2" />
      <Choice y={770} k="run" label="CORRER" col="#ff6b3d" letter="A" />
      <Choice y={935} k="door" label="ESCONDERTE" col="#8a6cff" letter="B" />
      <Choice y={1100} k="bike" label="LA BICI" col="#21b573" letter="C" />
    </Svg>
    <Grade />
    <Pill text="¡ELIGE YA!" y={100} bg="#ff3b30" color="#fff" size={64} />
    <StaticCap words={['¡EL TIEMPO', 'CORRE!']} hi={1} top={1290} />
  </AbsoluteFill>
);

const P3 = () => (
  <AbsoluteFill>
    <Svg>
      <Sky sunY={880} rays={false} />
      <SideStreet base={1240} blur />
      <Speed x0={430} x1={1000} />
      <Dust x={1000} y={1450} n={10} s={1.4} />
      <TRex2 x={1150} y={1450} s={2.2} open={0.7} step={0.8} id="p3" />
      <Dust x={380} y={1440} />
      <Guy x={300} y={1240} s={1.2} pose="run" p={1.1} face="scared" />
      <Gauge cx={540} cy={600} r={190} v={20} />
    </Svg>
    <Grade />
    <Title lines={['¿CORRER?']} top={100} size={110} />
    <Pill text="≈ 20 km/h · COMO UNA BICI TRANQUILA" y={685} bg="#FFD60A" size={40} />
    <StaticCap words={['LAS', 'PELÍCULAS', 'TE MINTIERON']} hi={1} />
  </AbsoluteFill>
);

const P4 = () => (
  <AbsoluteFill>
    <Svg>
      <Sky sunY={880} rays={false} />
      <SideStreet base={1240} shift={700} />
      <TRex2 x={1320} y={1450} s={2.4} open={0.15} step={0.2} id="p4" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${545 - i * 6},${820 + i * 22} q-14,10 0,20`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.75} />
      ))}
      <Guy x={330} y={1262} s={1.2} pose="crouch" face="scared" />
      <rect x={80} y={1150} width={490} height={200} fill="#c9a57e" />
      {Array.from({length: 4}, (_, r) =>
        Array.from({length: 7}, (_, c) => (
          <rect key={`${r}${c}`} x={80 + c * 74 + (r % 2 ? 37 : 0) - 37} y={1160 + r * 46} width={70} height={40} fill={['#b98f66', '#c9a57e', '#d4b18a'][(r + c) % 3]} stroke="#9a7a5a" strokeWidth={3} />
        )),
      )}
      <rect x={66} y={1132} width={518} height={26} rx={4} fill="#e2c49a" />
      <rect x={66} y={1152} width={518} height={8} fill="#000" opacity={0.2} />
      <rect x={480} y={1084} width={56} height={50} fill="#b5603a" />
      {[[-18, -18], [0, -34], [20, -16], [-8, -40], [14, -36]].map(([dx, dy], i) => (
        <ellipse key={i} cx={508 + dx} cy={1084 + dy} rx={18} ry={10} fill={i % 2 ? '#3f9a4b' : '#2e7a3a'} transform={`rotate(${dx * 2} ${508 + dx} ${1084 + dy})`} />
      ))}
      {[0, 1, 2].map((i) => (
        <path key={`s${i}`} d={`M${300 + i * 18},${1040 - i * 30} C${380},${960 - i * 40} ${430},${990 - i * 30} ${470},${930 - i * 30} S${530},${870 - i * 25} ${560 + i * 10},${860 - i * 18}`} fill="none" stroke="#bfe6ff" strokeWidth={6} strokeDasharray="3 16" strokeLinecap="round" opacity={0.9} />
      ))}
    </Svg>
    <Grade />
    <Title lines={['¿ESCONDERTE?']} top={100} size={110} />
    <Pill text="TE ENCUENTRA POR EL OLFATO" y={280} bg="#8a6cff" color="#fff" size={46} />
    <StaticCap words={['MALA', 'IDEA']} hi={1} />
  </AbsoluteFill>
);

const P5 = () => (
  <AbsoluteFill>
    <Svg>
      <Sky sunY={880} rays={false} />
      <SideStreet base={1240} shift={1400} blur />
      <Dust x={880} y={1400} n={9} s={0.9} />
      <g opacity={0.9}>
        <TRex2 x={1010} y={1400} s={0.95} open={0.5} step={1.4} id="p5" />
      </g>
      <Speed x0={500} x1={1060} y0={1000} n={10} />
      <Guy x={330} y={1185} s={1.2} pose="bike" p={0.8} face="happy" />
    </Svg>
    <Grade />
    <Title lines={['¿LA BICI?']} top={100} size={110} />
    <Pill text="✓ TU MEJOR OPCIÓN" y={280} bg="#21b573" color="#fff" size={56} />
    <StaticCap words={['LO', 'DEJAS', 'ATRÁS']} hi={1} />
  </AbsoluteFill>
);

const P6 = () => (
  <AbsoluteFill>
    <Svg>
      <Radial cx={540} cy={830} a="#3a0a10" b="#4c1218" n={44} />
      <defs>
        <radialGradient id="p6v" cx="50%" cy="45%" r="70%">
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#0a0204" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#p6v)" />
      <TRex2 x={1552} y={1918} s={4.4} open={0.32} id="p6" shadow={false} />
      <Bone x={520} y={910} s={1.5} crack={0.7} />
      <Burst cx={600} cy={500} r={175} text="¡CRACK!" />
    </Svg>
    <Grade />
    <Title lines={['PERO SI', 'TE ALCANZA…']} top={110} size={100} />
    <StaticCap words={['COMO', 'GALLETAS']} hi={1} />
  </AbsoluteFill>
);

const P7 = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{filter: 'blur(9px) brightness(0.42)'}}>
      <StreetScene open={0.3} />
    </AbsoluteFill>
    <Svg>
      {(['run', 'door', 'bike'] as const).map((k, i) => (
        <g key={k} transform={`translate(${290 + i * 250},480)`}>
          <circle r={96} fill="#17121f" opacity={0.9} />
          <circle r={84} fill={['#ff6b3d', '#8a6cff', '#21b573'][i]} />
          <g transform="scale(1.8)">
            <Icon k={k} />
          </g>
          <text y={150} textAnchor="middle" fontFamily={ANTON} fontSize={48} fill="#fff">
            {['A', 'B', 'C'][i]}
          </text>
        </g>
      ))}
      <path d="M820,1060 C930,1110 990,1190 1000,1290" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeDasharray="22 18" />
      <path d="M968,1266 L1002,1312 L1030,1262" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <TRex2 x={1380} y={2150} s={2.4} open={0.25} id="p7" shadow={false} />
    </Svg>
    <Grade />
    <Title lines={['¿TÚ QUÉ ELIGES?']} top={170} size={110} />
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
    <Pill text="Y TE ENSEÑO A HACER VIDEOS ASÍ" y={1030} bg="#fff" size={44} />
    <StaticCap words={['COMENTA', 'VIDEO']} hi={1} />
  </AbsoluteFill>
);

const PANELS = [P1, P2, P3, P4, P5, P6, P7];

export const Storyboard: React.FC = () => {
  const f = useCurrentFrame();
  const View = PANELS[Math.min(f, PANELS.length - 1)];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <View />
      <Grain />
    </AbsoluteFill>
  );
};
