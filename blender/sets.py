"""Escenarios estilo juguete y ajustes de render (Blender 5.2, EEVEE)."""
import math
import random

import bpy
from mathutils import Vector

import toy
from toy import box, cone, cyl, empty, mat, plane, sphere, torus


def setup_render(w=1080, h=1920, fps=30, samples=32):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.render.fps = fps
    e = sc.eevee
    e.taa_render_samples = samples
    for attr, val in (('use_raytracing', True), ('use_fast_gi', True), ('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 6)):
        try:
            setattr(e, attr, val)
        except Exception:
            pass
    vs = sc.view_settings
    vs.view_transform = 'AgX'
    for look in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast'):
        try:
            vs.look = look
            break
        except Exception:
            pass
    sc.render.image_settings.file_format = 'PNG'
    sc.render.film_transparent = False


def world(color='#cfe7ff', strength=0.7):
    w = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = toy.lin(color)
    bg.inputs['Strength'].default_value = strength


def sun(name, rot, strength=3.0, color='#fff2dc', angle=4.0):
    d = bpy.data.lights.new(name, 'SUN')
    d.energy = strength
    d.color = toy.lin(color)[:3]
    d.angle = math.radians(angle)
    ob = bpy.data.objects.new(name, d)
    (toy.CUR['col'] or bpy.context.scene.collection).objects.link(ob)
    ob.rotation_euler = tuple(math.radians(a) for a in rot)
    return ob


def area(name, loc, look, power=300, size=3.0, color='#ffffff'):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy = power
    d.size = size
    d.color = toy.lin(color)[:3]
    ob = bpy.data.objects.new(name, d)
    (toy.CUR['col'] or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    toy.aim(ob, look)
    return ob


def point(name, loc, power=60, color='#ffd9a0', radius=0.1):
    d = bpy.data.lights.new(name, 'POINT')
    d.energy = power
    d.color = toy.lin(color)[:3]
    d.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, d)
    (toy.CUR['col'] or bpy.context.scene.collection).objects.link(ob)
    ob.location = loc
    return ob


def lapacho(name, loc, s=1.0):
    root = empty(name, loc)
    bark = mat('corteza', '#6b4430', 0.8)
    cyl(f'{name}_trunk', (0, 0, 1.3 * s), 0.12 * s, 2.6 * s, bark, parent=root, subd=1)
    rnd = random.Random(name)
    for k in range(14):
        c = ['#e2629f', '#f08cbf', '#c74c8c', '#ffb0d6'][k % 4]
        sphere(f'{name}_flor{k}', (rnd.uniform(-0.9, 0.9) * s, rnd.uniform(-0.6, 0.6) * s, (2.6 + rnd.uniform(0, 1.0)) * s), rnd.uniform(0.45, 0.7) * s, mat(f'flor{k % 4}', c, 0.7), root, seg=20)
    return root


def tree(name, loc, s=1.0):
    """Árbol genérico de copa verde."""
    root = empty(name, loc)
    cyl(f'{name}_trunk', (0, 0, 1.3 * s), 0.12 * s, 2.6 * s, mat('corteza', '#6b4430', 0.8), parent=root, subd=1)
    rnd = random.Random(name)
    for k in range(12):
        c = ['#3f9a4b', '#4fae55', '#358a42'][k % 3]
        sphere(f'{name}_copa{k}', (rnd.uniform(-0.9, 0.9) * s, rnd.uniform(-0.6, 0.6) * s, (2.6 + rnd.uniform(0, 1.0)) * s), rnd.uniform(0.5, 0.75) * s, mat(f'copa{k % 3}', c, 0.8), root, seg=20)
    return root


def kitchen(O=(0, 0, 0)):
    """Cocina en corte (sin techo ni pared frontal). Mesa al centro, ventana en la pared del fondo."""
    toy.CUR['col'] = toy.coll('Cocina')
    ox, oy, oz = O
    root = empty('cocina', O)
    woods = [mat(f'madera{i}', c, 0.6) for i, c in enumerate(('#c8955f', '#b98552', '#d4a26c'))]
    for i in range(14):
        box(f'tabla{i}', (ox - 2.6 + 0.2 + i * 0.4, oy, oz - 0.03), (0.39, 6.0, 0.06), woods[i % 3], bevel=0.01)
    wallB, wallL = mat('pared_amarilla', '#f3dfa6', 0.85), mat('pared_menta', '#bfe0d8', 0.85)
    white = mat('blanco', '#f7f4ee', 0.5)
    # pared del fondo con hueco de ventana (x -1.55..-0.25, z 1.05..2.15)
    for nm, loc, size in (
        ('fondo_izq', (-2.1, 3.08, 1.4), (1.1, 0.16, 2.8)),
        ('fondo_der', (1.0, 3.08, 1.4), (2.5 + 0.1, 0.16, 2.8)),
        ('fondo_abajo', (-0.9, 3.08, 0.525), (1.3, 0.16, 1.05)),
        ('fondo_arriba', (-0.9, 3.08, 2.475), (1.3, 0.16, 0.65)),
    ):
        box(nm, (ox + loc[0], oy + loc[1], oz + loc[2]), size, wallB, bevel=0.0)
    box('pared_izq', (ox - 2.68, oy, oz + 1.4), (0.16, 6.0, 2.8), wallL, bevel=0.0)
    box('zocalo', (ox, oy + 2.98, oz + 0.06), (5.2, 0.04, 0.12), white, bevel=0.005)
    # ventana
    for nm, loc, size in (
        ('marco_ab', (-0.9, 2.98, 1.05), (1.42, 0.12, 0.08)),
        ('marco_ar', (-0.9, 2.98, 2.15), (1.42, 0.12, 0.08)),
        ('marco_i', (-1.57, 2.98, 1.6), (0.08, 0.12, 1.18)),
        ('marco_d', (-0.23, 2.98, 1.6), (0.08, 0.12, 1.18)),
        ('parteluz', (-0.9, 2.98, 1.6), (0.04, 0.08, 1.1)),
        ('alfeizar', (-0.9, 2.9, 1.02), (1.6, 0.26, 0.05)),
    ):
        box(nm, (ox + loc[0], oy + loc[1], oz + loc[2]), size, white, bevel=0.01)
    pot = mat('maceta', '#c86a3a', 0.7)
    cyl('maceta', (ox - 1.3, oy + 2.85, oz + 1.12), 0.08, 0.14, pot, subd=1)
    for k in range(5):
        sphere(f'planta{k}', (ox - 1.3 + (k - 2) * 0.04, oy + 2.85, oz + 1.24 + (k % 2) * 0.05), 0.07, mat('hoja', '#3f9a4b', 0.7), seg=16)
    # muebles verde agua sobre la pared izquierda
    teal, teal2 = mat('mueble', '#2f8f8a', 0.55), mat('mueble2', '#26746f', 0.55)
    box('bajo_mesada', (ox - 2.27, oy + 1.0, oz + 0.45), (0.66, 3.0, 0.9), teal, bevel=0.02)
    for k in range(4):
        box(f'puerta{k}', (ox - 1.93, oy - 0.3 + k * 0.72, oz + 0.45), (0.02, 0.66, 0.78), teal2, bevel=0.01)
        cyl(f'tirador{k}', (ox - 1.91, oy - 0.3 + k * 0.72 + 0.25, oz + 0.75), 0.012, 0.12, white)
    box('mesada', (ox - 2.25, oy + 1.0, oz + 0.92), (0.72, 3.04, 0.05), white, bevel=0.01)
    box('alacena', (ox - 2.4, oy + 1.4, oz + 2.05), (0.42, 2.2, 0.7), teal, bevel=0.02)
    box('microondas', (ox - 2.3, oy + 2.1, oz + 1.1), (0.45, 0.6, 0.32), mat('micro', '#2a2a33', 0.4), bevel=0.02)
    box('micro_vidrio', (ox - 2.07, oy + 2.0, oz + 1.1), (0.01, 0.36, 0.22), mat('vidrio_os', '#111118', 0.2), bevel=0.0)
    kettle = mat('pava', '#d8d8de', 0.25, metal=0.8)
    cyl('pava', (ox - 2.25, oy + 0.4, oz + 1.06), 0.09, 0.22, kettle, subd=1)
    sphere('pava_tapa', (ox - 2.25, oy + 0.4, oz + 1.18), (0.05, 0.05, 0.03), kettle)
    # heladera
    box('heladera', (ox + 2.05, oy + 2.45, oz + 0.95), (0.8, 0.75, 1.9), white, bevel=0.06)
    box('heladera_linea', (ox + 2.05, oy + 2.07, oz + 1.25), (0.78, 0.01, 0.015), mat('gris', '#c9c6c0', 0.5), bevel=0.0)
    cyl('heladera_manija', (ox + 1.75, oy + 2.05, oz + 1.55), 0.015, 0.4, mat('gris', '#c9c6c0', 0.5))
    # póster de dinosaurio
    box('poster_marco', (ox + 0.9, oy + 2.98, oz + 1.75), (0.9, 0.04, 0.7), mat('marco', '#3a2a22', 0.6), bevel=0.01)
    box('poster', (ox + 0.9, oy + 2.955, oz + 1.75), (0.8, 0.02, 0.6), mat('poster_fondo', '#ffd34a', 0.7), bevel=0.0)
    dino = mat('poster_dino', '#2a6a3a', 0.7)
    sphere('poster_cuerpo', (ox + 0.95, oy + 2.94, oz + 1.7), (0.16, 0.01, 0.1), dino, seg=16)
    sphere('poster_cabeza', (ox + 0.72, oy + 2.94, oz + 1.84), (0.08, 0.01, 0.06), dino, seg=16)
    cyl('poster_cola', (ox + 1.18, oy + 2.94, oz + 1.66), 0.03, 0.25, dino, rot=(0, 70, 0))
    for s in (-1, 1):
        cyl(f'poster_pata{s}', (ox + 0.95 + s * 0.06, oy + 2.94, oz + 1.57), 0.025, 0.12, dino)
    # mesa con pollo asado
    tw = mat('mesa', '#9c6236', 0.5)
    box('mesa', (ox, oy + 0.6, oz + 0.76), (1.5, 0.9, 0.07), tw, bevel=0.02)
    for sx in (-0.65, 0.65):
        for sy in (0.25, 0.95):
            cyl(f'pata_mesa{sx}{sy}', (ox + sx, oy + sy, oz + 0.37), 0.04, 0.74, tw)
    cyl('mantel', (ox, oy + 0.6, oz + 0.8), 0.5, 0.005, mat('mantel', '#e85d5d', 0.8))
    plate = cyl('plato', (ox + 0.1, oy + 0.55, oz + 0.815), 0.24, 0.025, white, verts=48)
    gold = mat('pollo_asado', '#c9772c', 0.45)
    sphere('pollo', (ox + 0.1, oy + 0.55, oz + 0.9), (0.15, 0.19, 0.1), gold)
    for s in (-1, 1):
        sphere(f'pollo_muslo{s}', (ox + 0.1 + s * 0.14, oy + 0.45, oz + 0.88), (0.06, 0.09, 0.06), gold, rot=(0, 0, s * 25))
        cyl(f'pollo_hueso{s}', (ox + 0.1 + s * 0.18, oy + 0.36, oz + 0.89), 0.012, 0.07, white, rot=(70, 0, s * 25))
    for k, (dx, c) in enumerate(((-0.45, '#f2c94c'), (0.45, '#7ac74f'))):
        cyl(f'vaso{k}', (ox + dx, oy + 0.75, oz + 0.86), 0.04, 0.14, mat(f'vaso{k}', c, 0.2))
    cw = mat('silla', '#7a4a2a', 0.6)
    for k, sx in enumerate((-0.45, 0.45)):
        box(f'silla_asiento{k}', (ox + sx, oy + 1.35, oz + 0.46), (0.44, 0.42, 0.05), cw, bevel=0.01)
        box(f'silla_resp{k}', (ox + sx, oy + 1.55, oz + 0.75), (0.44, 0.04, 0.55), cw, bevel=0.01)
        for lx in (-0.18, 0.18):
            for ly in (-0.17, 0.17):
                cyl(f'silla_pata{k}{lx}{ly}', (ox + sx + lx, oy + 1.35 + ly, oz + 0.22), 0.02, 0.44, cw)
    cyl('alfombra', (ox, oy + 0.6, oz + 0.005), 1.3, 0.01, mat('alfombra', '#4a7fc0', 0.9), verts=64)
    # lámpara colgante
    cyl('cable', (ox, oy + 0.6, oz + 2.6), 0.008, 0.6, mat('negro', '#141414', 0.3))
    cone('pantalla', (ox, oy + 0.6, oz + 2.22), 0.26, 0.06, 0.2, mat('pantalla', '#ffd34a', 0.5))
    sphere('foco', (ox, oy + 0.6, oz + 2.1), 0.06, mat('foco', '#fff2c8', 0.3, emit=6.0))
    point('luz_foco', (ox, oy + 0.6, oz + 2.0), power=40)
    # afuera: pasto, cielo y un lapacho
    plane('pasto_afuera', (ox, oy + 12, oz - 0.05), (40, 18), mat('pasto', '#6cbf4a', 0.9))
    plane('cielo', (ox, oy + 20, oz + 6), (60, 20), mat('cielo', '#9fd3f5', 0.9, emit=1.0), rot=(90, 0, 0))
    tree('arbol_afuera', (ox - 2.5, oy + 7.5, oz))
    for k in range(6):
        sphere(f'arbusto{k}', (ox - 5 + k * 2.2, oy + 9 + (k % 2), oz + 0.3), (0.9, 0.7, 0.6), mat('arbusto', '#3f9a4b', 0.8), seg=20)
    return root


def backdrop(name, O, y=18, w=80, h=30, color='#9fd3f5', clouds=True):
    ox, oy, oz = O
    plane(name, (ox, oy + y, oz + h / 2 - 2), (w, h), mat(f'{name}_cielo', color, 0.9, emit=1.0), rot=(90, 0, 0))
    if clouds:
        rnd = random.Random(name)
        nube = mat('nube', '#ffffff', 0.9, emit=0.6)
        for k in range(7):
            cx, cz = ox + rnd.uniform(-w / 3, w / 3), oz + rnd.uniform(5, 11)
            for j in range(4):
                sphere(f'{name}_nube{k}{j}', (cx + (j - 1.5) * 1.1, oy + y - 1, cz + (0.4 if j in (1, 2) else 0)), (1.0, 0.4, 0.7), nube, seg=20)


def yard(O):
    """Patio con pasto, cerca de madera blanca, casa al fondo y un lapacho."""
    toy.CUR['col'] = toy.coll('Patio')
    ox, oy, oz = O
    plane('patio_pasto', (ox, oy + 2, oz), (40, 40), mat('pasto', '#6cbf4a', 0.9))
    rnd = random.Random('patio')
    for k in range(40):
        sphere(f'patio_mata{k}', (ox + rnd.uniform(-8, 8), oy + rnd.uniform(-3, 9), oz), (0.25, 0.25, 0.08), mat('pasto2', '#5aad3e', 0.9), seg=12)
    wall = mat('casa_rosa', '#f2b5a6', 0.85)
    box('casa_pared', (ox, oy + 7, oz + 1.6), (12, 0.3, 3.2), wall, bevel=0.0)
    box('casa_techo', (ox, oy + 6.8, oz + 3.3), (12.6, 1.2, 0.3), mat('teja', '#c8502e', 0.7), bevel=0.02)
    box('casa_puerta', (ox + 2.5, oy + 6.84, oz + 1.05), (1.0, 0.05, 2.1), mat('puerta', '#7a4a2a', 0.6), bevel=0.02)
    for k, wx in enumerate((-3.5, -0.8)):
        box(f'casa_ventana{k}', (ox + wx, oy + 6.84, oz + 1.7), (1.2, 0.05, 1.0), mat('vidrio', '#9fd3f5', 0.2, emit=0.4), bevel=0.0)
        box(f'casa_marco{k}', (ox + wx, oy + 6.82, oz + 1.7), (1.32, 0.04, 1.12), mat('blanco', '#f7f4ee', 0.5), bevel=0.01)
    white = mat('cerca', '#f7f4ee', 0.6)
    for k in range(41):
        x = -6 + k * 0.3
        box(f'cerca_poste{k}', (ox + x, oy + 3, oz + 0.45), (0.1, 0.05, 0.9), white, bevel=0.01)
        cone(f'cerca_punta{k}', (ox + x, oy + 3, oz + 0.93), 0.07, 0.0, 0.1, white, verts=4, rot=(0, 0, 45))
    for z in (0.3, 0.72):
        box(f'cerca_riel{z}', (ox, oy + 3.03, oz + z), (12.2, 0.04, 0.08), white, bevel=0.01)
    box('cerca_tope', (ox, oy + 3.0, oz + 0.86), (12.2, 0.16, 0.05), white, bevel=0.01)
    lapacho('patio_lapacho', (ox - 4.2, oy + 5.0, oz), 1.1)
    for k in range(5):
        sphere(f'patio_arbusto{k}', (ox + 3.5 + k * 0.9, oy + 5.5, oz + 0.35), (0.6, 0.5, 0.55), mat('arbusto', '#3f9a4b', 0.8), seg=20)
    backdrop('patio_fondo', O, y=16)


def stage(O):
    """Escenario oscuro con plataforma y reflectores (para la fila evolutiva y los primeros planos)."""
    toy.CUR['col'] = toy.coll('Escenario')
    ox, oy, oz = O
    plane('esc_piso', (ox, oy, oz - 0.01), (40, 40), mat('esc_piso', '#2b2340', 0.6))
    cyl('esc_plataforma', (ox, oy, oz + 0.12), 3.6, 0.24, mat('esc_plat', '#4a3d7a', 0.4), verts=96, bevel=0.02)
    torus('esc_aro', (ox, oy, oz + 0.24), 3.6, 0.03, mat('esc_luz', '#ffd34a', 0.3, emit=4.0))
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=16, depth=14, location=(ox, oy, oz + 6))
    cyc = bpy.context.active_object
    cyc.name = 'esc_ciclorama'
    toy._put(cyc, mat('esc_fondo', '#3b2a6e', 0.9, emit=0.35), None)
    for k, (x, c) in enumerate(((-2.0, '#ffe6b0'), (0.6, '#ffd0f0'), (2.0, '#d0f0ff'))):
        d = bpy.data.lights.new(f'esc_spot{k}', 'SPOT')
        d.energy = 900
        d.spot_size = math.radians(40)
        d.spot_blend = 0.5
        d.shadow_soft_size = 0.4
        d.color = toy.lin(c)[:3]
        ob = bpy.data.objects.new(f'esc_spot{k}', d)
        toy.CUR['col'].objects.link(ob)
        ob.location = (ox + x, oy - 3.5, oz + 6)
        toy.aim(ob, (ox + x, oy, oz + 0.8))


def farm(O, hen_col):
    """Granja con cientos de gallinas (instancias de partículas de la colección hen_col)."""
    toy.CUR['col'] = toy.coll('Granja')
    ox, oy, oz = O
    plane('granja_pasto', (ox, oy + 20, oz), (120, 120), mat('pasto_granja', '#78c850', 0.9))
    for k in range(5):
        sphere(f'granja_loma{k}', (ox - 40 + k * 20, oy + 45, oz - 3), (14, 8, 6), mat('loma', '#5fae45', 0.9), seg=32)
    barn = mat('granero', '#c8392b', 0.7)
    box('granero', (ox + 9, oy + 24, oz + 2.5), (7, 6, 5), barn, bevel=0.05)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=5.4, depth=2.6, location=(ox + 9, oy + 24, oz + 6.3), rotation=(0, 0, math.radians(45)))
    roof = bpy.context.active_object
    roof.name = 'granero_techo'
    roof.scale = (1.0, 0.85, 1)
    toy._put(roof, mat('techo_granero', '#5a3a2a', 0.7), None, smooth=False)
    box('granero_puerta', (ox + 9, oy + 20.95, oz + 1.6), (2.4, 0.1, 3.2), mat('blanco', '#f7f4ee', 0.5), bevel=0.02)
    cyl('silo', (ox + 14, oy + 26, oz + 4), 1.6, 8, mat('silo', '#d9d4cc', 0.5, metal=0.3))
    sphere('silo_domo', (ox + 14, oy + 26, oz + 8), (1.6, 1.6, 1.0), mat('silo', '#d9d4cc', 0.5, metal=0.3))
    bpy.ops.mesh.primitive_plane_add(size=1, location=(ox, oy + 6, oz + 0.001))
    field = bpy.context.active_object
    field.name = 'granja_gallinas'
    field.scale = (18, 14, 1)
    bpy.ops.object.transform_apply(scale=True)
    toy._put(field, mat('pasto_granja', '#78c850', 0.9), None, smooth=False)
    ps = field.modifiers.new('gallinas', 'PARTICLE_SYSTEM').particle_system
    st = ps.settings
    st.type = 'HAIR'
    st.count = 420
    st.hair_length = 1.0
    st.render_type = 'COLLECTION'
    st.instance_collection = hen_col
    st.use_whole_collection = True
    st.use_advanced_hair = True
    st.use_rotations = True
    st.rotation_mode = 'NOR'
    st.phase_factor_random = 2.0
    st.particle_size = 1.35
    st.size_random = 0.15
    ps.seed = 7
    backdrop('granja_fondo', O, y=60, w=200, h=60)


def giant_room(O, H=150):
    """La cocina vista con el tamaño de una hormiga: baldosas enormes, mesa a H metros, paredes lejanas."""
    toy.CUR['col'] = toy.coll('MundoGigante')
    ox, oy, oz = O
    wood, seam = mat('mesa', '#9c6236', 0.5), mat('veta', '#7f4c28', 0.6)
    water = toy.water()
    # mesa: borde frontal en y=0, tapa en z=H
    box('mesaG', (ox, oy + 150, oz + H - 5), (400, 300, 10), wood, bevel=0.5)
    for k in range(-12, 13):
        box(f'mesaG_veta{k}', (ox + k * 5 + 1.3, oy + 60, oz + H + 0.01), (0.25, 120, 0.04), seam, bevel=0.0)
    for sx in (-185, 185):
        for sy in (12, 288):
            cyl(f'mesaG_pata{sx}_{sy}', (ox + sx, oy + sy, oz + (H - 10) / 2), 9, H - 10, wood, verts=64)
    cup = mat('taza', '#f4f1ea', 0.35)
    cyl('tazaG', (ox - 26, oy + 46, oz + H + 22), 16, 44, cup, verts=96, bevel=0.8)
    cyl('tazaG_franja', (ox - 26, oy + 46, oz + H + 33), 16.15, 6, mat('taza_franja', '#e85d5d', 0.4), verts=96)
    cyl('tazaG_cafe', (ox - 26, oy + 46, oz + H + 44.05), 14.8, 0.3, mat('cafe', '#4a2c1a', 0.2), verts=96)
    torus('tazaG_asa', (ox - 4, oy + 46, oz + H + 24), 9, 2.4, cup, rot=(90, 0, 0))
    sugar = mat('azucar', '#fbfbf7', 0.45)
    for k, (x, y) in enumerate(((16, 32), (24, 37), (18, 43))):
        box(f'azucarG{k}', (ox + x, oy + y, oz + H + 3.5), (7, 7, 7), sugar, bevel=0.6, rot=(0, 0, 14 * k + 8))
    bread, crumb = mat('pan', '#c98a3c', 0.7), mat('miga', '#f2dcae', 0.85)
    for k, (x, y, s) in enumerate(((3.5, 9.5, 0.7), (-3.2, 5.0, 0.5), (5.0, 14, 1.2), (-6, 12, 0.9), (8, 6, 0.45), (-1.5, 15, 0.6))):
        sphere(f'migaT{k}', (ox + x, oy + y, oz + H + s * 0.5), (s, s * 0.85, s * 0.7), bread if k % 2 else crumb, seg=20, rot=(0, 0, k * 40))
    metal = mat('metal', '#d0d4dc', 0.2, metal=0.9)
    box('cucharaG_mango', (ox + 34, oy + 80, oz + H + 0.8), (4, 60, 1.4), metal, bevel=0.6, rot=(0, 0, 18))
    sphere('cucharaG', (ox + 23, oy + 47, oz + H + 1.2), (8, 11, 1.5), metal, rot=(0, 0, 18))
    sphere('gotaMesa', (ox - 9, oy + 21, oz + H + 1.0), (2.0, 2.0, 1.15), water, seg=48)
    cyl('charco', (ox, oy + 2.0, oz + H + 0.02), 2.4, 0.05, water, verts=64)
    # piso de baldosas (en z=0) con juntas como zanjas
    tiles = [mat('baldosaG1', '#e2c9a0', 0.45), mat('baldosaG2', '#d4b88c', 0.45)]
    for i in range(-6, 7):
        for j in range(-6, 10):
            box(f'baldosa{i}_{j}', (ox + i * 40, oy + j * 40, oz - 0.6), (38.6, 38.6, 1.2), tiles[(i + j) % 2], bevel=0.35)
    plane('juntaG', (ox, oy + 80, oz - 1.0), (1600, 1400), mat('junta', '#b8a58a', 0.8))
    gold = mat('moneda', '#e0b13c', 0.3, metal=0.9)
    cyl('monedaG', (ox - 24, oy + 22, oz + 0.7), 10, 1.4, gold, verts=96, bevel=0.3)
    torus('monedaG_borde', (ox - 24, oy + 22, oz + 1.4), 9.2, 0.35, gold)
    rnd = random.Random('migasPiso')
    for k in range(14):
        x, y, s = rnd.uniform(-10, 12), rnd.uniform(-14, 8), rnd.uniform(0.15, 0.4)
        if abs(x - 14) < 4 and abs(y + 8) < 4:
            continue
        sphere(f'migaP{k}', (ox + x, oy + y, oz + s * 0.5), (s, s * 0.8, s * 0.6), crumb if k % 2 else bread, seg=16)
    # habitación lejana
    wy, wm = mat('pared_amarilla', '#f3dfa6', 0.85), mat('pared_menta', '#bfe0d8', 0.85)
    plane('paredG_fondo', (ox, oy + 700, oz + 450), (1600, 900), wy, rot=(90, 0, 0))
    plane('paredG_frente', (ox, oy - 700, oz + 450), (1600, 900), wy, rot=(90, 0, 0))
    plane('paredG_izq', (ox - 800, oy, oz + 450), (1400, 900), wm, rot=(90, 0, 90))
    plane('paredG_der', (ox + 800, oy, oz + 450), (1400, 900), wm, rot=(90, 0, 90))
    plane('techoG', (ox, oy, oz + 900), (1600, 1400), mat('techo', '#fbf6ec', 0.9))
    box('ventanaG', (ox - 200, oy + 695, oz + 420), (420, 4, 360), mat('ventana_luz', '#e8f6ff', 0.3, emit=2.5), bevel=0.0)
    box('zocaloG', (ox, oy + 696, oz + 30), (1600, 6, 60), mat('blanco', '#f7f4ee', 0.5), bevel=0.0)
    box('heladeraG', (ox + 560, oy + 560, oz + 450), (380, 260, 900), mat('blanco', '#f7f4ee', 0.5), bevel=4)
    box('bajoG', (ox - 640, oy + 300, oz + 210), (310, 700, 420), mat('mueble', '#2f8f8a', 0.55), bevel=3)
