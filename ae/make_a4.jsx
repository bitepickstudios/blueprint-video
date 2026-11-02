// Video 3 (Argentinosaurio): arma, anima y renderiza el video final en After Effects.
// Entradas: ae/a4/*.png (capas 2x), video/public/04 (voz, música, data.json, layers.json),
//           video/public/sfx3 (efectos), video/out/a4caps (subtítulos PNG con transparencia).
// Salida: ae/argentino.aep y videos/04-argentino-ae.mp4
(function () {
    var ROOT = "C:/Users/USER/Desktop/BluePrint-Project/";
    var LOG = new File(ROOT + "ae/log.txt");
    LOG.open("w");
    function log(s) { LOG.writeln(s); }
    function readJSON(path) {
        var f = new File(path);
        f.encoding = "UTF-8";
        f.open("r");
        var txt = f.read();
        f.close();
        return eval("(" + txt + ")");
    }
    function addFx(layer, match, values) {
        try {
            var fx = layer.property("ADBE Effect Parade").addProperty(match);
            for (var k in values) fx.property(parseInt(k, 10)).setValue(values[k]);
            return fx;
        } catch (e) {
            log("efecto " + match + " fallo: " + e.toString());
            return null;
        }
    }
    function T(layer) { return layer.property("ADBE Transform Group"); }
    function ease(prop) {
        var e = new KeyframeEase(0, 70);
        for (var k = 1; k <= prop.numKeys; k++) {
            prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER);
            try { prop.setTemporalEaseAtKey(k, [e, e, e].slice(0, prop.value.length || 1), [e, e, e].slice(0, prop.value.length || 1)); }
            catch (x) { try { prop.setTemporalEaseAtKey(k, [e], [e]); } catch (y) {} }
        }
    }
    function keys(prop, times, values) {
        for (var i = 0; i < times.length; i++) prop.setValueAtTime(Math.max(0, times[i]), values[i]);
        ease(prop);
    }
    // Aparece con rebote, centrado en (cx, cy) del cuadro.
    function pop(layer, t, cx, cy) {
        T(layer).property("ADBE Anchor Point").setValue([cx * 2, cy * 2]);
        T(layer).property("ADBE Position").setValue([cx, cy]);
        keys(T(layer).property("ADBE Scale"), [t, t + 0.16, t + 0.28], [[0, 0], [57, 57], [50, 50]]);
    }
    function fadeIn(layer, t, d) { keys(T(layer).property("ADBE Opacity"), [t, t + d], [0, 100]); }
    function expr(prop, code) { prop.expression = code; }

    try {
        var cfg = readJSON(ROOT + "video/public/04/layers.json");
        var data = readJSON(ROOT + "video/public/04/data.json");
        var FPS = 30, GAP = 0.12;
        // tiempo (en la escena) de la primera palabra que empieza con `key`
        function wt(i, key) {
            var w = data.scenes[i].words;
            for (var k = 0; k < w.length; k++) if (w[k].w.toLowerCase().indexOf(key) === 0) return w[k].s;
            log("palabra no encontrada: " + key);
            return 0;
        }
        app.beginSuppressDialogs();
        if (app.project) app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        var proj = app.newProject();
        var fCapas = proj.items.addFolder("capas");
        var fAudio = proj.items.addFolder("audio");
        var fEsc = proj.items.addFolder("escenas");
        function imp(path, parent) {
            var it = proj.importFile(new ImportOptions(new File(path)));
            if (parent) it.parentFolder = parent;
            return it;
        }
        var scenes = [];
        var starts = [];
        var t0 = 0;
        for (var i = 0; i < cfg.scenes.length; i++) {
            var sc = cfg.scenes[i];
            var sd = data.scenes[i];
            var dur = Math.ceil((sd.dur + GAP + (data.extra[i] || 0)) * FPS) / FPS;
            var comp = proj.items.addComp(sc.id.toUpperCase(), 1080, 1920, 1, dur, FPS);
            comp.parentFolder = fEsc;
            comp.motionBlur = true;
            var L = {};
            for (var j = 0; j < sc.layers.length; j++) {
                var def = (typeof sc.layers[j] === "string") ? {name: sc.layers[j]} : sc.layers[j];
                if (def.name === "cap") continue;
                var lay = comp.layers.add(imp(ROOT + "ae/a4/" + sc.id + "_" + def.name + ".png", fCapas));
                lay.name = def.name;
                lay.motionBlur = true;
                T(lay).property("ADBE Anchor Point").setValue(def.anchor ? [def.anchor[0] * 2, def.anchor[1] * 2] : [1080, 1920]);
                T(lay).property("ADBE Position").setValue(def.pos ? def.pos : [540, 960]);
                T(lay).property("ADBE Scale").setValue([50, 50]);
                if (def.rot) T(lay).property("ADBE Rotate Z").setValue(def.rot);
                if (def.blur) {
                    addFx(lay, "ADBE Gaussian Blur 2", {1: def.blur});
                    addFx(lay, "ADBE Brightness & Contrast 2", {1: -120});
                }
                L[def.name] = lay;
            }
            var adj = comp.layers.addSolid([0, 0, 0], "viñeta", 1080, 1920, 1, dur);
            adj.adjustmentLayer = true;
            addFx(adj, "CC Vignette", {1: 70});
            var UI = {measure: 1, title: 1, card: 1, label: 1, pill: 1, cta: 1, icons: 1, arrow: 1};
            for (var u = comp.numLayers; u >= 1; u--) if (UI[comp.layer(u).name]) { adj.moveAfter(comp.layer(u)); break; }
            var vo = comp.layers.add(imp(ROOT + "video/public/04/vo" + (i + 1) + ".mp3", fAudio));
            vo.name = "voz";
            vo.moveToEnd();
            scenes.push({comp: comp, L: L, dur: dur, adj: adj});
            starts.push(t0);
            t0 += dur;
        }
        var TOTAL = t0;

        // ---------- animación por escena ----------
        var s, L2;
        // 1. Gancho: camina, las medidas se despliegan.
        s = scenes[0]; L2 = s.L;
        keys(T(L2.bg).property("ADBE Position"), [0, s.dur], [[555, 960], [525, 960]]);
        keys(T(L2.bg).property("ADBE Scale"), [0, s.dur], [[50, 50], [52, 52]]);
        keys(T(L2.dino).property("ADBE Position"), [0, s.dur], [[600, 960], [505, 960]]);
        expr(T(L2.dino).property("ADBE Position"), "value + [0, -Math.abs(Math.sin(time*5))*7]");
        expr(T(L2.buses).property("ADBE Position"), "value + [0, Math.sin(time*31)*0.8]");
        T(L2.measure).property("ADBE Anchor Point").setValue([1090, 2232]);
        T(L2.measure).property("ADBE Position").setValue([545, 1116]);
        var tm = wt(0, "largo") - 0.1;
        keys(T(L2.measure).property("ADBE Scale"), [tm, tm + 0.45], [[0, 50], [50, 50]]);
        fadeIn(L2.measure, tm, 0.15);
        pop(L2.title, 0.05, 540, 230);

        // 2. Mapa: la cámara se aleja desde Paraguay; aparece la ruta.
        s = scenes[1]; L2 = s.L;
        var cam = s.comp.layers.addNull(s.dur);
        cam.name = "camara";
        T(cam).property("ADBE Position").setValue([540, 960]);
        L2.bg.parent = cam; L2.map.parent = cam; L2.pin.parent = cam;
        var tp = wt(1, "patagonia");
        keys(T(cam).property("ADBE Scale"), [0, tp], [[140, 140], [100, 100]]);
        keys(T(cam).property("ADBE Position"), [0, tp], [[540, 1073], [540, 960]]);
        fadeIn(L2.pin, wt(1, "vivi"), 0.5);
        pop(L2.title, 0.1, 540, 220);
        pop(L2.card, wt(1, "argentinosaurio"), 540, 1225);

        // 3. Ventana: el cuello entra, el chico tiembla.
        s = scenes[2]; L2 = s.L;
        keys(T(L2.bg).property("ADBE Scale"), [0, s.dur], [[50, 50], [53, 53]]);
        var tc = wt(2, "cuello");
        keys(T(L2.dino).property("ADBE Position"), [0, tc + 0.5], [[1300, 980], [540, 960]]);
        expr(T(L2.dino).property("ADBE Position"), "value + [0, Math.sin(time*2.5)*5]");
        expr(T(L2.person).property("ADBE Position"), "time > " + (tc + 0.55) + " ? value + [Math.sin(time*40)*3, 0] : value");
        pop(L2.title, wt(2, "espiar"), 540, 205);

        // 4. Peso: la calle tiembla y la balanza se vuelca.
        s = scenes[3]; L2 = s.L;
        var shake = "time > 0.3 && time < 1.7 ? value + [Math.sin(time*55)*6, Math.cos(time*47)*4] : value";
        expr(T(L2.bg).property("ADBE Position"), shake);
        expr(T(L2.base).property("ADBE Position"), shake);
        var te = wt(3, "elefantes");
        keys(T(L2.beam).property("ADBE Rotate Z"), [0, te - 0.3, te + 0.15, te + 0.45, te + 0.75], [6, 6, -12, -6, -8]);
        expr(T(L2.panL).property("ADBE Position"), 'thisComp.layer("beam").toComp([300,1280])');
        expr(T(L2.panR).property("ADBE Position"), 'thisComp.layer("beam").toComp([1860,1280])');
        pop(L2.title, 0.1, 540, 210);
        pop(L2.pill, te, 540, 1125);

        // 5. Peligro: se oscurece y entra la manada.
        s = scenes[4]; L2 = s.L;
        var tz = wt(4, "peligro");
        var cam5 = s.comp.layers.addNull(s.dur);
        cam5.name = "camara";
        T(cam5).property("ADBE Position").setValue([540, 960]);
        L2.bg.parent = cam5; L2.tree.parent = cam5; L2.dino.parent = cam5; L2.mapu.parent = cam5; L2.fg.parent = cam5;
        keys(T(cam5).property("ADBE Scale"), [tz, s.dur], [[100, 100], [112, 112]]);
        var night = s.comp.layers.addSolid([0, 0, 0], "noche", 1080, 1920, 1, s.dur);
        night.adjustmentLayer = true;
        night.moveBefore(L2.fg);
        var bc = addFx(night, "ADBE Brightness & Contrast 2", {});
        if (bc) keys(bc.property(1), [tz, tz + 0.8], [0, -45]);
        var tmapu = wt(4, "mapusaurio");
        // la manada cuelga de la cámara: su posición es relativa al null (50,50 = centro del cuadro)
        keys(T(L2.mapu).property("ADBE Position"), [tz, tmapu], [[750, 50], [50, 50]]);
        expr(T(L2.mapu).property("ADBE Position"), "value + [0, -Math.abs(Math.sin(time*4))*6]");
        expr(T(L2.dino).property("ADBE Position"), "value + [0, Math.sin(time*2)*4]");
        pop(L2.title, tz, 540, 210);
        pop(L2.label, tmapu, 780, 880);

        // 6. Cierre: botones con rebote y el dinosaurio asoma.
        s = scenes[5]; L2 = s.L;
        keys(T(L2.dino).property("ADBE Position"), [0.2, 1.0], [[540, 1560], [540, 960]]);
        expr(T(L2.dino).property("ADBE Position"), "value + [0, Math.sin(time*2)*6]");
        pop(L2.title, 0, 540, 220);
        pop(L2.icons, 0.25, 540, 560);
        var tcm = wt(5, "comenta");
        pop(L2.cta, tcm, 540, 860);
        expr(T(L2.cta).property("ADBE Scale"), "time > " + (tcm + 0.3) + " ? value * (1 + 0.03*Math.sin((time-" + tcm + ")*6)) : value");
        pop(L2.pill, wt(5, "aprender"), 540, 1065);
        fadeIn(L2.arrow, wt(5, "video") + 0.2, 0.3);

        // ---------- composición maestra ----------
        var master = proj.items.addComp("ARGENTINOSAURIO", 1080, 1920, 1, TOTAL, FPS);
        master.motionBlur = true;
        for (var m = scenes.length - 1; m >= 0; m--) {
            var sl = master.layers.add(scenes[m].comp);
            sl.startTime = starts[m];
            sl.motionBlur = true;
        }
        var capsIO = new ImportOptions(new File(ROOT + "video/out/a4caps/element-0000.png"));
        capsIO.sequence = true;
        capsIO.forceAlphabetical = true;
        var caps = proj.importFile(capsIO);
        caps.mainSource.conformFrameRate = FPS;
        var capL = master.layers.add(caps);
        capL.name = "subtítulos";
        var mus = master.layers.add(imp(ROOT + "video/public/04/music.wav", fAudio));
        mus.name = "música";
        mus.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([-1.5, -1.5]);
        function sfx(name, at, db) {
            var l = master.layers.add(imp(ROOT + "video/public/sfx3/" + name + ".wav", fAudio));
            l.startTime = at;
            l.name = "sfx " + name;
            l.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([db, db]);
        }
        for (var q = 1; q < scenes.length; q++) sfx("swish", starts[q], -20);
        var st = [0.3, 1.1, 1.9, 2.7, 3.5];
        for (q = 0; q < st.length; q++) sfx("step", st[q], -13);
        sfx("horn", wt(0, "cuadra"), -14);
        sfx("pop", starts[0] + wt(0, "largo"), -16);
        sfx("whoosh", starts[1], -18);
        sfx("pop", starts[1] + wt(1, "argentinosaurio"), -16);
        sfx("pop", starts[1] + wt(1, "vivi"), -16);
        sfx("whoosh2", starts[2] + 0.4, -16);
        sfx("glass", starts[2] + wt(2, "cuello") + 0.55, -16);
        sfx("step", starts[3] + 0.35, -11);
        sfx("glass", starts[3] + 0.35, -14);
        sfx("step", starts[3] + 0.9, -11);
        sfx("glass", starts[3] + 0.9, -14);
        sfx("toc", starts[3] + wt(3, "diez"), -12);
        sfx("step", starts[3] + wt(3, "elefantes") + 0.15, -10);
        sfx("roar", starts[4] + wt(4, "mapusaurio"), -14);
        sfx("pop", starts[5] + 0.25, -16);
        sfx("ding", starts[5] + wt(5, "comenta"), -12);

        proj.save(new File(ROOT + "ae/argentino.aep"));
        log("proyecto animado guardado, duracion " + TOTAL.toFixed(2) + " s");

        // ---------- render ----------
        var rq = app.project.renderQueue.items;
        while (rq.length > 0) rq[1].remove();
        var item = rq.add(master);
        var om = item.outputModule(1);
        var tpl = null;
        for (var z = 0; z < om.templates.length; z++) if (om.templates[z].indexOf("H.264") >= 0 && om.templates[z].indexOf("40") >= 0) tpl = om.templates[z];
        om.applyTemplate(tpl);
        om.file = new File(ROOT + "videos/04-argentino-ae.mp4");
        log("render con plantilla: " + tpl);
        app.project.renderQueue.render();
        proj.save(new File(ROOT + "ae/argentino.aep"));
        log("render terminado");
        app.endSuppressDialogs(false);
    } catch (e) {
        log("ERROR " + e.toString() + " linea " + e.line);
    }
    log("fin");
    LOG.close();
})();
