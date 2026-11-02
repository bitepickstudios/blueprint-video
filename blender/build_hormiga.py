"""Video "Te encogiste al tamaño de una hormiga": escenarios, personajes, cámaras y animación en Blender.
Ejecutar dentro de Blender: exec(open(r".../blender/build_hormiga.py", encoding="utf-8").read())
"""
import importlib
import json
import math
import random
import sys

import bpy
from mathutils import Vector

BASE = r"C:/Users/USER/Desktop/BluePrint-Project/"
sys.path.insert(0, BASE + "blender")
import toy  # noqa: E402
import sets  # noqa: E402

importlib.reload(toy)
importlib.reload(sets)
from toy import D, key  # noqa: E402

# ---------- tiempos desde la narración ----------
data = json.load(open(BASE + "video/public/06/data.json", encoding="utf-8"))
FPS = 30
lens_ = [math.ceil((s['dur'] + 0.12 + data['extra'][i]) * FPS) for i, s in enumerate(data['scenes'])]
START = [1]
for n in lens_[:-1]:
    START.append(START[-1] + n)
END = START[-1] + lens_[-1] - 1


def wf(i, k, nth=0):
    hits = [w for w in data['scenes'][i]['words'] if w['w'].lower().startswith(k)]
    w = hits[min(nth, len(hits) - 1)] if hits else data['scenes'][i]['words'][-1]
    return START[i] + round(w['s'] * FPS)


# ---------- limpiar y preparar ----------
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    for x in list(blk):
        blk.remove(x)
sc = bpy.context.scene
sc.timeline_markers.clear()
sets.setup_render(samples=24)
sets.world('#fff0d8', 0.55)
sc.frame_start, sc.frame_end = 1, END
sc.render.filepath = BASE + "blender/render6/f_"

H = 150
WX = 3000


def W(x, y, z):
    return (WX + x, y, z)


toy.CUR['col'] = toy.coll('Luces')
sets.sun('sol', (50, 0, 30), strength=3.2, angle=5)
sets.area('relleno_cocina', (1.5, -3.5, 2.6), (0, 0.6, 1.0), power=450, size=4)
sets.area('relleno_mesa', W(9, -14, H + 12), W(0, 5, H + 1), power=20000, size=18)
sets.area('relleno_piso', W(10, -22, 14), W(5, -5, 1), power=18000, size=20)
sets.kitchen((0, 0, 0))
sets.giant_room((WX, 0, 0), H)

# ---------- utilidades ----------
REST = {'armR': (0, -6, 0), 'armL': (0, 6, 0), 'legR': (0, 0, 0), 'legL': (0, 0, 0), 'head': (0, 0, 0), 'body': (0, 0, 0)}


def pose(P, f, **kw):
    for part, rot in kw.items():
        key(P[part], 'rotation_euler', f, rot)


def rest(P, f, *parts):
    for p in parts or REST:
        key(P[p], 'rotation_euler', f, REST[p])


def bodyz(P, f, z=0.47):
    key(P['body'], 'location', f, (0, 0, z))


def root(P, f, loc, rot=None):
    key(P['root'], 'location', f, loc)
    if rot is not None:
        key(P['root'], 'rotation_euler', f, rot if isinstance(rot, tuple) else (0, 0, rot))


def face(dx, dy):
    """Ángulo en Z para que un personaje (que mira a -Y) mire hacia (dx, dy)."""
    return math.degrees(math.atan2(dx, -dy))


def near(a, ref):
    """El ángulo equivalente a 'a' más cercano a 'ref' (para girar por el camino corto)."""
    return a + 360 * round((ref - a) / 360)


def fcurves(ob):
    ad = ob.animation_data
    if not ad or not ad.action:
        return []
    try:
        from bpy_extras import anim_utils
        cb = anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot)
        return list(cb.fcurves) if cb else []
    except Exception:
        return list(getattr(ad.action, 'fcurves', []))


def linear(ob, path, frames):
    """Tramos lineales (sin aceleración) desde los cuadros dados."""
    for fc in fcurves(ob):
        if fc.data_path == path:
            for kp in fc.keyframe_points:
                if int(round(kp.co[0])) in frames:
                    kp.interpolation = 'LINEAR'


def walk(P, f0, f1, period=10, amp=30, arm=35, lean=0, bob=0.02):
    s, f, h = 1, f0, period // 2
    while f + h <= f1:
        pose(P, f, legR=(s * amp, 0, 0), legL=(-s * amp, 0, 0), armR=(-s * arm, -6, 0), armL=(s * arm, 6, 0), body=(lean, 0, 0))
        bodyz(P, f)
        bodyz(P, f + h // 2, 0.47 + bob)
        f += h
        s = -s
    pose(P, f1, legR=(0, 0, 0), legL=(0, 0, 0), armR=REST['armR'], armL=REST['armL'], body=(0, 0, 0))
    bodyz(P, f1)


def breathe(P, f0, f1, period=24):
    for f in range(f0, f1 - period // 2, period):
        bodyz(P, f, 0.47)
        bodyz(P, f + period // 2, 0.482)
    bodyz(P, f1, 0.47)


SPARK = toy.mat('chispa', '#ffe066', 0.3, emit=8.0)


def glow(name, color, emit, alpha):
    m = toy.mat(name, color, 0.5, emit=emit)
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Alpha'].default_value = alpha
    try:
        m.surface_render_method = 'BLENDED'
    except Exception:
        pass
    return m


def burst(name, center, f, n=12, r=0.7, size=0.05, m=SPARK):
    rnd = random.Random(name)
    c = Vector(center)
    for k in range(n):
        a = 2 * math.pi * k / n + rnd.uniform(-0.25, 0.25)
        el = rnd.uniform(-0.3, 0.9)
        d = Vector((math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el)))
        s = toy.sphere(f'{name}{k}', tuple(c), size, m, seg=12)
        key(s, 'scale', f - 1, (0, 0, 0))
        key(s, 'location', f, tuple(c))
        key(s, 'scale', f, (size,) * 3)
        key(s, 'location', f + 12, tuple(c + d * r * rnd.uniform(0.7, 1.2)))
        key(s, 'scale', f + 8, (size * 1.2,) * 3)
        key(s, 'scale', f + 16, (0, 0, 0))


# ---------- personajes ----------
toy.CUR['col'] = toy.coll('Personajes')
N = toy.nico('Nico')
MINI = (0.6, 0.3, 0.797)
M = toy.dup(N, 'NicoMini', MINI, rot_z=-25)
G = toy.nico('NicoG')
N['root'].location = (0.38, -0.3, 0)
S = toy.spider('Arana')
WATER = toy.water()

s1, s2, s3, s4, s5, s6, s7 = START

# ================= 1a. cocina: Nico se encoge =================
hor = wf(0, 'hormiga')
breathe(N, s1, hor - 10)
rest(N, s1)
pose(N, s1 + 6, armR=(-55, -6, -20), armL=(-55, 6, 20), head=(22, 0, 0))   # se mira las manos
pose(N, hor - 8, armR=(-55, -6, -20), armL=(-55, 6, 20), head=(22, 0, 0))
pose(N, hor - 3, armR=(-150, -20, 0), armL=(-150, 20, 0), head=(-12, 0, 0))  # ¡eh!
for f, sv in ((s1, 1.0), (hor - 4, 1.0), (hor - 1, 1.12), (hor + 5, 0.0)):
    key(N['root'], 'scale', f, (sv, sv, sv))
burst('chispaPop', (0.38, -0.3, 0.8), hor + 3, n=14, r=0.9, size=0.04)
for f, sv in ((s1, 0.0), (hor + 5, 0.0), (hor + 9, 0.0048), (hor + 12, 0.004), (s2 - 1, 0.004), (s2, 0.0)):
    key(M['root'], 'scale', f, (sv, sv, sv))
ring = toy.torus('anillo_mini', (MINI[0], MINI[1], MINI[2] + 0.0005), 0.009, 0.0007, SPARK)
for f, sv in ((s1, 0.0), (hor + 8, 0.0), (hor + 14, 1.0), (hor + 24, 0.7), (hor + 34, 1.1), (s2 - 1, 1.0), (s2, 0.0)):
    key(ring, 'scale', f, (sv, sv, sv))
# vuelve a tamaño normal en la escena 7 y cierra
for f, sv in ((s7, 0.0), (s7 + 2, 0.0), (s7 + 7, 1.15), (s7 + 11, 1.0)):
    key(N['root'], 'scale', f, (sv, sv, sv))
burst('chispaVuelve', (0.38, -0.3, 0.8), s7 + 3, n=14, r=0.9, size=0.04)
per = wf(6, 'perdido')
com = wf(6, 'comenta')
apr = wf(6, 'aprender')
rest(N, s7)
rest(N, per - 4)
pose(N, per + 4, armR=(-40, -55, -12), armL=(-30, 60, 0), head=(0, 0, -12))  # se encoge de hombros
pose(N, com - 6, armR=(-40, -55, -12), armL=(-30, 60, 0), head=(0, 0, -12))
pose(N, com, armR=(-92, -6, 4), armL=REST['armL'], head=(4, 0, 0))  # señala a cámara
pose(N, apr - 2, armR=(-92, -6, 4), armL=REST['armL'])
pose(N, apr + 6, armR=REST['armR'])
for k, f in enumerate(range(apr + 2, apr + 62, 8)):
    pose(N, f, armL=(-12 if k % 2 else 12, 150, 0))
pose(N, apr + 70, armL=REST['armL'], head=(0, 0, 0))
breathe(N, s7, END)

# ================= 1b. mundo gigante: Nico mira todo enorme =================
cua = wf(0, 'cuatro')
ult = wf(0, 'última')
ven = wf(0, 'nadie')
toward_cup = face(-26 - 0, 46 - 8)
root(G, s1, W(0, 8, H), toward_cup)
root(G, cua, W(0, 8, H), toward_cup)
rest(G, s1)
pose(G, cua, head=(-32, 0, 0))
pose(G, ult - 6, head=(-32, 0, 14))
root(G, ult - 6, W(0, 8, H), toward_cup)
root(G, ult + 6, W(0, 8, H), face(4, -7))
pose(G, ult + 6, head=(0, 0, 0), armR=(-150, -25, 0), armL=(-150, 25, 0))  # ¡son enormes!
pose(G, ven - 2, armR=(-130, -25, 0), armL=(-130, 25, 0), head=(0, 0, 0))
pose(G, ven + 6, armR=(-70, -6, -28), armL=(-70, 6, 28), head=(6, 0, 22))   # nervioso
pose(G, ven + 18, head=(6, 0, -22))
pose(G, s2 - 1, armR=(-70, -6, -28), armL=(-70, 6, 28), head=(6, 0, 0))
breathe(G, cua, s2 - 1)

# ================= 2. peligro uno: resbala del borde =================
res = wf(1, 'resbalas')
bor = wf(1, 'borde')
root(G, s2, W(0, 6.5, H), 0)
rest(G, s2)
walk(G, s2, res - 3, period=10, amp=28, arm=30)
root(G, res - 3, W(0, 2.6, H), 0)
linear(G['root'], 'location', [s2])
# resbala: pies adelante, cola al piso, se desliza hasta pasar el borde
pose(G, res, legR=(-80, 0, 6), legL=(-70, 0, -6), body=(-28, 0, 0), armR=(-160, -40, 0), armL=(-150, 40, 0), head=(-18, 0, 0))
root(G, res + 4, W(0, 2.2, H - 0.3), 0)
slide_end = bor + 3
root(G, slide_end, W(0, -0.15, H - 0.3), (0, 0, 0))
linear(G['root'], 'location', [res + 4])
fall0, fall1 = slide_end + 4, s3 - 1
VZ = 0.45


def fall_pos(f):
    t = (f - fall0) / (fall1 - fall0)
    return W(0, -0.7 - 2.3 * t, H - 1.4 - VZ * (f - fall0))


root(G, fall0, fall_pos(fall0))
root(G, fall1, fall_pos(fall1))
linear(G['root'], 'location', [fall0])
for f, r in ((slide_end, (0, 0, 0)), (fall0 + 20, (-35, 15, 40)), (fall0 + 70, (25, -20, 110)), (fall0 + 130, (-20, 12, 170)), (fall1, (8, 0, 215))):
    key(G['root'], 'rotation_euler', f, r)
for k, f in enumerate(range(fall0, fall1 - 3, 7)):
    s = 1 if k % 2 else -1
    pose(G, f, armR=(-150 + s * 30, -40 - s * 20, 0), armL=(-150 - s * 30, 40 - s * 20, 0), legR=(s * 35, 0, 0), legL=(-s * 35, 0, 0), body=(0, 0, 0), head=(-10, 0, 0))

# ================= 3. ¡sí! el aire te frena =================
air = wf(2, 'aire')
land = wf(2, 'cualquier') + 6
las = wf(2, 'lastimarte')
face3 = face(3.6, -7.8)
root(G, s3, W(0, -4, 12), (0, 0, face3))
root(G, land - 40, W(0, -4, 2.6), (0, 0, face3))
root(G, land, W(0, -4, 0), (0, 0, face3))
root(G, s4 - 1, W(0, -4, 0), (0, 0, face3))
key(G['hat'], 'location', s3 - 1, (0, 0, 0.36))
key(G['hat'], 'location', s3, (0, 0, 0.62))
key(G['hat'], 'scale', s3 - 1, (1, 1, 1))
key(G['hat'], 'scale', s3, (1.5, 1.5, 1.5))
key(G['hat'], 'location', land + 2, (0, 0, 0.62))
key(G['hat'], 'location', land + 9, (0, 0, 0.36))
key(G['hat'], 'scale', land + 2, (1.5, 1.5, 1.5))
key(G['hat'], 'scale', land + 9, (1, 1, 1))
pose(G, s3, armR=(-176, -6, 0), armL=(-176, 6, 0), head=(0, 0, 0), body=(0, 0, 0))
for k, f in enumerate(range(s3, land - 4, 14)):
    s = 1 if k % 2 else -1
    pose(G, f, legR=(s * 14, 0, 0), legL=(-s * 14, 0, 0))
pose(G, land, armR=(-176, -6, 0), armL=(-176, 6, 0), legR=(0, 0, 0), legL=(0, 0, 0))
bodyz(G, s3)
bodyz(G, land)
bodyz(G, land + 3, 0.38)
bodyz(G, land + 8, 0.5)
bodyz(G, land + 12, 0.47)
pose(G, land + 10, armR=REST['armR'], armL=REST['armL'])
pose(G, las - 4, armR=REST['armR'], armL=REST['armL'])
pose(G, las + 2, armR=(-160, -35, 0), armL=(-160, 35, 0), head=(-8, 0, 0))   # ¡festeja!
root(G, las + 2, W(0, -4, 0))
root(G, las + 8, W(0, -4, 0.35))
root(G, las + 14, W(0, -4, 0))
pose(G, s4 - 2, armR=(-160, -35, 0), armL=(-160, 35, 0))
# líneas de aire alrededor mientras baja
streak_m = glow('aire_linea', '#ffffff', 2.0, 0.55)
rnd = random.Random('aire')
for k in range(8):
    a = 2 * math.pi * k / 8
    rr = rnd.uniform(0.55, 0.85)
    ln = toy.cyl(f'aire{k}', (math.cos(a) * rr, math.sin(a) * rr, 0), 0.012, 0.8, streak_m, parent=G['root'], verts=8)
    key(ln, 'scale', s3 - 1, (0, 0, 0))
    key(ln, 'scale', air - 12, (0, 0, 0))
    for c, f in enumerate(range(air - 10 + k * 2, land - 8, 14)):
        key(ln, 'location', f, (ln.location.x, ln.location.y, -0.6))
        key(ln, 'scale', f, (1, 1, 1))
        key(ln, 'location', f + 13, (ln.location.x, ln.location.y, 2.6))
    key(ln, 'scale', land - 6, (0, 0, 0))

# ================= 4. peligro dos: el hambre =================
ham = wf(3, 'hambre')
cal = wf(3, 'calor')
cmr = wf(3, 'comer')
root(G, s4, W(0, -4, 0), (0, 0, face3))
rest(G, s4)
breathe(G, s4, ham - 2)
pose(G, ham - 2, armR=REST['armR'], armL=REST['armL'], body=(0, 0, 0))
pose(G, ham + 4, armR=(-42, -6, -34), armL=(-42, 6, 34), head=(18, 0, 0))   # se agarra la panza
for k, f in enumerate(range(ham + 4, ham + 26, 3)):
    pose(G, f, body=(6, (4 if k % 2 else -4), 0))
pose(G, ham + 28, body=(4, 0, 0))
pose(G, cal - 8, armR=(-42, -6, -34), armL=(-42, 6, 34), body=(4, 0, 0), head=(14, 0, 0))
pose(G, cal - 2, armR=(-72, -6, -40), armL=(-72, 6, 40), head=(10, 0, 0))   # se abraza, tiembla
for k, f in enumerate(range(cal, cmr - 10, 2)):
    pose(G, f, body=(2, 0, 4 if k % 2 else -4))
pose(G, cmr - 8, body=(0, 0, 0), armR=(-72, -6, -40), armL=(-72, 6, 40))
heat_m = glow('calor', '#ff8a3d', 3.0, 0.6)
rnd = random.Random('calor')
for k in range(12):
    f = cal - 6 + k * 4
    x0, y0 = rnd.uniform(-0.25, 0.25), rnd.uniform(-0.2, 0.2)
    p = toy.sphere(f'calor{k}', (x0, y0, 0.8), 0.1, heat_m, G['root'], seg=12)
    key(p, 'scale', s1, (0, 0, 0))
    key(p, 'scale', f, (0, 0, 0))
    key(p, 'location', f, (x0, y0, 0.75))
    key(p, 'scale', f + 5, (0.11, 0.11, 0.11))
    key(p, 'location', f + 26, (x0 * 2.6, y0 * 2.6, 1.9))
    key(p, 'scale', f + 26, (0, 0, 0))
# la miga: camina hasta ella y la muerde
CR = W(1.25, -4.65, 0.42)
crumb = toy.empty('migaComida', CR)
crust, inner = toy.mat('pan', '#c98a3c', 0.7), toy.mat('miga', '#f2dcae', 0.85)
for k, (x, y, z, sx, sy, sz, m_) in enumerate(((0, 0, 0, 0.5, 0.44, 0.38, crust), (0.3, -0.12, 0.08, 0.32, 0.3, 0.3, crust), (-0.28, 0.1, 0.02, 0.3, 0.3, 0.27, crust),
                                               (0.05, 0.22, 0.18, 0.28, 0.24, 0.24, crust), (-0.1, -0.3, 0.12, 0.3, 0.12, 0.26, inner), (0.22, -0.3, 0.2, 0.18, 0.1, 0.16, inner))):
    toy.sphere(f'migaComida_{k}', (x, y, z), (sx, sy, sz), m_, crumb, seg=20, rot=(k * 17, k * 29, k * 41))
tc = face(CR[0] - WX - 0.0, CR[1] + 4)
root(G, cmr - 8, W(0, -4, 0), (0, 0, face3))
root(G, cmr - 2, W(0, -4, 0), (0, 0, tc))
walk(G, cmr - 2, cmr + 10, period=8, amp=25, arm=20)
root(G, cmr + 10, W(0.62, -4.32, 0), (0, 0, tc))
linear(G['root'], 'location', [cmr - 2])
pose(G, cmr + 14, armR=(-82, -6, -28), armL=(-82, 6, 28), body=(10, 0, 0), head=(0, 0, 0))
for k, f in enumerate(range(cmr + 16, s5 - 10, 7)):
    pose(G, f, head=(16 if k % 2 == 0 else -2, 0, 0))
for f, sv in ((s1, 1.0), (cmr + 16, 1.0), (s5 - 10, 0.72)):
    key(crumb, 'scale', f, (sv, sv, sv))
for k in range(6):
    burst(f'migita{k}_', (CR[0] - 0.4, CR[1] + 0.3, 0.75), cmr + 18 + k * 9, n=4, r=0.5, size=0.04, m=toy.mat('miga', '#f2dcae', 0.85))

# ================= 5. peligro tres: la araña =================
ara = wf(4, 'araña')
ell = wf(4, 'para')
alm = wf(4, 'almuerzo')
cor = wf(4, 'corre')
SP0 = W(-2.6, 3.2, 0)
key(S['root'], 'location', s1, W(-2.6, 3.2, 60))
key(S['root'], 'location', ara - 30, W(-2.6, 3.2, 60))
key(S['root'], 'location', ara + 30, SP0)
thread = toy.cyl('hilo', (0, 0.2, 75.5), 0.03, 150, glow('seda', '#eef0ff', 0.6, 0.8), parent=S['body'], verts=8)
key(thread, 'scale', s1, (0, 0, 0))
key(thread, 'scale', s5 - 1, (0, 0, 0))
key(thread, 'scale', s5, (1, 1, 1))
for f, sv in ((s1, 0), (s5 - 1, 0), (s5, 1)):
    key(S['root'], 'scale', f, (sv, sv, sv))
key(thread, 'scale', cor + 2, (1, 1, 1))
key(thread, 'scale', cor + 3, (0, 0, 0))
nf = face(2.0, -8.5)
root(G, s5, W(0.62, -4.32, 0), (0, 0, tc))
rest(G, s5)
root(G, s5 + 10, W(0.62, -4.32, 0), (0, 0, nf))
breathe(G, s5, ell)
pose(G, ara + 26, head=(0, 0, 0))
pose(G, ara + 32, head=(-10, 0, 0))     # algo cayó atrás
tsp = near(face(-2.6 - 0.62, 3.2 + 4.32), nf)
root(G, ell - 2, W(0.62, -4.32, 0), (0, 0, nf))
root(G, ell + 8, W(0.62, -4.32, 0), (0, 0, tsp))
pose(G, ell + 8, armR=REST['armR'], armL=REST['armL'], head=(-12, 0, 0))
pose(G, alm, armR=(-130, -30, 0), armL=(-130, 30, 0), head=(-14, 0, 0), legR=(0, 0, 0), legL=(0, 0, 0))   # se asusta
root(G, alm + 2, W(0.62, -4.32, 0), (0, 0, tsp))
root(G, alm + 22, W(0.9, -5.4, 0), (0, 0, tsp))
for k, f in enumerate(range(alm + 2, cor - 2, 3)):
    pose(G, f, body=(-6, 0, 3 if k % 2 else -3))
# la araña se levanta y abre los colmillos
for f, r in ((s1, 0), (alm - 4, 0), (alm + 6, -24), (cor - 2, -24), (cor + 6, 0)):
    key(S['body'], 'rotation_euler', f, (r, 0, 0))
for hip, sd, k in S['legs']:
    if k == 0:
        for f, a in ((s1, 0), (alm - 4, 0), (alm + 6, 50), (cor - 2, 50), (cor + 6, 0)):
            key(hip, 'rotation_euler', f, (0, -sd * a, 0))
for nm, sd in (('fangR', 1), ('fangL', -1)):
    for k, f in enumerate(range(alm, cor + 4, 6)):
        key(S[nm], 'rotation_euler', f, (0, -sd * (28 if k % 2 == 0 else 4), 0))
# ¡corre!
RUN_END = W(14, -8, 0)
rf = near(face(14 - 0.9, -8 + 5.4), tsp)
root(G, cor - 2, W(0.9, -5.4, 0), (0, 0, tsp))
root(G, cor + 4, W(0.9, -5.4, 0), (0, 0, rf))
run_stop = s6 + 14
walk(G, cor + 4, run_stop, period=6, amp=55, arm=60, lean=14, bob=0.06)
root(G, run_stop, RUN_END, (0, 0, rf))
linear(G['root'], 'location', [cor + 4])
pose(G, cor + 4, head=(0, 0, 0))
# la araña lo persigue
chase = face(5.5 + 2.6, -3.8 - 3.2)
key(S['root'], 'rotation_euler', cor + 2, (0, 0, 0))
key(S['root'], 'rotation_euler', cor + 8, (0, 0, D(chase)))
key(S['root'], 'location', cor + 6, SP0)
key(S['root'], 'location', s6 - 1, W(5.5, -3.8, 0))
linear(S['root'], 'location', [cor + 6])
key(S['root'], 'location', s6, W(-80, 90, 0))   # fuera de cuadro en la escena 6
for k, f in enumerate(range(cor + 6, s6, 3)):
    for hip, sd, j in S['legs']:
        grp = (j + (0 if sd > 0 else 1)) % 2
        sw = 18 if (k + grp) % 2 else -18
        key(hip, 'rotation_euler', f, (0, -sd * (14 if (k + grp) % 2 else 0), sw))

# ================= 6. peligro cuatro: la gota =================
ine = wf(5, 'inesperado')
got = wf(5, 'gota')
apl = wf(5, 'aplasta')
peg = wf(5, 'pegamento')
sal = wf(5, 'salir')
DROP = W(14, -8, 0)
fc6 = near(face(3.6, -5.6), rf)
root(G, run_stop + 2, RUN_END, (0, 0, rf))
root(G, run_stop + 10, RUN_END, (0, 0, fc6))
pose(G, run_stop + 4, armR=REST['armR'], armL=REST['armL'], body=(10, 0, 0), head=(10, 0, 0))
pose(G, run_stop + 16, armR=(-150, -6, -42), body=(6, 0, 0), head=(6, 0, 0))   # se seca la frente: uff
pose(G, ine - 6, armR=(-150, -6, -42))
pose(G, ine + 2, armR=REST['armR'], body=(0, 0, 0), head=(0, 0, 28))
pose(G, ine + 14, head=(0, 0, -28))
pose(G, got - 6, head=(0, 0, 0))
pose(G, got, head=(-38, 0, 0), armR=(-40, -30, 0), armL=(-40, 30, 0))  # mira arriba
breathe(G, run_stop + 16, got)
hit = apl - 22
drop = toy.sphere('gota', W(14, -8, 40), (1.0, 1.0, 1.25), WATER, seg=48)
key(drop, 'location', s1, W(14, -8, 40))
key(drop, 'scale', s1, (1.0, 1.0, 1.25))
key(drop, 'location', got - 2, W(14, -8, 40))
key(drop, 'location', hit, W(14, -8, 1.0))
linear(drop, 'location', [got - 2])
key(drop, 'scale', hit - 1, (1.0, 1.0, 1.25))
key(drop, 'location', hit + 1, W(14, -8, 0.82))
for f, sv in ((hit + 1, (1.5, 1.5, 0.78)), (hit + 6, (1.24, 1.24, 1.0)), (hit + 12, (1.38, 1.38, 0.86)), (hit + 20, (1.3, 1.3, 0.93)), (hit + 30, (1.34, 1.34, 0.9))):
    key(drop, 'scale', f, sv)
key(drop, 'location', hit + 30, W(14, -8, 0.88))
rnd = random.Random('salpica')
for k in range(12):
    a = 2 * math.pi * k / 12 + rnd.uniform(-0.2, 0.2)
    dist = rnd.uniform(1.8, 3.2)
    sz = rnd.uniform(0.1, 0.22)
    d = toy.sphere(f'salpica{k}', W(14, -8, 0.3), sz, WATER, seg=20)
    key(d, 'scale', s1, (0, 0, 0))
    key(d, 'scale', hit, (0, 0, 0))
    key(d, 'location', hit, W(14 + math.cos(a) * 1.1, -8 + math.sin(a) * 1.1, 0.4))
    key(d, 'scale', hit + 1, (sz, sz, sz))
    key(d, 'location', hit + 7, W(14 + math.cos(a) * dist * 0.75, -8 + math.sin(a) * dist * 0.75, rnd.uniform(1.0, 1.8)))
    key(d, 'location', hit + 14, W(14 + math.cos(a) * dist, -8 + math.sin(a) * dist, sz * 0.6))
    key(d, 'scale', hit + 14, (sz, sz, sz * 0.7))
# atrapado: se agita, empuja la pared de agua, se rinde
pose(G, hit, head=(-38, 0, 0), armR=(-40, -30, 0), armL=(-40, 30, 0))
bodyz(G, hit)
bodyz(G, hit + 3, 0.4)
bodyz(G, hit + 9, 0.47)
for k, f in enumerate(range(hit + 4, peg - 14, 9)):
    s = 1 if k % 2 else -1
    pose(G, f, armR=(-150 + s * 40, -30, 0), armL=(-150 - s * 40, 30, 0), legR=(s * 30, 0, 0), legL=(-s * 30, 0, 0), head=(0, 0, s * 10), body=(0, 0, 0))
pose(G, peg - 12, armR=(-60, -6, 0), armL=(-60, 6, 0), legR=(0, 0, 0), legL=(0, 0, 0), head=(0, 0, 0), body=(0, 0, 0))
pose(G, peg - 2, armR=(-92, -6, 6), armL=(-92, 6, -6), body=(16, 0, 0), legR=(20, 0, 0), legL=(-25, 0, 0))   # empuja
pose(G, peg + 14, armR=(-92, -6, 6), armL=(-92, 6, -6), body=(18, 0, 0))
pose(G, peg + 22, armR=(-130, -30, 0), armL=(-130, 30, 0), body=(-14, 0, 0), legR=(-20, 0, 0), legL=(10, 0, 0))   # lo devuelve
root(G, peg + 14, RUN_END, (0, 0, fc6))
root(G, peg + 24, W(13.85, -7.75, 0), (0, 0, fc6))
fwd = Vector((math.sin(D(fc6)), -math.cos(D(fc6)), 0))
bul = toy.sphere('gota_bulto', W(14, -8, 0.85), 0.45, WATER, seg=32)
c0 = Vector(W(14, -8, 0.85)) + fwd * 1.2
c1 = Vector(W(14, -8, 0.85)) + fwd * 1.5
for f, loc, sv in ((s1, c0, 0), (peg - 4, c0, 0), (peg, c0, 0.3), (peg + 14, c1, 0.5), (peg + 18, c1, 0.5), (peg + 22, c0, 0.25), (peg + 26, c0, 0)):
    key(bul, 'location', f, tuple(loc))
    key(bul, 'scale', f, (sv, sv, sv))
for f, sv in ((peg + 14, (1.3, 1.3, 0.93)), (peg + 22, (1.4, 1.4, 0.86)), (peg + 30, (1.3, 1.3, 0.93)), (peg + 40, (1.33, 1.33, 0.9))):
    key(drop, 'scale', f, sv)
pose(G, sal - 10, armR=(-60, -6, 0), armL=(-60, 6, 0), body=(0, 0, 0), legR=(0, 0, 0), legL=(0, 0, 0))
root(G, sal - 10, W(13.85, -7.75, 0), (0, 0, fc6))
root(G, sal + 2, W(13.85, -7.75, -0.3), (0, 0, fc6))
pose(G, sal + 2, legR=(-85, 0, 8), legL=(-85, 0, -8), body=(10, 0, 0), armR=(-40, -6, -20), armL=(-40, 6, 20), head=(24, 0, 0))   # se sienta, triste
pose(G, END, head=(28, 0, 0))
bub_m = glow('burbuja', '#ffffff', 0.8, 0.5)
for k in range(7):
    f = hit + 20 + k * 26
    x = rnd.uniform(-0.15, 0.15)
    b = toy.sphere(f'burbuja{k}', W(14 + x, -8.1, 1.2), 0.05, bub_m, seg=12)
    key(b, 'scale', s1, (0, 0, 0))
    key(b, 'scale', f, (0, 0, 0))
    key(b, 'location', f, W(13.9 + x, -8.1, 1.15))
    key(b, 'scale', f + 2, (0.05, 0.05, 0.05))
    key(b, 'location', f + 24, W(14 + x * 2, -8.1, 1.68))
    key(b, 'scale', f + 24, (0.07, 0.07, 0.07))
    key(b, 'scale', f + 26, (0, 0, 0))

# ---------- cámaras y cortes ----------
toy.CUR['col'] = toy.coll('Camaras')


def camera(name, keys, lens=32, dof=None, fstop=2.8, clip=(0.05, 3000), focus=None):
    c = toy.cam(name, keys[0][1], keys[0][2], lens)
    c.data.clip_start, c.data.clip_end = clip
    prev = None
    for f, loc, look in keys:
        c.location = loc
        q = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y')
        c.rotation_euler = q.to_euler('XYZ', prev) if prev else q.to_euler('XYZ')
        prev = c.rotation_euler.copy()
        c.keyframe_insert('location', frame=f)
        c.keyframe_insert('rotation_euler', frame=f)
    if dof:
        c.data.dof.use_dof = True
        c.data.dof.focus_object = bpy.data.objects[dof]
        c.data.dof.aperture_fstop = fstop
    if focus:
        c.data.dof.use_dof = True
        c.data.dof.aperture_fstop = fstop
        for f, dist in focus:
            c.data.dof.focus_distance = dist
            c.data.dof.keyframe_insert('focus_distance', frame=f)
    m = sc.timeline_markers.new(name, frame=keys[0][0])
    m.camera = c
    return c


def gx(x, y, z):
    return W(x, y, z)


# 1a cocina
camera('c1_cocina', [(s1, (0.2, -2.6, 1.05), (0.3, 0.2, 0.95)), (hor + 6, (0.25, -2.4, 1.02), (0.4, 0.2, 0.9)),
                     (cua - 12, (0.57, 0.02, 0.86), MINI), (cua - 1, (0.59, 0.2, 0.815), MINI)], lens=32, fstop=4.0, clip=(0.004, 300),
       focus=[(s1, 2.35), (hor + 6, 2.3), (cua - 12, 0.29), (cua - 1, 0.105)])
# 1b mesa gigante
camera('c2_mesa', [(cua, gx(4.0, 1.2, H + 0.5), gx(-1.4, 9.8, H + 3.2)), (s2 - 1, gx(4.8, 0.6, H + 0.8), gx(-1.4, 9.8, H + 3.6))], lens=24, dof='NicoG_skull', fstop=2.2)
# 2 resbala
camera('c3_borde', [(s2, gx(6.6, -1.8, H + 1.2), gx(0, 3.4, H + 0.5)), (res, gx(6.2, -2.4, H + 0.9), gx(0, 2.0, H + 0.3)), (fall0, gx(5.8, -3.2, H + 0.3), gx(0, -0.5, H - 1.0)), (fall0 + 12, gx(5.8, -3.4, H - 0.6), gx(0, -0.8, H - 4.0))], lens=26, dof='NicoG_skull', fstop=2.8)
# 2b cae: cámara arriba mirando hacia abajo
cut2 = fall0 + 13
p0, p1 = Vector(fall_pos(cut2)), Vector(fall_pos(fall1))
camera('c4_caida', [(cut2, tuple(p0 + Vector((1.2, -1.8, 4.6))), tuple(p0)), (fall1, tuple(p1 + Vector((-1.0, -2.0, 4.2))), tuple(p1))], lens=26, dof='NicoG_skull', fstop=9)
linear(bpy.data.objects['c4_caida'], 'location', [cut2])
# 3 aterriza
camera('c5_aterriza', [(s3, gx(3.6, -11.8, 1.1), gx(0, -4, 9.5)), (land, gx(3.4, -11.4, 1.0), gx(0, -4, 1.0)), (s4 - 1, gx(3.2, -11.0, 0.95), gx(0, -4, 0.9))], lens=30, dof='NicoG_skull', fstop=2.4)
# 4 hambre
camera('c6_hambre', [(s4, gx(2.6, -8.9, 0.95), gx(0.3, -4.1, 0.8)), (s5 - 1, gx(2.2, -7.9, 0.9), gx(0.6, -4.3, 0.75))], lens=32, dof='NicoG_skull', fstop=2.2)
# 5 araña
camera('c7_arana', [(s5, gx(2.4, -13.0, 1.4), gx(-1.0, -1.0, 2.6)), (cor, gx(2.0, -12.0, 1.3), gx(-0.6, -2.0, 1.6)), (s6 - 1, gx(4.5, -12.5, 1.2), gx(5.0, -5.5, 1.1))], lens=28, dof='NicoG_skull', fstop=3.2)
# 6 gota
camera('c8_respira', [(s6, gx(17.5, -14.5, 1.3), gx(12.6, -7.4, 0.9)), (got - 1, gx(17.0, -13.6, 1.2), gx(13.6, -7.8, 0.9))], lens=32, dof='NicoG_skull', fstop=2.4)
camera('c9_arriba', [(got, gx(12.2, -10.6, 0.25), gx(14.3, -7.4, 6.0)), (hit - 1, gx(12.1, -10.8, 0.22), gx(14.2, -7.5, 5.0))], lens=20)
camera('c10_atrapado', [(hit, gx(17.8, -13.9, 1.55), gx(14, -8, 0.95)), (s7 - 1, gx(16.8, -12.4, 1.3), gx(14, -8, 0.9))], lens=34, dof='NicoG_skull', fstop=3.0)
# 7 cocina
camera('c11_cocina', [(s7, (0.2, -2.4, 1.05), (0.3, 0.3, 0.98)), (END, (0.18, -2.2, 1.0), (0.3, 0.3, 0.98))], lens=30, dof='Nico_skull', fstop=2.8)
sc.camera = bpy.data.objects['c1_cocina']

bpy.ops.wm.save_as_mainfile(filepath=BASE + "blender/hormiga.blend")
print('listo', START, END, 'objetos', len(bpy.data.objects))
