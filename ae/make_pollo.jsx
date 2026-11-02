// Video "¿Hoy comiste dinosaurio?": junta el render 3D de Blender, la capa de gráficos, la voz,
// la música y los efectos, y renderiza el video final.
(function () {
    var ROOT = "C:/Users/USER/Desktop/BluePrint-Project/";
    var LOG = new File(ROOT + "ae/log_pollo.txt");
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
        var data = readJSON(ROOT + "video/public/05/data.json");
        var FPS = 30;
        var starts = [], t = 0;
        for (var i = 0; i < data.scenes.length; i++) {
            starts.push(t);
            t += Math.ceil((data.scenes[i].dur + 0.12 + (data.extra[i] || 0)) * FPS) / FPS;
        }
        var TOTAL = t;
        function wt(i, key, nth) {
            var w = data.scenes[i].words, n = nth || 0;
            for (var k = 0; k < w.length; k++) if (w[k].w.toLowerCase().indexOf(key) === 0 && n-- === 0) return starts[i] + w[k].s;
            log("palabra no encontrada: " + key);
            return starts[i];
        }
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
        var comp = proj.items.addComp("POLLO", 1080, 1920, 1, TOTAL, FPS);
        var render3d = comp.layers.add(seq(ROOT + "blender/render/f_0001.png"));
        render3d.name = "3D Blender";
        var ov = comp.layers.add(seq(ROOT + "video/out/pollo_ov/element-0000.png"));
        ov.name = "gráficos";
        for (i = 0; i < data.scenes.length; i++) {
            var vo = comp.layers.add(imp(ROOT + "video/public/05/vo" + (i + 1) + ".mp3"));
            vo.startTime = starts[i];
            vo.name = "voz " + (i + 1);
        }
        var mus = comp.layers.add(imp(ROOT + "video/public/05/music.wav"));
        mus.name = "música";
        mus.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([-1.5, -1.5]);
        function sfx(name, at, db) {
            var l = comp.layers.add(imp(ROOT + "video/public/sfx3/" + name + ".wav"));
            l.startTime = at;
            l.name = "sfx " + name;
            l.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([db, db]);
        }
        for (i = 1; i < starts.length; i++) sfx("swish", starts[i], -20);
        sfx("pop", wt(0, "pollo"), -16);
        var d = wt(0, "dinosaurio");
        sfx("hit", d, -14);
        sfx("pop", d + 0.1, -14);
        sfx("roar", d + 0.25, -16);
        sfx("cluck", starts[1] + 0.3, -12);
        var son = wt(1, "son", 1);
        for (var k = 0; k < 6; k++) sfx("step", son - 0.67 + k * 0.27, -15);
        var ta = wt(1, "asteroide");
        sfx("whoosh", ta - 0.5, -14);
        sfx("hit", ta + 0.6, -18);
        sfx("pop", wt(2, "t-rex"), -16);
        sfx("pop", wt(2, "terópodos"), -16);
        sfx("pop", wt(2, "terópodos") + 0.4, -16);
        sfx("tick2", wt(3, "plumas"), -10);
        sfx("tick2", wt(3, "huesos"), -10);
        sfx("tick2", wt(3, "tres"), -10);
        sfx("ding", wt(3, "gallina"), -14);
        sfx("cluck", wt(3, "gallina") + 0.2, -12);
        sfx("pop", wt(4, "diez"), -16);
        for (k = 0; k < 4; k++) sfx("tick2", wt(4, "diez") + k * 0.2, -14);
        sfx("chirp", starts[4] + 1.5, -16);
        sfx("chirp", starts[4] + 3.2, -16);
        sfx("pop", wt(4, "dinosaurios"), -16);
        sfx("chirp", starts[4] + 6.0, -16);
        sfx("cluck", starts[5] + 0.3, -12);
        sfx("cluck", starts[5] + 1.3, -14);
        for (k = 0; k < 5; k++) sfx("tick2", wt(5, "veinte") + k * 0.2, -14);
        sfx("ding", wt(6, "comenta"), -12);
        sfx("pop", wt(6, "aprender"), -16);
        sfx("sparkle", wt(6, "video") + 0.1, -18);
        proj.save(new File(ROOT + "ae/pollo.aep"));
        log("proyecto guardado, duracion " + TOTAL.toFixed(2) + " s");
        var rq = app.project.renderQueue.items;
        while (rq.length > 0) rq[1].remove();
        var item = rq.add(comp);
        var om = item.outputModule(1);
        var tpl = null;
        for (var z = 0; z < om.templates.length; z++) if (om.templates[z].indexOf("H.264") >= 0 && om.templates[z].indexOf("40") >= 0) tpl = om.templates[z];
        om.applyTemplate(tpl);
        om.file = new File(ROOT + "videos/05-pollo-ae.mp4");
        app.project.renderQueue.render();
        proj.save(new File(ROOT + "ae/pollo.aep"));
        log("render terminado");
        app.endSuppressDialogs(false);
    } catch (e) {
        log("ERROR " + e.toString() + " linea " + e.line);
    }
    log("fin");
    LOG.close();
})();
