"""Piezas 3D estilo juguete para los shorts (Blender 5.2). Todo se modela con primitivas suavizadas.

Uso desde Blender:
    import sys; sys.path.insert(0, r"C:/Users/USER/Desktop/BluePrint-Project/blender")
    import toy, importlib; importlib.reload(toy)
Convención: los personajes miran hacia -Y y apoyan los pies en z=0 de su raíz.
"""
import math
import random

import bpy
from mathutils import Vector

D = math.radians


def lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple([(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c] + [1.0])


def mat(name, color, rough=0.55, emit=0.0, spec=0.35, metal=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = lin(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    for k in ('Specular IOR Level', 'Specular'):
        if k in b.inputs:
            b.inputs[k].default_value = spec
            break
    if emit:
        b.inputs['Emission Color'].default_value = lin(color)
        b.inputs['Emission Strength'].default_value = emit
    return m


def coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    return c


CUR = {'col': None}


def _put(ob, m, parent, smooth=True, subd=0, bevel=0.0):
    col = CUR['col'] or bpy.context.scene.collection
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    col.objects.link(ob)
    if m is not None:
        ob.data.materials.append(m)
    if parent is not None:
        ob.parent = parent
    if smooth and ob.type == 'MESH':
        for p in ob.data.polygons:
            p.use_smooth = True
    if bevel:
        md = ob.modifiers.new('bevel', 'BEVEL')
        md.width = bevel
        md.segments = 3
        md.limit_method = 'ANGLE'
    if subd:
        md = ob.modifiers.new('subd', 'SUBSURF')
        md.levels = subd
        md.render_levels = subd
    return ob


def _rot(r):
    return tuple(D(a) for a in r)


def sphere(name, loc, scale, m, parent=None, seg=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(8, seg // 2), location=loc, rotation=_rot(rot))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale if isinstance(scale, (tuple, list)) else (scale, scale, scale)
    return _put(ob, m, parent)


def cyl(name, loc, r, depth, m, rot=(0, 0, 0), parent=None, verts=32, subd=0, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=_rot(rot))
    ob = bpy.context.active_object
    ob.name = name
    return _put(ob, m, parent, subd=subd, bevel=bevel)


def cone(name, loc, r1, r2, depth, m, rot=(0, 0, 0), parent=None, verts=32):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=_rot(rot))
    ob = bpy.context.active_object
    ob.name = name
    return _put(ob, m, parent)


def box(name, loc, size, m, rot=(0, 0, 0), parent=None, bevel=0.03, smooth=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=_rot(rot))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _put(ob, m, parent, smooth=smooth, bevel=bevel)


def torus(name, loc, R, r, m, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=_rot(rot), major_segments=48, minor_segments=16)
    ob = bpy.context.active_object
    ob.name = name
    return _put(ob, m, parent)


def empty(name, loc=(0, 0, 0), parent=None, rot=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.15
    ob.location = loc
    ob.rotation_euler = _rot(rot)
    col = CUR['col'] or bpy.context.scene.collection
    col.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def capsule(name, loc, r, length, m, rot=(0, 0, 0), parent=None):
    """Cápsula: cilindro con dos medias esferas (extremidades estilo juguete). El eje va a lo largo de Z local."""
    e = empty(name, loc, parent, rot)
    cyl(f'{name}_c', (0, 0, 0), r, length, m, parent=e)
    sphere(f'{name}_a', (0, 0, length / 2), r, m, e, seg=24)
    sphere(f'{name}_b', (0, 0, -length / 2), r, m, e, seg=24)
    return e


def plane(name, loc, size, m, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=_rot(rot))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0], size[1], 1)
    return _put(ob, m, parent, smooth=False)


# ---------------- personajes ----------------
def nico(name='Nico'):
    """Personaje fijo del canal: chico explorador con sombrero de safari y buzo verde agua."""
    skin, skin2 = mat('piel', '#e7a97f', 0.6), mat('piel2', '#d48c66', 0.6)
    hood, hood2 = mat('buzo', '#1fa39a', 0.7), mat('buzo2', '#14756e', 0.7)
    pants, shoe, sole = mat('jean', '#2c3554', 0.8), mat('zapa', '#f4f1ea', 0.5), mat('suela', '#e94b3c', 0.6)
    white, black = mat('ojo', '#ffffff', 0.25), mat('negro', '#141414', 0.3)
    hat, band, hair = mat('safari', '#d9c08a', 0.75), mat('cinta', '#7a4a26', 0.7), mat('pelo', '#3a2416', 0.8)
    mouth = mat('boca', '#5a1a1e', 0.5)
    R = empty(name)
    P = {'root': R}
    for s, side in ((1, 'R'), (-1, 'L')):
        hip = empty(f'{name}_hip{side}', (s * 0.09, 0, 0.47), R)
        P['leg' + side] = hip
        capsule(f'{name}_leg{side}', (0, 0, -0.2), 0.07, 0.34, pants, parent=hip)
        sphere(f'{name}_shoe{side}', (0, -0.05, -0.42), (0.085, 0.14, 0.065), shoe, hip)
        sphere(f'{name}_sole{side}', (0, -0.05, -0.455), (0.088, 0.142, 0.025), sole, hip)
    body = empty(f'{name}_body', (0, 0, 0.47), R)
    P['body'] = body
    sphere(f'{name}_torso', (0, 0, 0.2), (0.21, 0.17, 0.25), hood, body)
    sphere(f'{name}_pocket', (0, -0.16, 0.1), (0.11, 0.05, 0.07), hood2, body)
    torus(f'{name}_hoodie', (0, 0.02, 0.4), 0.13, 0.05, hood2, parent=body)
    for s in (1, -1):
        cyl(f'{name}_string{s}', (s * 0.04, -0.17, 0.28), 0.008, 0.14, white, parent=body)
    for s, side in ((1, 'R'), (-1, 'L')):
        sh = empty(f'{name}_sh{side}', (s * 0.22, 0, 0.36), body)
        P['arm' + side] = sh
        capsule(f'{name}_arm{side}', (0, 0, -0.15), 0.055, 0.26, hood, parent=sh)
        cyl(f'{name}_cuff{side}', (0, 0, -0.3), 0.058, 0.05, hood2, parent=sh)
        sphere(f'{name}_hand{side}', (0, 0, -0.36), 0.06, skin, sh)
    head = empty(f'{name}_head', (0, 0, 0.42), body)
    P['head'] = head
    sphere(f'{name}_skull', (0, 0, 0.22), 0.24, skin, head)
    for s in (1, -1):
        sphere(f'{name}_ear{s}', (s * 0.235, 0.01, 0.2), (0.045, 0.03, 0.06), skin2, head)
        sphere(f'{name}_eye{s}', (s * 0.085, -0.205, 0.25), (0.05, 0.025, 0.062), white, head)
        sphere(f'{name}_pupil{s}', (s * 0.085, -0.228, 0.245), (0.027, 0.012, 0.032), black, head)
        sphere(f'{name}_shine{s}', (s * 0.075, -0.236, 0.262), 0.008, white, head)
        sphere(f'{name}_cheek{s}', (s * 0.15, -0.17, 0.15), (0.045, 0.02, 0.03), mat('mejilla', '#f08a8a', 0.6), head)
        box(f'{name}_brow{s}', (s * 0.085, -0.215, 0.33), (0.07, 0.015, 0.018), hair, rot=(0, 0, -s * 8), parent=head, bevel=0.006)
    sphere(f'{name}_nose', (0, -0.24, 0.19), (0.04, 0.035, 0.035), skin2, head)
    P['mouth'] = sphere(f'{name}_mouth', (0, -0.225, 0.1), (0.045, 0.015, 0.02), mouth, head)
    sphere(f'{name}_hair', (0, 0.03, 0.32), (0.245, 0.235, 0.15), hair, head)
    hatE = empty(f'{name}_hatpivot', (0, 0, 0.36), head)
    P['hat'] = hatE
    sphere(f'{name}_crown', (0, 0, 0.04), (0.2, 0.2, 0.13), hat, hatE)
    cyl(f'{name}_brim', (0, 0, 0.0), 0.34, 0.025, hat, parent=hatE, verts=48)
    torus(f'{name}_band', (0, 0, 0.03), 0.198, 0.022, band, parent=hatE)
    return P


def bird(name, kind='gallina'):
    """Aves estilo juguete: gallina, tucan, loro, paloma, picaflor."""
    pal = {
        'gallina': ('#f6f1e7', '#e6ddcc', '#f2a01c', '#d8262c'),
        'tucan': ('#1c1c22', '#f4efe2', '#ff9a1a', '#2a7ad8'),
        'loro': ('#3fae49', '#d8262c', '#e8d6a8', '#2a64d8'),
        'paloma': ('#8a8f9c', '#6b7080', '#c98a8a', '#5aa58a'),
        'picaflor': ('#2fb37a', '#f2f2f2', '#2a2a2a', '#d84ab0'),
    }[kind]
    body, wing, beak, accent = (mat(f'{kind}_c{i}', c, 0.6) for i, c in enumerate(pal))
    leg = mat('pata', '#f2b63a', 0.5)
    black, white = mat('negro', '#141414', 0.3), mat('ojo', '#ffffff', 0.25)
    R = empty(name)
    P = {'root': R}
    small = kind == 'picaflor'
    for s, side in ((1, 'R'), (-1, 'L')):
        hip = empty(f'{name}_hip{side}', (s * 0.045, 0.0, 0.13), R)
        P['leg' + side] = hip
        cyl(f'{name}_leg{side}', (0, 0, -0.065), 0.013, 0.13, leg, parent=hip)
        for a in (-35, 0, 35):
            cyl(f'{name}_toe{side}{a}', (math.sin(D(a)) * 0.035, -math.cos(D(a)) * 0.035, -0.125), 0.009, 0.075, leg, rot=(90, 0, a), parent=hip)
    bodyE = empty(f'{name}_body', (0, 0, 0.13), R)
    P['body'] = bodyE
    sphere(f'{name}_torso', (0, 0.02, 0.1), (0.13, 0.17, 0.12), body, bodyE)
    if kind == 'tucan':
        sphere(f'{name}_chest', (0, -0.1, 0.12), (0.09, 0.06, 0.09), wing, bodyE)
    for s in (1, -1):
        sphere(f'{name}_wing{s}', (s * 0.12, 0.04, 0.11), (0.035, 0.13, 0.085), wing if kind != 'tucan' else body, bodyE, rot=(-12, 0, 0))
    for k, a in enumerate((-20, 0, 20)):
        cone(f'{name}_tail{k}', (math.sin(D(a)) * 0.04, 0.2, 0.2), 0.05, 0.005, 0.18 if kind == 'gallina' else 0.14, wing if kind == 'gallina' else body, rot=(-55, 0, a), parent=bodyE)
    head = empty(f'{name}_head', (0, -0.12, 0.2), bodyE)
    P['head'] = head
    sphere(f'{name}_neck', (0, 0.0, 0.02), (0.07, 0.07, 0.09), body if kind != 'paloma' else accent, head)
    sphere(f'{name}_skull', (0, -0.02, 0.1), 0.07, body if kind != 'loro' else wing, head)
    for s in (1, -1):
        sphere(f'{name}_eye{s}', (s * 0.052, -0.06, 0.125), 0.017, white, head)
        sphere(f'{name}_pupil{s}', (s * 0.06, -0.066, 0.126), 0.01, black, head)
    if kind == 'gallina':
        for k in range(3):
            sphere(f'{name}_comb{k}', (0, -0.05 + k * 0.035, 0.17 + (0.01 if k == 1 else 0)), 0.024, accent, head)
        sphere(f'{name}_wattle', (0, -0.085, 0.045), (0.018, 0.012, 0.03), accent, head)
    if kind == 'tucan':
        cone(f'{name}_beak', (0, -0.17, 0.1), 0.045, 0.012, 0.22, beak, rot=(90, 0, 0), parent=head)
        sphere(f'{name}_beaktip', (0, -0.27, 0.095), 0.014, accent, head)
    elif kind == 'picaflor':
        cone(f'{name}_beak', (0, -0.15, 0.1), 0.01, 0.002, 0.16, beak, rot=(95, 0, 0), parent=head)
    elif kind == 'loro':
        cone(f'{name}_beak', (0, -0.1, 0.08), 0.03, 0.006, 0.07, beak, rot=(120, 0, 0), parent=head)
    else:
        cone(f'{name}_beak', (0, -0.1, 0.095), 0.024, 0.003, 0.06, beak, rot=(95, 0, 0), parent=head)
    if small:
        R.scale = (0.45, 0.45, 0.45)
    return P


def theropod(name, skin='#5f9a4a', belly='#cfd98f', spots='#3f6e32', feathers=None, tooth=True):
    """T-Rex juguete (o un terópodo chico con plumas). Mide ~2.5 m de alto en escala 1."""
    sk, bl, sp = mat(f'{name}_skin', skin, 0.55), mat(f'{name}_belly', belly, 0.6), mat(f'{name}_spot', spots, 0.6)
    white, black, red = mat('ojo', '#ffffff', 0.25), mat('negro', '#141414', 0.3), mat('bocaroja', '#9a2a34', 0.5)
    teeth = mat('diente', '#f6f1e2', 0.4)
    fm = mat(f'{name}_pluma', feathers, 0.7) if feathers else None
    R = empty(name)
    P = {'root': R}
    for s, side in ((1, 'R'), (-1, 'L')):
        hip = empty(f'{name}_hip{side}', (s * 0.34, 0.15, 1.35), R)
        P['leg' + side] = hip
        sphere(f'{name}_thigh{side}', (0, 0, -0.15), (0.27, 0.42, 0.45), sk, hip)
        capsule(f'{name}_shin{side}', (0, 0.12, -0.7), 0.13, 0.55, sk, rot=(-12, 0, 0), parent=hip)
        sphere(f'{name}_foot{side}', (0, -0.08, -1.29), (0.2, 0.34, 0.08), sk, hip)
        for a in (-25, 0, 25):
            cone(f'{name}_claw{side}{a}', (math.sin(D(a)) * 0.16, -0.42 - math.cos(D(a)) * 0.02, -1.3), 0.04, 0.0, 0.13, teeth, rot=(90, 0, a), parent=hip)
    bodyE = empty(f'{name}_body', (0, 0, 1.55), R)
    P['body'] = bodyE
    sphere(f'{name}_torso', (0, 0, 0), (0.52, 0.88, 0.56), sk, bodyE, rot=(-8, 0, 0))
    sphere(f'{name}_tummy', (0, -0.12, -0.14), (0.44, 0.7, 0.44), bl, bodyE, rot=(-8, 0, 0))
    rnd = random.Random(name)
    for k in range(9):
        y = -0.5 + k * 0.13
        sphere(f'{name}_spot{k}', (rnd.uniform(-0.25, 0.25), y, 0.48 - abs(y) * 0.12), (0.09, 0.07, 0.03), sp, bodyE)
    tail = empty(f'{name}_tail', (0, 0.72, 0.08), bodyE, rot=(8, 0, 0))
    P['tail'] = tail
    cone(f'{name}_tail1', (0, 0.8, 0), 0.4, 0.05, 1.7, sk, rot=(-90, 0, 0), parent=tail)
    if feathers:
        for k in range(4):
            cone(f'{name}_tailf{k}', ((k - 1.5) * 0.06, 1.6, 0.05), 0.07, 0.0, 0.5, fm, rot=(-95, 0, (k - 1.5) * 12), parent=tail)
    head = empty(f'{name}_head', (0, -0.78, 0.38), bodyE, rot=(10, 0, 0))
    P['head'] = head
    capsule(f'{name}_neck', (0, 0.05, 0.05), 0.26, 0.35, sk, rot=(-30, 0, 0), parent=head)
    sphere(f'{name}_skull', (0, -0.4, 0.32), (0.34, 0.5, 0.32), sk, head)
    sphere(f'{name}_snout', (0, -0.8, 0.26), (0.28, 0.34, 0.22), sk, head)
    jaw = empty(f'{name}_jaw', (0, -0.3, 0.12), head)
    P['jaw'] = jaw
    sphere(f'{name}_jawbone', (0, -0.42, -0.04), (0.25, 0.55, 0.11), bl, jaw)
    sphere(f'{name}_mouthin', (0, -0.42, 0.04), (0.22, 0.5, 0.06), red, jaw)
    if tooth:
        for k in range(6):
            for s in (1, -1):
                cone(f'{name}_tooth{k}{s}', (s * (0.2 - k * 0.012), -0.55 - k * 0.07, 0.08), 0.025, 0.0, 0.07, teeth, rot=(180, 0, 0), parent=head)
    for s in (1, -1):
        sphere(f'{name}_eye{s}', (s * 0.24, -0.55, 0.45), 0.1, white, head)
        sphere(f'{name}_pupil{s}', (s * 0.29, -0.6, 0.46), 0.055, black, head)
        sphere(f'{name}_shine{s}', (s * 0.3, -0.64, 0.49), 0.016, white, head)
        sphere(f'{name}_brow{s}', (s * 0.22, -0.55, 0.56), (0.12, 0.06, 0.035), sp, head, rot=(0, -s * 12, 0))
        sphere(f'{name}_nostril{s}', (s * 0.1, -1.1, 0.34), 0.025, black, head)
        arm = empty(f'{name}_arm{s}', (s * 0.36, -0.55, -0.1), bodyE)
        capsule(f'{name}_armc{s}', (0, -0.12, -0.08), 0.06, 0.22, sk, rot=(60, 0, 0), parent=arm)
        if feathers:
            cone(f'{name}_armf{s}', (s * 0.05, 0.0, -0.12), 0.12, 0.0, 0.45, fm, rot=(150, 0, 0), parent=arm)
    return P


# ---------------- utilidades de animación ----------------
def key(ob, path, frame, value, idx=None):
    if path == 'rotation_euler':
        value = tuple(D(v) for v in value) if isinstance(value, (tuple, list)) else D(value)
    if idx is None:
        setattr(ob, path, value)
        ob.keyframe_insert(path, frame=frame)
    else:
        getattr(ob, path)[idx] = value
        ob.keyframe_insert(path, index=idx, frame=frame)


def ease_all(ob, interp='BEZIER'):
    ad = ob.animation_data
    if ad and ad.action:
        for fc in getattr(ad.action, 'fcurves', []):
            for kp in fc.keyframe_points:
                kp.interpolation = interp


def cam(name, loc, look, lens=35, parent=None):
    c = bpy.data.cameras.new(name)
    c.lens = lens
    c.clip_start = 0.05
    c.clip_end = 400
    ob = bpy.data.objects.new(name, c)
    (CUR['col'] or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    aim(ob, look)
    return ob


def aim(ob, look):
    d = Vector(look) - Vector(ob.location)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def dup(P, name, loc=(0, 0, 0), rot_z=0):
    """Copia un personaje (comparte mallas) con toda su jerarquía."""
    root = P['root']
    mapping = {}

    def rec(ob, parent):
        n = ob.copy()
        n.name = ob.name.replace(root.name, name, 1)
        (CUR['col'] or bpy.context.scene.collection).objects.link(n)
        n.parent = parent
        mapping[ob] = n
        for ch in ob.children:
            rec(ch, n)
    rec(root, None)
    mapping[root].location = loc
    mapping[root].rotation_euler = (0, 0, D(rot_z))
    return {k: mapping[v] for k, v in P.items() if v in mapping}


def limb(name, p0, p1, r, m, parent=None):
    """Cápsula del punto p0 al p1 (coordenadas del padre). Devuelve el empty de la base."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    base = empty(name, tuple(p0), parent)
    base.rotation_euler = Vector((0, 0, 1)).rotation_difference(d).to_euler()
    L = d.length
    cyl(f'{name}_c', (0, 0, L / 2), r, L, m, parent=base, verts=20)
    sphere(f'{name}_a', (0, 0, 0), r, m, base, seg=16)
    sphere(f'{name}_b', (0, 0, L), r, m, base, seg=16)
    return base


def spider(name):
    """Araña de juguete (mira a -Y). Mide ~4.5 m de largo: gigante al lado de Nico encogido."""
    body_m, abd_m = mat('arana_cuerpo', '#2f2440', 0.55), mat('arana_abdomen', '#3b2a55', 0.5)
    spot, leg_m, joint = mat('arana_mancha', '#ff7a2a', 0.5), mat('arana_pata', '#241b33', 0.6), mat('arana_rodilla', '#4a3a66', 0.5)
    white, black = mat('ojo', '#ffffff', 0.25), mat('negro', '#141414', 0.3)
    red, fang = mat('ojo_rojo', '#e83a3a', 0.3, emit=0.8), mat('colmillo', '#f2ead8', 0.4)
    R = empty(name)
    P = {'root': R, 'legs': []}
    B = empty(f'{name}_body', (0, 0, 1.25), R)
    P['body'] = B
    sphere(f'{name}_ceph', (0, -0.7, 0), (0.8, 0.9, 0.6), body_m, B)
    sphere(f'{name}_abd', (0, 1.0, 0.35), (1.2, 1.45, 1.0), abd_m, B)
    rnd = random.Random(name)
    for k in range(7):
        sphere(f'{name}_spot{k}', (rnd.uniform(-0.5, 0.5), 0.55 + k * 0.17, 1.28 - abs(k - 3) * 0.07), (0.16, 0.12, 0.05), spot, B)
    for s in (1, -1):
        sphere(f'{name}_eye{s}', (s * 0.27, -1.42, 0.3), 0.23, white, B)
        sphere(f'{name}_pupil{s}', (s * 0.29, -1.62, 0.28), 0.12, black, B)
        sphere(f'{name}_shine{s}', (s * 0.24, -1.72, 0.36), 0.035, white, B)
        sphere(f'{name}_eyesm{s}', (s * 0.55, -1.25, 0.4), 0.08, red, B)
        sphere(f'{name}_eyesm2{s}', (s * 0.15, -1.36, 0.6), 0.07, red, B)
        fg = empty(f'{name}_fangE{s}', (s * 0.16, -1.45, -0.25), B)
        P['fang' + ('R' if s > 0 else 'L')] = fg
        cone(f'{name}_fang{s}', (0, 0, -0.12), 0.08, 0.0, 0.3, fang, rot=(180, 0, 0), parent=fg)
    for s in (1, -1):
        for k, dy in enumerate((-1.05, -0.8, -0.55, -0.3)):
            hip = empty(f'{name}_hip{s}{k}', (s * 0.6, dy, 0), B)
            spread = (k - 1.5) * 0.5
            knee = (s * 1.2, spread, 0.9)
            foot = (s * 2.1, spread * 1.7, -1.25)
            limb(f'{name}_up{s}{k}', (0, 0, 0), knee, 0.09, leg_m, hip)
            sphere(f'{name}_knee{s}{k}', knee, 0.13, joint, hip, seg=16)
            limb(f'{name}_lo{s}{k}', knee, foot, 0.075, leg_m, hip)
            P['legs'].append((hip, s, k))
    return P


def water(name='agua'):
    """Agua celeste semitransparente con brillo (se ve a Nico adentro)."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (0.55, 0.82, 1.0, 1)
    b.inputs['Roughness'].default_value = 0.04
    b.inputs['Alpha'].default_value = 0.27
    for k, v in (('Specular IOR Level', 1.0), ('Coat Weight', 1.0), ('Emission Strength', 0.1)):
        if k in b.inputs:
            b.inputs[k].default_value = v
    if 'Emission Color' in b.inputs:
        b.inputs['Emission Color'].default_value = (0.6, 0.85, 1.0, 1)
    for attr, val in (('surface_render_method', 'BLENDED'), ('use_transparency_overlap', True), ('use_backface_culling', False)):
        try:
            setattr(m, attr, val)
        except Exception:
            pass
    return m
