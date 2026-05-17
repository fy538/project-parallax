#!/usr/bin/env python3
"""
pronunciation_guide.py — extract proper nouns / foreign terms from a script
and emit a recording-time pronunciation cheat-sheet.

The output is `episodes/<slug>/pronunciation-guide.md`: every candidate
term, ranked by frequency (most common first), with an IPA column the
operator fills in, a Forvo lookup URL (`forvo.com/word/<term>/`), and a
Wiktionary lookup URL. For terms in the bundled lexicon (Schelling,
Hofstadter, Xi Jinping, TSMC, ASML, EUV, etc.) the IPA + anglicization
are pre-filled; for unknowns the row is blank and the operator fills it
in before recording.

Why this matters: geopolitics scripts contain Mandarin pinyin, Russian
patronymics, Arabic transliterations, and economist/historian surnames
that the narrator will mispronounce on the first take if unprepared.
A mispronounced 习近平 / Алексеев / al-Bāḥa / Schelling kills credibility
for the entire audience that would notice.

Usage:
    python3 tools/narration/pronunciation_guide.py <slug>
    python3 tools/narration/pronunciation_guide.py <slug> --script <path>
    python3 tools/narration/pronunciation_guide.py <slug> -o <out>
    python3 tools/narration/pronunciation_guide.py <slug> --stdout
    python3 tools/narration/pronunciation_guide.py <slug> --merge
        # merge new candidates into an existing guide instead of overwriting,
        # preserving operator-filled IPA columns
"""

from __future__ import annotations

import argparse
import re
import sys
import urllib.parse
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

# Re-use the script parser instead of re-implementing two-column extraction.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"


@dataclass
class Term:
    """One candidate term + its lookup metadata.

    `ipa` and `anglicized` are populated only when the term is in the
    bundled LEXICON. For unknowns they're empty strings; the operator
    fills them in.
    """

    term: str
    count: int
    ipa: str = ""
    anglicized: str = ""
    note: str = ""

    @property
    def forvo_url(self) -> str:
        return f"https://forvo.com/word/{urllib.parse.quote(self.term)}/"

    @property
    def wiktionary_url(self) -> str:
        return f"https://en.wiktionary.org/wiki/{urllib.parse.quote(self.term)}"


# ── Lexicon ──────────────────────────────────────────────────────────────────
# Hand-curated dictionary of terms that have appeared in Parallax research
# briefs or are likely to in upcoming episodes. Keys are case-insensitive
# on lookup. Values: (IPA, anglicized hint, optional note).
#
# Adding entries is encouraged — every time the operator fills in a row by
# hand, that knowledge should land here so the next episode benefits. The
# tool reads this dict at import time; no JSON/YAML round-trip needed.

# IPA convention: entries represent the **English-speaker pronunciation**
# (i.e. what a US narrator should sound like reading the name in English
# context), NOT the native-language IPA. So "Xi" is `ʃiː` (English "shee"),
# not the Mandarin `ɕi`. For names where the operator wants the Mandarin-
# accurate read, override the row via `pronunciation-guide.md`'s editable
# Anglicized column — the `--merge` flag will preserve the override.
LEXICON: dict[str, tuple[str, str, str]] = {
    # ── Economists & game-theorists ──────────────────────────────────────
    "Schelling":       ("ˈʃɛlɪŋ",       "SHELL-ing",           "Thomas Schelling"),
    "Hofstadter":      ("ˈhɒfstædər",   "HOFF-stat-ter",       "Douglas Hofstadter"),
    "Alchian":         ("ˈɑːltʃiən",    "AHL-chee-un",         "Armen Alchian"),
    "Axelrod":         ("ˈæksəlrɒd",    "AX-el-rod",           "Robert Axelrod"),
    "Ostrom":          ("ˈɒstrəm",      "OSS-trum",            "Elinor Ostrom"),
    "Hayek":           ("ˈhaɪɛk",       "HIGH-ek",             "Friedrich Hayek"),
    "Friedman":        ("ˈfriːdmən",    "FREED-mun",           "Milton Friedman"),
    "Keynes":          ("keɪnz",        "KAYNZ",               "John Maynard Keynes"),
    "Acemoglu":        ("ˌædʒəˈmoʊɡluː", "AH-jeh-MOH-gloo",    "Daron Acemoglu"),
    "Tetlock":         ("ˈtɛtlɒk",      "TET-lok",             "Philip Tetlock"),
    "Kahneman":        ("ˈkɑːnəmən",    "KAH-neh-mun",         "Daniel Kahneman"),

    # ── Mathematicians / scientists ──────────────────────────────────────
    "Nash":            ("næʃ",          "NASH",                "John Nash"),
    "Hamilton":        ("ˈhæmɪltən",    "HAM-il-tun",          ""),
    "Trivers":         ("ˈtrɪvərz",     "TRIH-verz",           "Robert Trivers"),
    "Lissitzky":       ("lɪˈsɪtski",    "lih-SIT-skee",        "El Lissitzky"),
    "Rodchenko":       ("rɒdˈtʃɛŋkoʊ",  "rod-CHEN-koh",        "Alexander Rodchenko"),

    # ── Chinese names (pinyin → English approximation) ──────────────────
    "Xi":              ("ʃiː",          "SHEE",                "as in Xi Jinping"),
    "Jinping":         ("ʤɪnˈpɪŋ",     "jin-PING",            ""),
    "Xi Jinping":      ("ˌʃiː ʤɪnˈpɪŋ", "SHEE jin-PING",      "习近平"),
    "Deng":            ("dʌŋ",          "DUNG",                "Deng Xiaoping"),
    "Xiaoping":        ("ʃaʊˈpɪŋ",     "shao-PING",           ""),
    "Mao":             ("maʊ",          "MOW (rhymes with cow)", "Mao Zedong"),
    "Zedong":          ("dzəˈdʊŋ",     "dzuh-DOONG",          ""),
    "Shenzhen":        ("ʃɛnˈʒɛn",     "shen-ZHEN",           "深圳"),
    "Beijing":         ("beɪˈʒɪŋ",     "bay-ZHING (not -JING)", "北京 — soft ʒ, not hard ʤ"),
    "Guangzhou":       ("ɡwɑːŋˈʤoʊ",   "gwang-JOH",           "广州"),
    "Tsinghua":        ("ˈtsɪŋhwɑː",   "TSING-hwah",          "清华 — initial 'ts' not 'ch'"),
    "Hu":              ("huː",          "HOO",                  "Hu Jintao"),
    "Jintao":          ("ʤɪnˈtaʊ",     "jin-TAOW",             ""),

    # ── Tech / semiconductor industry ────────────────────────────────────
    "TSMC":            ("ˌtiː ɛs ɛm ˈsiː", "T-S-M-C",          "Taiwan Semiconductor — spell each letter"),
    "ASML":            ("ˌeɪ ɛs ɛm ˈɛl", "A-S-M-L",            "Dutch lithography — spell each letter"),
    "EUV":             ("ˌiː juː ˈviː",  "E-U-V",               "extreme ultraviolet"),
    "SMIC":            ("ˈɛs mɪk",      "S-mick",               "Semiconductor Manufacturing International"),
    "Nvidia":          ("ɛnˈvɪdiə",     "en-VID-ee-uh",        "not en-VEE-dee-uh"),
    "Huawei":          ("ˈhwɑːweɪ",     "HWAH-way",            "华为"),
    "Kioxia":          ("kiˈɒksiə",     "kee-OX-ee-uh",        "former Toshiba Memory"),

    # ── Russian / Ukrainian (Cyrillic transliterations) ──────────────────
    "Putin":           ("ˈpuːtɪn",      "POO-tin",              "Russian П — softer 'p'"),
    "Medvedev":        ("mɛdˈvjɛdjɛf",  "med-VYED-yef",         "stress on second syllable"),
    "Zelensky":        ("zɛˈlɛnski",    "zeh-LEN-skee",         "alternative: zeh-LIN-skee"),
    "Lavrov":          ("ˈlɑːvrɒf",     "LAH-vrof",             ""),
    "Kyiv":            ("ˈkiːjɪv",      "KEE-yiv",              "preferred over 'Kiev'"),

    # ── Arabic / Persian ─────────────────────────────────────────────────
    "Erdoğan":         ("ˈɛərdoʊɑːn",   "AIR-doh-ahn",          "ğ is silent; lengthens the o"),
    "Khamenei":        ("ˌxɑːmənɛˈiː",  "khah-meh-neh-EE",      "soft 'kh' as in Bach"),
    "Soleimani":       ("ˌsoʊleɪˈmɑːni", "SOH-lay-MAH-nee",     "Qasem Soleimani"),
    "Riyadh":          ("riˈjɑːd",      "ree-YAHD",             "not RYE-ad"),
    "Doha":            ("ˈdoʊhɑː",      "DOH-hah",              ""),

    # ── Places, organizations, terms ─────────────────────────────────────
    "Taiwan":          ("ˌtaɪˈwɑːn",    "tie-WAHN",             "rhymes with 'on', not 'an'"),
    "RAND":            ("rænd",         "RAND",                  "rhymes with 'sand' — one word, not letters"),
    "COCOM":           ("ˈkoʊkɒm",      "KOH-kom",               "Cold War export-control regime"),
    "panopticon":      ("pænˈɒptɪkɒn",  "pa-NOP-ti-kon",         "Bentham's surveillance prison"),
    "praxis":          ("ˈpræksɪs",     "PRAK-sis",              ""),
    "Mishnaic":        ("mɪʃˈneɪɪk",    "mish-NAY-ik",           "of the Mishnah"),
}


# ── Extraction ───────────────────────────────────────────────────────────────
# Heuristic: a "candidate proper noun" is a capitalized word — or
# capitalized multi-word sequence — that isn't a sentence-start. Sentence-
# start tokens are filtered by checking the previous non-whitespace char:
# if it's `.`, `!`, `?`, `"`, or the start of the cell, we treat it as
# sentence-initial and skip.
#
# We also keep ALL-CAPS tokens (acronyms like TSMC, ASML, COCOM) even at
# sentence start because they're almost always proper nouns.
#
# We skip a built-in stopword list of titles, function words, and
# common-English words that get capitalized by accident at sentence-start.

# Multi-word match: 1-3 consecutive Capitalized words, optionally joined by
# `-` or apostrophes. `[A-Z][a-zA-Z'’-]+` matches one word; we allow up to
# two more such words after a space.
PROPER_NOUN_RE = re.compile(
    r"(?<![\w-])"                            # not preceded by word char
    r"([A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){0,2})"
)
# All-caps acronyms (2-6 letters, optionally with digits): TSMC, ASML, EUV, P2P, B2B.
ACRONYM_RE = re.compile(r"(?<![A-Z0-9])([A-Z]{2,6}[0-9]?)(?![A-Z0-9])")
# Pinyin-style Chinese names embedded in scripts as Latin script: capitalized
# letter followed by lowercase, e.g. Jinping, Xiaoping, Zedong. Caught by
# PROPER_NOUN_RE; the dedicated regex is reserved for future hanzi support.

# Stopwords: common words that are often capitalized at sentence start and
# shouldn't be flagged as proper nouns. Lowercase comparison.
SENTENCE_STARTERS = {
    "the", "a", "an", "this", "that", "these", "those", "his", "her", "its",
    "their", "our", "your", "my", "and", "but", "or", "so", "yet", "for", "if",
    "when", "where", "why", "how", "what", "who", "which", "by", "of", "in",
    "on", "at", "to", "from", "as", "is", "was", "were", "are", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "shall", "should", "can", "could", "may", "might", "must", "here", "there",
    "now", "then", "today", "tomorrow", "yesterday", "first", "second", "third",
    "last", "next", "every", "some", "any", "all", "no", "not", "you", "we",
    "they", "he", "she", "it", "i", "one", "two", "three",
    "even", "still", "just", "only", "also", "indeed", "however", "therefore",
    "after", "before", "during", "while", "because", "since", "until", "though",
}
# Words that look like proper nouns but are too common to surface (false
# positives that clutter the guide). All comparisons are lowercased.
COMMON_FALSE_POSITIVES = {
    # Capitalized common nouns the parser catches at sentence start
    "tiger", "parallax", "youtube", "google", "facebook", "twitter", "english",
    "american", "european", "western", "eastern", "northern", "southern",
    "game", "checkpoint", "note", "stage", "beat", "pause", "voice",
    "transition", "titletransition", "narration", "visual", "production",
    "counterpoint", "every", "soviet",
    # Contractions that get capitalized at sentence start. Matching is
    # case-insensitive against the whole token (including the apostrophe),
    # both straight and curly forms.
    "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll", "you'd",
    "we're", "we've", "we'll", "we'd", "they're", "they've", "they'll",
    "they'd", "he's", "she's", "it's", "that's", "there's", "what's",
    "who's", "let's", "don't", "doesn't", "didn't", "won't", "wouldn't",
    "can't", "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't",
    "haven't", "hasn't", "hadn't",
    # Months / common time references — every English speaker knows these
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    # 2-3-letter acronyms native English speakers don't need a guide for
    "us", "usa", "uk", "eu", "un", "ai", "pd", "tv", "id", "os", "pc",
    "it", "ok", "etc", "faq", "pdf", "url", "gif", "jpg", "png", "mp3",
    "mp4", "am", "pm", "est", "pst", "bc", "ad", "ceo", "cfo", "cto",
    "coo", "ip", "gdp", "ww1", "ww2", "wwi", "wwii",
}

# Leading determiners stripped before deduplication so "The Prisoner's
# Dilemma" and "Prisoner's Dilemma" collapse to one entry. Add new terms
# sparingly — "the" is the only one that meaningfully duplicates in
# practice; "a"/"an" are usually grammatical and don't precede proper nouns.
LEADING_DETERMINERS = {"The", "A", "An"}


def _is_sentence_initial(text: str, match_start: int) -> bool:
    """True if the match begins a sentence (start of text, or preceded by
    sentence-ending punctuation + whitespace)."""
    # Walk back through whitespace to the previous non-whitespace char.
    i = match_start - 1
    while i >= 0 and text[i].isspace():
        i -= 1
    if i < 0:
        return True  # start of cell
    return text[i] in ".!?\""


def _normalise_term(raw: str) -> str:
    """Trim possessives + leading determiners so identical terms collapse.
    'Schelling’s' → 'Schelling'; 'The Prisoner's Dilemma' → 'Prisoner's Dilemma'.
    """
    cleaned = raw.strip().rstrip("'’")
    cleaned = re.sub(r"['’]s$", "", cleaned)
    # Strip a leading determiner so "The Prisoner's Dilemma" and
    # "Prisoner's Dilemma" become one entry.
    parts = cleaned.split(" ", 1)
    if len(parts) == 2 and parts[0] in LEADING_DETERMINERS:
        cleaned = parts[1]
    return cleaned


def _is_false_positive(term: str) -> bool:
    """COMMON_FALSE_POSITIVES match — case-insensitive AND apostrophe-normalized
    so the curly-vs-straight variants ('don’t' vs 'don't') compare equal."""
    canonical = term.lower().replace("’", "'")
    return canonical in COMMON_FALSE_POSITIVES


def extract_candidates(narration_text: str) -> Counter[str]:
    """Pull proper-noun candidates from a chunk of narration text.

    Heuristic: capitalized tokens are proper-noun candidates EXCEPT when
    they're sentence-initial and single-word — in which case they're
    almost always common nouns the writer just capitalized at sentence
    start (Mutual, Soviet, Nuclear, People). Single-word sentence-initial
    tokens are only kept if they're explicitly in the bundled lexicon.

    Returns a Counter of {term → frequency}. Caller decides what to do
    with each — typically: look up in LEXICON, sort by frequency, render.
    """
    candidates: Counter[str] = Counter()
    lex_keys = {k.lower() for k in LEXICON}

    # Multi-word proper-noun matches.
    for m in PROPER_NOUN_RE.finditer(narration_text):
        term = _normalise_term(m.group(1))
        if not term:
            continue
        if _is_false_positive(term):
            continue

        if _is_sentence_initial(narration_text, m.start()):
            is_single_word = " " not in term
            if is_single_word and term.lower() not in lex_keys:
                # "Mutual", "Soviet", "Every" — common noun in disguise.
                continue
            # Multi-word starting with a stopword like "The Schelling Point"
            # already had its determiner stripped by _normalise_term. But
            # "In Beijing" would still slip through — strip a leading
            # SENTENCE_STARTERS word if the remainder is itself capitalized.
            parts = term.split(maxsplit=1)
            if (
                len(parts) > 1
                and parts[0].lower() in SENTENCE_STARTERS
                and parts[1][0:1].isupper()
            ):
                term = parts[1]
                # The stripped remainder might itself be on the
                # false-positive list (e.g. "In January" → "January"),
                # so re-check before counting.
                if _is_false_positive(term):
                    continue

        candidates[term] += 1

    # Acronyms — scan separately so we catch e.g. "TSMC's first fab" where
    # the apostrophe-s would otherwise complicate the multi-word regex.
    for m in ACRONYM_RE.finditer(narration_text):
        term = _normalise_term(m.group(1))
        if term and not _is_false_positive(term):
            candidates[term] += 1

    return candidates


def gather_terms_from_script(script_path: Path) -> list[Term]:
    """Parse a script via format_for_reading, extract candidates from every
    narration take, look up in LEXICON, return sorted Term list."""
    beats = ffr.parse_script(script_path)
    full_text = "\n".join(
        t.text
        for beat in beats
        for t in beat.takes
        if t.kind == "narration"
    )
    counts = extract_candidates(full_text)
    # Build Term objects, looking up the bundled lexicon (case-insensitive).
    lex_lower = {k.lower(): v for k, v in LEXICON.items()}
    terms: list[Term] = []
    for term, count in counts.most_common():
        ipa, anglicized, note = lex_lower.get(term.lower(), ("", "", ""))
        terms.append(Term(term=term, count=count, ipa=ipa, anglicized=anglicized, note=note))
    return terms


# ── Rendering ────────────────────────────────────────────────────────────────


def render_guide(terms: list[Term], slug: str) -> str:
    """Render the pronunciation guide as markdown."""
    if not terms:
        return f"# Pronunciation Guide — {slug}\n\n_No proper-noun candidates found._\n"

    known = [t for t in terms if t.ipa]
    unknown = [t for t in terms if not t.ipa]

    lines: list[str] = [
        f"# Pronunciation Guide — {slug}",
        "",
        f"> Auto-generated by `tools/narration/pronunciation_guide.py`.",
        f"> Pre-filled rows come from the bundled lexicon — append new ones to",
        f"> `LEXICON` in the tool source after a recording session so the next",
        f"> episode benefits.",
        ">",
        f"> Fill in the IPA column for any blank rows before recording. Use the",
        f"> Forvo / Wiktionary URLs to verify — never guess on names you haven't",
        f"> heard pronounced. Mispronounce a name and the entire audience that",
        f"> would notice will write you off in that one moment.",
        "",
        f"**{len(terms)} candidate term(s)** · {len(known)} in lexicon · {len(unknown)} need verification",
        "",
    ]

    if known:
        lines.extend([
            "## In the lexicon (verify, then read)",
            "",
            "| Term | Count | IPA | Anglicized | Note |",
            "|---|---|---|---|---|",
        ])
        for t in known:
            lines.append(
                f"| **{t.term}** | {t.count} | `{t.ipa}` | {t.anglicized} | {t.note} |"
            )
        lines.append("")

    if unknown:
        lines.extend([
            "## Needs verification (fill in before recording)",
            "",
            "| Term | Count | IPA | Anglicized | Forvo | Wiktionary |",
            "|---|---|---|---|---|---|",
        ])
        for t in unknown:
            lines.append(
                f"| **{t.term}** | {t.count} |  |  | "
                f"[listen]({t.forvo_url}) | [look up]({t.wiktionary_url}) |"
            )
        lines.append("")

    lines.extend([
        "---",
        "",
        f"_Regenerate: `python3 tools/narration/pronunciation_guide.py {slug}`_",
        f"_Re-run with `--merge` to preserve operator-filled IPA values when new terms are added._",
    ])
    return "\n".join(lines) + "\n"


# ── Merge mode ───────────────────────────────────────────────────────────────
# When the operator has already filled in IPA values in the existing guide,
# regenerating overwrites them. Merge mode parses the existing guide,
# extracts any IPA values present in rows whose term matches a freshly-
# extracted candidate, and merges them back in.

# Matches the first 4 cells of either table shape — known-section
# (`Term | Count | IPA | Anglicized | Note`) and unknown-section
# (`Term | Count | IPA | Anglicized | Forvo | Wiktionary`). Both put
# the operator-editable IPA + Anglicized in cells 3 + 4, so we don't
# need to anchor at end of line. Raw `|` inside a cell would break
# markdown table rendering anyway — contract violation, not a parser
# limitation. The `\d+` after Term enforces that we only match data
# rows, not the header/separator rows (which have non-numeric cell 2).
EXISTING_ROW_RE = re.compile(
    r"^\|\s*\*\*([^*]+?)\*\*\s*\|\s*\d+\s*\|\s*`?([^`|]*?)`?\s*\|\s*([^|]*?)\s*\|"
)


def merge_existing_ipa(terms: list[Term], existing_path: Path) -> list[Term]:
    """Walk an existing guide; for each parsed row, if our term list has
    an empty IPA for that term, fill from the existing row."""
    if not existing_path.is_file():
        return terms
    by_term = {t.term.lower(): t for t in terms}
    for line in existing_path.read_text(encoding="utf-8").splitlines():
        m = EXISTING_ROW_RE.match(line)
        if not m:
            continue
        term, ipa, anglicized = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
        if not ipa:
            continue
        target = by_term.get(term.lower())
        if target and not target.ipa:
            target.ipa = ipa
            target.anglicized = anglicized
    return terms


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "slug",
        nargs="?",
        help="Episode slug (resolves to episodes/<slug>/script-*.md).",
    )
    parser.add_argument("--script", help="Explicit path to a script (overrides slug).")
    parser.add_argument("-o", "--output", help="Output path (default: episodes/<slug>/pronunciation-guide.md).")
    parser.add_argument("--stdout", action="store_true", help="Write to stdout.")
    parser.add_argument(
        "--merge",
        action="store_true",
        help="Preserve operator-filled IPA values from the existing guide.",
    )
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
        slug = args.slug or script_path.parent.name
    else:
        if not args.slug:
            print("✗ provide either a slug or --script <path>", file=sys.stderr)
            return 2
        slug = args.slug
        found = ffr.find_script(slug)
        if not found:
            print(f"✗ no script found for {slug}", file=sys.stderr)
            return 2
        script_path = found

    if not script_path.is_file():
        print(f"✗ script not found: {script_path}", file=sys.stderr)
        return 2

    terms = gather_terms_from_script(script_path)

    out_path: Optional[Path] = None
    if not args.stdout:
        out_path = (
            Path(args.output).resolve()
            if args.output
            else EPISODES_DIR / slug / "pronunciation-guide.md"
        )
        if args.merge and out_path.is_file():
            terms = merge_existing_ipa(terms, out_path)

    rendered = render_guide(terms, slug=slug)

    if args.stdout:
        sys.stdout.write(rendered)
        return 0

    assert out_path is not None  # appeases type-checkers; CLI guarantees this branch
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    print(f"✓ wrote {rel}")
    known = sum(1 for t in terms if t.ipa)
    unknown = len(terms) - known
    print(f"  {len(terms)} term(s) · {known} from lexicon · {unknown} to fill in")
    return 0


if __name__ == "__main__":
    sys.exit(main())
