#!/usr/bin/env python3
"""
generate_sfx.py — Parallax SFX synthesiser.

Generates all 22 transition SFX + 7 texture-hit WAV files for the Parallax
audio design system. Output format: 48 kHz · 24-bit · stereo PCM WAV.

Aesthetic target: "minimal editorial" — clean, tonal, never flashy.
Consistent reverb tail and dynamic envelope across all cue types so the
library sounds like it came from one session.

Usage:
    python3 tools/generate_sfx.py               # regenerate everything
    python3 tools/generate_sfx.py --dry-run     # print file list, no writes
    python3 tools/generate_sfx.py --cue beat-transition   # one type only

Output directories (relative to repo root):
    remotion-templates/public/audio/sfx/transitions/
    remotion-templates/public/audio/sfx/textures/
"""

import argparse
import struct
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

# ── Constants ────────────────────────────────────────────────────────────────

SR = 48_000          # 48 kHz — production standard (doctrine: 48kHz 24-bit)
PEAK = 0.88          # headroom ceiling for all generated signals

REPO_ROOT = Path(__file__).resolve().parent.parent
TRANSITIONS_DIR = REPO_ROOT / "remotion-templates/public/audio/sfx/transitions"
TEXTURES_DIR    = REPO_ROOT / "remotion-templates/public/audio/sfx/textures"

# ── 24-bit stereo WAV writer ─────────────────────────────────────────────────

def write_wav_24bit(path: Path, mono: np.ndarray, sr: int = SR) -> None:
    """
    Write a 24-bit stereo PCM WAV from a mono float32 signal [-1, 1].
    The mono signal is duplicated to both channels (true stereo requires a
    real recording; synthesis outputs are inherently mono-compatible).
    """
    mono = np.clip(mono, -1.0, 1.0).astype(np.float32)

    # Convert to int32 (24-bit range)
    ints = (mono * (2**23 - 1)).astype(np.int32)

    # Interleave L / R (identical — mono-compatible stereo)
    stereo = np.column_stack([ints, ints]).flatten()          # (N*2,) int32

    # Extract the 3 low bytes per sample (little-endian 24-bit PCM)
    raw = stereo.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()

    n_ch  = 2
    bps   = 24
    block = n_ch * bps // 8   # 6 bytes per frame
    br    = sr * block         # byte rate

    with open(path, "wb") as f:
        data_sz = len(raw)
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_sz))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))          # fmt chunk size
        f.write(struct.pack("<H", 1))           # PCM
        f.write(struct.pack("<H", n_ch))
        f.write(struct.pack("<I", sr))
        f.write(struct.pack("<I", br))
        f.write(struct.pack("<H", block))
        f.write(struct.pack("<H", bps))
        f.write(b"data")
        f.write(struct.pack("<I", data_sz))
        f.write(raw)


# ── Signal primitives ────────────────────────────────────────────────────────

def t(dur: float) -> np.ndarray:
    """Time vector [0, dur) at SR."""
    return np.linspace(0, dur, int(dur * SR), endpoint=False)


def env(n: int, attack: float = 0.01, release: float = 0.3,
        hold: float = 0.0) -> np.ndarray:
    """
    ADSR-style amplitude envelope (no sustain level — full sustain).
    attack / release / hold are fractions of n (0–1).
    The three fractions must not exceed 1.0 combined; an AssertionError is
    raised at call time if they do (catches misconfigured synth calls early).
    """
    if attack + hold + release > 1.0 + 1e-9:
        raise ValueError(
            f"env(): attack({attack}) + hold({hold}) + release({release}) = "
            f"{attack + hold + release:.3f} > 1.0 — regions would overlap"
        )
    out = np.ones(n)
    na  = max(1, int(attack * n))
    nr  = max(1, int(release * n))
    nh  = max(1, int(hold * n))
    out[:na]      = np.linspace(0, 1, na)
    # hold plateau
    hold_end = na + nh
    if hold_end < n - nr:
        out[na:hold_end] = 1.0
        out[hold_end:n - nr] = 1.0
    out[max(0, n - nr):] = np.linspace(1, 0, min(nr, n - max(0, n - nr)))
    return np.clip(out, 0, 1)


def exp_decay(n: int, half_life: float = 0.15) -> np.ndarray:
    """Exponential decay envelope: 1 → 0 over n samples, half-life in seconds."""
    tau = half_life * SR
    return np.exp(-np.arange(n) / tau)


def butter_bp(signal: np.ndarray, lo: float, hi: float, order: int = 4) -> np.ndarray:
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, signal)


def butter_lp(signal: np.ndarray, cutoff: float, order: int = 4) -> np.ndarray:
    sos = butter(order, cutoff / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, signal)


def butter_hp(signal: np.ndarray, cutoff: float, order: int = 4) -> np.ndarray:
    sos = butter(order, cutoff / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, signal)


def pink_noise(n: int) -> np.ndarray:
    """
    Approx. pink noise via spectral shaping of white noise.
    -3 dB/octave roll-off gives warmer, more natural texture than white.
    """
    white = np.random.default_rng(42).standard_normal(n)
    # Frequency domain shaping
    freqs  = np.fft.rfftfreq(n, 1 / SR)
    freqs[0] = 1e-6  # avoid divide-by-zero at DC
    spectrum = np.fft.rfft(white)
    pink = np.fft.irfft(spectrum / np.sqrt(freqs), n=n)
    return pink / (np.max(np.abs(pink)) + 1e-9)


def add_reverb(sig: np.ndarray, rt60: float = 0.25,
               pre_delay_ms: float = 18.0, wet: float = 0.28) -> np.ndarray:
    """
    Short plate-style reverb via exponential IR convolution.
    Gives all cues the same spatial signature without muddying them.
    """
    if np.max(np.abs(sig)) < 1e-6:
        print(
            "WARNING: add_reverb() received a near-silent signal — "
            "check synthesiser for zero-gain or out-of-range parameters.",
            file=sys.stderr,
        )
        return sig  # return as-is; normalising silence produces noise

    n_pre = int(pre_delay_ms * SR / 1000)
    n_ir  = int(rt60 * SR)
    ir    = np.exp(-np.linspace(0, 6.9, n_ir))        # 60 dB decay
    ir    = np.concatenate([np.zeros(n_pre), ir])
    wet_s = fftconvolve(sig, ir)[: len(sig)]
    mixed = sig + wet * wet_s
    peak  = np.max(np.abs(mixed)) + 1e-9
    return mixed / peak * PEAK


def normalise(sig: np.ndarray, target: float = PEAK) -> np.ndarray:
    peak = np.max(np.abs(sig)) + 1e-9
    return sig / peak * target


def sine(freq: float, dur: float, phase: float = 0.0) -> np.ndarray:
    tt = t(dur)
    return np.sin(2 * np.pi * freq * tt + phase)


def freq_sweep(f0: float, f1: float, dur: float) -> np.ndarray:
    """Linear frequency sweep from f0 → f1 over dur seconds."""
    tt = t(dur)
    freqs = np.linspace(f0, f1, len(tt))
    phase = np.cumsum(freqs / SR) * 2 * np.pi
    return np.sin(phase)


# ── Intensity scaling ─────────────────────────────────────────────────────────

INTENSITY_GAIN = {"subtle": 0.38, "normal": 0.72, "dramatic": PEAK}


# ─────────────────────────────────────────────────────────────────────────────
# LAYER 2 — Transition SFX synthesisers
# ─────────────────────────────────────────────────────────────────────────────

def synth_beat_transition(dur: float, gain: float) -> np.ndarray:
    """
    Low whoosh + subtle tonal shift.
    Filtered noise centred ~80 Hz, swept slightly downward, with a thin
    high-frequency "air" component for presence. The workhorse cue — it
    should disappear into the edit without calling attention.
    """
    n = int(dur * SR)

    # Core: bandpass noise (40–180 Hz), gives the low "body" thud
    noise = pink_noise(n)
    body  = butter_bp(noise, 40, 180, order=3)
    body *= env(n, attack=0.06, release=0.55)

    # Air: very quiet high-pass (3 kHz+) layer for clarity
    air   = butter_hp(noise, 3000, order=2) * 0.12
    air  *= env(n, attack=0.02, release=0.65)

    # Subtle sub-tone at 55 Hz for depth on good speakers
    sub   = sine(55, dur) * 0.18 * env(n, attack=0.04, release=0.70)

    raw  = body + air + sub
    return add_reverb(raw, rt60=0.18, wet=0.22) * gain


def synth_stat_reveal(dur: float, gain: float) -> np.ndarray:
    """
    Rising tone → soft 'lock' click.
    Sine sweep 220 Hz → 880 Hz (A3→A5) over 60 % of the duration, then
    a short bright click (noise burst at 2–5 kHz) for the 'settle'.
    """
    n      = int(dur * SR)
    sweep_end = int(0.62 * n)
    click_len = int(0.04 * SR)   # 40 ms click

    # Rising sweep
    sweep = freq_sweep(220, 880, sweep_end / SR)
    sweep *= env(sweep_end, attack=0.08, release=0.35)

    # Click: bandpass noise burst
    click_n = np.random.default_rng(7).standard_normal(click_len)
    click   = butter_bp(click_n, 2000, 5500, order=4)
    click  *= exp_decay(click_len, half_life=0.010)

    # Combine
    raw     = np.zeros(n)
    raw[:sweep_end]                  += sweep
    click_start = min(sweep_end + int(0.02 * SR), n - click_len)
    raw[click_start: click_start + click_len] += click * 0.65

    return add_reverb(raw, rt60=0.15, wet=0.20) * gain


def synth_tension_rise(dur: float, gain: float) -> np.ndarray:
    """
    Slowly ascending pad — three slightly detuned oscillators rising
    in pitch from ~55 Hz to ~110 Hz, gradual fade-in.
    Builds subconscious unease without being melodic.
    """
    n  = int(dur * SR)
    tt = t(dur)

    # Three detuned oscillators rising across the duration
    def osc(f0: float, f1: float, detune: float = 0.0) -> np.ndarray:
        freqs = np.linspace(f0 + detune, f1 + detune, len(tt))
        ph    = np.cumsum(freqs / SR) * 2 * np.pi
        return np.sin(ph)

    layer  = osc(55, 110, 0.0) * 0.6
    layer += osc(55, 110, 0.7) * 0.25
    layer += osc(55, 110, -0.5) * 0.20
    # Add a thin high-frequency shimmer that grows in
    shimmer_f = np.linspace(1200, 2200, len(tt))
    shimmer_ph = np.cumsum(shimmer_f / SR) * 2 * np.pi
    layer += np.sin(shimmer_ph) * 0.08

    # Envelope: very slow attack (no pop), holds, then releases at the end
    e  = env(n, attack=0.50, release=0.20)
    # Extra low-end roll-in
    e *= (1 - np.exp(-np.arange(n) / (0.15 * SR)))

    raw = layer * e
    return add_reverb(raw, rt60=0.35, pre_delay_ms=25, wet=0.35) * gain


def synth_tension_resolve(dur: float, gain: float) -> np.ndarray:
    """
    Descending tone + breath/release — the counterpart to tension-rise.
    Sine sweep from 880 Hz → 220 Hz with a soft noise 'exhale'.
    """
    n  = int(dur * SR)
    sweep_n = int(0.65 * n)

    sweep   = freq_sweep(880, 220, sweep_n / SR)
    sweep  *= env(sweep_n, attack=0.05, release=0.55)

    # Exhale: low-passed noise tail
    exhale_n = n - sweep_n
    if exhale_n > 0:
        noise   = pink_noise(exhale_n)
        exhale  = butter_lp(noise, 800) * 0.30
        exhale *= env(exhale_n, attack=0.02, release=0.80)
    else:
        exhale = np.array([])

    raw = np.concatenate([sweep, exhale])[:n]
    return add_reverb(raw, rt60=0.20, wet=0.25) * gain


def synth_map_whoosh(dur: float, gain: float) -> np.ndarray:
    """
    Spatial sweep with subtle Doppler quality.
    Broadband noise filtered to sweep from high (4 kHz) to low (300 Hz),
    evoking a camera panning across a geographic surface.
    """
    n   = int(dur * SR)
    tt  = t(dur)

    noise = pink_noise(n)

    # Time-varying bandpass: centre frequency sweeps 3500 Hz → 300 Hz
    # Approximate by splitting into bands with time-weighted mix
    hi   = butter_bp(noise, 1500, 4500, order=3)
    lo   = butter_bp(noise, 150, 600, order=3)

    # Cross-fade hi → lo over the duration
    fade = np.linspace(1.0, 0.0, n)
    raw  = hi * fade + lo * (1 - fade)

    e    = env(n, attack=0.06, release=0.50)
    raw *= e

    return add_reverb(raw, rt60=0.22, pre_delay_ms=12, wet=0.30) * gain


def synth_quote_bell(dur: float, gain: float) -> np.ndarray:
    """
    Single clean tone (piano / bell character).
    A5 (880 Hz) fundamental + harmonics at 1760 Hz and 2640 Hz.
    Instant attack, exponential decay — classic bell envelope.
    """
    n  = int(dur * SR)
    hl = dur * 0.28   # half-life: decay speed

    fundamental = sine(880, dur)
    h2          = sine(1760, dur) * 0.28
    h3          = sine(2640, dur) * 0.08
    h4          = sine(3520, dur) * 0.03

    raw  = fundamental + h2 + h3 + h4
    raw *= exp_decay(n, half_life=hl)

    return add_reverb(raw, rt60=0.30, pre_delay_ms=8, wet=0.32) * gain


def synth_section_open(dur: float, gain: float) -> np.ndarray:
    """
    Soft atmospheric swell — a sustained harmonic chord (Am voicing:
    A3 + E4 + A4) that fades in slowly and exits cleanly.
    Sets the new section's mood without announcing itself.
    """
    n  = int(dur * SR)

    # Am chord: A3 (220 Hz) + E4 (329.6 Hz) + A4 (440 Hz)
    a3  = sine(220.0, dur)
    e4  = sine(329.6, dur) * 0.65
    a4  = sine(440.0, dur) * 0.45
    # Slight detuning for warmth (2 cents sharp on upper voices)
    a4d = sine(440.0 * 1.0012, dur) * 0.20

    raw  = a3 + e4 + a4 + a4d
    raw *= env(n, attack=0.40, release=0.35)

    return add_reverb(raw, rt60=0.40, pre_delay_ms=20, wet=0.38) * gain


def synth_end_stinger(gain: float = PEAK) -> np.ndarray:
    """
    Resolving chord + fade to silence — episode close.
    Am → C major crossfade: [A3+C4+E4] blends into [C4+E4+G4] over 2.5 s,
    then fades to silence. Used once per episode.
    """
    dur = 2.5
    n   = int(dur * SR)

    # Am voicing: A3 + C4 + E4
    am  = (sine(220.0, dur) +
           sine(261.6, dur) * 0.75 +
           sine(329.6, dur) * 0.60)

    # C major voicing: C4 + E4 + G4
    cm  = (sine(261.6, dur) +
           sine(329.6, dur) * 0.75 +
           sine(392.0, dur) * 0.55)

    # Crossfade: Am dominates first half, C major the second
    xfade = np.linspace(0, 1, n)
    raw   = am * (1 - xfade) + cm * xfade

    # Master envelope: hold then slow fade to silence
    e     = env(n, attack=0.05, release=0.45)
    raw  *= e

    return add_reverb(raw, rt60=0.55, pre_delay_ms=22, wet=0.40) * gain


# ─────────────────────────────────────────────────────────────────────────────
# LAYER 3 — Texture hit synthesisers
# ─────────────────────────────────────────────────────────────────────────────

def synth_dot_click() -> np.ndarray:
    """50 ms · soft mechanical click — dots, data-points, list items."""
    dur = 0.050
    n   = int(dur * SR)
    rng = np.random.default_rng(11)
    noise = rng.standard_normal(n)
    click = butter_bp(noise, 1200, 4000, order=4)
    click *= exp_decay(n, half_life=0.008)
    return normalise(click, 0.55)


def synth_card_settle() -> np.ndarray:
    """150 ms · paper placement + micro-reverb — KineticTypography cards."""
    dur = 0.150
    n   = int(dur * SR)
    rng = np.random.default_rng(17)
    noise = rng.standard_normal(n)
    # Broadband with slight mid emphasis (paper thud)
    body  = butter_bp(noise, 300, 2500, order=3) * 0.75
    tap   = butter_bp(noise, 80, 300, order=2) * 0.40
    raw   = (body + tap) * exp_decay(n, half_life=0.030)
    return add_reverb(normalise(raw), rt60=0.12, wet=0.20) * 0.58


def synth_line_draw() -> np.ndarray:
    """300 ms · soft pencil/pen stroke — connection lines drawing."""
    dur = 0.300
    n   = int(dur * SR)
    noise = pink_noise(n)
    # Sweep from 2 kHz → 600 Hz (pencil dragging across paper)
    hi  = butter_hp(noise, 1500, order=3)
    lo  = butter_lp(noise, 800, order=3)
    xf  = np.linspace(1.0, 0.0, n)
    raw = (hi * xf + lo * (1 - xf)) * 0.70
    raw *= env(n, attack=0.03, release=0.55)
    return add_reverb(normalise(raw), rt60=0.10, wet=0.15) * 0.52


def synth_region_glow() -> np.ndarray:
    """500 ms · ambient tone swell — map region highlights."""
    dur = 0.500
    n   = int(dur * SR)
    # Very soft A2 (110 Hz) sine with slow swell
    raw  = sine(110.0, dur) * 0.55
    raw += sine(220.0, dur) * 0.25
    raw *= env(n, attack=0.45, release=0.42)
    return add_reverb(normalise(raw), rt60=0.38, pre_delay_ms=15, wet=0.42) * 0.48


def synth_bar_grow() -> np.ndarray:
    """300 ms · ascending micro-tone — DataChart bars / ProbabilityGauge arcs."""
    dur = 0.300
    n   = int(dur * SR)
    sweep = freq_sweep(200, 700, dur)
    sweep *= exp_decay(n, half_life=0.10) * env(n, attack=0.04, release=0.50)
    return add_reverb(normalise(sweep), rt60=0.12, wet=0.18) * 0.60


def synth_node_pop() -> np.ndarray:
    """100 ms · bubble pop — NetworkDiagram / StrategicLandscape nodes."""
    dur = 0.100
    n   = int(dur * SR)
    # Pitch drops from 480 Hz → 80 Hz quickly (bubble-pop pitch envelope)
    freqs = np.exp(np.linspace(np.log(480), np.log(80), n))
    phase = np.cumsum(freqs / SR) * 2 * np.pi
    raw   = np.sin(phase) * exp_decay(n, half_life=0.018)
    return add_reverb(normalise(raw), rt60=0.08, wet=0.14) * 0.62


def synth_page_turn() -> np.ndarray:
    """250 ms · paper rustle — PhotoMontage transitions."""
    dur = 0.250
    n   = int(dur * SR)
    noise = pink_noise(n)
    # Paper-like: slight high-frequency emphasis with a swish shape
    hi  = butter_hp(noise, 2500, order=3) * 0.60
    mid = butter_bp(noise, 600, 2500, order=2) * 0.45
    raw = (hi + mid) * env(n, attack=0.04, release=0.65)
    return add_reverb(normalise(raw), rt60=0.10, wet=0.12) * 0.50


# ─────────────────────────────────────────────────────────────────────────────
# Build plan
# ─────────────────────────────────────────────────────────────────────────────

DURATIONS = {
    # (dur_sec, peak_gain)
    "beat-transition":  {"subtle": (0.50, INTENSITY_GAIN["subtle"]),
                          "normal": (0.70, INTENSITY_GAIN["normal"]),
                          "dramatic": (1.00, INTENSITY_GAIN["dramatic"])},
    "stat-reveal":      {"subtle": (0.80, INTENSITY_GAIN["subtle"]),
                          "normal": (1.00, INTENSITY_GAIN["normal"]),
                          "dramatic": (1.20, INTENSITY_GAIN["dramatic"])},
    "tension-rise":     {"subtle": (2.00, INTENSITY_GAIN["subtle"]),
                          "normal": (3.50, INTENSITY_GAIN["normal"]),
                          "dramatic": (5.00, INTENSITY_GAIN["dramatic"])},
    "tension-resolve":  {"subtle": (0.50, INTENSITY_GAIN["subtle"]),
                          "normal": (0.70, INTENSITY_GAIN["normal"]),
                          "dramatic": (1.00, INTENSITY_GAIN["dramatic"])},
    "map-whoosh":       {"subtle": (0.50, INTENSITY_GAIN["subtle"]),
                          "normal": (0.65, INTENSITY_GAIN["normal"]),
                          "dramatic": (0.80, INTENSITY_GAIN["dramatic"])},
    "quote-bell":       {"subtle": (0.30, INTENSITY_GAIN["subtle"]),
                          "normal": (0.40, INTENSITY_GAIN["normal"]),
                          "dramatic": (0.50, INTENSITY_GAIN["dramatic"])},
    "section-open":     {"subtle": (1.00, INTENSITY_GAIN["subtle"]),
                          "normal": (1.20, INTENSITY_GAIN["normal"]),
                          "dramatic": (1.50, INTENSITY_GAIN["dramatic"])},
}

SYNTHS = {
    "beat-transition":  synth_beat_transition,
    "stat-reveal":      synth_stat_reveal,
    "tension-rise":     synth_tension_rise,
    "tension-resolve":  synth_tension_resolve,
    "map-whoosh":       synth_map_whoosh,
    "quote-bell":       synth_quote_bell,
    "section-open":     synth_section_open,
}

TEXTURES = {
    "dot-click":    synth_dot_click,
    "card-settle":  synth_card_settle,
    "line-draw":    synth_line_draw,
    "region-glow":  synth_region_glow,
    "bar-grow":     synth_bar_grow,
    "node-pop":     synth_node_pop,
    "page-turn":    synth_page_turn,
}


def all_targets() -> list[tuple[Path, str]]:
    """Return [(output_path, label), ...] for every file to generate."""
    targets = []
    for cue, intensities in DURATIONS.items():
        for intensity in intensities:
            fname = f"{cue}-{intensity}.wav"
            targets.append((TRANSITIONS_DIR / fname, f"{cue}-{intensity}"))
    targets.append((TRANSITIONS_DIR / "end-stinger.wav", "end-stinger"))
    for name in TEXTURES:
        targets.append((TEXTURES_DIR / f"{name}.wav", name))
    return targets


def generate_one(label: str, path: Path, dry_run: bool = False) -> None:
    """Synthesise one file and write it."""
    print(f"  {'[dry-run] ' if dry_run else ''}→ {path.name}", end="")

    if dry_run:
        print()
        return

    # Dispatch
    if label == "end-stinger":
        sig = synth_end_stinger()
    elif label in TEXTURES:
        sig = TEXTURES[label]()
    else:
        cue, intensity = label.rsplit("-", 1)
        dur, gain = DURATIONS[cue][intensity]
        sig = SYNTHS[cue](dur, gain)

    write_wav_24bit(path, sig)

    duration = len(sig) / SR
    size_kb   = path.stat().st_size // 1024
    print(f"  {duration:.2f}s  {size_kb} KB")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Parallax SFX library.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print file list without writing anything.")
    parser.add_argument("--cue", metavar="NAME",
                        help="Generate only this cue type (e.g. beat-transition).")
    args = parser.parse_args()

    targets = all_targets()
    if args.cue:
        targets = [(p, lbl) for p, lbl in targets
                   if lbl == args.cue or lbl.startswith(f"{args.cue}-")]
        if not targets:
            print(f"ERROR: unknown cue '{args.cue}'", file=sys.stderr)
            print(f"Known cues: {', '.join(list(SYNTHS) + list(TEXTURES) + ['end-stinger'])}",
                  file=sys.stderr)
            sys.exit(1)

    print(f"Generating {len(targets)} SFX file(s) …\n")
    print("LAYER 2 — Transition SFX")
    print("-" * 50)

    in_textures = False
    for path, label in targets:
        if not in_textures and path.parent == TEXTURES_DIR:
            in_textures = True
            print("\nLAYER 3 — Texture hits")
            print("-" * 50)
        generate_one(label, path, dry_run=args.dry_run)

    print(f"\n{'[dry-run] ' if args.dry_run else ''}Done.")


if __name__ == "__main__":
    main()
