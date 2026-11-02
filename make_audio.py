"""Narración (edge-tts) + efectos sintetizados (ffmpeg) para un short.

Uso: python make_audio.py shorts/01-asteroide.json video/public/01
"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

SR = "44100"
# Cada efecto: (entradas lavfi, filtro final). Todo sintetizado, sin samples de terceros.
SFX = {
    "whoosh": (["anoisesrc=d=0.45:c=pink:a=0.9"],
               "highpass=f=500,lowpass=f=4500,aphaser,afade=t=in:d=0.28:curve=exp,afade=t=out:st=0.28:d=0.17"),
    "boom": (["aevalsrc='0.9*sin(2*PI*(38*t+90*(1-exp(-6*t))/6))*exp(-2.2*t)':d=2.4",
              "anoisesrc=c=brown:d=2.4:a=0.9"],
             "[1]lowpass=f=260,afade=t=out:d=2.4:curve=exp,volume=0.8[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95"),
    "hit": (["aevalsrc='0.9*sin(2*PI*(50*t+160*(1-exp(-30*t))/30))*exp(-7*t)':d=0.7",
             "anoisesrc=c=white:d=0.7:a=0.6"],
            "[1]highpass=f=1500,afade=t=out:d=0.08,volume=0.5[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95"),
    "riser": (["aevalsrc='0.35*sin(2*PI*(180*t+260*t*t))*(t/1.8)':d=1.8",
               "anoisesrc=c=pink:d=1.8:a=0.5"],
              "[1]highpass=f=1800,afade=t=in:d=1.8:curve=exp[n];[0][n]amix=inputs=2:normalize=0"),
    "tick": (["aevalsrc='0.6*sin(2*PI*2600*t)*exp(-90*t)':d=0.08"], "anull"),
    "chime": (["aevalsrc='0.3*(sin(2*PI*880*t)+0.6*sin(2*PI*1318.5*t)+0.3*sin(2*PI*1760*t))*exp(-3*t)':d=1.6"], "anull"),
    "step": (["aevalsrc='1.0*sin(2*PI*(40*t+70*(1-exp(-20*t))/20))*exp(-9*t)':d=0.6",
              "anoisesrc=c=brown:d=0.6:a=0.9"],
             "[1]lowpass=f=200,afade=t=out:d=0.4,volume=0.6[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95"),
    "rumble": (["anoisesrc=c=brown:d=4:a=0.9"], "lowpass=f=140,afade=t=in:d=1,afade=t=out:st=2.5:d=1.5,volume=1.6"),
    # Fondo: drone grave + latido cada 0.9 s.
    "bed": (["aevalsrc='0.12*sin(2*PI*55*t)+0.08*sin(2*PI*82.41*t)*(0.6+0.4*sin(2*PI*0.13*t))"
             "+0.05*sin(2*PI*110*t+2*sin(2*PI*0.21*t))+0.03*sin(2*PI*164.8*t)*(0.5+0.5*sin(2*PI*0.07*t))"
             "+0.22*sin(2*PI*48*t)*exp(-14*mod(t,0.9))':d=75"],
            "lowpass=f=900,afade=t=in:d=1.5"),
}


def make_sfx(out: Path):
    out.mkdir(parents=True, exist_ok=True)
    for name, (inputs, filt) in SFX.items():
        dst = out / f"{name}.wav"
        if dst.exists():
            continue
        cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        for i in inputs:
            cmd += ["-f", "lavfi", "-i", i]
        flag = "-filter_complex" if "[" in filt else "-af"
        cmd += [flag, filt, "-ar", SR, "-ac", "1", str(dst)]
        subprocess.run(cmd, check=True)


async def tts(text, voice, rate, mp3):
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"w": ch["text"], "s": round(s, 3), "e": round(s + ch["duration"] / 1e7, 3)})
    # "13 por ciento" -> "13%" en los subtítulos
    out = []
    for w in words:
        if w["w"] == "ciento" and len(out) >= 2 and out[-1]["w"] == "por" and out[-2]["w"][-1:].isdigit():
            out.pop()
            out[-1] = {**out[-1], "w": out[-1]["w"] + "%", "e": w["e"]}
        else:
            out.append(w)
    return out


def duration(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))


async def main(src, out):
    cfg = json.loads(Path(src).read_text(encoding="utf-8"))
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    make_sfx(out.parent / "sfx")
    scenes = []
    for i, text in enumerate(cfg["scenes"], 1):
        mp3 = out / f"vo{i}.mp3"
        words = await tts(text, cfg["voice"], cfg["rate"], mp3)
        scenes.append({"text": text, "audio": f"{out.name}/vo{i}.mp3", "dur": round(duration(mp3), 3), "words": words})
    data = {"scenes": scenes, "extra": cfg.get("extra", [])}
    (out / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print("total", round(sum(s["dur"] for s in scenes), 1), "s")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
