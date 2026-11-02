# BluePrint: guía para hacer los Shorts

Shorts verticales en español (1080×1920, 30 fps, ~45–60 s) del tipo "¿Qué pasaría si…?". Hay un personaje fijo, Nico (un chico explorador), y el estilo es 3D de juguete con carteles tipo HUD, barra de progreso y subtítulos de una línea.

Todo se hace en código: los modelos, los escenarios, los gráficos, la música y los efectos. No se usan generadores de imágenes ni de video por IA. La única pieza externa es la voz, que sale de edge-tts.

## Reglas del canal

- **Contenido universal:** no se ata a ningún país ni usa referencias locales.
- **Pocos datos por video:** cada uno tiene que estar verificado.
- **Gancho fuerte al inicio:** la escena 1 pone la pregunta y la promesa ("4 peligros… y el último nadie lo ve venir").
- **Subtítulos chicos:** una línea, abajo y con la palabra que se dice en amarillo: `<Captions top={1560} size={62} maxWords={3} maxChars={17} />`.
- **Efectos sutiles:** siempre por debajo de la voz (entre −12 y −24 dB). La música va a −1,5 dB y baja sola cuando habla la voz.
- **Cierre fijo:** "Comenta VIDEO si quieres aprender a hacer videos así para tu negocio."

## Herramientas

| Herramienta | Para qué |
|---|---|
| Blender 5.2 (EEVEE) | Personajes, escenarios, cámaras y animación (`blender/`) |
| Remotion 4 (`video/`) | Capa de gráficos transparente: carteles, íconos, subtítulos y barra de progreso |
| Python + edge-tts | Voz (`make_audio.py`) |
| Python + numpy/scipy | Música y efectos sintetizados (`sound.py`) |
| After Effects 2024 | Armado final con capas, audio y render H.264 (`ae/`) |
| ffmpeg | Normalización de volumen (−14 LUFS) y vista previa liviana |

Instalación: `cd video && npm install` y `pip install edge-tts numpy scipy`.

## Paso a paso para un video nuevo

1. **Guion.** Copiar `shorts/06-hormiga.json` a `shorts/NN-tema.json`. Lleva una escena por línea de narración. `extra` agrega segundos de pausa al final de cada escena (por ejemplo, para una cuenta regresiva).
2. **Voz.**
   ```
   python make_audio.py shorts/NN-tema.json video/public/NN
   ```
   Genera `voN.mp3` y `data.json`, con la duración de cada escena y el tiempo de cada palabra. Todos los tiempos salen de ahí: cada escena dura `ceil((dur + 0.12 + extra) * 30)` cuadros.
3. **3D en Blender.** Escribir `blender/build_tema.py` tomando de modelo `build_hormiga.py`:
   - Piezas en `toy.py`: `nico()`, `spider()`, `bird()`, `theropod()`, `water()`, primitivas y `key()`.
   - Escenarios en `sets.py`: `kitchen()`, `giant_room()`, `yard()`, `stage()` y `farm()`.
   - `wf(escena, "palabra")` devuelve el cuadro en que se dice esa palabra, para sincronizar las acciones con la voz.
   - Hay una cámara por toma, atada a marcadores de la línea de tiempo.

   Para correrlo dentro de Blender:
   ```
   exec(open(r"C:/.../blender/build_tema.py", encoding="utf-8").read())
   ```
   Conviene revisar algunos cuadros sueltos al 40 % antes del render completo:
   ```
   blender.exe -b blender/tema.blend -a      # cuadros en blender/renderN/f_####.png
   ```
4. **Gráficos.** Escribir `video/src/tema.tsx` tomando de modelo `hormiga.tsx`. Reusa `Panel`, `Pill`, `Label`, `Item`, `Progress` y `usePop` de `pollo.tsx`. Después hay que registrarlo en `Root.tsx` y renderizar:
   ```
   npx remotion render src/index.ts tema-overlay out/tema_ov --sequence --image-format=png
   ```
5. **Música y efectos.** Agregar un modo `compose_tema()` en `sound.py`, con un tramo de música por escena, y correr:
   ```
   python sound.py video/public/NN <modo>
   ```
   Los efectos quedan en `video/public/sfx3/`.
6. **Armado.** Copiar `ae/make_hormiga.jsx`, cambiar las rutas y ubicar los efectos con `wt(escena, "palabra")`. Correr:
   ```
   AfterFX.exe -r ae/make_tema.jsx
   ```
   El script escribe `ae/log_tema.txt` y termina con la línea "fin".
7. **Final.**
   ```
   ffmpeg -i videos/NN-tema-ae.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k videos/NN-tema.mp4
   ffmpeg -i videos/NN-tema.mp4 -c:v libx264 -crf 24 -c:a copy videos/NN-tema-preview.mp4
   ```

## Trucos y problemas conocidos

- **Blender, partículas:** al instanciar colecciones hay que usar `use_whole_collection=True` y rotar el prototipo 90° en Y.
- **Blender, agua:** el material va en modo `BLENDED` con alfa ~0,27 (ver `toy.water()`).
- **Blender, giros:** usar `near()` para que los personajes giren por el camino corto.
- **Blender, saltos:** los saltos de posición entre tomas se hacen con dos claves en cuadros seguidos.
- **After Effects, proyecto:** cada script tiene que hacer `app.open()` o crear un proyecto nuevo.
- **After Effects, efectos:** los parámetros se setean por índice, `property(1)`.
- **After Effects, cuadros sueltos:** `saveFrameToPng` no funciona; hay que usar la cola de render.
- **After Effects, acentos:** en los `.jsx`, los textos con acentos van como `\u00e1`, etc.
- **After Effects, Glow:** no agregarlo, lava la imagen.
- **Archivos que no van al repositorio:** renders, `node_modules`, `.wav`, `.aep` y los videos finales. Todo se regenera con los scripts. Solo se suben las vistas previas (`*-preview.mp4`).

## Videos

| # | Tema | Técnica |
|---|---|---|
| 01–02 | Asteroide | Pruebas en 2D y en 3D low-poly (descartadas) |
| 03 | ¿Podrías escapar de un T-Rex? | 2D ilustrado en Remotion |
| 04 | Argentinosaurio | Capas de Remotion armadas en After Effects |
| 05 | ¿Hoy comiste dinosaurio? | 3D de juguete en Blender + After Effects |
| 06 | Te encogiste al tamaño de una hormiga | 3D de juguete en Blender + After Effects |
