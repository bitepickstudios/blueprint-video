// Capa de gráficos del video "¿Hoy comiste dinosaurio?" (se superpone al render 3D de Blender en After Effects).
import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ANTON, MONT, Word, clamp, stroke, wordFrame} from './art';
import {Captions} from './Short';
import data05 from '../public/05/data.json';

const D5 = data05 as {scenes: {dur: number; words: Word[]}[]; extra: number[]};
export const len5 = (i: number) => Math.ceil((D5.scenes[i].dur + 0.12 + (D5.extra[i] ?? 0)) * 30);
export const P5_TOTAL = D5.scenes.reduce((a, _, i) => a + len5(i), 0);

export const NAVY = 'rgba(18,22,40,0.92)';
export const YEL = '#FFD60A';
export const TEAL = '#2ee6c8';

// ---------- íconos ----------
const Hen: React.FC<{s?: number}> = ({s = 1}) => (
  <svg width={64 * s} height={64 * s} viewBox="0 0 64 64">
    <ellipse cx="34" cy="38" rx="17" ry="13" fill="#fff" />
    <circle cx="22" cy="22" r="9" fill="#fff" />
    {[16, 21, 26].map((x) => (
      <circle key={x} cx={x} cy="12" r="3.6" fill="#ff3b30" />
    ))}
    <path d="M12,22 L5,25 L12,27 Z" fill="#ffb020" />
    <circle cx="20" cy="20" r="1.8" fill="#111" />
    <path d="M30,50 L28,60 M38,50 L40,60" stroke="#ffb020" strokeWidth="3" strokeLinecap="round" />
    <path d="M49,30 L58,22 L55,34 Z" fill="#fff" />
  </svg>
);

const Dino: React.FC<{s?: number}> = ({s = 1}) => (
  <svg width={72 * s} height={64 * s} viewBox="0 0 72 64">
    <path d="M6,20 C8,12 16,8 26,9 C34,10 38,16 36,22 L44,26 C54,28 62,34 70,46 C60,42 52,40 46,42 L44,50 L46,60 L40,60 L38,50 L32,48 L32,58 L26,58 L26,46 C22,40 22,32 26,28 L20,26 C12,27 6,26 6,20 Z" fill="#7ad36a" />
    <circle cx="20" cy="15" r="2.2" fill="#111" />
    <path d="M30,32 l5,4" stroke="#7ad36a" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Feather: React.FC = () => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    <path d="M44,6 C26,8 12,22 12,40 L18,40 C20,28 30,16 44,6 Z" fill="#fff" />
    <path d="M44,6 C40,22 30,34 16,42" stroke="#9fd3f5" strokeWidth="2.5" fill="none" />
    <path d="M14,40 L8,50" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Bone: React.FC = () => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    <g fill="#fff" transform="rotate(-35 28 28)">
      <rect x="14" y="24" width="28" height="8" rx="3" />
      <circle cx="13" cy="23" r="6" />
      <circle cx="13" cy="33" r="6" />
      <circle cx="43" cy="23" r="6" />
      <circle cx="43" cy="33" r="6" />
    </g>
    <circle cx="28" cy="28" r="3" fill="#121628" />
  </svg>
);

const Foot: React.FC = () => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    <g stroke="#ffb020" strokeWidth="5" strokeLinecap="round">
      <path d="M28,10 L28,32" />
      <path d="M28,32 L12,48 M28,32 L28,50 M28,32 L44,48" />
    </g>
  </svg>
);

// ---------- piezas ----------
export const usePop = (from: number) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from) return 0;
  return spring({frame: f - from, fps, config: {damping: 11, stiffness: 210}});
};

export const Panel: React.FC<{from: number; top?: number; children: React.ReactNode; border?: string}> = ({from, top = 120, children, border = YEL}) => {
  const s = usePop(from);
  if (!s) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.4), transformOrigin: `50% ${top}px`}}>
      <div style={{background: NAVY, border: `5px solid ${border}`, borderRadius: 30, padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 22, boxShadow: '0 16px 40px rgba(0,0,0,.45)'}}>{children}</div>
    </div>
  );
};

export const Label: React.FC<{text: string; sub?: string; color?: string; size?: number}> = ({text, sub, color = '#fff', size = 46}) => (
  <div style={{fontFamily: MONT, fontWeight: 900, lineHeight: 1.02, color}}>
    {sub && <div style={{fontSize: size * 0.55, color: YEL, letterSpacing: 1}}>{sub}</div>}
    <div style={{fontSize: size}}>{text}</div>
  </div>
);

export const Item: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => {
  const s = usePop(from);
  return <div style={{display: 'flex', alignItems: 'center', gap: 14, transform: `scale(${s})`, opacity: s ? 1 : 0}}>{children}</div>;
};

const Arrow: React.FC<{from: number}> = ({from}) => (
  <Item from={from}>
    <svg width={50} height={30} viewBox="0 0 50 30">
      <path d="M4,15 L40,15 M30,5 L42,15 L30,25" stroke={TEAL} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Item>
);

const Check: React.FC<{from: number; icon: React.ReactNode; text: string}> = ({from, icon, text}) => {
  const s = usePop(from);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: s ? 1 : 0.25}}>
      <div style={{width: 64, height: 64, borderRadius: 32, background: '#25304f', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
      <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 46, color: '#fff', flex: 1}}>{text}</div>
      <div style={{width: 52, height: 52, borderRadius: 26, background: s ? '#21b573' : '#3a4562', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * s})`}}>
        {s > 0 && (
          <svg width={30} height={30} viewBox="0 0 30 30">
            <path d="M6,16 L12,22 L24,8" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

const Counter: React.FC<{from: number; to: number; dur?: number; label: string; prefix?: string; size?: number}> = ({from, to, dur = 26, label, prefix = '+', size = 96}) => {
  const f = useCurrentFrame();
  const v = Math.round(interpolate(f, [from, from + dur], [0, to], {...clamp, easing: Easing.out(Easing.cubic)}));
  return (
    <div style={{textAlign: 'center'}}>
      <div style={{fontFamily: ANTON, fontSize: size, color: YEL, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{prefix + v.toLocaleString('es-ES')}</div>
      <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 40, color: '#fff', marginTop: 6}}>{label}</div>
    </div>
  );
};

export const Pill: React.FC<{from: number; text: string; top: number; bg?: string; color?: string; size?: number}> = ({from, text, top, bg = YEL, color = '#111', size = 50}) => {
  const s = usePop(from);
  if (!s) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${s})`}}>
      <div style={{background: bg, color, fontFamily: MONT, fontWeight: 900, fontSize: size, padding: '12px 30px', borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,.45), inset 0 -6px 0 rgba(0,0,0,.15)'}}>{text}</div>
    </div>
  );
};

// ---------- gráficos por escena ----------
const HUD: React.FC<{i: number; words: Word[]}> = ({i, words}) => {
  const f = useCurrentFrame();
  const w = (k: string, nth = 0) => wordFrame(words, k, nth);
  if (i === 0) {
    const s = usePop(2);
    return (
      <div style={{position: 'absolute', top: 120, left: 50, transform: `scale(${s})`, transformOrigin: '0 0'}}>
        {['¿HOY COMISTE', 'DINOSAURIO?'].map((l, k) => (
          <div key={k} style={{fontFamily: MONT, fontWeight: 900, fontSize: 96, lineHeight: 1.05, color: k ? YEL : '#fff', ...stroke(16), textShadow: '0 10px 24px rgba(0,0,0,.5)'}}>
            {l}
          </div>
        ))}
      </div>
    );
  }
  if (i === 1)
    return (
      <>
        <Panel from={w('son', 1) - 2}>
          <Item from={w('son', 1) - 2}>
            <Hen />
            <Label text="AVES" />
          </Item>
          <Item from={w('son', 1) + 4}>
            <div style={{fontFamily: ANTON, fontSize: 70, color: TEAL}}>=</div>
          </Item>
          <Item from={w('son', 1) + 8}>
            <Dino />
            <Label text="DINOSAURIOS" color={YEL} />
          </Item>
        </Panel>
        <Pill from={w('únicos')} text="LOS ÚNICOS SOBREVIVIENTES" top={330} bg="#ff6a3a" color="#fff" size={44} />
      </>
    );
  if (i === 2)
    return (
      <Panel from={w('carnívoros') - 4} border={TEAL}>
        <Item from={w('t-rex')}>
          <Dino s={0.9} />
          <Label text="T-REX" size={42} />
        </Item>
        <Arrow from={w('t-rex') + 6} />
        <Item from={w('terópodos')}>
          <Label text="TERÓPODOS" sub="GRUPO" color={YEL} size={42} />
        </Item>
        <Arrow from={w('terópodos') + 8} />
        <Item from={w('terópodos') + 12}>
          <Hen s={0.9} />
          <Label text="AVES" size={42} />
        </Item>
      </Panel>
    );
  if (i === 3)
    return (
      <>
        <div style={{position: 'absolute', top: 110, left: 60, right: 60}}>
          <div style={{background: NAVY, border: `5px solid ${YEL}`, borderRadius: 30, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 16px 40px rgba(0,0,0,.45)', opacity: Math.min(1, usePop(0) * 1.5)}}>
            <Check from={w('plumas')} icon={<Feather />} text="PLUMAS" />
            <Check from={w('huesos')} icon={<Bone />} text="HUESOS HUECOS" />
            <Check from={w('tres')} icon={<Foot />} text="PATAS DE 3 DEDOS" />
          </div>
        </div>
        <Pill from={w('gallina')} text="= COMO UNA GALLINA" top={560} />
      </>
    );
  if (i === 4)
    return (
      <>
        <Panel from={w('diez') - 4}>
          <Counter from={w('diez')} to={10000} label="ESPECIES DE AVES" />
        </Panel>
        <Pill from={w('dinosaurios')} text="= +10.000 DINOSAURIOS VIVOS" top={430} bg="#21b573" color="#fff" size={46} />
      </>
    );
  if (i === 5)
    return (
      <Panel from={w('gallina') - 6}>
        <Hen s={1.3} />
        <Counter from={w('veinte')} to={20000000000} dur={30} label="GALLINAS EN EL MUNDO" size={84} />
      </Panel>
    );
  const com = w('comenta');
  const s = usePop(com);
  return (
    <>
      {s > 0 && (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${s * (1 + 0.03 * Math.sin((f - com) / 4))})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, background: 'linear-gradient(180deg,#ffe24a,#ffc800)', borderRadius: 28, padding: '22px 36px', boxShadow: '0 18px 50px rgba(0,0,0,.55), inset 0 -8px 0 rgba(0,0,0,.15)'}}>
            <svg width={120} height={120} viewBox="0 0 24 24">
              <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#111" />
              <circle cx="8" cy="11" r="1.4" fill={YEL} />
              <circle cx="12" cy="11" r="1.4" fill={YEL} />
              <circle cx="16" cy="11" r="1.4" fill={YEL} />
            </svg>
            <div style={{fontFamily: MONT, fontWeight: 900, color: '#111', lineHeight: 1}}>
              <div style={{fontSize: 60}}>COMENTA</div>
              <div style={{fontFamily: ANTON, fontSize: 150}}>«VIDEO»</div>
            </div>
          </div>
        </div>
      )}
      <Pill from={w('aprender')} text="Y TE ENSEÑO A HACER VIDEOS ASÍ" top={490} bg="#fff" size={44} />
    </>
  );
};

export const Progress: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 9, background: 'rgba(0,0,0,.25)'}}>
      <div style={{width: `${(100 * f) / (durationInFrames - 1)}%`, height: '100%', background: `linear-gradient(90deg, ${TEAL}, ${YEL})`}} />
    </div>
  );
};

export const PolloOverlay: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill>
      {D5.scenes.map((s, i) => {
        const len = len5(i);
        const el = (
          <Sequence key={i} from={from} durationInFrames={len}>
            <HUD i={i} words={s.words} />
            <Captions words={s.words} top={1480} />
          </Sequence>
        );
        from += len;
        return el;
      })}
      <Progress />
    </AbsoluteFill>
  );
};
