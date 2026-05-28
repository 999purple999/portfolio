"""COLD EMAIL CHECKER — deliverability monitor.

Action #1 from DeepSeek architectural review. Tracks bounce rate on the
klabindustries.hq Gmail and screams if it crosses the 10% danger threshold
that signals Gmail's outbound spam filter is about to throttle sends.

Reads the same OAuth credentials as the gmail-klab MCP server.
Run weekly (Sunday evening recommended) or before any large outreach batch.

Output: JSON to stdout — easy to integrate into a CI/cron job later.

Usage:
  python scripts/bounce_tracker.py [--days 7] [--threshold 0.10]
"""
from __future__ import annotations
import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

OAUTH_KEYS = Path(r"C:\Users\FRA\.gmail-mcp\klab-oauth.keys.json")
CREDS_PATH = Path(r"C:\Users\FRA\.gmail-mcp\klab-credentials.json")


def get_access_token() -> str:
    keys = json.loads(OAUTH_KEYS.read_text())["installed"]
    creds = json.loads(CREDS_PATH.read_text())
    data = urllib.parse.urlencode({
        "client_id": keys["client_id"],
        "client_secret": keys["client_secret"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]


def gmail_search(access_token: str, q: str, max_results: int = 500) -> list[dict]:
    """Return list of message metadata for query q."""
    out: list[dict] = []
    page_token = None
    while True:
        params = {"q": q, "maxResults": str(min(max_results - len(out), 100))}
        if page_token:
            params["pageToken"] = page_token
        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
        with urllib.request.urlopen(req) as r:
            body = json.loads(r.read())
        out.extend(body.get("messages", []))
        page_token = body.get("nextPageToken")
        if not page_token or len(out) >= max_results:
            break
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7, help="window in days (default 7)")
    ap.add_argument("--threshold", type=float, default=0.10, help="bounce rate alert threshold (default 0.10)")
    args = ap.parse_args()

    token = get_access_token()

    # Sent messages in window
    sent = gmail_search(token, f"in:sent newer_than:{args.days}d -from:no-reply -from:noreply")

    # Bounce notifications in window
    bounces = gmail_search(
        token,
        f"newer_than:{args.days}d (from:mailer-daemon@googlemail.com OR from:postmaster@ OR subject:\"Delivery Status Notification (Failure)\")",
    )

    sent_count = len(sent)
    bounce_count = len(bounces)
    rate = bounce_count / sent_count if sent_count else 0.0

    report = {
        "window_days": args.days,
        "sent_count": sent_count,
        "bounce_count": bounce_count,
        "bounce_rate": round(rate, 4),
        "threshold": args.threshold,
        "alert": rate > args.threshold,
        "advice": (
            "PAUSE outreach sends and warm up the domain — bounce rate above threshold "
            "suggests Gmail is starting to flag outbound. Send plain-text test mails to "
            "a personal address for 3-4 days before resuming."
            if rate > args.threshold
            else "OK — deliverability within healthy range."
        ),
    }
    print(json.dumps(report, indent=2))
    return 1 if report["alert"] else 0


if __name__ == "__main__":
    sys.exit(main())
