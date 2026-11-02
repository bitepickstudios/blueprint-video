// Video 2 animado: "¿Podrías escapar de un T-Rex?" (sigue el storyboard aprobado).
import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ANTON, MONT, Word, clamp, ramp, wordFrame} from './art';
import {Captions} from './Short';
import {BackView, Bone, Burst, Choice, FX, Gauge, Grade, Grain, Guy, Icon, P, PerspStreet, Phone, Pill, Radial, SideStreet, Sky, Stopwatch, TRex2, Title} from './trex';

type Scene = {text: string; audio: string; dur: number; words: Word[]};
export type Data3 = {scenes: Scene[]; extra: number[]};
type SP = {words: Word[]; len: number};

const FPS = 30;
const GAP = 0.12;
const W = 1080;
const H = 1920;
const lenOf = (s: Scene, extra: number) => Math.ceil((s.dur + GAP + extra) * FPS);
export const total3 = (d: Data3) => d.scenes.reduce((a, s, i) => a + lenOf(s, d.extra[i] ?? 0), 0);
const easeOut = Easing.out(Easing.cubic);

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute'}}>
    <FX />
    {children}
  </svg>
);

const Sfx: React.FC<{at: number; name: string; vol: number}> = ({at, name, vol}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={120}>
    <Audio src={staticFile(`sfx3/${name}.wav`)} volume={vol} />
  </Sequence>
);

// Aparece con rebote (para textos y botones).
const Pop: React.FC<{from: number; origin?: string; children: React.ReactNode}> = ({from, origin = '50% 50%', children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from) return null;
  const s = spring({frame: f - from, fps, config: {damping: 11, stiffness: 220}});
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: origin}}>{children}</AbsoluteFill>;
};

const Street: React.FC<{open: number; step: number; x?: number; id: string}> = ({open, step, x = 560, id}) => (
  <Svg>
    <Sky />
    <PerspStreet layer="back" />
    <TRex2 x={x} y={P(0, 0, 14)[1]} s={1.75} open={open} step={step} id={id} />
    <PerspStreet layer="front" />
  </Svg>
);

const SpeedLines: React.FC<{off: number; y0?: number; n?: number}> = ({off, y0 = 980, n = 10}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const len = 160 + random(`sl${i}`) * 260;
      const x = ((((random(`sx${i}`) * 1400 - off * (0.8 + random(`sv${i}`) * 0.6)) % 1600) + 1600) % 1600) - 300;
      return <line key={i} x1={x} y1={y0 + i * 45} x2={x + len} y2={y0 + i * 45} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.28} />;
    })}
  </g>
);

const DustTrail: React.FC<{f: number; x: number; y: number; s?: number; every?: number; life?: number}> = ({f, x, y, s = 1, every = 6, life = 26}) => (
  <g filter="url(#b3)">
    {Array.from({length: Math.ceil(life / every) + 1}, (_, i) => {
      const born = Math.floor(f / every) * every - i * every;
      const age = f - born;
      if (age < 0 || age > life) return null;
      const k = age / life;
      return <circle key={born} cx={x + k * 140 * s} cy={y - k * 34 * s} r={(12 + k * 30) * s} fill="#b8a8a8" opacity={0.42 * (1 - k)} />;
    })}
  </g>
);

const Wall: React.FC = () => (
  <g>
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
  </g>
);

// 1. Gancho: el T-Rex en tu calle, vos lo grabás con el celular.
const A1: React.FC<SP> = ({words, len}) => {
  const f = useCurrentFrame();
  const step = f / 4.5;
  const thump = Math.pow(Math.abs(Math.sin(step)), 14);
  const ap = wordFrame(words, 'aparece');
  const open = 0.25 + 0.6 * ramp(f, ap - 4, ap + 6);
  const rise = 1 - easeOut(ramp(f, 0, 16));
  const tx = 610 - f * 0.8;
  return (
    <AbsoluteFill style={{transform: `translateY(${thump * 8}px)`}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.06 * (f / len)})`, transformOrigin: '540px 980px'}}>
        <Street open={open} step={step} x={tx} id="a1" />
      </AbsoluteFill>
      <Svg>
        <g transform={`translate(0,${rise * 420})`}>
          <BackView x={200} y={1720} s={1.15} />
          <Phone cx={690} cy={1500} w={230} h={410} r={-6}>
            <rect x={570} y={1290} width={240} height={420} fill="url(#sky)" />
            <rect x={570} y={1560} width={240} height={160} fill="#3e3444" />
            <TRex2 x={770 - f * 0.4} y={1580} s={0.55} open={open} step={step} id="a1p" shadow={false} />
          </Phone>
        </g>
      </Svg>
      <Grade />
      <Pop from={0} origin="50% 12%">
        <Title lines={['UN T-REX', 'EN TU CALLE']} />
      </Pop>
      {[0, 1, 2, 3, 4].map((k) => (
        <Sfx key={k} at={4.5 * (Math.PI / 2 + k * Math.PI)} name="step" vol={0.25} />
      ))}
      <Sfx at={ap - 3} name="roar" vol={0.22} />
    </AbsoluteFill>
  );
};

// 2. Las tres opciones y el contrarreloj.
const A2: React.FC<SP> = ({words}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ca = wordFrame(words, 'corres');
  const cb = wordFrame(words, 'escondes');
  const cc = wordFrame(words, 'bici');
  const cd0 = Math.round((words[words.length - 1].e + 0.15) * FPS);
  const k = f - cd0;
  const over = k >= 90;
  const p = k < 0 ? 1 : Math.max(0, 1 - k / 90);
  const n = k < 0 ? 3 : Math.max(1, 3 - Math.floor(k / 30));
  const beat = k >= 0 && !over ? 1 + 0.09 * Math.exp(-(k % 30) / 5) : 1;
  const enter = spring({frame: f, fps, config: {damping: 12, stiffness: 180}});
  const slide = (from: number) => (1 - spring({frame: f - from, fps, config: {damping: 13, stiffness: 170}})) * 1100;
  const sh = over ? (random(`t${f}`) - 0.5) * 18 * Math.exp(-(k - 90) / 8) : 0;
  const sc = enter * beat;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(10px) brightness(0.42)', transform: `scale(${1.05 + f * 0.0003})`}}>
        <Street open={0.5 + 0.3 * Math.sin(f / 8)} step={f / 6} id="a2" />
      </AbsoluteFill>
      <Svg>
        {!over && (
          <g transform={`translate(540,480) scale(${sc}) translate(-540,-480)`}>
            <Stopwatch cx={540} cy={480} r={175} p={p} n={String(n)} />
          </g>
        )}
        {f >= ca && (
          <g transform={`translate(${slide(ca) + sh},0)`}>
            <Choice y={770} k="run" label="CORRER" col="#ff6b3d" letter="A" />
          </g>
        )}
        {f >= cb && (
          <g transform={`translate(${slide(cb) - sh},0)`}>
            <Choice y={935} k="door" label="ESCONDERTE" col="#8a6cff" letter="B" />
          </g>
        )}
        {f >= cc && (
          <g transform={`translate(${slide(cc) + sh},0)`}>
            <Choice y={1100} k="bike" label="LA BICI" col="#21b573" letter="C" />
          </g>
        )}
      </Svg>
      {over && f < cd0 + 96 && <AbsoluteFill style={{background: '#fff', opacity: 0.5 * (1 - (k - 90) / 6)}} />}
      <Grade />
      {k >= 0 && !over && (
        <Pop from={cd0} origin="50% 8%">
          <Pill text="¡ELIGE YA!" y={100} bg="#ff3b30" color="#fff" size={64} />
        </Pop>
      )}
      <Pop from={cd0 + 90} origin="50% 25%">
        <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: ANTON, fontSize: 210, color: '#ff3b30', WebkitTextStroke: '18px #000', paintOrder: 'stroke fill', textShadow: '0 14px 40px rgba(0,0,0,.6)'}}>¡TIEMPO!</div>
      </Pop>
      {[ca, cb, cc].map((at, i) => (
        <Sfx key={i} at={at} name="pop" vol={0.15} />
      ))}
      {[0, 30, 60].map((d) => (
        <Sfx key={d} at={cd0 + d} name="tick2" vol={0.5} />
      ))}
      <Sfx at={cd0 + 90} name="buzzer" vol={0.22} />
    </AbsoluteFill>
  );
};

// 3. ¿Correr? Persecución y velocímetro.
const A3: React.FC<SP> = ({words}) => {
  const f = useCurrentFrame();
  const rom = wordFrame(words, 'romperse');
  const bici = wordFrame(words, 'bici');
  const v = f < rom ? 45 * easeOut(ramp(f, 8, 40)) : 45 - 25 * Easing.out(Easing.back(1.8))(ramp(f, rom, rom + 22));
  const p = f * 0.42;
  return (
    <AbsoluteFill>
      <Svg>
        <Sky sunY={880} rays={false} />
        <SideStreet base={1240} shift={f * 16} blur />
        <SpeedLines off={f * 40} />
        <DustTrail f={f} x={1000} y={1450} s={1.5} every={8} />
        <TRex2 x={1150 + Math.sin(f / 18) * 25} y={1450} s={2.2} open={0.55 + 0.25 * Math.sin(f / 7)} step={f * 0.32} id="a3" />
        <DustTrail f={f} x={340} y={1440} />
        <Guy x={300} y={1240 - Math.abs(Math.sin(p)) * 10} s={1.2} pose="run" p={p} face="scared" />
        <Gauge cx={540} cy={600} r={190} v={v} />
      </Svg>
      <Grade />
      <Pop from={0} origin="50% 8%">
        <Title lines={['¿CORRER?']} top={100} size={110} />
      </Pop>
      <Pop from={bici} origin="50% 37%">
        <Pill text="≈ 20 km/h · COMO UNA BICI TRANQUILA" y={685} bg="#FFD60A" size={40} />
      </Pop>
      <Sfx at={rom + 16} name="tick2" vol={0.18} />
      <Sfx at={bici} name="swish" vol={0.12} />
    </AbsoluteFill>
  );
};

// 4. ¿Esconderte? El T-Rex olfatea.
const A4: React.FC<SP> = ({words}) => {
  const f = useCurrentFrame();
  const olf = wordFrame(words, 'olfato');
  const enter = easeOut(ramp(f, 0, 26));
  const rx = 1750 - 430 * enter;
  const sniff = f >= olf - 6 ? Math.sin((f - olf) / 2.2) * 5 : 0;
  const noseX = rx - 720;
  return (
    <AbsoluteFill>
      <Svg>
        <Sky sunY={880} rays={false} />
        <SideStreet base={1240} shift={700} />
        <g transform={`rotate(${sniff * 0.25} ${noseX} 840)`}>
          <TRex2 x={rx} y={1450 + sniff} s={2.4} open={0.12} step={Math.min(f, 26) * 0.18} id="a4" />
        </g>
        {f >= olf &&
          [0, 1, 2].map((i) => (
            <path key={i} d={`M${noseX - 5 - i * 6},${822 + i * 22} q-14,10 0,20`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.4 + 0.4 * Math.abs(Math.sin((f - olf) / 3 + i))} />
          ))}
        <g transform={`translate(${(random(`tr${f}`) - 0.5) * 4},0)`}>
          <Guy x={330} y={1262} s={1.2} pose="crouch" face="scared" />
        </g>
        <Wall />
        {[0, 1, 2].map((i) => (
          <path key={`s${i}`} d={`M${300 + i * 18},${1040 - i * 30} C380,${960 - i * 40} 430,${990 - i * 30} 470,${930 - i * 30} S530,${870 - i * 25} ${noseX + 10 + i * 10},${860 - i * 18}`} fill="none" stroke="#bfe6ff" strokeWidth={6} strokeDasharray="3 16" strokeDashoffset={-f * 2.5} strokeLinecap="round" opacity={ramp(f, olf - 12, olf) * 0.9} />
        ))}
      </Svg>
      <Grade />
      <Pop from={0} origin="50% 8%">
        <Title lines={['¿ESCONDERTE?']} top={100} size={110} />
      </Pop>
      <Pop from={olf} origin="50% 16%">
        <Pill text="TE ENCUENTRA POR EL OLFATO" y={280} bg="#8a6cff" color="#fff" size={46} />
      </Pop>
      <Sfx at={olf} name="sniff" vol={0.3} />
      <Sfx at={olf + 42} name="sniff" vol={0.22} />
    </AbsoluteFill>
  );
};

// 5. ¿La bici? Lo dejás atrás.
const A5: React.FC<SP> = ({words, len}) => {
  const f = useCurrentFrame();
  const mej = wordFrame(words, 'mejor');
  const dej = wordFrame(words, 'dejas');
  const t = f / len;
  const rx = 1010 + 260 * t;
  const rs = 0.95 - 0.3 * t;
  return (
    <AbsoluteFill>
      <Svg>
        <Sky sunY={880} rays={false} />
        <SideStreet base={1240} shift={1400 + f * 24} blur />
        <DustTrail f={f} x={rx - 140 * rs} y={1400 - 30 * t} s={rs} every={7} />
        <g opacity={0.9}>
          <TRex2 x={rx} y={1400 - 30 * t} s={rs} open={0.5} step={f * 0.38} id="a5" />
        </g>
        <SpeedLines off={f * 50} y0={1000} />
        <Guy x={330} y={1185 + Math.sin(f / 3) * 3} s={1.2} pose="bike" p={f * 0.35} face="happy" />
      </Svg>
      <Grade />
      <Pop from={0} origin="50% 8%">
        <Title lines={['¿LA BICI?']} top={100} size={110} />
      </Pop>
      <Pop from={mej} origin="50% 16%">
        <Pill text="✓ TU MEJOR OPCIÓN" y={280} bg="#21b573" color="#fff" size={56} />
      </Pop>
      <Sfx at={dej} name="swish" vol={0.14} />
    </AbsoluteFill>
  );
};

// 6. El giro: la mordida.
const A6: React.FC<SP> = ({words, len}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hu = wordFrame(words, 'huesos');
  const open = f < hu - 5 ? 0.5 + 0.05 * Math.sin(f / 5) : interpolate(f, [hu - 5, hu], [0.5, 0.06], clamp);
  const sh = f >= hu ? 16 * Math.exp(-(f - hu) / 6) : 0;
  const bs = f >= hu ? spring({frame: f - hu, fps, config: {damping: 8, stiffness: 220}}) : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${(random(`a${f}`) - 0.5) * sh}px,${(random(`b${f}`) - 0.5) * sh}px)`}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.08 * (f / len)})`}}>
        <Svg>
          <g transform={`rotate(${f * 0.15} 540 830)`}>
            <Radial cx={540} cy={830} a="#3a0a10" b="#4c1218" n={44} />
          </g>
          <defs>
            <radialGradient id="a6v" cx="50%" cy="45%" r="70%">
              <stop offset="0.3" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#0a0204" stopOpacity="0.85" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#a6v)" />
          <TRex2 x={1552} y={1918} s={4.4} open={open} id="a6" shadow={false} />
          <Bone x={520} y={910} s={1.5} crack={ramp(f, hu, hu + 8, 0, 0.9)} />
          {bs > 0 && (
            <g transform={`translate(600,500) scale(${bs}) translate(-600,-500)`}>
              <Burst cx={600} cy={500} r={175} text="¡CRACK!" />
            </g>
          )}
        </Svg>
      </AbsoluteFill>
      {f >= hu && f < hu + 4 && <AbsoluteFill style={{background: '#fff', opacity: 0.5}} />}
      <Grade />
      <Pop from={0} origin="50% 10%">
        <Title lines={['PERO SI', 'TE ALCANZA…']} top={110} size={100} />
      </Pop>
      <Sfx at={hu} name="crack" vol={0.4} />
      <Sfx at={hu} name="hit" vol={0.15} />
    </AbsoluteFill>
  );
};

// 7. Cierre: ¿Tú qué eliges? + Comenta VIDEO.
const A7: React.FC<SP> = ({words}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const com = wordFrame(words, 'comenta');
  const apr = wordFrame(words, 'aprender');
  const peek = easeOut(ramp(f, 6, 26));
  const pulse = f >= com ? 1 + 0.035 * Math.sin((f - com) / 4) : 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(9px) brightness(0.42)'}}>
        <Street open={0.3} step={f / 6} id="a7s" />
      </AbsoluteFill>
      <Svg>
        {(['run', 'door', 'bike'] as const).map((k, i) => {
          const s = spring({frame: f - i * 5, fps, config: {damping: 10, stiffness: 200}});
          return (
            <g key={k} transform={`translate(${290 + i * 250},480) scale(${s})`}>
              <circle r={96} fill="#17121f" opacity={0.9} />
              <circle r={84} fill={['#ff6b3d', '#8a6cff', '#21b573'][i]} />
              <g transform="scale(1.8)">
                <Icon k={k} />
              </g>
              <text y={150} textAnchor="middle" fontFamily={ANTON} fontSize={48} fill="#fff">
                {['A', 'B', 'C'][i]}
              </text>
            </g>
          );
        })}
        {f >= com + 8 && (
          <g opacity={ramp(f, com + 8, com + 16)}>
            <path d="M820,1060 C930,1110 990,1190 1000,1290" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeDasharray="22 18" strokeDashoffset={-(f - com) * 3} />
            <path d="M968,1266 L1002,1312 L1030,1262" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        <TRex2 x={1380} y={2150 + (1 - peek) * 380} s={2.4} open={0.25 + 0.1 * Math.sin(f / 10)} id="a7" shadow={false} />
      </Svg>
      <Grade />
      <Pop from={0} origin="50% 12%">
        <Title lines={['¿TÚ QUÉ ELIGES?']} top={170} size={110} />
      </Pop>
      <Pop from={com} origin="50% 45%">
        <div style={{position: 'absolute', top: 720, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pulse})`}}>
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
      </Pop>
      <Pop from={apr} origin="50% 55%">
        <Pill text="Y TE ENSEÑO A HACER VIDEOS ASÍ" y={1030} bg="#fff" size={44} />
      </Pop>
      {[0, 5, 10].map((d) => (
        <Sfx key={d} at={d} name="pop" vol={0.12} />
      ))}
      <Sfx at={com} name="ding" vol={0.25} />
    </AbsoluteFill>
  );
};

const SCENES3 = [A1, A2, A3, A4, A5, A6, A7];

// Pequeño zoom al entrar en cada escena.
const Punch: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${1 + 0.05 * Math.exp(-f / 4)})`}}>{children}</AbsoluteFill>;
};

export const Short3: React.FC<{data: Data3; music: string}> = ({data, music}) => {
  let from = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {data.scenes.map((s, i) => {
        const len = lenOf(s, data.extra[i] ?? 0);
        const View = SCENES3[i];
        const seq = (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Punch>
              <View words={s.words} len={len} />
            </Punch>
            <Captions words={s.words} top={i === 0 ? 1150 : 1330} />
            <Audio src={staticFile(s.audio)} />
            {i > 0 && <Audio src={staticFile('sfx3/swish.wav')} volume={0.1} />}
          </Sequence>
        );
        from += len;
        return seq;
      })}
      <Audio src={staticFile(music)} volume={0.85} />
      <Grain />
    </AbsoluteFill>
  );
};
