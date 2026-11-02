// Arma el proyecto del video 3 (Argentinosaurio) en After Effects a partir de las capas PNG y la voz.
// Salida: ae/argentino.aep + un cuadro por escena en ae/sb4/ para el storyboard.
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
    try {
        var cfg = readJSON(ROOT + "video/public/04/layers.json");
        var data = readJSON(ROOT + "video/public/04/data.json");
        var FPS = 30, GAP = 0.12;
        app.beginSuppressDialogs();
        if (app.project) app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        var proj = app.newProject();
        var fCapas = proj.items.addFolder("capas");
        var fAudio = proj.items.addFolder("audio");
        var fEsc = proj.items.addFolder("escenas");
        function imp(path, parent) {
            var it = proj.importFile(new ImportOptions(new File(path)));
            it.parentFolder = parent;
            return it;
        }
        var master = proj.items.addComp("ARGENTINOSAURIO", 1080, 1920, 1, 60, FPS);
        var t0 = 0;
        var comps = [];
        for (var i = 0; i < cfg.scenes.length; i++) {
            var sc = cfg.scenes[i];
            var sd = data.scenes[i];
            var dur = Math.ceil((sd.dur + GAP + (data.extra[i] || 0)) * FPS) / FPS;
            var comp = proj.items.addComp(sc.id.toUpperCase(), 1080, 1920, 1, dur, FPS);
            comp.parentFolder = fEsc;
            comp.motionBlur = true;
            for (var j = 0; j < sc.layers.length; j++) {
                var L = (typeof sc.layers[j] === "string") ? {name: sc.layers[j]} : sc.layers[j];
                var name = L.name;
                var lay = comp.layers.add(imp(ROOT + "ae/a4/" + sc.id + "_" + name + ".png", fCapas));
                lay.name = name;
                var tr = lay.property("ADBE Transform Group");
                tr.property("ADBE Anchor Point").setValue(L.anchor ? [L.anchor[0] * 2, L.anchor[1] * 2] : [1080, 1920]);
                tr.property("ADBE Position").setValue(L.pos ? L.pos : [540, 960]);
                tr.property("ADBE Scale").setValue([50, 50]);
                if (L.rot) tr.property("ADBE Rotate Z").setValue(L.rot);
                if (L.blur) {
                    addFx(lay, "ADBE Gaussian Blur 2", {1: L.blur});
                    addFx(lay, "ADBE Brightness & Contrast 2", {1: -120});
                }
            }
            var adj = comp.layers.addSolid([0, 0, 0], "viñeta", 1080, 1920, 1, dur);
            adj.adjustmentLayer = true;
            addFx(adj, "CC Vignette", {1: 70});
            var UI = {measure: 1, title: 1, card: 1, label: 1, pill: 1, cta: 1, icons: 1, arrow: 1, cap: 1};
            for (var u = comp.numLayers; u >= 1; u--) {
                if (UI[comp.layer(u).name]) { adj.moveAfter(comp.layer(u)); break; }
            }
            var vo = comp.layers.add(imp(ROOT + "video/public/04/vo" + (i + 1) + ".mp3", fAudio));
            vo.name = "voz";
            vo.moveToEnd();
            var sl = master.layers.add(comp);
            sl.startTime = t0;
            t0 += dur;
            comps.push({comp: comp, key: sc.key, id: sc.id});
        }
        master.duration = t0;
        proj.save(new File(ROOT + "ae/argentino.aep"));
        log("proyecto guardado, duracion " + t0.toFixed(2) + " s");
        var outDir = new Folder(ROOT + "ae/sb4");
        if (!outDir.exists) outDir.create();
        var rqItems = app.project.renderQueue.items;
        while (rqItems.length > 0) rqItems[1].remove();
        for (var c = 0; c < comps.length; c++) {
            var it = rqItems.add(comps[c].comp);
            it.timeSpanStart = comps[c].key;
            it.timeSpanDuration = 1 / FPS;
            var om = it.outputModule(1);
            var tpl = null;
            for (var q = 0; q < om.templates.length; q++) if (om.templates[q].indexOf("TIFF") >= 0) tpl = om.templates[q];
            om.applyTemplate(tpl);
            om.file = new File(ROOT + "ae/sb4/" + comps[c].id + "_[#####].tif");
        }
        app.project.renderQueue.render();
        log("cuadros renderizados");
        proj.save(new File(ROOT + "ae/argentino.aep"));
        app.endSuppressDialogs(false);
    } catch (e) {
        log("ERROR " + e.toString() + " linea " + e.line);
    }
    log("fin");
    LOG.close();
})();
