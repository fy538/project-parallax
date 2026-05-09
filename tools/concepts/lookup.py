#!/usr/bin/env python3
"""
Parallax Concept Registry — lookup and management CLI.

Query, search, and manage the concept registry (data/concepts.json).
Used by humans, visual-spec skill, and script drafting to detect
concept reuse and suggest callbacks.

Usage:
  python lookup.py search <query>         Search by term, tag, or definition
  python lookup.py episode <epID>         List all concepts introduced in an episode
  python lookup.py reuse-check <epID>     Find concepts from OTHER episodes that might
                                          appear in this episode's script (pass script
                                          path via --script)
  python lookup.py show <conceptID>       Show full detail for one concept
  python lookup.py tags                   List all tags with counts
  python lookup.py stats                  Registry statistics
  python lookup.py add                    Interactive: add a new concept
  python lookup.py graph                  Print concept relationship graph
  python lookup.py validate               Validate registry against schema
  python lookup.py predictions            List all predictions, grouped by status
  python lookup.py predictions-due        Show predictions whose timeframe has passed
  python lookup.py resolve <conceptID>    Interactively resolve a prediction

Options:
  --json          Output as JSON (for tool integration)
  --script PATH   Path to a script .md file (used with reuse-check)
  --registry PATH Override path to concepts.json
"""

import argparse
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

# ── Paths ───────────────────────────────────────────────────────────────────

PROJECT_ROOT = get_project_root()
DEFAULT_REGISTRY = PROJECT_ROOT / "data" / "concepts.json"
SCHEMA_PATH = PROJECT_ROOT / "data" / "concept-registry.schema.json"


def load_registry(path: Path) -> dict:
    if not path.exists():
        print(f"Error: concept registry not found at {path}", file=sys.stderr)
        print("  Run from project root, or check that data/concepts.json exists.", file=sys.stderr)
        sys.exit(1)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: concept registry is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)


def save_registry(data: dict, path: Path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Saved to {path}")


# ── Search ──────────────────────────────────────────────────────────────────

def cmd_search(args, registry):
    """Search concepts by term, tag, type, or definition text."""
    query = args.query.lower()
    results = []

    for c in registry["concepts"]:
        score = 0
        # Match against term fields
        term = c["term"]
        for field in ["en", "cn", "pinyin", "short"]:
            val = term.get(field, "")
            if val and query in val.lower():
                score += 10 if query == val.lower() else 5

        # Match against definition and insight
        if query in c.get("definition", "").lower():
            score += 3
        if query in c.get("insight", "").lower():
            score += 2

        # Match against tags
        for tag in c.get("tags", []):
            if query in tag.lower():
                score += 4

        # Match against type
        if query == c.get("type", ""):
            score += 6

        # Match against id
        if query in c["id"]:
            score += 7

        # Match against pillar
        for p in c.get("pillar", []):
            if query in p:
                score += 3

        if score > 0:
            results.append((score, c))

    results.sort(key=lambda x: -x[0])

    if args.json:
        print(json.dumps([c for _, c in results], indent=2, ensure_ascii=False))
        return

    if not results:
        print(f"  No concepts matching '{args.query}'")
        return

    print(f"  {len(results)} concept(s) matching '{args.query}':\n")
    for score, c in results:
        term_str = c["term"]["en"]
        if c["term"].get("cn"):
            term_str += f" ({c['term']['cn']})"
        ep = c["introduced"]["episode"]
        print(f"  [{c['id']}]  {term_str}")
        print(f"    Type: {c['type']}  |  Introduced: {ep} Beat {c['introduced']['beat']}  |  Score: {score}")
        print(f"    {c['definition'][:100]}...")
        print()


# ── Episode ─────────────────────────────────────────────────────────────────

def cmd_episode(args, registry):
    """List all concepts introduced in a specific episode."""
    ep = args.episode.upper()
    concepts = [c for c in registry["concepts"] if c["introduced"]["episode"] == ep]

    # Also find appearances
    appeared = []
    for c in registry["concepts"]:
        for a in c.get("appearances", []):
            if a["episode"] == ep:
                appeared.append((c, a))

    if args.json:
        print(json.dumps({
            "introduced": concepts,
            "referenced": [{"concept": c, "appearance": a} for c, a in appeared]
        }, indent=2, ensure_ascii=False))
        return

    if not concepts and not appeared:
        print(f"  No concepts found for {ep}")
        return

    if concepts:
        print(f"\n  Concepts INTRODUCED in {ep} ({len(concepts)}):\n")
        for c in sorted(concepts, key=lambda x: x["introduced"].get("beat", 0)):
            term_str = c["term"]["en"]
            if c["term"].get("cn"):
                term_str += f" ({c['term']['cn']})"
            beat = c["introduced"]["beat"]
            tmpl = c["introduced"].get("template") or "—"
            treatment = c["introduced"].get("treatment", "—")
            print(f"    Beat {beat}: [{c['id']}] {term_str}")
            print(f"      Template: {tmpl}  |  Treatment: {treatment}")
            print(f"      {c['definition'][:90]}")
            print()

    if appeared:
        print(f"\n  Concepts REFERENCED in {ep} ({len(appeared)}):\n")
        for c, a in appeared:
            print(f"    [{c['id']}] {c['term']['en']}  —  role: {a['role']}")
            if a.get("notes"):
                print(f"      {a['notes']}")
            print()


# ── Reuse Check ─────────────────────────────────────────────────────────────

def cmd_reuse_check(args, registry):
    """Find concepts from prior episodes that appear in a new script."""
    target_ep = args.episode.upper()

    if not args.script:
        print("  Error: --script PATH required for reuse-check")
        sys.exit(1)

    script_path = Path(args.script)
    if not script_path.exists():
        print(f"  Error: script not found at {script_path}")
        sys.exit(1)

    script_text = script_path.read_text(encoding="utf-8").lower()

    # Find concepts from OTHER episodes that appear in the script text
    hits = []
    for c in registry["concepts"]:
        if c["introduced"]["episode"] == target_ep:
            continue  # Skip concepts introduced in this episode

        # Check if any term variant appears in the script
        search_terms = [c["term"]["en"].lower()]
        if c["term"].get("cn"):
            search_terms.append(c["term"]["cn"])
        if c["term"].get("short"):
            search_terms.append(c["term"]["short"].lower())
        if c["term"].get("pinyin"):
            search_terms.append(c["term"]["pinyin"].lower())
        # Also check the ID with hyphens→spaces
        search_terms.append(c["id"].replace("-", " "))

        matched_terms = [t for t in search_terms if t in script_text]
        if matched_terms:
            hits.append((c, matched_terms))

    if args.json:
        print(json.dumps([{
            "concept": c,
            "matched_terms": mt,
            "callback_visual": c.get("callbackVisual")
        } for c, mt in hits], indent=2, ensure_ascii=False))
        return

    if not hits:
        print(f"  No prior-episode concepts detected in {script_path.name}")
        return

    print(f"\n  {len(hits)} prior concept(s) detected in {script_path.name}:")
    print(f"  These were introduced in earlier episodes — consider callbacks.\n")

    for c, matched in hits:
        term_str = c["term"]["en"]
        if c["term"].get("cn"):
            term_str += f" ({c['term']['cn']})"
        print(f"  ★ [{c['id']}] {term_str}")
        print(f"    Introduced: {c['introduced']['episode']} Beat {c['introduced']['beat']}")
        print(f"    Matched on: {', '.join(matched)}")
        if c.get("callbackVisual"):
            print(f"    Callback suggestion: {c['callbackVisual']}")
        print()


# ── Show ────────────────────────────────────────────────────────────────────

def cmd_show(args, registry):
    """Show full detail for one concept."""
    cid = args.concept_id
    concept = next((c for c in registry["concepts"] if c["id"] == cid), None)

    if not concept:
        print(f"  Concept '{cid}' not found.")
        # Suggest close matches
        close = [c["id"] for c in registry["concepts"] if cid in c["id"] or c["id"] in cid]
        if close:
            print(f"  Did you mean: {', '.join(close)}?")
        return

    if args.json:
        print(json.dumps(concept, indent=2, ensure_ascii=False))
        return

    c = concept
    term = c["term"]
    print(f"\n  ═══ {term['en'].upper()} ═══")
    if term.get("cn"):
        print(f"  {term['cn']}  ({term.get('pinyin', '')})")
    print(f"\n  ID:   {c['id']}")
    print(f"  Type: {c['type']}")
    print(f"\n  Definition:")
    print(f"    {c['definition']}")
    print(f"\n  Key Insight:")
    print(f"    {c['insight']}")

    intro = c["introduced"]
    print(f"\n  Introduced:")
    print(f"    Episode {intro['episode']}, Beat {intro['beat']}", end="")
    if intro.get("timestamp"):
        print(f" ({intro['timestamp']})", end="")
    print()
    if intro.get("template"):
        print(f"    Template: {intro['template']}  |  Treatment: {intro.get('treatment', '—')}")
    if intro.get("accentColor"):
        print(f"    Accent: {intro['accentColor']}")

    if c.get("appearances"):
        print(f"\n  Appearances ({len(c['appearances'])}):")
        for a in c["appearances"]:
            print(f"    {a['episode']} Beat {a.get('beat', '?')} — {a['role']}")
            if a.get("notes"):
                print(f"      {a['notes']}")

    if c.get("relatedConcepts"):
        print(f"\n  Related: {', '.join(c['relatedConcepts'])}")
    if c.get("pillar"):
        print(f"  Pillars: {', '.join(c['pillar'])}")
    if c.get("tags"):
        print(f"  Tags: {', '.join(c['tags'])}")
    if c.get("callbackVisual"):
        print(f"\n  Callback visual:")
        print(f"    {c['callbackVisual']}")

    if c.get("prediction"):
        pred = c["prediction"]
        prob = pred.get("probability", "?")
        prob_str = f"{int(prob*100)}%" if isinstance(prob, (int, float)) else str(prob)
        print(f"\n  Prediction:")
        print(f"    Claim: {pred.get('claim', '—')}")
        print(f"    Probability: {prob_str}")
        print(f"    Timeframe: {pred.get('timeframe', '—')}")
        print(f"    Falsification: {pred.get('falsification', '—')}")
        print(f"    Status: {pred.get('status', '—')}")
        if pred.get("whatWouldChangeMyMind"):
            print(f"    WWCMM: {pred['whatWouldChangeMyMind']}")
        if pred.get("scenarioName"):
            print(f"    Scenario: {pred['scenarioName']}")
        if pred.get("watchSignals"):
            print(f"    Watch: {', '.join(pred['watchSignals'])}")
        if pred.get("resolution"):
            res = pred["resolution"]
            print(f"    Resolution: {res.get('status', '—')} on {res.get('date', '—')}")
            print(f"    Evidence: {res.get('evidence', '—')}")
    print()


# ── Tags ────────────────────────────────────────────────────────────────────

def cmd_tags(args, registry):
    """List all tags with counts."""
    counter = Counter()
    for c in registry["concepts"]:
        for tag in c.get("tags", []):
            counter[tag] += 1

    if args.json:
        print(json.dumps(dict(counter.most_common()), ensure_ascii=False))
        return

    print(f"\n  Tags ({len(counter)}):\n")
    for tag, count in counter.most_common():
        print(f"    {tag:30s} {count}")
    print()


# ── Stats ───────────────────────────────────────────────────────────────────

def cmd_stats(args, registry):
    """Registry statistics."""
    concepts = registry["concepts"]
    total = len(concepts)
    by_type = Counter(c["type"] for c in concepts)
    by_ep = Counter(c["introduced"]["episode"] for c in concepts)
    by_pillar = Counter()
    for c in concepts:
        for p in c.get("pillar", []):
            by_pillar[p] += 1

    total_appearances = sum(len(c.get("appearances", [])) for c in concepts)
    with_callback = sum(1 for c in concepts if c.get("callbackVisual"))
    with_cn = sum(1 for c in concepts if c["term"].get("cn"))
    orphans = [c["id"] for c in concepts if not c.get("relatedConcepts")]

    if args.json:
        print(json.dumps({
            "total": total,
            "by_type": dict(by_type),
            "by_episode": dict(by_ep),
            "by_pillar": dict(by_pillar),
            "total_appearances": total_appearances,
            "with_callback_visual": with_callback,
            "bilingual": with_cn,
            "orphans": orphans,
        }, indent=2))
        return

    print(f"\n  ═══ CONCEPT REGISTRY STATS ═══\n")
    print(f"  Total concepts:         {total}")
    print(f"  Total appearances:      {total_appearances}")
    print(f"  With callback visual:   {with_callback}/{total}")
    print(f"  Bilingual (EN+CN):      {with_cn}/{total}")
    print(f"\n  By type:")
    for t, n in by_type.most_common():
        print(f"    {t:22s} {n}")
    print(f"\n  By episode:")
    for ep, n in sorted(by_ep.items()):
        print(f"    {ep:10s} {n} concepts introduced")
    print(f"\n  By pillar:")
    for p, n in by_pillar.most_common():
        print(f"    {p:30s} {n}")
    if orphans:
        print(f"\n  Orphans (no related concepts): {', '.join(orphans)}")

    # Prediction stats
    preds = [c for c in concepts if c.get("type") == "prediction"]
    if preds:
        pred_statuses = Counter(c.get("prediction", {}).get("status", "unknown") for c in preds)
        print(f"\n  Predictions ({len(preds)}):")
        for s, n in pred_statuses.most_common():
            print(f"    {s:22s} {n}")
    print()


# ── Graph ───────────────────────────────────────────────────────────────────

def cmd_graph(args, registry):
    """Print concept relationship graph as adjacency list."""
    concepts = registry["concepts"]
    id_set = {c["id"] for c in concepts}

    if args.json:
        edges = []
        for c in concepts:
            for rel in c.get("relatedConcepts", []):
                if rel in id_set:
                    edges.append({"from": c["id"], "to": rel})
        print(json.dumps({"nodes": list(id_set), "edges": edges}, indent=2))
        return

    print(f"\n  ═══ CONCEPT GRAPH ═══\n")
    for c in sorted(concepts, key=lambda x: x["id"]):
        related = c.get("relatedConcepts", [])
        valid = [r for r in related if r in id_set]
        broken = [r for r in related if r not in id_set]
        label = c["term"]["en"]
        if len(label) > 35:
            label = label[:32] + "..."
        print(f"  {c['id']}")
        for r in valid:
            print(f"    → {r}")
        for r in broken:
            print(f"    ✗ {r}  (broken link)")
        print()


# ── Add ─────────────────────────────────────────────────────────────────────

def cmd_add(args, registry):
    """Interactive: add a new concept."""
    print("\n  ═══ ADD NEW CONCEPT ═══\n")

    cid = input("  ID (kebab-case): ").strip()
    if any(c["id"] == cid for c in registry["concepts"]):
        print(f"  Error: concept '{cid}' already exists.")
        return

    en = input("  Term (EN): ").strip()
    cn = input("  Term (CN, or blank): ").strip() or None
    pinyin = input("  Pinyin (or blank): ").strip() or None if cn else None
    short = input("  Short form (or blank): ").strip() or None

    types = ["framework", "foreign-term", "named-concept", "historical-analogy", "entity", "mental-model", "prediction"]
    print(f"  Types: {', '.join(types)}")
    ctype = input("  Type: ").strip()

    definition = input("  Definition (one sentence): ").strip()
    insight = input("  Key insight: ").strip()

    episode = input("  Episode (e.g. EP01): ").strip().upper()
    beat = int(input("  Beat number: ").strip())
    timestamp = input("  Timestamp (e.g. 3:00-3:30, or blank): ").strip() or None
    template = input("  Template used (or blank): ").strip() or None
    treatment = input("  Treatment (cold-intro/organic/callback): ").strip() or "cold-intro"
    accent = input("  Accent color hex (or blank): ").strip() or None

    pillars_input = input("  Pillars (comma-sep: historical-analogy, philosophical-framework, geopolitics): ").strip()
    pillars = [p.strip() for p in pillars_input.split(",") if p.strip()] if pillars_input else []

    tags_input = input("  Tags (comma-sep): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []

    related_input = input("  Related concept IDs (comma-sep, or blank): ").strip()
    related = [r.strip() for r in related_input.split(",") if r.strip()] if related_input else []

    callback = input("  Callback visual suggestion (or blank): ").strip() or None

    concept = {
        "id": cid,
        "term": {"en": en},
        "type": ctype,
        "definition": definition,
        "insight": insight,
        "introduced": {
            "episode": episode,
            "beat": beat,
            "treatment": treatment,
        },
        "appearances": [],
        "relatedConcepts": related,
        "pillar": pillars,
        "tags": tags,
    }

    if cn:
        concept["term"]["cn"] = cn
    if pinyin:
        concept["term"]["pinyin"] = pinyin
    if short:
        concept["term"]["short"] = short
    if timestamp:
        concept["introduced"]["timestamp"] = timestamp
    if template:
        concept["introduced"]["template"] = template
    if accent:
        concept["introduced"]["accentColor"] = accent
    if callback:
        concept["callbackVisual"] = callback

    registry["concepts"].append(concept)
    save_registry(registry, Path(args.registry))
    print(f"\n  ✓ Added concept '{cid}'")


# ── Validate ────────────────────────────────────────────────────────────────

def cmd_validate(args, registry):
    """Validate registry: broken links, missing fields, ID uniqueness."""
    concepts = registry["concepts"]
    id_set = {c["id"] for c in concepts}
    issues = []

    # Check ID uniqueness
    ids = [c["id"] for c in concepts]
    dupes = [i for i in ids if ids.count(i) > 1]
    if dupes:
        issues.append(f"Duplicate IDs: {set(dupes)}")

    for c in concepts:
        cid = c["id"]

        # Check ID format
        if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", cid):
            issues.append(f"[{cid}] ID format invalid (must be kebab-case)")

        # Check required fields
        for field in ["definition", "insight"]:
            if not c.get(field):
                issues.append(f"[{cid}] Missing {field}")

        # Check related concept links
        for rel in c.get("relatedConcepts", []):
            if rel not in id_set:
                issues.append(f"[{cid}] Broken link → '{rel}'")

        # Check introduction has episode and beat
        intro = c.get("introduced", {})
        if not intro.get("episode"):
            issues.append(f"[{cid}] Missing introduced.episode")
        if "beat" not in intro:
            issues.append(f"[{cid}] Missing introduced.beat")

        # Check prediction-specific fields
        if c.get("type") == "prediction":
            pred = c.get("prediction")
            if not pred:
                issues.append(f"[{cid}] Type is 'prediction' but missing prediction fields")
            else:
                for pfield in ["claim", "probability", "timeframe", "falsification", "status"]:
                    if not pred.get(pfield) and pred.get(pfield) != 0:
                        issues.append(f"[{cid}] Prediction missing required field: {pfield}")

        # Check type validity
        valid_types = ["framework", "foreign-term", "named-concept", "historical-analogy", "entity", "mental-model", "prediction"]
        if c.get("type") not in valid_types:
            issues.append(f"[{cid}] Invalid type: {c.get('type')}")

    if args.json:
        print(json.dumps({"valid": len(issues) == 0, "issues": issues}, indent=2))
        return

    if not issues:
        print(f"\n  ✓ Registry valid — {len(concepts)} concepts, 0 issues\n")
    else:
        print(f"\n  ✗ {len(issues)} issue(s) found:\n")
        for issue in issues:
            print(f"    • {issue}")
        print()

    sys.exit(0 if not issues else 1)


# ── Predictions ────────────────────────────────────────────────────────────

def cmd_predictions(args, registry):
    """List all predictions, grouped by status."""
    preds = [c for c in registry["concepts"] if c.get("type") == "prediction"]

    if not preds:
        print("  No predictions in registry.")
        return

    if args.json:
        print(json.dumps(preds, indent=2, ensure_ascii=False))
        return

    by_status = {}
    for c in preds:
        status = c.get("prediction", {}).get("status", "unknown")
        by_status.setdefault(status, []).append(c)

    print(f"\n  ═══ PREDICTIONS ({len(preds)} total) ═══\n")
    status_order = ["open", "confirmed", "falsified", "partially-confirmed", "revised", "expired"]
    for status in status_order:
        group = by_status.get(status, [])
        if not group:
            continue
        status_label = status.upper()
        print(f"  ── {status_label} ({len(group)}) ──\n")
        for c in group:
            pred = c.get("prediction", {})
            prob = pred.get("probability", "?")
            prob_str = f"{int(prob*100)}%" if isinstance(prob, (int, float)) else str(prob)
            print(f"  [{c['id']}] {c['term']['en']}")
            print(f"    Claim: {pred.get('claim', '—')}")
            print(f"    Probability: {prob_str}  |  Check by: {pred.get('timeframe', '—')}")
            print(f"    Episode: {c['introduced']['episode']}")
            if pred.get("scenarioName"):
                print(f"    Scenario: {pred['scenarioName']}")
            if status not in ("open",) and pred.get("resolution"):
                res = pred["resolution"]
                print(f"    Resolved: {res.get('date', '—')} — {res.get('evidence', '—')}")
            print()


def cmd_predictions_due(args, registry):
    """Show predictions whose timeframe has passed or is approaching."""
    from datetime import datetime

    preds = [c for c in registry["concepts"]
             if c.get("type") == "prediction"
             and c.get("prediction", {}).get("status") == "open"]

    if not preds:
        print("  No open predictions.")
        return

    now = datetime.now()
    due = []
    upcoming = []

    for c in preds:
        tf = c["prediction"].get("timeframe", "")
        # Try to parse various formats
        check_date = None
        if re.match(r"\d{4}-Q[1-4]", tf):
            year = int(tf[:4])
            quarter = int(tf[6])
            month = quarter * 3
            check_date = datetime(year, month, 28)
        elif re.match(r"\d{4}-\d{2}-\d{2}", tf):
            check_date = datetime.strptime(tf[:10], "%Y-%m-%d")
        elif re.match(r"\d{4}-\d{2}", tf):
            check_date = datetime.strptime(tf[:7], "%Y-%m")

        if check_date:
            days_until = (check_date - now).days
            if days_until <= 0:
                due.append((c, days_until))
            elif days_until <= 90:
                upcoming.append((c, days_until))

    if args.json:
        print(json.dumps({
            "due": [{"concept": c, "days_overdue": -d} for c, d in due],
            "upcoming": [{"concept": c, "days_until": d} for c, d in upcoming],
        }, indent=2, ensure_ascii=False))
        return

    if due:
        print(f"\n  ⚠️  PREDICTIONS DUE FOR REVIEW ({len(due)}):\n")
        for c, days in sorted(due, key=lambda x: x[1]):
            pred = c["prediction"]
            print(f"  [{c['id']}] {pred['claim']}")
            print(f"    Due: {pred['timeframe']} ({-days} days overdue)")
            print(f"    Falsification: {pred.get('falsification', '—')}")
            print()

    if upcoming:
        print(f"\n  📅  COMING UP WITHIN 90 DAYS ({len(upcoming)}):\n")
        for c, days in sorted(upcoming, key=lambda x: x[1]):
            pred = c["prediction"]
            print(f"  [{c['id']}] {pred['claim']}")
            print(f"    Due: {pred['timeframe']} ({days} days)")
            print()

    if not due and not upcoming:
        print(f"  No predictions due or upcoming within 90 days. ({len(preds)} open predictions)")


def cmd_resolve(args, registry):
    """Interactively resolve a prediction."""
    cid = args.concept_id
    concept = next((c for c in registry["concepts"] if c["id"] == cid), None)

    if not concept:
        print(f"  Concept '{cid}' not found.")
        return

    if concept.get("type") != "prediction":
        print(f"  [{cid}] is type '{concept.get('type')}', not a prediction.")
        return

    pred = concept.get("prediction", {})
    print(f"\n  ═══ RESOLVE PREDICTION ═══\n")
    print(f"  [{cid}] {concept['term']['en']}")
    print(f"  Claim: {pred.get('claim', '—')}")
    print(f"  Current probability: {pred.get('probability', '—')}")
    print(f"  Timeframe: {pred.get('timeframe', '—')}")
    print(f"  Falsification: {pred.get('falsification', '—')}")
    print()

    statuses = ["confirmed", "falsified", "partially-confirmed", "expired", "revised"]
    print(f"  Status options: {', '.join(statuses)}")
    new_status = input("  New status: ").strip()
    if new_status not in statuses:
        print(f"  Invalid status. Choose from: {', '.join(statuses)}")
        return

    date = input("  Resolution date (YYYY-MM-DD, or blank for today): ").strip()
    if not date:
        from datetime import datetime
        date = datetime.now().strftime("%Y-%m-%d")

    evidence = input("  Evidence (what confirmed/falsified this): ").strip()
    episode = input("  Episode discussed in (e.g. EP05, or blank): ").strip() or None

    pred["status"] = new_status
    pred["resolution"] = {
        "date": date,
        "evidence": evidence,
    }
    if episode:
        pred["resolution"]["episode"] = episode

    if new_status == "revised":
        new_prob = input("  Updated probability (0-1): ").strip()
        try:
            pred["resolution"]["updatedProbability"] = float(new_prob)
        except ValueError:
            print("  Warning: couldn't parse probability, skipping.")

    save_registry(registry, Path(args.registry))
    print(f"\n  ✓ Prediction '{cid}' resolved as {new_status}")


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Parallax Concept Registry — lookup and management CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Path to concepts.json")

    sub = parser.add_subparsers(dest="command")

    p_search = sub.add_parser("search", help="Search concepts")
    p_search.add_argument("query", help="Search term")

    p_ep = sub.add_parser("episode", help="List concepts by episode")
    p_ep.add_argument("episode", help="Episode ID (e.g. EP01)")

    p_reuse = sub.add_parser("reuse-check", help="Check script for prior-episode concepts")
    p_reuse.add_argument("episode", help="Target episode ID")
    p_reuse.add_argument("--script", required=True, help="Path to script .md file")

    p_show = sub.add_parser("show", help="Show concept detail")
    p_show.add_argument("concept_id", help="Concept ID")

    sub.add_parser("tags", help="List all tags")
    sub.add_parser("stats", help="Registry statistics")
    sub.add_parser("add", help="Add a concept interactively")
    sub.add_parser("graph", help="Concept relationship graph")
    sub.add_parser("validate", help="Validate registry")
    sub.add_parser("predictions", help="List all predictions by status")
    sub.add_parser("predictions-due", help="Show predictions due for review")

    p_resolve = sub.add_parser("resolve", help="Resolve a prediction")
    p_resolve.add_argument("concept_id", help="Prediction concept ID")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    registry = load_registry(Path(args.registry))

    commands = {
        "search": cmd_search,
        "episode": cmd_episode,
        "reuse-check": cmd_reuse_check,
        "show": cmd_show,
        "tags": cmd_tags,
        "stats": cmd_stats,
        "add": cmd_add,
        "graph": cmd_graph,
        "validate": cmd_validate,
        "predictions": cmd_predictions,
        "predictions-due": cmd_predictions_due,
        "resolve": cmd_resolve,
    }

    commands[args.command](args, registry)


if __name__ == "__main__":
    main()
