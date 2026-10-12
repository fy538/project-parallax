/** Local, synthetic timing track. No service calls; requires macOS say + ffmpeg. */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = fileURLToPath(new URL("../", import.meta.url));
const pilots = { "promise-and-copy": "PromiseAndCopy", "what-we-count": "WhatWeCount" };
const pilot = process.argv[2] ?? "promise-and-copy";
if (!(pilot in pilots)) throw new Error(`Unknown pilot: ${pilot}. Choose ${Object.keys(pilots).join(", ")}.`);
const source = join(root, "src/pilots", pilots[pilot]);
const output = join(root, "public/pilots", pilot);
const script = JSON.parse(readFileSync(join(source, "narration.json"), "utf8"));
const voice = process.env.PILOT_VOICE ?? "Samantha";
const rate = process.env.PILOT_RATE ?? "150";
if (process.platform !== "darwin") throw new Error("Scratch regeneration uses macOS say. The checked-in WAVs render on any platform.");
mkdirSync(output, { recursive: true });
const temp = mkdtempSync(join(tmpdir(), "promise-copy-"));
const manifest = {};
try {
  for (const [key, text] of Object.entries(script)) {
    const txt = join(temp, `${key}.txt`);
    const aiff = join(temp, `${key}.aiff`);
    const wav = join(output, `${key}.wav`);
    writeFileSync(txt, text);
    execFileSync("say", ["-v", voice, "-r", rate, "-f", txt, "-o", aiff]);
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", aiff,
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
    const durationSec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries",
      "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wav], { encoding: "utf8" }).trim());
    if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error(`Invalid duration for ${key}`);
    manifest[key] = { src: `pilots/${pilot}/${key}.wav`, durationSec, text, voice, rate: Number(rate) };
    console.log(`${key}: ${durationSec.toFixed(2)}s`);
  }
  writeFileSync(join(source, "audio-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
