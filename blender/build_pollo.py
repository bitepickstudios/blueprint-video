"""Video "¿Hoy comiste dinosaurio?": arma escenarios, personajes, cámaras y animación en Blender.
Ejecutar dentro de Blender: exec(open(r".../blender/build_pollo.py", encoding="utf-8").read())
"""
import importlib
import json
import math
import sys

import bpy

BASE = r"C:/Users/USER/Desktop/BluePrint-Project/"
sys.path.insert(0, BASE + "blender")
import toy  # noqa: E402
import sets  # noqa: E402

importlib.reload(toy)
importlib.reload(sets)
from toy import D, key  # noqa: E402

# ---------- tiempos desde la narración ----------
data = json.load(open(BASE + "video/public/05/data.json", encoding="utf-8"))
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
sc = bpy.context.scene
sc.timeline_markers.clear()
sets.setup_render(samples=24)
sets.world('#cfe7ff', 0.6)
sc.frame_start, sc.frame_end = 1, END
sc.render.filepath = BASE + "blender/render/f_"

O_K, O_Y, O_S, O_F = (0, 0, 0), (60, 0, 0), (120, 0, 0), (180, 0, 0)
toy.CUR['col'] = toy.coll('Luces')
sets.sun('sol', (55, 0, 200), strength=3.5, angle=6)
sets.area('relleno_cocina', (1.5, -3.5, 2.6), (0, 0.6, 1.0), power=450, size=4)
sets.area('relleno_patio', (O_Y[0] + 2, -9, 4), (O_Y[0], -2, 0.8), power=1200, size=6)
sets.area('relleno_granja', (O_F[0], -16, 10), (O_F[0], 8, 0), power=6000, size=12)
sets.kitchen(O_K)
sets.yard(O_Y)
sets.stage(O_S)

# gallina prototipo para la granja (colección excluida del render directo)
toy.CUR['col'] = toy.coll('ProtoGallina')
_pr = toy.bird('Proto', 'gallina')['root']
_pr.scale = (1.6, 1.6, 1.6)
_pr.rotation_euler = (0, D(90), 0)  # el sistema de partículas alinea el eje X del modelo con la vertical
proto = bpy.data.collections['ProtoGallina']
sets.farm(O_F, proto)
bpy.context.view_layer.layer_collection.children['ProtoGallina'].exclude = True

toy.CUR['col'] = toy.coll('Personajes')

# ---------- 1 y 7: cocina ----------
N = toy.nico('Nico')
N['root'].location = (0.38, -0.3, 0)
meat, bone = toy.mat('pollo_asado', '#c9772c', 0.45), toy.mat('blanco', '#f7f4ee', 0.5)
leg = toy.empty('muslo', (0, 0, -0.4), N['armR'], rot=(180, 0, 0))
toy.sphere('muslo_carne', (0, 0, 0.1), (0.07, 0.07, 0.11), meat, leg)
toy.cyl('muslo_hueso', (0, 0, 0.24), 0.014, 0.12, bone, parent=leg)
toy.sphere('muslo_punta', (0, 0, 0.3), 0.025, bone, leg)
s1, s7 = START[0], START[6]
dino_w = wf(0, 'dinosaurio')
for f, rx in ((s1, -60), (wf(0, 'pollo') - 6, -60), (wf(0, 'pollo') + 4, -112), (dino_w - 2, -112), (dino_w + 4, -80)):
    key(N['armR'], 'rotation_euler', f, (rx, 0, -12))
key(N['armL'], 'rotation_euler', s1, (0, 8, 0))
key(N['armL'], 'rotation_euler', dino_w, (0, 8, 0))
key(N['armL'], 'rotation_euler', dino_w + 5, (-20, 35, 0))
for f, v in ((s1, (1, 1, 1)), (dino_w, (1, 1, 1)), (dino_w + 4, (1.7, 1, 2.8))):
    key(N['mouth'], 'scale', f, tuple(a * b for a, b in zip(v, (0.045, 0.015, 0.02))))
for f, z in ((s1, 0.36), (dino_w, 0.36), (dino_w + 3, 0.5), (dino_w + 9, 0.38), (dino_w + 12, 0.36)):
    key(N['hat'], 'location', f, (0, 0, z))
for f, rx in ((s1, 0), (dino_w, 0), (dino_w + 4, 8)):
    key(N['head'], 'rotation_euler', f, (rx, 0, 0))
# cierre (escena 7): mira el muslo, mira a cámara y se encoge de hombros
com = wf(6, 'comiendo')
key(N['head'], 'rotation_euler', s7, (-14, 0, -18))
key(N['head'], 'rotation_euler', com - 4, (-14, 0, -18))
key(N['head'], 'rotation_euler', com + 4, (6, 0, 0))
key(N['mouth'], 'scale', s7, (0.045, 0.015, 0.02))
key(N['mouth'], 'scale', com, (0.045, 0.015, 0.02))
key(N['mouth'], 'scale', com + 4, (0.07, 0.015, 0.05))
key(N['armR'], 'rotation_euler', s7, (-80, 0, -12))
key(N['armR'], 'rotation_euler', com, (-80, 0, -12))
key(N['armR'], 'rotation_euler', com + 6, (-40, -55, -12))
key(N['armL'], 'rotation_euler', s7, (0, 8, 0))
key(N['armL'], 'rotation_euler', com, (0, 8, 0))
key(N['armL'], 'rotation_euler', com + 6, (-30, 60, 0))
key(N['hat'], 'location', s7, (0, 0, 0.36))
for f in range(s1, END, 16):
    key(N['body'], 'location', f, (0, 0, 0.47))
    key(N['body'], 'location', f + 8, (0, 0, 0.485))

# T-Rex que se asoma por la ventana
RW = toy.theropod('RexVentana')
RW['root'].scale = (1.7, 1.7, 1.7)
for f, z in ((s1, -4.4), (dino_w - 3, -4.4), (dino_w + 7, -2.05), (dino_w + 11, -2.3), (dino_w + 14, -2.25)):
    key(RW['root'], 'location', f, (-0.9, 5.2, z))
for f, a in ((dino_w + 8, 0), (dino_w + 14, 22), (dino_w + 24, 6)):
    key(RW['jaw'], 'rotation_euler', f, (a, 0, 0))
key(RW['root'], 'location', s7, (-0.9, 5.2, -2.25))
for f, a in ((s7, (0, 0, 0)), (s7 + 30, (0, 0, -12)), (s7 + 60, (0, 0, 10)), (END, (0, 0, 0))):
    key(RW['head'], 'rotation_euler', f, (10 + a[0], a[1], a[2]))
eye = bpy.data.objects['RexVentana_eye1']
wink = wf(6, 'video')
for f, z in ((wink - 2, 0.1), (wink + 2, 0.015), (wink + 7, 0.1)):
    key(eye, 'scale', f, (0.1, 0.1, z))

# ---------- 2 y 5: patio ----------
ox = O_Y[0]
G = toy.bird('GallinaPatio', 'gallina')
G['root'].location = (ox, -4, 0)
G['root'].scale = (2.2, 2.2, 2.2)
s2 = START[1]
for k, f in enumerate(range(s2, s2 + 70, 14)):
    key(G['head'], 'rotation_euler', f, (0, 0, 0))
    key(G['head'], 'rotation_euler', f + 7, (45, 0, 0))
son = wf(1, 'son', 1)
key(G['head'], 'rotation_euler', son, (0, 0, 0))
key(G['head'], 'rotation_euler', son + 40, (0, 0, -60))
RY = toy.theropod('RexPatio')
for f, x in ((s2, ox + 8), (son - 20, ox + 8), (son + 30, ox + 2.4)):
    key(RY['root'], 'location', f, (x, -3.5, 0))
key(RY['root'], 'rotation_euler', son + 30, (0, 0, -90))
key(RY['root'], 'rotation_euler', son + 44, (0, 0, -45))
for f in range(son - 20, son + 32, 8):
    s = 1 if (f // 8) % 2 else -1
    key(RY['legR'], 'rotation_euler', f, (s * 22, 0, 0))
    key(RY['legL'], 'rotation_euler', f, (-s * 22, 0, 0))
key(RY['legR'], 'rotation_euler', son + 34, (0, 0, 0))
key(RY['legL'], 'rotation_euler', son + 34, (0, 0, 0))
key(RY['head'], 'rotation_euler', son + 40, (10, 0, 0))
key(RY['head'], 'rotation_euler', son + 52, (24, 0, 20))
# asteroide cruzando el cielo
toy.CUR['col'] = toy.coll('Asteroide')
ast = toy.empty('asteroide')
toy.sphere('asteroide_roca', (0, 0, 0), 0.55, toy.mat('roca', '#5a4038', 0.8), ast)
for k in range(6):
    toy.sphere(f'asteroide_fuego{k}', (0.55 + k * 0.5, 0, 0), 0.5 - k * 0.07, toy.mat('cola_fuego' if k % 2 else 'cola_fuego2', '#ffb347' if k % 2 else '#ff6a1a', 0.5, emit=6.0), ast)
ta = wf(1, 'asteroide')
for f, loc in ((s2, (ox + 9, 11, 7.5)), (ta - 14, (ox + 9, 11, 7.5)), (ta + 18, (ox - 9, 11, 3.6))):
    key(ast, 'location', f, loc)
ast.rotation_euler = (0, D(-15), 0)
toy.CUR['col'] = toy.coll('Personajes')
# aves en la cerca (escena 5)
for k, kind in enumerate(('gallina', 'tucan', 'loro', 'paloma', 'picaflor')):
    B = toy.bird(f'Cerca_{kind}', kind)
    B['root'].location = (ox - 2.4 + k * 1.2, 3.0, 0.9)
    sc_ = 1.6 if kind != 'picaflor' else 1.6
    B['root'].scale = tuple(v * sc_ for v in B['root'].scale)
    for f in range(START[4], START[5], 20 + k * 3):
        key(B['head'], 'rotation_euler', f, (0, 0, -25 + (f // 20 % 2) * 50))

# ---------- 3 y 4: escenario ----------
sx = O_S[0]
RS = toy.theropod('RexEsc')
RS['root'].location = (sx - 2.0, 0, 0.24)
RS['root'].rotation_euler = (0, 0, D(-15))
RA = toy.theropod('Raptor', skin='#c9783a', belly='#f2d29a', spots='#8a4a22', feathers='#e85d3a', tooth=True)
RA['root'].location = (sx + 0.5, 0, 0.24)
RA['root'].scale = (0.42, 0.42, 0.42)
RA['root'].rotation_euler = (0, 0, D(-25))
GS = toy.bird('GallinaEsc', 'gallina')
GS['root'].location = (sx + 1.9, 0, 0.24)
GS['root'].scale = (1.8, 1.8, 1.8)
GS['root'].rotation_euler = (0, 0, D(-25))
key(GS['root'], 'location', START[2], (sx + 1.9, 0, 0.24))
key(GS['root'], 'location', START[3] - 1, (sx + 1.9, 0, 0.24))
key(GS['root'], 'location', START[3], (sx + 1.25, 0.1, 0.24))
for fc in GS['root'].animation_data.action.fcurves if hasattr(GS['root'].animation_data.action, 'fcurves') else []:
    for kp in fc.keyframe_points:
        kp.interpolation = 'CONSTANT'
for P, period in ((RS, 50), (RA, 34), (GS, 22)):
    for f in range(START[2], START[4], period):
        key(P['head'], 'rotation_euler', f, (8, 0, -10))
        key(P['head'], 'rotation_euler', f + period // 2, (8 if P is not GS else 0, 0, 12))

# ---------- cámaras y cortes ----------
toy.CUR['col'] = toy.coll('Camaras')
cams = []


def shot(i, a_loc, a_look, b_loc, b_look, lens=32, dof=None, f0=None, f1=None):
    c = toy.cam(f'cam{i + 1}', a_loc, a_look, lens)
    f0 = f0 or START[i]
    f1 = f1 or (START[i + 1] - 1 if i + 1 < len(START) else END)
    c.location = a_loc
    toy.aim(c, a_look)
    c.keyframe_insert('location', frame=f0)
    c.keyframe_insert('rotation_euler', frame=f0)
    c.location = b_loc
    toy.aim(c, b_look)
    c.keyframe_insert('location', frame=f1)
    c.keyframe_insert('rotation_euler', frame=f1)
    if dof:
        c.data.dof.use_dof = True
        c.data.dof.focus_object = bpy.data.objects[dof]
        c.data.dof.aperture_fstop = 3.2
    m = sc.timeline_markers.new(f'S{i + 1}', frame=START[i])
    m.camera = c
    cams.append(c)
    return c


shot(0, (0.2, -2.6, 1.05), (0.1, 0.6, 1.35), (0.15, -2.1, 1.0), (0.1, 0.6, 1.35), lens=28, dof='Nico_skull')
shot(1, (ox - 0.4, -10.6, 1.3), (ox + 0.9, -3.8, 1.3), (ox + 0.4, -10.0, 1.5), (ox + 1.1, -3.8, 1.5), lens=32)
shot(2, (sx - 2.6, -4.8, 2.3), (sx - 2.0, 0, 1.7), (sx + 1.3, -3.6, 1.1), (sx + 1.3, 0, 0.7), lens=35)
shot(3, (sx + 0.85, -1.75, 0.95), (sx + 0.85, 0, 0.7), (sx + 0.85, -1.55, 0.3), (sx + 0.85, 0, 0.2), lens=26)
shot(4, (ox - 2.4, 1.3, 1.25), (ox - 2.4, 3.0, 1.15), (ox + 2.4, 1.3, 1.25), (ox + 2.4, 3.0, 1.15), lens=35)
shot(5, (O_F[0], -3.2, 0.9), (O_F[0], 1, 0.6), (O_F[0], -9.5, 4.2), (O_F[0], 6, 0.3), lens=30)
shot(6, (0.2, -2.4, 1.05), (0.1, 0.6, 1.35), (0.15, -2.2, 1.0), (0.1, 0.6, 1.35), lens=28, dof='Nico_skull')
sc.camera = cams[0]

bpy.ops.wm.save_as_mainfile(filepath=BASE + "blender/pollo.blend")
print('listo', START, END, 'objetos', len(bpy.data.objects))
