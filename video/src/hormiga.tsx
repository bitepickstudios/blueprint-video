// Capa de gráficos del video "Te encogiste al tamaño de una hormiga" (va encima del render 3D de Blender en After Effects).
import React from 'react';
import {AbsoluteFill, Sequence, spring, useCurrentFrame} from 'remotion';
import {ANTON, MONT, Word, stroke, wordFrame} from './art';
import {Captions} from './Short';
import {Item, Label, Panel, Pill, Progress, TEAL, YEL, usePop} from './pollo';
import data06 from '../public/06/data.json';

const D6 = data06 as {scenes: {dur: number; words: Word[]}[]; extra: number[]};
export const len6 = (i: number) => Math.ceil((D6.scenes[i].dur + 0.12 + (D6.extra[i] ?? 0)) * 30);
export const P6_TOTAL = D6.scenes.reduce((a, _, i) => a + len6(i), 0);

const RED = '#ff3b4a';
const GREEN = '#21b573';

// ---------- íconos ----------
const Fall: React.FC = () => (
  <svg width={58} height={58} viewBox="0 0 58 58">
    <path d="M29,6 L29,44 M16,32 L29,46 L42,32" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10,10 L10,22 M48,14 L48,26" stroke={TEAL} strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);
const Crumb: React.FC = () => (
  <svg width={58} height={58} viewBox="0 0 58 58">
    <path d="M10,34 C8,22 18,12 30,13 C42,13 50,22 48,33 C46,44 36,48 28,47 C18,47 11,42 10,34 Z" fill="#d9a050" />
    <ellipse cx="24" cy="30" rx="7" ry="5" fill="#f6e2b8" />
    <ellipse cx="36" cy="25" rx="4" ry="3" fill="#f6e2b8" />
  </svg>
);
const Spider: React.FC<{s?: number}> = ({s = 1}) => (
  <svg width={58 * s} height={58 * s} viewBox="0 0 58 58">
    <g stroke="#b9a2ff" strokeWidth="3.2" fill="none" strokeLinecap="round">
      {[-1, 1].map((d) =>
        [8, 16, 24, 32].map((y, k) => <path key={`${d}${k}`} d={`M29,${26 + k * 2} L${29 + d * 16},${y} L${29 + d * 25},${y + 14}`} />)
      )}
    </g>
    <ellipse cx="29" cy="38" rx="11" ry="12" fill="#5b3f8f" />
    <circle cx="29" cy="24" r="8" fill="#3d2a63" />
    <circle cx="26" cy="22" r="2.6" fill="#fff" />
    <circle cx="32" cy="22" r="2.6" fill="#fff" />
  </svg>
);
const Drop: React.FC = () => (
  <svg width={58} height={58} viewBox="0 0 58 58">
    <path d="M29,6 C36,18 46,28 46,37 C46,47 38,53 29,53 C20,53 12,47 12,37 C12,28 22,18 29,6 Z" fill="#7cc8ff" />
    <ellipse cx="22" cy="36" rx="4" ry="7" fill="#e6f6ff" />
  </svg>
);
const ICONS = [<Fall key="f" />, <Crumb key="c" />, <Spider key="s" />, <Drop key="d" />];
const NAMES = ['LA CAÍDA', 'EL HAMBRE', 'LA ARAÑA', 'UNA GOTA'];

const Circle: React.FC<{children: React.ReactNode; bg?: string; ring?: string}> = ({children, bg = '#25304f', ring}) => (
  <div style={{width: 76, height: 76, borderRadius: 38, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: ring ? `0 0 0 5px ${ring}` : undefined}}>{children}</div>
);

const Q: React.FC = () => <div style={{fontFamily: ANTON, fontSize: 48, color: '#8d97b8'}}>?</div>;

// Encabezado de cada peligro: ícono + "PELIGRO n/4" + nombre.
const Header: React.FC<{n: number; from: number; done?: number}> = ({n, from, done}) => {
  const f = useCurrentFrame();
  const ok = done !== undefined && f >= done;
  return (
    <Panel from={from} top={110} border={ok ? GREEN : YEL}>
      <Circle>{ICONS[n - 1]}</Circle>
      <Label sub={`PELIGRO ${n}/4`} text={NAMES[n - 1]} size={54} />
      {ok && (
        <Item from={done!}>
          <div style={{width: 60, height: 60, borderRadius: 30, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={34} height={34} viewBox="0 0 30 30">
              <path d="M6,16 L12,22 L24,8" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Item>
      )}
    </Panel>
  );
};

// Cuenta regresiva 3-2-1 con anillo que se vacía.
const Countdown: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const seg = (to - from) / 3;
  const k = Math.min(2, Math.floor((f - from) / seg));
  const local = Math.min(1, (f - from - k * seg) / seg);
  const pop = spring({frame: f - from - Math.round(k * seg), fps: 30, config: {damping: 10, stiffness: 220}});
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div style={{position: 'relative', width: 130, height: 130}}>
      <svg width={130} height={130} viewBox="0 0 130 130" style={{position: 'absolute'}}>
        <circle cx="65" cy="65" r={R} stroke="rgba(255,255,255,.18)" strokeWidth="12" fill="none" />
        <circle cx="65" cy="65" r={R} stroke={k === 2 ? RED : YEL} strokeWidth="12" fill="none" strokeDasharray={C} strokeDashoffset={C * local} strokeLinecap="round" transform="rotate(-90 65 65)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ANTON, fontSize: 78, color: '#fff', transform: `scale(${0.6 + 0.4 * pop})`}}>{3 - k}</div>
    </div>
  );
};

const Choice: React.FC<{text: string; bg: string}> = ({text, bg}) => (
  <div style={{background: bg, color: '#fff', fontFamily: MONT, fontWeight: 900, fontSize: 52, padding: '8px 34px', borderRadius: 18, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.18)'}}>{text}</div>
);

const Big: React.FC<{from: number; text: string; color: string; top: number; size?: number; shake?: boolean}> = ({from, text, color, top, size = 150, shake}) => {
  const f = useCurrentFrame();
  const s = usePop(from);
  if (!s) return null;
  const dx = shake ? Math.sin(f * 2.1) * 6 : 0;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', transform: `translateX(${dx}px) scale(${s}) rotate(-4deg)`}}>
      <span style={{fontFamily: MONT, fontWeight: 900, fontSize: size, color, ...stroke(18), textShadow: '0 14px 30px rgba(0,0,0,.55)'}}>{text}</span>
    </div>
  );
};

// ---------- gráficos por escena ----------
const HUD: React.FC<{i: number; words: Word[]; len: number}> = ({i, words, len}) => {
  const f = useCurrentFrame();
  const w = (k: string, nth = 0) => wordFrame(words, k, nth);
  if (i === 0) {
    const cua = w('cuatro');
    const ult = w('última');
    const t = usePop(2);
    const pulse = f >= ult ? 1 + 0.08 * Math.sin((f - ult) / 3) : 1;
    return (
      <>
        {f < cua && (
          <div style={{position: 'absolute', top: 130, left: 50, right: 50, textAlign: 'center', transform: `scale(${t})`}}>
            {['TE ENCOGISTE AL', 'TAMAÑO DE HORMIGA'].map((l, k) => (
              <div key={k} style={{fontFamily: MONT, fontWeight: 900, fontSize: 76, lineHeight: 1.05, color: k ? YEL : '#fff', ...stroke(16), textShadow: '0 10px 24px rgba(0,0,0,.5)'}}>
                {l}
              </div>
            ))}
          </div>
        )}
        {f >= cua && (
          <Panel from={cua} top={110}>
            <Label text="4 PELIGROS" size={64} />
            {[0, 1, 2, 3].map((k) => (
              <Item key={k} from={cua + 4 + k * 4}>
                <div style={{transform: `scale(${k === 3 ? pulse : 1})`}}>
                  <Circle ring={k === 3 && f >= ult ? RED : undefined}>
                    <Q />
                  </Circle>
                </div>
              </Item>
            ))}
          </Panel>
        )}
      </>
    );
  }
  if (i === 1) {
    const sob = w('sobrevives');
    return (
      <>
        <Header n={1} from={2} />
        <Panel from={sob - 2} top={330} border={TEAL}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
            <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 64, color: '#fff'}}>¿SOBREVIVE?</div>
            <div style={{display: 'flex', gap: 22}}>
              <Choice text="SÍ" bg={GREEN} />
              <Choice text="NO" bg={RED} />
            </div>
          </div>
          <Countdown from={sob + 14} to={len - 6} />
        </Panel>
      </>
    );
  }
  if (i === 2)
    return (
      <>
        <Header n={1} from={0} done={2} />
        <Big from={3} text="¡SOBREVIVE!" color="#5dff9e" top={330} size={120} />
        <Pill from={w('aire')} text="EL AIRE LO FRENA" top={530} bg="#fff" size={50} />
      </>
    );
  if (i === 3)
    return (
      <>
        <Header n={2} from={2} />
        {f < w('comer') - 4 && <Pill from={w('calor')} text="PIERDE CALOR MUY RÁPIDO" top={330} bg="#ff8a3d" color="#fff" size={46} />}
        <Panel from={w('comer') - 2} top={330} border={TEAL}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 40, color: '#fff'}}>COMER CADA DÍA</div>
            <div style={{fontFamily: ANTON, fontSize: 104, lineHeight: 1.05, color: f >= w('peso') ? YEL : '#55607f'}}>≈ TU PESO</div>
          </div>
        </Panel>
      </>
    );
  if (i === 4)
    return (
      <>
        <Header n={3} from={2} />
        {f < w('corre') && <Pill from={w('almuerzo')} text="ERES SU ALMUERZO" top={330} bg={RED} color="#fff" size={50} />}
        <Big from={w('corre')} text="¡CORRE!" color={RED} top={340} size={170} shake />
      </>
    );
  if (i === 5) {
    const atr = w('atrapa');
    const peg = w('pegamento');
    return (
      <>
        <Header n={4} from={w('peligro')} />
        {f < w('gota') - 2 && <Pill from={w('inesperado')} text="EL MÁS INESPERADO" top={330} bg="#7cc8ff" color="#0d1b33" size={46} />}
        {f < peg - 4 && <Pill from={atr} text="¡TE ATRAPA!" top={330} bg={RED} color="#fff" size={56} />}
        <Panel from={peg - 4} top={330} border="#7cc8ff">
          <div style={{textAlign: 'center', fontFamily: MONT, fontWeight: 900, lineHeight: 1.05}}>
            <div style={{fontSize: 44, color: '#fff'}}>EL AGUA SE PEGA</div>
            <div style={{fontSize: 64, color: YEL}}>COMO PEGAMENTO</div>
          </div>
        </Panel>
      </>
    );
  }
  const com = w('comenta');
  const s = usePop(com);
  return (
    <>
      {f < com - 1 && (
        <Panel from={2} top={110}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <div style={{fontFamily: MONT, fontWeight: 900, fontSize: 52, color: '#fff'}}>¿EN CUÁL PERDÍAS TÚ?</div>
            <div style={{display: 'flex', gap: 18}}>
              {ICONS.map((ic, k) => (
                <Item key={k} from={6 + k * 4}>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                    <Circle>{ic}</Circle>
                    <div style={{fontFamily: ANTON, fontSize: 34, color: YEL}}>{k + 1}</div>
                  </div>
                </Item>
              ))}
            </div>
          </div>
        </Panel>
      )}
      {s > 0 && (
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${s * (1 + 0.03 * Math.sin((f - com) / 4))})`}}>
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
      <Pill from={w('aprender')} text="Y TE ENSEÑO A HACER VIDEOS ASÍ" top={470} bg="#fff" size={44} />
    </>
  );
};

export const HormigaOverlay: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill>
      {D6.scenes.map((s, i) => {
        const len = len6(i);
        const el = (
          <Sequence key={i} from={from} durationInFrames={len}>
            <HUD i={i} words={s.words} len={len} />
            <Captions words={s.words} top={1560} size={62} maxWords={3} maxChars={17} />
          </Sequence>
        );
        from += len;
        return el;
      })}
      <Progress />
    </AbsoluteFill>
  );
};

