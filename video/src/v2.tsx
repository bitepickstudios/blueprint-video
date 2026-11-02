// Versión 2: estilo 3D low-poly, música y efectos propios, cierre con llamada a la acción.
import React from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ANTON, Headline, MONT, SceneProps, Tag, clamp, ramp, stroke, wordFrame} from './art';
import {Captions, Data, Punch, sceneLen} from './Short';
import {Asteroid, Cam, Car, City, Earth, Fern, Glow, Human, Mouse, OnSurface, Puff, Rock, Sauropod, Stars, TRex, V3, faceRot, lerp, lerp3, surf} from './lp';

const ease = (t: number) => t * t * (3 - 2 * t);
const YUC = [-89.5, 21.3] as const;

const Sfx: React.FC<{at: number; name: string; vol?: number}> = ({at, name, vol = 0.8}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={200}>
    <Audio src={staticFile(`sfx2/${name}.wav`)} volume={vol} />
  </Sequence>
);

const Stage: React.FC<{children: React.ReactNode; bg?: string; fog?: [string, number, number]; style?: React.CSSProperties}> = ({
  children,
  bg = '#02030a',
  fog,
  style,
}) => (
  <AbsoluteFill style={{background: bg, ...style}}>
    <ThreeCanvas width={1080} height={1920} camera={{fov: 40}} gl={{antialias: true}}>
      {fog && <fog attach="fog" args={fog} />}
      {children}
    </ThreeCanvas>
  </AbsoluteFill>
);

const Sun: React.FC<{i?: number}> = ({i = 2.4}) => (
  <>
    <ambientLight intensity={0.07} />
    <directionalLight position={[5, 2, 4]} intensity={i} color="#fff2dd" />
  </>
);

const Flash: React.FC<{at: number; dur?: number}> = ({at, dur = 9}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  return <AbsoluteFill style={{background: '#fff', opacity: 1 - (f - at) / dur}} />;
};

// 1. Gancho: cámara persiguiendo al asteroide hacia la Tierra.
const S1: React.FC<SceneProps> = ({len}) => {
  const f = useCurrentFrame();
  const t = f / len;
  // Cámara fija mirando la Tierra; el asteroide entra en diagonal desde abajo a la derecha.
  const A0: V3 = [0.6, -1.85, 2.4];
  const A1: V3 = [0.04, 0.0, 1.15];
  const a = lerp3(A0, A1, Math.pow(t, 1.3));
  const back = new THREE.Vector3(...A0).sub(new THREE.Vector3(...A1)).normalize();
  return (
    <AbsoluteFill>
      <Stage>
        <Cam pos={[0, lerp(-0.3, -0.15, t), lerp(6.4, 3.5, ease(t))]} look={[0, -0.5, 0]} fov={42} />
        <Sun />
        <Stars />
        <Glow p={[60, 30, -120]} s={50} c="#ffe2a8" o={0.9} />
        <Earth rot={faceRot(lerp(-55, YUC[0], t), lerp(5, YUC[1], t))} />
        {Array.from({length: 18}, (_, k) => (
          <Glow key={k} p={[a[0] + back.x * k * 0.06, a[1] + back.y * k * 0.06, a[2] + back.z * k * 0.06]} s={0.5 * (1 - k / 18)} c={k < 5 ? '#ffd889' : '#ff5a1a'} o={0.8 * (1 - k / 18)} />
        ))}
        <Asteroid p={a} s={0.11} spin={f * 0.05} />
      </Stage>
      <Headline lines={['¿Y SI HUBIERA CAÍDO', 'EN OTRO LUGAR?']} top={190} size={104} />
      <Sfx at={0} name="whoosh" vol={0.7} />
      <Sfx at={len - 78} name="riser" vol={0.75} />
    </AbsoluteFill>
  );
};

// 2. Impacto en México.
const S2: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const hit = 3;
  const k = f - hit;
  const t = f / len;
  const sh = k >= 0 ? 0.06 * Math.exp(-k / 7) : 0;
  const j = (s: string) => (random(`${s}${f}`) - 0.5) * sh;
  const fire = k < 0 ? 0 : Math.min(1, k / 5) * Math.exp(-Math.max(0, k - 15) / 45);
  const p0 = new THREE.Vector3(...surf(YUC[0], YUC[1], 1.01));
  const n = p0.clone().normalize();
  return (
    <AbsoluteFill>
      <Stage>
        <Cam pos={[0.3 - 0.1 * t + j('x'), 0.45 - 0.1 * t + j('y'), 3.3 - 0.6 * ease(t)]} look={[0, 0.1, 0.4]} />
        <Sun />
        <pointLight position={[0, 0.05, 1.3]} intensity={6 * fire} color="#ff8a3a" distance={3} />
        <Stars />
        <Earth rot={faceRot(YUC[0] + t * 3, YUC[1])}>
          <OnSurface lon={YUC[0]} lat={YUC[1]} r={1.003}>
            <mesh scale={Math.min(0.12, Math.max(0, k) * 0.004)}>
              <circleGeometry args={[1, 48]} />
              <meshBasicMaterial color="#0c0806" transparent opacity={0.9} />
            </mesh>
            {[0, 9, 18].map((d) =>
              k >= d ? (
                <mesh key={d} scale={Math.min(0.5, (k - d) * 0.0065)}>
                  <ringGeometry args={[0.92, 1, 72]} />
                  <meshBasicMaterial color="#ffd27a" transparent opacity={Math.max(0, 1 - (k - d) / 60)} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
              ) : null,
            )}
          </OnSurface>
          {fire > 0 && (
            <>
              <Glow p={surf(YUC[0], YUC[1], 1.04)} s={0.7 * fire} c="#ff6a1a" />
              <Glow p={surf(YUC[0], YUC[1], 1.04)} s={0.3 * fire} c="#fff1c0" />
            </>
          )}
          {k >= 0 &&
            Array.from({length: 46}, (_, i) => {
              const tan = new THREE.Vector3(random(`dx${i}`) - 0.5, random(`dy${i}`) - 0.5, random(`dz${i}`) - 0.5).projectOnPlane(n).normalize();
              const s = k / 30;
              const v = n.clone().multiplyScalar(0.35 + random(`v${i}`) * 0.5).add(tan.multiplyScalar(0.3 + random(`w${i}`) * 0.5));
              const p = p0.clone().add(v.multiplyScalar(s)).sub(n.clone().multiplyScalar(0.45 * s * s));
              return <Glow key={i} p={[p.x, p.y, p.z]} s={0.05} c={i % 3 ? '#ff8a2a' : '#ffe0a0'} o={Math.max(0, 1 - k / 40)} />;
            })}
          {k > 12 &&
            Array.from({length: 16}, (_, i) => {
              const kk = k - 12 - i * 2;
              if (kk < 0) return null;
              const ang = random(`sa${i}`) * Math.PI * 2;
              const d = kk * 0.25;
              return <Puff key={i} p={surf(YUC[0] + Math.cos(ang) * d, YUC[1] + Math.sin(ang) * d * 0.7, 1.04 + kk * 0.0012)} s={0.12 + kk * 0.005} c="#2a2220" o={0.85} rot={ang} />;
            })}
        </Earth>
      </Stage>
      <Flash at={hit} />
      <Tag text="PETRÓLEO" x={540} y={380} from={wordFrame(words, 'petrol')} bg="#111" color="#ffb347" size={58} />
      <Tag text="MÉXICO" x={540} y={480} from={wordFrame(words, 'mexic')} bg="#FFD60A" size={58} />
      <Sfx at={hit} name="impact" vol={1} />
      <Sfx at={hit} name="braam" vol={0.55} />
    </AbsoluteFill>
  );
};

// 3. Humo, frío y muerte.
const S3: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const t = f / len;
  const sol = wordFrame(words, 'sol');
  const cong = wordFrame(words, 'congel');
  const mur = wordFrame(words, 'muri');
  const dist = lerp(2.1, 3.4, ease(t));
  return (
    <AbsoluteFill style={{filter: `grayscale(${ramp(f, mur - 4, mur + 18, 0, 0.75)})`}}>
      <Stage>
        <Cam pos={[0.12 * dist, 0.25, dist]} look={[0, 0, 0]} />
        <Sun i={ramp(f, 0, sol + 10, 2.4, 0.6)} />
        <Stars />
        <Earth rot={faceRot(YUC[0] + f * 0.22, YUC[1] - f * 0.04)} smoke={f < cong ? ramp(f, 0, sol + 15, 0.25, 0.92) : ramp(f, cong, cong + 25, 0.92, 0.4)} frozen={ramp(f, cong, cong + 30, 0, 0.9)} atmo={ramp(f, mur, mur + 20, 1, 0.3)}>
          {Array.from({length: 34}, (_, i) => {
            const ang = random(`ga${i}`) * Math.PI * 2;
            const d = Math.min(1, t * 1.5) * (10 + random(`gd${i}`) * 70);
            return <Puff key={i} p={surf(YUC[0] + Math.cos(ang) * d, YUC[1] + Math.sin(ang) * d * 0.6, 1.05)} s={0.28 + random(`gs${i}`) * 0.25} c="#1d1715" o={f < cong ? 0.8 : ramp(f, cong, cong + 25, 0.8, 0.2)} rot={ang} />;
          })}
        </Earth>
      </Stage>
      <Sfx at={0} name="wind" vol={0.9} />
      <Sfx at={cong} name="freeze" vol={0.9} />
    </AbsoluteFill>
  );
};

// 4. "Si caía casi en cualquier otra parte...": puntos verdes y un saurópodo que sobrevive.
const S4: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const any = wordFrame(words, 'cualquier');
  const sv = wordFrame(words, 'sobreviv');
  const z = ease(ramp(f, sv - 4, sv + 26));
  const pts = Array.from({length: 40}, (_, i) => [random(`mx${i}`) * 360 - 180, random(`my${i}`) * 120 - 60] as const).filter(
    ([lo, la]) => Math.abs(lo - YUC[0]) > 25 || Math.abs(la - YUC[1]) > 20,
  );
  const dino = spring({frame: f - sv, fps, config: {damping: 10, stiffness: 160}});
  return (
    <AbsoluteFill>
      <Stage>
        <Cam pos={lerp3([0, 0.35, 3.6], [0.95, 1.35, 1.9], z)} look={lerp3([0, 0.1, 0], [0, 1.0, 0], z)} />
        <Sun />
        <Stars />
        <Earth rot={faceRot(YUC[0] + f * 0.5, 15)}>
          <Glow p={surf(YUC[0], YUC[1], 1.03)} s={0.28 + 0.06 * Math.sin(f / 3)} c="#ff2a2a" />
          {pts.map(([lo, la], i) => {
            const k = f - (any + i * 2);
            if (k < 0) return null;
            return <Glow key={i} p={surf(lo, la, 1.03)} s={Math.min(0.2, k * 0.04)} c="#3dff9a" o={0.95} />;
          })}
        </Earth>
        {f >= sv && (
          <group position={[0, 1.0, 0]} scale={0.055 * dino} rotation={[0, -0.5, 0]}>
            <Sauropod phase={f / 4} c="#7fae5c" />
          </group>
        )}
      </Stage>
      <Tag text="SOBREVIVÍAN" x={540} y={330} from={sv} bg="#34d399" size={64} />
      {pts.slice(0, 24).map((_, i) => (i % 3 === 0 ? <Sfx key={i} at={any + i * 2} name="pop" vol={0.5} /> : null))}
      <Sfx at={sv} name="hit" vol={0.5} />
    </AbsoluteFill>
  );
};

// 5. "Imagina el mundo hoy": picada a través de las nubes.
const S5: React.FC<SceneProps> = ({len}) => {
  const f = useCurrentFrame();
  const t = f / len;
  const d = lerp(2.9, 1.05, Math.pow(t, 1.8));
  return (
    <AbsoluteFill>
      <Stage>
        <Cam pos={[0, 0, d]} look={[0, 0, 0]} fov={40 + 20 * t} />
        <Sun i={2.6} />
        <Stars />
        <Earth rot={faceRot(-58 + f * 0.1, -12)} />
        {Array.from({length: 22}, (_, i) => (
          <Puff key={i} p={[(random(`cx${i}`) - 0.5) * 0.5, (random(`cy${i}`) - 0.5) * 0.8, 1.08 + random(`cz${i}`) * 0.5]} s={0.12 + random(`cs${i}`) * 0.18} c="#ffffff" o={0.9} />
        ))}
      </Stage>
      <AbsoluteFill style={{background: '#fff', opacity: ramp(f, len - 10, len, 0, 1)}} />
      <Sfx at={0} name="sparkle" vol={0.8} />
      <Sfx at={0} name="riser" vol={0.5} />
    </AbsoluteFill>
  );
};

// 6. Mamíferos chiquitos escondidos; una pata gigante.
const GiantFoot: React.FC<{p: V3}> = ({p}) => (
  <group position={p} scale={1.4}>
    {[-0.5, 0, 0.5].map((a, i) => (
      <group key={i} rotation={[0, a, 0]}>
        <mesh position={[0.9, 0.22, 0]}>
          <boxGeometry args={[1.5, 0.45, 0.42]} />
          <meshStandardMaterial color="#4b5730" flatShading />
        </mesh>
        <mesh position={[1.75, 0.15, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.45, 5]} />
          <meshStandardMaterial color="#d8d0b8" flatShading />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 4, 0]}>
      <cylinderGeometry args={[0.65, 0.8, 8, 7]} />
      <meshStandardMaterial color="#4b5730" flatShading />
    </mesh>
  </group>
);

const S6: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const st = wordFrame(words, 'escond');
  const k = f - st;
  const footY = k < -9 ? 9 : k < 0 ? lerp(9, 0, ease((k + 9) / 9)) : 0;
  const sh = k >= 0 ? 0.07 * Math.exp(-k / 6) : 0;
  const j = (s: string) => (random(`${s}${f}`) - 0.5) * sh;
  return (
    <AbsoluteFill>
      <Stage bg="#081420" fog={['#081420', 3, 18]}>
        <Cam pos={[0.9 - f * 0.002 + j('a'), 1.05 + j('b'), 2.5 - f * 0.003]} look={[-0.35, 0.55, -0.6]} fov={50} />
        <ambientLight intensity={0.6} color="#7f9cff" />
        <directionalLight position={[3, 6, 4]} intensity={2.2} color="#c4dcff" />
        <directionalLight position={[2, 2, -4]} intensity={1.0} color="#7fb0ff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#21402b" roughness={1} />
        </mesh>
        <Glow p={[-9, 10, -22]} s={9} c="#cfe2ff" o={0.9} />
        <group rotation={[0, -1.1, 0]}><Mouse t={f} scared={k >= 0 ? 1 : 0} /></group>
        <Rock p={[-0.9, 0.25, -0.6]} s={0.55} />
        <Rock p={[1.4, 0.12, -1.8]} s={0.45} />
        <Rock p={[-3.2, 0.3, -3.5]} s={1.1} />
        {[[-1.2, 0, 0.6], [0.9, 0, -0.9], [-2.4, 0, -1.2], [2.3, 0, -0.2], [-0.2, 0, -2.6], [3.2, 0, -3]].map((p, i) => (
          <Fern key={i} p={p as V3} s={0.7 + (i % 3) * 0.25} c={i % 2 ? '#1f4a2a' : '#275a32'} />
        ))}
        <GiantFoot p={[-1.1, footY, -1.2]} />
        {k >= 0 &&
          Array.from({length: 14}, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const r = 0.6 + k * 0.05;
            return <Puff key={i} p={[-1.1 + Math.cos(a) * r, 0.25 + k * 0.006, -1.2 + Math.sin(a) * r]} s={0.5 + k * 0.02} c="#8a9aa8" o={Math.max(0, 0.7 - k / 50)} />;
          })}
        {Array.from({length: 14}, (_, i) => (
          <Glow key={i} p={[(random(`fx${i}`) - 0.5) * 7 + Math.sin(f / 25 + i) * 0.3, 0.4 + random(`fy${i}`) * 1.8 + Math.sin(f / 18 + i) * 0.15, -random(`fz${i}`) * 5]} s={0.14} c="#d6ff7a" o={0.5 + 0.5 * Math.sin(f / 6 + i)} />
        ))}
      </Stage>
      <Sfx at={st - 9} name="whoosh2" vol={0.6} />
      <Sfx at={st} name="step" vol={1} />
    </AbsoluteFill>
  );
};

// 7. "Y nosotros... quizás nunca habríamos existido": una persona que se deshace en partículas.
const S7: React.FC<SceneProps> = ({words, len}) => {
  const f = useCurrentFrame();
  const d0 = wordFrame(words, 'nunca');
  const ex = wordFrame(words, 'existido');
  const k = f - d0;
  return (
    <AbsoluteFill>
      <Stage bg="#040509">
        <Cam pos={[0, 1.3, lerp(4.8, 3.7, f / len)]} look={[0, 1.1, 0]} />
        <ambientLight intensity={0.1} />
        <spotLight position={[0, 6, 1.2]} angle={0.42} penumbra={0.7} intensity={90} distance={14} decay={1.6} color="#e8f0ff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#14161d" roughness={0.7} />
        </mesh>
        <group scale={1.2} rotation={[0, Math.PI / 2, 0]}>
          <Human o={ramp(f, d0, d0 + 28, 1, 0)} e="#202838" />
        </group>
        {k >= 0 &&
          Array.from({length: 80}, (_, i) => {
            const r = (s: string) => random(`${s}${i}`);
            const p: V3 = [(r('x') - 0.5) * 0.5 + (r('a') - 0.5) * k * 0.03, 0.1 + r('y') * 2.2 + k * 0.03 * (0.4 + r('b')), (r('z') - 0.5) * 0.4 + (r('c') - 0.5) * k * 0.03];
            return <Glow key={i} p={p} s={0.07} c="#cfe3ff" o={Math.max(0, Math.min(1, k / 6) - k / 60)} />;
          })}
      </Stage>
      <Sfx at={d0} name="whoosh2" vol={0.6} />
      <Sfx at={ex - 48} name="reverse" vol={0.6} />
    </AbsoluteFill>
  );
};

// 8 y 9. La ciudad de hoy con dinosaurios. g = frames desde que empieza la escena 8.
const CityStage: React.FC<{g: number; jaw: number; style?: React.CSSProperties}> = ({g, jaw, style}) => {
  const rx = 22 - g * 0.083;
  return (
    <Stage bg="linear-gradient(180deg,#2a1b4a 0%,#8a3f74 30%,#e07a6a 48%,#ffb36b 58%)" fog={['#e9906c', 30, 150]} style={style}>
      <Cam pos={[-1.5, 1.4, lerp(12, 8.5, Math.min(1, g / 460))]} look={[1.2, 5.5, -16]} fov={44} />
      <hemisphereLight args={['#ffb48a', '#2a2238', 0.9]} />
      <directionalLight position={[-20, 18, -60]} intensity={1.8} color="#ffc08a" />
      <directionalLight position={[10, 10, 20]} intensity={1.4} color="#d8c8ff" />
      <Glow p={[0, 9, -170]} s={80} c="#ffd08a" o={0.95} />
      <City />
      <group position={[lerp(10, 1, Math.min(1, g / 460)), 0, -85]} rotation={[0, Math.PI, 0]} scale={3.4}>
        <Sauropod phase={g / 9} c="#6d6a7a" />
      </group>
      <group position={[rx, 0, -16]} rotation={[0, Math.PI - 0.35 * jaw, 0]} scale={2.1}>
        <TRex phase={g / 5} jaw={jaw} />
      </group>
      {Array.from({length: 6}, (_, i) => {
        const dir = i % 2 ? 1 : -1;
        const z = dir === 1 ? -70 + ((g * 0.3 + i * 23) % 78) : 6 - ((g * 0.3 + i * 23) % 78);
        return <Car key={i} p={[dir * -2.6, 0, z]} c={['#c0392b', '#2e86de', '#f1c40f', '#ecf0f1', '#16a085', '#8e44ad'][i]} dir={dir as 1 | -1} />;
      })}
    </Stage>
  );
};

const S8: React.FC<SceneProps> = ({words}) => {
  const f = useCurrentFrame();
  const rex = wordFrame(words, 'rex');
  const jaw = ramp(f, rex, rex + 6, 0, 0.6) * ramp(f, rex + 34, rex + 44, 1, 0);
  return (
    <AbsoluteFill>
      <CityStage g={f} jaw={jaw} />
      <Sfx at={rex} name="roar" vol={0.9} />
      {Array.from({length: 14}, (_, i) => <Sfx key={i} at={8 + i * 15.7} name="step" vol={0.55} />)}
    </AbsoluteFill>
  );
};

const CTA: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from) return null;
  const s = spring({frame: f - from, fps, config: {damping: 9, stiffness: 200}});
  const pulse = 1 + 0.035 * Math.sin((f - from) / 4);
  return (
    <>
      <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${s * pulse})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, background: '#FFD60A', borderRadius: 28, padding: '22px 36px', boxShadow: '0 18px 50px rgba(0,0,0,.55)'}}>
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
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <path d="M800,1010 C930,1060 990,1150 1000,1260" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeDasharray="22 18" strokeDashoffset={-(f - from) * 3} opacity={ramp(f, from + 8, from + 16)} />
        <path d="M968,1236 L1002,1282 L1030,1232" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={ramp(f, from + 8, from + 16)} />
      </svg>
    </>
  );
};

const S9: React.FC<SceneProps> = ({words}) => {
  const f = useCurrentFrame();
  const ens = wordFrame(words, 'enseñ');
  const com = wordFrame(words, 'comenta');
  return (
    <AbsoluteFill>
      <CityStage g={f + 206} jaw={0} style={{filter: `blur(${ramp(f, 0, 12, 0, 9)}px) brightness(${ramp(f, 0, 12, 1, 0.5)})`}} />
      <Headline lines={['¿QUIERES VIDEOS ASÍ', 'PARA TU NEGOCIO?']} top={250} size={100} />
      <Tag text="TE ENSEÑO" x={540} y={600} from={ens} bg="#fff" size={60} />
      <CTA from={com} />
      <Sfx at={ens} name="pop" vol={0.7} />
      <Sfx at={com} name="ding" vol={0.8} />
    </AbsoluteFill>
  );
};

const SCENES2 = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Short2: React.FC<{data: Data; music: string}> = ({data, music}) => {
  let from = 0;
  return (
    <AbsoluteFill style={{background: '#02030a'}}>
      {data.scenes.map((s, i) => {
        const len = sceneLen(s, i === data.scenes.length - 1);
        const View = SCENES2[i];
        const seq = (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Punch>
              <View words={s.words} len={len} />
            </Punch>
            <Captions words={s.words} />
            <Audio src={staticFile(s.audio)} />
            {i > 0 && i !== 1 && <Audio src={staticFile('sfx2/whoosh.wav')} volume={0.4} />}
          </Sequence>
        );
        from += len;
        return seq;
      })}
      <Audio src={staticFile(music)} volume={0.95} />
    </AbsoluteFill>
  );
};

export {interpolate, clamp, stroke};
