"""Tests for tools/lint/script_lint.py."""

from __future__ import annotations

from tools.lint import script_lint


def rules(text: str) -> list[str]:
    return [d["rule"] for d in script_lint.lint_text(text)]


ESSAY = "<!-- narration:start -->\n{}\n<!-- narration:end -->\n"


def test_essay_only_scans_narration_block() -> None:
    text = "Maybe this is a note.\n" + ESSAY.format("Plain confident line.")
    assert rules(text) == []


def test_level3_hedge_flagged() -> None:
    assert "S-HEDGE-L3" in rules(ESSAY.format("Maybe it does."))


def test_verification_narration_is_error() -> None:
    issues = script_lint.lint_text(ESSAY.format("Verified as of May, the number holds."))
    assert any(d["rule"] == "S-VERIFY-NARRATION" and d["severity"] == "error" for d in issues)


def test_signpost_flagged() -> None:
    assert "S-SIGNPOST" in rules(ESSAY.format("Here's the problem. It breaks."))


def test_hedge_density_threshold() -> None:
    hedged = " ".join("This might hold." for _ in range(3)) + " Plain one. Plain two."
    assert "S-HEDGE-DENSITY" in rules(ESSAY.format(hedged))
    assert "S-HEDGE-DENSITY" not in rules(ESSAY.format("Plain one. Plain two. Plain three."))


def test_questions_not_counted_as_declarative() -> None:
    assert "S-HEDGE-DENSITY" not in rules(ESSAY.format("Might it work? Maybe not? Plain."))


TABLE = "| NARRATION | VISUAL PRODUCTION |\n|---|---|\n"


def test_two_column_extracts_first_cell_only() -> None:
    text = TABLE + "| Plain line. | **P1** · [MG:] Chart · maybe this visual note |\n"
    assert "S-HEDGE-L3" not in rules(text)


def test_two_column_skips_voice_notes() -> None:
    text = TABLE + "| *(Voice note: perhaps softer.)* | |\n"
    assert rules(text) == []


def test_deprecated_cut_is_error() -> None:
    text = TABLE + "| | DIR: cut(whip-pan) |\n"
    assert "S-DIR-DEPRECATED" in rules(text)


def test_iris_overuse() -> None:
    text = TABLE + "".join("| | DIR: cut(iris, origin:center) |\n" for _ in range(3))
    assert "S-DIR-IRIS-OVERUSE" in rules(text)
    two = TABLE + "".join("| | DIR: cut(iris) |\n" for _ in range(2))
    assert "S-DIR-IRIS-OVERUSE" not in rules(two)


def test_color_wash_requires_token() -> None:
    assert "S-DIR-COLOR-WASH" in rules(TABLE + "| | DIR: cut(color-wash) |\n")
    assert "S-DIR-COLOR-WASH" not in rules(TABLE + "| | DIR: cut(color-wash, ink) |\n")


def test_pace_invalid_value() -> None:
    assert "S-PACE-INVALID" in rules(TABLE + "| | PACE: frantic |\n")
    assert "S-PACE-INVALID" not in rules(TABLE + "| | PACE: urgent |\n")


def test_pace_in_prose_is_ignored() -> None:
    assert "S-PACE-INVALID" not in rules(TABLE + "| a | PACE: annotations carry rhythm |\n")


def test_mg_run() -> None:
    mg = "".join(f"| Line {i}. | **P2** · [MG:] Chart |\n" for i in range(4))
    assert "S-MG-RUN" in rules(TABLE + mg)
    broken = "".join(f"| Line {i}. | **P2** · [MG:] Chart |\n" for i in range(3))
    broken += "| Break. | **P3** · [AI-GEN:] scene |\n| More. | **P2** · [MG:] Chart |\n"
    assert "S-MG-RUN" not in rules(TABLE + broken)


def test_negation_pivot_across_sentences() -> None:
    assert "S-NEGATION-PIVOT" in rules(ESSAY.format("That doesn't make the price wrong. It changes the credit."))


def test_negation_pivot_inline() -> None:
    assert "S-NEGATION-PIVOT" in rules(ESSAY.format("It's not a miracle, it's a design."))


def test_plain_negation_without_pivot_not_flagged() -> None:
    assert "S-NEGATION-PIVOT" not in rules(ESSAY.format("The shop doesn't open on Sundays. Prices stay fixed."))


def test_mg_run_reset_by_footage_with_subtype() -> None:
    mg = "".join(f"| Line {i}. | **P2** · [MG:] Chart |\n" for i in range(3))
    mg += "| Screen. | **P1** · [FOOTAGE: screen] recording |\n| More. | **P2** · [MG:] Chart |\n"
    assert "S-MG-RUN" not in rules(TABLE + mg)
