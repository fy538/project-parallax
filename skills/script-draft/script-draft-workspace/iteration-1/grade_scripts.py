import json, re, sys

def grade_script(filepath, output_path):
    with open(filepath, 'r') as f:
        content = f.read()
    
    results = []
    
    # format-two-column
    has_table = bool(re.search(r'\| NARRATION \| VISUAL PRODUCTION \|', content))
    results.append({"text": "format-two-column", "passed": has_table, "evidence": f"Found {'yes' if has_table else 'no'} two-column table headers"})
    
    # format-beat-structure
    beats = re.findall(r'## BEAT \d+ —', content)
    results.append({"text": "format-beat-structure", "passed": len(beats) == 5, "evidence": f"Found {len(beats)} beats"})
    
    # format-mode-tags
    visual_entries = re.findall(r'\*\*P[123]\*\*', content)
    mode_tags = re.findall(r'\[(FOOTAGE|MG|LAYERED):\]', content)
    # Also count TRANSITION entries
    transitions = re.findall(r'\*\*TRANSITION\*\*', content)
    total_visual = len(visual_entries) + len(transitions)
    tag_ratio = len(mode_tags) / max(len(visual_entries), 1)
    results.append({"text": "format-mode-tags", "passed": tag_ratio > 0.7, "evidence": f"{len(mode_tags)} mode tags across {len(visual_entries)} visual entries ({tag_ratio:.0%})"})
    
    # format-priority-tiers
    p1 = len(re.findall(r'\*\*P1\*\*', content))
    p2 = len(re.findall(r'\*\*P2\*\*', content))
    p3 = len(re.findall(r'\*\*P3\*\*', content))
    results.append({"text": "format-priority-tiers", "passed": p1 > 0 and p2 > 0 and p3 > 0, "evidence": f"P1: {p1}, P2: {p2}, P3: {p3}"})
    
    # format-claim-tags
    verified = len(re.findall(r'\{✅\}', content))
    unverified = len(re.findall(r'\{⚠️\}', content))
    new_claims = len(re.findall(r'\{NEW\}', content))
    total_tags = verified + unverified + new_claims
    results.append({"text": "format-claim-tags", "passed": total_tags >= 10, "evidence": f"✅: {verified}, ⚠️: {unverified}, NEW: {new_claims} (total: {total_tags})"})
    
    # format-asset-summary
    has_mode_breakdown = bool(re.search(r'Visual Mode Breakdown', content))
    has_remotion = bool(re.search(r'Remotion Compositions', content))
    has_footage = bool(re.search(r'Stock Footage', content))
    has_images = bool(re.search(r'Images.*Archival', content))
    all_tables = has_mode_breakdown and has_remotion and has_footage and has_images
    results.append({"text": "format-asset-summary", "passed": all_tables, "evidence": f"Mode breakdown: {has_mode_breakdown}, Remotion: {has_remotion}, Footage: {has_footage}, Images: {has_images}"})
    
    # nar-10-stakes-first-30s (check first beat for contradiction/stakes)
    beat1_match = re.search(r'## BEAT 1.*?## BEAT 2', content, re.DOTALL)
    if beat1_match:
        beat1 = beat1_match.group()
        # Check for contradiction or reversal early
        has_reversal = any(w in beat1.lower() for w in ['except', 'but', 'paradox', 'puzzle', 'however', 'only seven percent', 'seven percent', '7%', 'rounding error', 'drop in the ocean'])
        results.append({"text": "nar-10-stakes-first-30s", "passed": has_reversal, "evidence": f"Beat 1 contains contradiction/reversal: {has_reversal}"})
    else:
        results.append({"text": "nar-10-stakes-first-30s", "passed": False, "evidence": "Could not parse Beat 1"})
    
    # nar-11-named-concept
    trap_mentions = len(re.findall(r'[Ss]ilicon [Tt]rap', content.split('ASSET SUMMARY')[0] if 'ASSET SUMMARY' in content else content))
    results.append({"text": "nar-11-named-concept", "passed": trap_mentions >= 3, "evidence": f"'Silicon Trap' appears {trap_mentions} times in narration"})
    
    # nar-06-bilateral-balance (check for Chinese terms)
    has_chinese = bool(re.search(r'卡脖子|举国体制|kǎ bózi|jǔguó', content))
    results.append({"text": "nar-06-bilateral-balance", "passed": has_chinese, "evidence": f"Contains Chinese perspective terms: {has_chinese}"})
    
    # vis-06-timing-breaks
    has_visual_first = bool(re.search(r'VISUAL-FIRST', content))
    has_counterpoint = bool(re.search(r'COUNTERPOINT', content))
    results.append({"text": "vis-06-timing-breaks", "passed": has_visual_first or has_counterpoint, "evidence": f"VISUAL-FIRST: {has_visual_first}, COUNTERPOINT: {has_counterpoint}"})
    
    # vis-mode-balance (parse from mode breakdown table)
    footage_pct = re.search(r'\[FOOTAGE:\].*?(\d+)%', content)
    mg_pct = re.search(r'\[MG:\].*?(\d+)%', content)
    if footage_pct and mg_pct:
        f_pct = int(footage_pct.group(1))
        m_pct = int(mg_pct.group(1))
        in_range = 50 <= f_pct <= 70 and 20 <= m_pct <= 35
        results.append({"text": "vis-mode-balance", "passed": in_range, "evidence": f"FOOTAGE: {f_pct}%, MG: {m_pct}%"})
    else:
        results.append({"text": "vis-mode-balance", "passed": False, "evidence": "Could not parse mode percentages"})
    
    # nar-09-decoder-posture (check for explainer anti-patterns)
    explainer_phrases = re.findall(r'[Ll]et me explain|[Tt]o understand this.*first|[Bb]efore we.*need to', content.split('ASSET SUMMARY')[0] if 'ASSET SUMMARY' in content else content)
    results.append({"text": "nar-09-decoder-posture", "passed": len(explainer_phrases) == 0, "evidence": f"Explainer anti-patterns found: {len(explainer_phrases)} — {explainer_phrases[:3]}"})
    
    with open(output_path, 'w') as f:
        json.dump({"expectations": results}, f, indent=2)
    
    passed = sum(1 for r in results if r['passed'])
    total = len(results)
    print(f"{output_path}: {passed}/{total} passed")

grade_script('ep01-with-skill/outputs/script-v1.md', 'ep01-with-skill/grading.json')
grade_script('ep01-without-skill/outputs/script-v1.md', 'ep01-without-skill/grading.json')
