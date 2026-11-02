import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS, MONT, Word, clamp, stroke} from './art';
import {SCENES} from './scenes';

export type Scene = {text: string; audio: string; dur: number; words: Word[]};
export type Data = {scenes: Scene[]};

const GAP = 0.12; // pausa entre escenas (s)
const END = 45; // cierre con la pregunta final (frames)

export const sceneLen = (s: Scene, last: boolean) => Math.ceil((s.dur + GAP) * FPS) + (last ? END : 0);
export const totalFrames = (d: Data) =>
  d.scenes.reduce((a, s, i) => a + sceneLen(s, i === d.scenes.length - 1), 0);

// Subtítulos palabra por palabra: bloques de hasta 3 palabras, la que se dice en amarillo.
type Chunk = {words: Word[]; s: number};
const chunk = (words: Word[], maxWords = 3, maxChars = 16): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const chars = cur.reduce((a, x) => a + x.w.length + 1, 0);
    if (cur.length && (cur.length >= maxWords || chars + w.w.length > maxChars || w.s - prev.e > 0.3)) {
      out.push({words: cur, s: cur[0].s});
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) out.push({words: cur, s: cur[0].s});
  return out;
};

export const Captions: React.FC<{words: Word[]; top?: number; size?: number; maxWords?: number; maxChars?: number}> = ({words, top = 1150, size = 96, maxWords = 3, maxChars = 16}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chunks = useMemo(() => chunk(words, maxWords, maxChars), [words, maxWords, maxChars]);
  const t = f / fps;
  let idx = -1;
  chunks.forEach((c, i) => {
    if (t >= c.s - 0.04) idx = i;
  });
  if (idx < 0 || t > words[words.length - 1].e + 0.4) return null;
  const c = chunks[idx];
  const pop = spring({frame: f - Math.round(c.s * fps), fps, config: {damping: 12, stiffness: 260}, durationInFrames: 7});
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', transform: `scale(${0.8 + 0.2 * pop})`}}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.04 && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.04);
        return (
          <span key={i} style={{display: 'inline-block', margin: `0 ${size / 8 + (size < 80 ? 6 : 0)}px`, fontFamily: MONT, fontWeight: 900, fontSize: size, lineHeight: 1.1, color: on ? '#FFD60A' : '#fff', transform: `scale(${on ? 1.08 : 1})`, textShadow: '0 8px 20px rgba(0,0,0,.6)', ...stroke(Math.round(size / 6))}}>
            {w.w.replace(/[.,;:…]/g, '').toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

// Golpe de zoom al entrar en cada escena + viñeta.
export const Punch: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{transform: `scale(${1 + 0.07 * Math.exp(-f / 4)})`}}>
      {children}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

export const Short: React.FC<{data: Data}> = ({data}) => {
  const total = totalFrames(data);
  let from = 0;
  return (
    <AbsoluteFill style={{background: '#05070f'}}>
      {data.scenes.map((s, i) => {
        const len = sceneLen(s, i === data.scenes.length - 1);
        const View = SCENES[i];
        const seq = (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Punch>
              <View words={s.words} len={len} />
            </Punch>
            <Captions words={s.words} />
            <Audio src={staticFile(s.audio)} />
            {i > 0 && <Audio src={staticFile('sfx/whoosh.wav')} volume={0.45} />}
          </Sequence>
        );
        from += len;
        return seq;
      })}
      <Audio src={staticFile('sfx/bed.wav')} volume={(f) => interpolate(f, [0, 15, total - 30, total], [0, 0.3, 0.3, 0], clamp)} />
    </AbsoluteFill>
  );
};
