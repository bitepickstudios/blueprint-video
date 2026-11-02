// Video "Te encogiste al tamaño de una hormiga": junta el render 3D de Blender, la capa de gráficos,
// la voz, la música y los efectos, y renderiza el video final.
(function () {
    var ROOT = "C:/Users/USER/Desktop/BluePrint-Project/";
    var LOG = new File(ROOT + "ae/log_hormiga.txt");
    LOG.open("w");
    function log(s) { LOG.writeln(s); }
    function readJSON(path) {
        var f = new File(path);
        f.encoding = "UTF-8";
        f.open("r");
        var t = f.read();
        f.close();
        return eval("(" + t + ")");
    }
    try {
        var data = readJSON(ROOT + "video/public/06/data.json");
        var FPS = 30;
        var starts = [], lens = [], t = 0;
        for (var i = 0; i < data.scenes.length; i++) {
            starts.push(t);
            var n = Math.ceil((data.scenes[i].dur + 0.12 + (data.extra[i] || 0)) * FPS);
            lens.push(n);
            t += n / FPS;
        }
        var TOTAL = t;
        function ws(i, key) {
            var w = data.scenes[i].words;
            for (var k = 0; k < w.length; k++) if (w[k].w.toLowerCase().replace(/[\u00bf\u00a1]/g, "").indexOf(key) === 0) return w[k].s;
            log("palabra no encontrada: " + key);
            return 0;
        }
        function wt(i, key) { return starts[i] + ws(i, key); }
        app.beginSuppressDialogs();
        if (app.project) app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        var proj = app.newProject();
        function seq(path) {
            var io = new ImportOptions(new File(path));
            io.sequence = true;
            io.forceAlphabetical = true;
            var it = proj.importFile(io);
            it.mainSource.conformFrameRate = FPS;
            return it;
        }
        function imp(path) { return proj.importFile(new ImportOptions(new File(path))); }
        var comp = proj.items.addComp("HORMIGA", 1080, 1920, 1, TOTAL, FPS);
        var render3d = comp.layers.add(seq(ROOT + "blender/render6/f_0001.png"));
        render3d.name = "3D Blender";
        var ov = comp.layers.add(seq(ROOT + "video/out/hormiga_ov/element-0000.png"));
        ov.name = "gr\u00e1ficos";
        for (i = 0; i < data.scenes.length; i++) {
            var vo = comp.layers.add(imp(ROOT + "video/public/06/vo" + (i + 1) + ".mp3"));
            vo.startTime = starts[i];
            vo.name = "voz " + (i + 1);
        }
        var mus = comp.layers.add(imp(ROOT + "video/public/06/music.wav"));
        mus.name = "m\u00fasica";
        mus.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([-1.5, -1.5]);
        var cache = {};
        function sfx(name, at, db) {
            if (!cache[name]) cache[name] = imp(ROOT + "video/public/sfx3/" + name + ".wav");
            var l = comp.layers.add(cache[name]);
            l.startTime = at;
            l.name = "sfx " + name;
            l.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([db, db]);
        }
        var k;
        for (i = 1; i < starts.length; i++) sfx("swish", starts[i], -20);
        // 1: se encoge, 4 peligros
        var hor = wt(0, "hormiga");
        sfx("pop", hor, -14);
        sfx("sparkle", hor + 0.1, -20);
        var cua = Math.round(ws(0, "cuatro") * FPS) / FPS + starts[0];
        for (k = 0; k < 4; k++) sfx("pop", cua + (4 + k * 4) / FPS, -19);
        sfx("tick2", wt(0, "\u00faltima"), -14);
        // 2: camina, resbala, cae, cuenta regresiva
        for (k = 0; k < 4; k++) sfx("step", starts[1] + k * 0.33, -24);
        sfx("whoosh", wt(1, "resbalas"), -16);
        sfx("reverse", wt(1, "borde"), -20);
        sfx("wind", wt(1, "mesa"), -20);
        var cd0 = Math.round(ws(1, "sobrevives") * FPS) + 14, cd1 = lens[1] - 6, seg = (cd1 - cd0) / 3;
        for (k = 0; k < 3; k++) sfx("tick2", starts[1] + (cd0 + Math.round(k * seg)) / FPS, -11);
        // 3: ¡sí!, el aire lo frena, aterriza y festeja
        sfx("ding", starts[2] + 0.1, -12);
        sfx("sparkle", starts[2] + 0.15, -19);
        sfx("wind", wt(2, "aire") - 0.3, -22);
        sfx("toc", wt(2, "cualquier") + 6 / FPS, -14);
        sfx("pop", wt(2, "lastimarte") + 2 / FPS, -18);
        // 4: hambre, calor, mordiscos
        sfx("growl", wt(3, "hambre") + 0.1, -10);
        sfx("freeze", wt(3, "calor") - 0.2, -22);
        var bite0 = wt(3, "comer") + 16 / FPS;
        for (k = 0; k < 4; k++) sfx("crunch", bite0 + k * 14 / FPS, -15);
        // 5: araña baja, se levanta, persecución
        sfx("riser", wt(4, "ara\u00f1a") - 1.0, -22);
        sfx("toc", wt(4, "ara\u00f1a") + 1.0, -18);
        sfx("skitter", wt(4, "almuerzo") - 0.1, -15);
        sfx("hit", wt(4, "almuerzo") + 0.1, -20);
        var cor = wt(4, "corre");
        sfx("whoosh", cor, -15);
        for (k = 0; k < 3; k++) sfx("skitter", cor + 0.2 + k * 0.7, -18);
        for (k = 0; k < 8; k++) sfx("step", cor + 0.15 + k * 0.2, -24);
        // 6: la gota
        sfx("drip", wt(5, "gota"), -11);
        var hit = wt(5, "aplasta") - 22 / FPS;
        sfx("whoosh", hit - 0.45, -18);
        sfx("splash", hit, -12);
        for (k = 0; k < 5; k++) sfx("blub", wt(5, "atrapa") + k * 1.1, -20);
        // 7: vuelve a su tamaño, CTA
        sfx("pop", starts[6] + 0.15, -15);
        sfx("sparkle", starts[6] + 0.2, -20);
        sfx("ding", wt(6, "comenta"), -12);
        sfx("pop", wt(6, "aprender"), -16);
        sfx("sparkle", wt(6, "video") + 0.1, -18);
        proj.save(new File(ROOT + "ae/hormiga.aep"));
        log("proyecto guardado, duracion " + TOTAL.toFixed(2) + " s");
        var rq = app.project.renderQueue.items;
        while (rq.length > 0) rq[1].remove();
        var item = rq.add(comp);
        var om = item.outputModule(1);
        var tpl = null;
        for (var z = 0; z < om.templates.length; z++) if (om.templates[z].indexOf("H.264") >= 0 && om.templates[z].indexOf("40") >= 0) tpl = om.templates[z];
        om.applyTemplate(tpl);
        om.file = new File(ROOT + "videos/06-hormiga-ae.mp4");
        app.project.renderQueue.render();
        proj.save(new File(ROOT + "ae/hormiga.aep"));
        log("render terminado");
        app.endSuppressDialogs(false);
    } catch (e) {
        log("ERROR " + e.toString() + " linea " + e.line);
    }
    log("fin");
    LOG.close();
})();
