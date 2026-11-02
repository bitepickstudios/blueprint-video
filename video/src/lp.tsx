// Modelos 3D low-poly hechos con primitivas. Nada descargado ni generado por IA.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {random} from 'remotion';
import {geoEquirectangular, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import land50 from 'world-atlas/land-50m.json';

export type V3 = [number, number, number];
const LAND = feature(land50 as any, (land50 as any).objects.land) as any;
const deg = Math.PI / 180;

// ---------- cámara y utilidades ----------
export const Cam: React.FC<{pos: V3; look: V3; fov?: number}> = ({pos, look, fov = 40}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.fov = fov;
    camera.near = 0.02;
    camera.far = 600;
    camera.updateProjectionMatrix();
    camera.lookAt(...look);
  });
  return null;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

let _glow: THREE.Texture | null = null;
const glowTex = () =>
  (_glow ??= canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(255,255,255,0.65)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  }));

let _puff: THREE.Texture | null = null;
const puffTex = () =>
  (_puff ??= canvasTex(256, 256, (g) => {
    for (let i = 0; i < 26; i++) {
      const x = 128 + (random(`p${i}`) - 0.5) * 120;
      const y = 128 + (random(`q${i}`) - 0.5) * 120;
      const r = g.createRadialGradient(x, y, 0, x, y, 40 + random(`r${i}`) * 50);
      r.addColorStop(0, 'rgba(255,255,255,0.35)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 256, 256);
    }
  }));

export const Glow: React.FC<{p: V3; s: number; c: string; o?: number}> = ({p, s, c, o = 1}) => (
  <sprite position={p} scale={[s, s, 1]}>
    <spriteMaterial map={glowTex()} color={c} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} />
  </sprite>
);

export const Puff: React.FC<{p: V3; s: number; c: string; o?: number; rot?: number}> = ({p, s, c, o = 1, rot = 0}) => (
  <sprite position={p} scale={[s, s, 1]}>
    <spriteMaterial map={puffTex()} color={c} transparent opacity={o} depthWrite={false} rotation={rot} />
  </sprite>
);

export const Stars: React.FC<{n?: number; r?: number}> = ({n = 1500, r = 300}) => {
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = random(`u${i}`) * 2 - 1;
      const t = random(`t${i}`) * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      a.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
    }
    return a;
  }, [n, r]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={n} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} />
    </points>
  );
};

// Material low-poly
export const M: React.FC<{c: string; e?: string; ei?: number; o?: number}> = ({c, e = '#000000', ei = 1, o = 1}) => (
  <meshStandardMaterial color={c} flatShading roughness={0.85} metalness={0} emissive={e} emissiveIntensity={ei} transparent={o < 1} opacity={o} />
);

// ---------- Tierra ----------
const earthTex = (frozen: boolean) =>
  canvasTex(2048, 1024, (g) => {
    const ocean = g.createLinearGradient(0, 0, 0, 1024);
    ocean.addColorStop(0, frozen ? '#9db4c9' : '#163f73');
    ocean.addColorStop(0.5, frozen ? '#b8cadb' : '#2468b4');
    ocean.addColorStop(1, frozen ? '#9db4c9' : '#163f73');
    g.fillStyle = ocean;
    g.fillRect(0, 0, 2048, 1024);
    const proj = geoEquirectangular().scale(2048 / (2 * Math.PI)).translate([1024, 512]);
    const path = geoPath(proj, g);
    g.save();
    g.beginPath();
    path(LAND);
    g.fillStyle = frozen ? '#eef4fa' : '#4c9450';
    g.fill();
    g.clip();
    g.filter = 'blur(10px)';
    for (let i = 0; i < 900; i++) {
      const x = random(`lx${i}`) * 2048;
      const y = random(`ly${i}`) * 1024;
      const lat = 90 - (y / 1024) * 180;
      const dry = Math.abs(Math.abs(lat) - 25) < 12;
      g.fillStyle = frozen ? 'rgba(200,215,230,0.5)' : dry ? 'rgba(196,170,104,0.4)' : 'rgba(40,110,52,0.35)';
      g.beginPath();
      g.arc(x, y, 6 + random(`lr${i}`) * 22, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    if (!frozen) {
      g.fillStyle = '#f2f6fa';
      g.fillRect(0, 0, 2048, 14);
      g.fillRect(0, 1024 - 60, 2048, 60);
    }
  });

const cloudTex = (dark: boolean) =>
  canvasTex(1024, 512, (g) => {
    g.filter = 'blur(5px)';
    for (let i = 0; i < (dark ? 700 : 320); i++) {
      g.fillStyle = dark ? `rgba(18,14,12,${0.35 + random(`ca${i}`) * 0.4})` : `rgba(255,255,255,${0.25 + random(`ca${i}`) * 0.4})`;
      g.beginPath();
      g.ellipse(random(`cx${i}`) * 1024, 40 + random(`cy${i}`) * 432, 20 + random(`cw${i}`) * 50, 6 + random(`ch${i}`) * 14, 0, 0, Math.PI * 2);
      g.fill();
    }
  });

const atmoMat = () =>
  new THREE.ShaderMaterial({
    uniforms: {c: {value: new THREE.Color('#5fb4ff')}, k: {value: 1}},
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 c; uniform float k; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.,0.,1.)), 3.0); gl_FragColor = vec4(c, 1.0) * i * k; }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

// Punto de la superficie (radio r) para lon/lat, en coordenadas de la esfera.
export const surf = (lon: number, lat: number, r = 1): V3 => {
  const phi = Math.PI + lon * deg;
  const th = Math.PI / 2 - lat * deg;
  return [-Math.cos(phi) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(phi) * Math.sin(th) * r];
};
// Rotación que pone lon/lat de frente a +Z.
export const faceRot = (lon: number, lat: number): V3 => [lat * deg, -Math.PI / 2 - lon * deg, 0];

export const Earth: React.FC<{
  rot: V3;
  frozen?: number;
  smoke?: number;
  clouds?: number;
  atmo?: number;
  children?: React.ReactNode;
}> = ({rot, frozen = 0, smoke = 0, clouds = 1, atmo = 1, children}) => {
  const t = useMemo(
    () => ({day: earthTex(false), ice: earthTex(true), cl: cloudTex(false), sm: cloudTex(true), atmo: atmoMat()}),
    [],
  );
  t.atmo.uniforms.k.value = atmo;
  return (
    <group>
      <mesh scale={1.17} material={t.atmo}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <group rotation={rot}>
        <mesh>
          <sphereGeometry args={[1, 128, 96]} />
          <meshStandardMaterial map={t.day} roughness={0.95} />
        </mesh>
        {frozen > 0 && (
          <mesh scale={1.003}>
            <sphereGeometry args={[1, 128, 96]} />
            <meshStandardMaterial map={t.ice} roughness={0.6} transparent opacity={frozen} />
          </mesh>
        )}
        {clouds > 0 && (
          <mesh scale={1.012}>
            <sphereGeometry args={[1, 96, 64]} />
            <meshStandardMaterial map={t.cl} transparent opacity={clouds} depthWrite={false} />
          </mesh>
        )}
        {smoke > 0 && (
          <mesh scale={1.02}>
            <sphereGeometry args={[1, 96, 64]} />
            <meshStandardMaterial map={t.sm} transparent opacity={smoke} depthWrite={false} />
          </mesh>
        )}
        {children}
      </group>
    </group>
  );
};

// Objeto plano apoyado sobre la superficie en lon/lat (mira hacia afuera).
export const OnSurface: React.FC<{lon: number; lat: number; r?: number; children: React.ReactNode}> = ({lon, lat, r = 1.001, children}) => {
  const q = useMemo(() => {
    const n = new THREE.Vector3(...surf(lon, lat, 1));
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  }, [lon, lat]);
  return (
    <group position={surf(lon, lat, r)} quaternion={q}>
      {children}
    </group>
  );
};

// ---------- asteroide ----------
export const Asteroid: React.FC<{p: V3; s: number; spin: number; heat?: number}> = ({p, s, spin, heat = 1}) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const a = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i);
      const k = 1 + 0.16 * Math.sin(3 * v.x + 1) * Math.sin(4 * v.y + 2) * Math.sin(5 * v.z) + 0.07 * Math.sin(11 * v.x + 7 * v.z);
      v.multiplyScalar(k);
      a.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={p}>
      <mesh geometry={geo} scale={s} rotation={[spin, spin * 0.7, 0]}>
        <meshStandardMaterial color="#5a4a40" flatShading roughness={1} emissive="#ff5a1a" emissiveIntensity={0.25 * heat} />
      </mesh>
      <Glow p={[0, 0, 0]} s={s * 5} c="#ff7a2a" o={0.8 * heat} />
      <Glow p={[0, 0, 0]} s={s * 2.6} c="#ffe1a0" o={0.6 * heat} />
    </group>
  );
};

// ---------- dinosaurios ----------
export const TRex: React.FC<{phase: number; jaw?: number; c?: string}> = ({phase, jaw = 0, c = '#5f7036'}) => {
  const sw = Math.sin(phase) * 0.45;
  const dark = '#3c4722';
  const leg = (z: number, a: number) => (
    <group position={[0, 2.0, z]} rotation={[0, 0, a]}>
      <mesh position={[0, -0.35, 0]} scale={[0.55, 0.78, 0.38]}>
        <icosahedronGeometry args={[1, 1]} />
        <M c={c} />
      </mesh>
      <mesh position={[0.15, -1.25, 0]} rotation={[0, 0, 0.25]}>
        <cylinderGeometry args={[0.15, 0.2, 1.15, 6]} />
        <M c={c} />
      </mesh>
      <mesh position={[0.38, -1.9, 0]}>
        <boxGeometry args={[0.75, 0.16, 0.36]} />
        <M c={dark} />
      </mesh>
    </group>
  );
  return (
    <group position={[0, Math.abs(Math.cos(phase)) * 0.08, 0]}>
      {leg(0.45, sw)}
      {leg(-0.45, -sw)}
      <mesh position={[0, 2.3, 0]} rotation={[0, 0, 0.12]} scale={[1.5, 0.85, 0.75]}>
        <icosahedronGeometry args={[1, 1]} />
        <M c={c} />
      </mesh>
      <group position={[-1.1, 2.4, 0]} rotation={[0, Math.sin(phase) * 0.15, 0.08]}>
        <mesh position={[-1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.55, 2.8, 6]} />
          <M c={c} />
        </mesh>
      </group>
      <mesh position={[1.35, 2.78, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.32, 0.42, 0.85, 6]} />
        <M c={c} />
      </mesh>
      <group position={[1.75, 3.15, 0]}>
        <mesh position={[0.38, 0.06, 0]}>
          <boxGeometry args={[1.15, 0.52, 0.58]} />
          <M c={c} />
        </mesh>
        <group position={[-0.12, -0.18, 0]} rotation={[0, 0, -jaw]}>
          <mesh position={[0.52, -0.08, 0]}>
            <boxGeometry args={[1.0, 0.18, 0.48]} />
            <M c={dark} />
          </mesh>
        </group>
        {[0.3, -0.3].map((z) => (
          <mesh key={z} position={[0.28, 0.2, z]}>
            <sphereGeometry args={[0.065, 6, 6]} />
            <meshBasicMaterial color="#ffc93a" />
          </mesh>
        ))}
      </group>
      {[0.4, -0.4].map((z) => (
        <mesh key={z} position={[1.2, 2.0, z]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.06, 0.08, 0.55, 5]} />
          <M c={c} />
        </mesh>
      ))}
    </group>
  );
};

export const Sauropod: React.FC<{phase: number; c?: string}> = ({phase, c = '#7c8d5a'}) => {
  const sw = Math.sin(phase) * 0.22;
  const chain = (n: number, f: (t: number) => [number, number, number]) =>
    Array.from({length: n}, (_, i) => {
      const [x, y, r] = f(i / (n - 1));
      return (
        <mesh key={i} position={[x, y, 0]}>
          <icosahedronGeometry args={[r, 1]} />
          <M c={c} />
        </mesh>
      );
    });
  const leg = (x: number, z: number, a: number) => (
    <group key={`${x}${z}`} position={[x, 2.5, z]} rotation={[0, 0, a]}>
      <mesh position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.34, 0.3, 2.5, 7]} />
        <M c={c} />
      </mesh>
    </group>
  );
  const head = (t: number) => [1.6 + 2.6 * t, 3.3 + 4.2 * Math.pow(t, 0.75) + Math.sin(phase * 0.5) * 0.1 * t] as const;
  const [hx, hy] = head(1);
  return (
    <group>
      {leg(1.3, 0.6, sw)}
      {leg(1.3, -0.6, -sw)}
      {leg(-1.3, 0.6, -sw)}
      {leg(-1.3, -0.6, sw)}
      <mesh position={[0, 3.1, 0]} scale={[2.3, 1.35, 1.25]}>
        <icosahedronGeometry args={[1, 1]} />
        <M c={c} />
      </mesh>
      {chain(14, (t) => [...head(t), 0.6 - 0.36 * t] as [number, number, number])}
      {chain(14, (t) => [-1.9 - 4.2 * t, 3.2 - 2.0 * t + Math.sin(phase + t * 3) * 0.15 * t, 0.6 - 0.52 * t])}
      <mesh position={[hx + 0.35, hy + 0.05, 0]} scale={[0.6, 0.3, 0.32]}>
        <icosahedronGeometry args={[1, 1]} />
        <M c={c} />
      </mesh>
    </group>
  );
};

export const Mouse: React.FC<{t: number; scared?: number}> = ({t, scared = 0}) => {
  const c = '#8b7b6c';
  const sh = scared * Math.sin(t * 2.5) * 0.04;
  return (
    <group position={[sh, 0, 0]} scale={1 - scared * 0.12}>
      <mesh position={[0, 0.38, 0]} scale={[0.62, 0.42, 0.44]}>
        <icosahedronGeometry args={[1, 1]} />
        <M c={c} />
      </mesh>
      <mesh position={[0.58, 0.5, 0]} scale={[0.32, 0.27, 0.26]}>
        <icosahedronGeometry args={[1, 1]} />
        <M c={c} />
      </mesh>
      {[0.17, -0.17].map((z) => (
        <mesh key={z} position={[0.48, 0.8, z]} scale={[0.16, 0.16, 0.05]} rotation={[0, 0.4 * Math.sign(z), 0]}>
          <icosahedronGeometry args={[1, 1]} />
          <M c="#d49a9a" />
        </mesh>
      ))}
      <mesh position={[0.9, 0.48, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <M c="#e48a9a" />
      </mesh>
      {[0.1, -0.1].map((z) => (
        <mesh key={z} position={[0.75, 0.58, z]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      ))}
      <mesh position={[-0.85, 0.22, 0]} rotation={[0, 0, 1.2 + Math.sin(t / 3) * 0.2]}>
        <cylinderGeometry args={[0.02, 0.035, 0.8, 5]} />
        <M c="#c99a8a" />
      </mesh>
    </group>
  );
};

export const Human: React.FC<{c?: string; o?: number; e?: string}> = ({c = '#d8d2c8', o = 1, e = '#000000'}) => (
  <group>
    {[0.14, -0.14].map((z) => (
      <mesh key={z} position={[0, 0.45, z]}>
        <cylinderGeometry args={[0.08, 0.07, 0.9, 6]} />
        <M c={c} o={o} e={e} />
      </mesh>
    ))}
    <mesh position={[0, 1.25, 0]}>
      <cylinderGeometry args={[0.22, 0.17, 0.75, 7]} />
      <M c={c} o={o} e={e} />
    </mesh>
    {[0.3, -0.3].map((z) => (
      <mesh key={z} position={[0, 1.2, z]} rotation={[0.12 * Math.sign(z), 0, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.7, 6]} />
        <M c={c} o={o} e={e} />
      </mesh>
    ))}
    <mesh position={[0, 1.83, 0]}>
      <icosahedronGeometry args={[0.17, 1]} />
      <M c={c} o={o} e={e} />
    </mesh>
  </group>
);

// ---------- ciudad ----------
const windowTex = () =>
  canvasTex(128, 256, (g) => {
    g.fillStyle = '#2a2638';
    g.fillRect(0, 0, 128, 256);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 4; x++) {
        const on = random(`w${x}-${y}`) > 0.45;
        g.fillStyle = on ? '#ffd38a' : '#151320';
        g.fillRect(8 + x * 30, 6 + y * 16, 20, 9);
      }
  });

export const City: React.FC = () => {
  const tex = useMemo(() => windowTex(), []);
  const blds = useMemo(
    () =>
      Array.from({length: 46}, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const z = 8 - Math.floor(i / 2) * 7.5 - random(`bz${i}`) * 2;
        const w = 5 + random(`bw${i}`) * 4;
        const h = 8 + random(`bh${i}`) * 26;
        const d = 5 + random(`bd${i}`) * 2;
        const x = side * (8 + w / 2 + random(`bx${i}`) * 1.5);
        const t = tex.clone();
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 8)));
        t.needsUpdate = true;
        return {x, z, w, h, d, t, c: ['#3b3550', '#463a4f', '#2f3247'][i % 3]};
      }),
    [tex],
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -100]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#26222c" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -100]}>
        <planeGeometry args={[14, 400]} />
        <meshStandardMaterial color="#1b1a20" roughness={0.6} />
      </mesh>
      {Array.from({length: 40}, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10 - i * 6]}>
          <planeGeometry args={[0.25, 2.5]} />
          <meshBasicMaterial color="#e8c56a" />
        </mesh>
      ))}
      {blds.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.c} map={b.t} emissiveMap={b.t} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.8} />
        </mesh>
      ))}
      {Array.from({length: 12}, (_, i) => {
        const x = (i % 2 ? 1 : -1) * 7.4;
        const z = 4 - Math.floor(i / 2) * 12;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 5, 6]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <Glow p={[-Math.sign(x) * 0.6, 5, 0]} s={2.4} c="#ffcf7a" o={0.9} />
          </group>
        );
      })}
    </group>
  );
};

export const Car: React.FC<{p: V3; c: string; dir: 1 | -1}> = ({p, c, dir}) => (
  <group position={p} rotation={[0, dir === 1 ? 0 : Math.PI, 0]}>
    <mesh position={[0, 0.45, 0]}>
      <boxGeometry args={[1.7, 0.6, 3.6]} />
      <M c={c} />
    </mesh>
    <mesh position={[0, 0.95, -0.2]}>
      <boxGeometry args={[1.4, 0.5, 1.8]} />
      <M c="#1d2430" />
    </mesh>
    {[0.55, -0.55].map((x) => (
      <Glow key={x} p={[x, 0.5, 1.85]} s={1.4} c="#fff2c4" o={0.9} />
    ))}
    {[0.6, -0.6].map((x) => (
      <Glow key={x} p={[x, 0.5, -1.85]} s={0.9} c="#ff3030" o={0.8} />
    ))}
  </group>
);

export const Fern: React.FC<{p: V3; s?: number; c?: string}> = ({p, s = 1, c = '#1f4a2a'}) => (
  <group position={p} scale={s}>
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[0, 0.5, 0]} rotation={[0.9 * Math.cos(i * 0.9), i * 0.9, 0.9 * Math.sin(i * 0.9)]}>
        <coneGeometry args={[0.18, 1.6, 4]} />
        <M c={c} />
      </mesh>
    ))}
  </group>
);

export const Rock: React.FC<{p: V3; s: number; c?: string}> = ({p, s, c = '#3d4048'}) => (
  <mesh position={p} scale={[s * 1.3, s * 0.8, s]} rotation={[0.2, random(`rk${p[0]}`) * 3, 0.1]}>
    <icosahedronGeometry args={[1, 0]} />
    <M c={c} />
  </mesh>
);
