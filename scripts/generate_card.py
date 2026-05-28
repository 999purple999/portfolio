"""COLD FORGE Phase 7 — portfolio card generator.

Action #7 from DeepSeek architectural review. Collapses the 15-20 min
manual portfolio update per shipped PR into a 30-second invocation:

  python scripts/generate_card.py path/to/pr_data.json

The script:
  1. reads a small JSON describing the PR (rank, org, pr_num, ...)
  2. emits the <article class="project ..."> card markup to stdout
  3. lists every outreach/*.html sibling page that needs the new nav link
  4. prints the exact `sed` command to insert the nav link on all siblings
  5. prints the line you'd insert into index.html and into MEMORY.md

It does NOT mutate index.html directly — operator pastes the markup at the
right insertion point. This avoids race conditions and accidental
overwrites of hand-tuned card prose.

Existing 13 outreach pages stay handcrafted. Generator is for FUTURE PRs.

JSON schema (pr_data.json):
{
  "rank": 14,
  "slug": "cryptpad",
  "org": "CryptPad",
  "repo": "cryptpad/cryptpad",
  "pr_num": 1234,
  "branch": "fix/whatever",
  "issue_num": 5678,
  "status_pill_class": "pill-green",
  "status_pill_text": "PR #1234 open",
  "ci_status_line": "Issue #5678 - X tests pass - PR open",
  "title": "CryptPad",
  "claim": "One-sentence pitch.",
  "body": "Full paragraph describing the fix, context, follow-up.",
  "tech_tags": ["TypeScript", "vitest", "..."],
  "diff_size": "+10/-2",
  "regression_tests": "1 regression-guard test"
}
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

PORTFOLIO_ROOT = Path(r"c:/Users/FRA/Documents/github/portfolio")

CARD_TEMPLATE = """      <article class="project featured reveal" data-tilt>
        <div class="project-rank">#{rank} · {org} · PR #{pr_num} · {rank_suffix}</div>
        <div class="project-badge public">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.5-.3.8 0 1.7.1 2.5.3 1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.5C22 6.5 17.5 2 12 2z"/></svg>
          {ci_status_line}
        </div>
        <h3 class="project-title">{title}</h3>
        <p class="project-claim">{claim}</p>
        <p class="project-body">{body}</p>
        <ul class="project-tech">
{tech_tags_html}
        </ul>
        <div class="project-links">
          <a href="outreach/{slug}.html">View the case →</a>
          <a href="https://github.com/{repo}/pull/{pr_num}" target="_blank" rel="noopener">PR #{pr_num} ↗</a>
          <a href="https://github.com/999purple999/{repo_name}/tree/{branch}" target="_blank" rel="noopener">Branch ↗</a>
          <a href="https://github.com/{repo}/issues/{issue_num}" target="_blank" rel="noopener">Issue #{issue_num} ↗</a>
        </div>
      </article>"""


def render_tech_tags(tags: list[str], diff_size: str, regression: str) -> str:
    extra = [diff_size, regression]
    all_tags = tags + [t for t in extra if t]
    lines = ["          <li>" + "</li><li>".join(all_tags[:3]) + "</li>"]
    if len(all_tags) > 3:
        lines.append("          <li>" + "</li><li>".join(all_tags[3:]) + "</li>")
    return "\n".join(lines)


def list_sibling_pages(slug: str) -> list[str]:
    outreach = PORTFOLIO_ROOT / "outreach"
    pages = sorted(p.name for p in outreach.glob("*.html") if p.stem != slug)
    return pages


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pr_data", help="path to pr_data.json")
    args = ap.parse_args()

    data = json.loads(Path(args.pr_data).read_text(encoding="utf-8"))
    data["rank_suffix"] = data.get("rank_suffix", "draft PR open")
    data["repo_name"] = data["repo"].split("/", 1)[1] if "/" in data["repo"] else data["repo"]
    data["tech_tags_html"] = render_tech_tags(
        data["tech_tags"], data.get("diff_size", ""), data.get("regression_tests", "")
    )

    print("=== INDEX CARD MARKUP (paste at top of #outreach section) ===\n")
    print(CARD_TEMPLATE.format(**data))
    print()

    print(f"=== NAV CROSS-LINK INSERTION (run from portfolio/outreach/) ===\n")
    siblings = list_sibling_pages(data["slug"])
    print(f"# add a Jinja-friendly nav link to {len(siblings)} sibling pages")
    print(f"for f in {' '.join(siblings)}; do")
    print(
        f"  sed -i 's|<a href=\"jitsi.html\">Jitsi</a>|<a href=\"jitsi.html\">Jitsi</a>\\n    "
        f"<a href=\"{data['slug']}.html\">{data['org']}</a>|' \"$f\";"
    )
    print("done")
    print()

    print("=== MEMORY.md INDEX ENTRY ===\n")
    print(
        f"- [Wave 3 fix #{data['rank']} · {data['org']} PR #{data['pr_num']} ({data['slug']})]"
        f"(wave3_{data['slug']}.md) — one-line hook"
    )
    print()

    print("=== SECTION TITLE BUMP ===\n")
    print(
        f"sed -i 's|[0-9]\\+ fixes on real upstream repos|{data['rank']} fixes on real upstream repos|' "
        f"{PORTFOLIO_ROOT}/index.html"
    )
    print()

    print("=== HOME-COVERAGE AUDIT (must show 0 diff) ===\n")
    print(f"cd {PORTFOLIO_ROOT}")
    print("diff <(ls outreach/*.html | sed 's|outreach/||' | sort) \\")
    print(
        "     <(awk 'NR>=127 && NR<=401' index.html | "
        "grep -oE 'outreach/[a-z-]+\\.html' | sed 's|outreach/||' | sort -u)"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
