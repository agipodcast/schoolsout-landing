#!/usr/bin/env python3
"""Validate the static Schools Out public surface before deployment."""

from __future__ import annotations

import html
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_HOSTS = {"agipodcast.ai", "schoolsout.agipodcast.ai"}
DEAD_FIELD_NOTES_FORM = "2rc7ZgrJeSQm9geAkrYbj6Aq51dop"
FIELD_NOTES_FORM_ID = "3fbae9ad-3525-46c4-aeaf-460d6fac64ca"
CONTACT_FORM_ID = "172rws_4LT7CcG4mtdk137w41aedp"
errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def load_json(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"{path.relative_to(ROOT)} is not valid JSON: {exc}")
        return {}


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        if values.get("name"):
            self.ids.add(values["name"])
        for attr in ("href", "src"):
            if values.get(attr):
                self.links.append(values[attr])


def parsed_html(path: Path) -> LinkParser:
    parser = LinkParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def resolve_public_path(source: Path, raw_url: str) -> tuple[Path, str] | None:
    if raw_url.startswith(("mailto:", "tel:", "javascript:", "data:")):
        return None

    parsed = urllib.parse.urlsplit(raw_url)
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None
    if parsed.netloc and parsed.hostname not in PUBLIC_HOSTS:
        return None

    fragment = urllib.parse.unquote(parsed.fragment)
    if parsed.netloc or parsed.path.startswith("/"):
        relative = urllib.parse.unquote(parsed.path).lstrip("/")
    else:
        relative = urllib.parse.unquote(parsed.path)
        relative = str((source.parent.relative_to(ROOT) / relative)) if relative else str(source.relative_to(ROOT))

    relative = relative or "index.html"
    target = ROOT / relative
    candidates = [target]
    if relative.endswith("/"):
        candidates = [target / "index.html"]
    elif not target.suffix:
        candidates = [target, target.with_suffix(".html"), target / "index.html"]

    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve(), fragment
    return candidates[-1].resolve(), fragment


def validate_links() -> None:
    html_files = sorted(ROOT.rglob("*.html"))
    parsed_cache: dict[Path, LinkParser] = {}
    for source in html_files:
        if "template" in source.name:
            continue
        parser = parsed_cache.setdefault(source.resolve(), parsed_html(source))
        for raw_url in parser.links:
            if "{{" in raw_url:
                continue
            resolved = resolve_public_path(source, raw_url)
            if resolved is None:
                continue
            target, fragment = resolved
            if not target.is_file():
                fail(f"{source.relative_to(ROOT)} has unresolved local link: {raw_url}")
                continue
            if fragment and target.suffix.lower() == ".html":
                target_parser = parsed_cache.setdefault(target, parsed_html(target))
                if fragment not in target_parser.ids:
                    fail(
                        f"{source.relative_to(ROOT)} links to missing fragment "
                        f"#{fragment} in {target.relative_to(ROOT)}"
                    )


def validate_episode_catalog() -> None:
    catalog = load_json(ROOT / "data" / "episodes.json")
    if not isinstance(catalog, dict):
        return
    episodes = catalog.get("episodes")
    if not isinstance(episodes, list):
        fail("data/episodes.json does not contain an episodes array")
        return

    count = catalog.get("episodeCount")
    if count != len(episodes):
        fail(f"episodeCount is {count}, but the catalog contains {len(episodes)} episodes")
    if catalog.get("updated") != episodes[0].get("date"):
        fail("catalog updated date does not match the newest episode date")

    dates = [episode.get("date", "") for episode in episodes]
    if dates != sorted(dates, reverse=True):
        fail("episode catalog is not in descending date order")
    media_urls = [episode.get("youtube") or episode.get("spotify") for episode in episodes]
    if any(not url for url in media_urls):
        fail("each episode must have a YouTube or Spotify listening URL")
    if len(media_urls) != len(set(media_urls)):
        fail("episode catalog contains duplicate listening URLs")

    episode_html = (ROOT / "episodes" / "index.html").read_text(encoding="utf-8")
    json_ld_match = re.search(
        r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
        episode_html,
        re.DOTALL,
    )
    if not json_ld_match:
        fail("episodes/index.html has no JSON-LD block")
        return
    try:
        graph = json.loads(json_ld_match.group(1)).get("@graph", [])
    except json.JSONDecodeError as exc:
        fail(f"episodes/index.html JSON-LD is invalid: {exc}")
        return

    lists = [
        item
        for item in graph
        if item.get("@type") == "ItemList" and "numberOfItems" in item
    ]
    if len(lists) != 1:
        fail("episodes/index.html must have one numbered episode ItemList")
        return
    item_list = lists[0]
    items = item_list.get("itemListElement", [])
    if item_list.get("numberOfItems") != len(episodes) or len(items) != len(episodes):
        fail("episode JSON-LD count does not match data/episodes.json")
    if [item.get("position") for item in items] != list(range(1, len(items) + 1)):
        fail("episode JSON-LD positions are not consecutive")

    for position, (episode, item) in enumerate(zip(episodes, items), start=1):
        expected_url = episode.get("hub") or episode.get("youtube") or episode.get("spotify")
        if item.get("name") != episode.get("title"):
            fail(f"episode JSON-LD title mismatch at position {position}")
        if item.get("url") != expected_url:
            fail(f"episode JSON-LD URL mismatch at position {position}")

    cards = re.findall(
        r'<article class="ep-card(?: featured)?">(.*?)</article>',
        episode_html,
        re.DOTALL,
    )
    if len(cards) != len(episodes):
        fail(f"episodes/index.html has {len(cards)} cards; expected {len(episodes)}")
        return
    for position, (episode, card) in enumerate(zip(episodes, cards), start=1):
        title_match = re.search(r'<h3 class="ep-title">(.*?)</h3>', card, re.DOTALL)
        date_match = re.search(r'<span class="ep-date">(.*?)</span>', card, re.DOTALL)
        if not title_match or html.unescape(title_match.group(1).strip()) != episode.get("title"):
            fail(f"visible episode title mismatch at position {position}")
        if not date_match:
            fail(f"visible episode date missing at position {position}")
        else:
            rendered_date = datetime.strptime(
                html.unescape(date_match.group(1).strip()), "%B %d, %Y"
            ).strftime("%Y-%m-%d")
            if rendered_date != episode.get("date"):
                fail(f"visible episode date mismatch at position {position}")
        expected_media = episode.get("youtube") or episode.get("spotify")
        if expected_media not in card:
            fail(f"visible episode listening URL mismatch at position {position}")


def validate_public_metadata() -> None:
    sitemap = ET.parse(ROOT / "sitemap.xml")
    locations = [
        element.text or ""
        for element in sitemap.getroot().iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    ]
    redirected = [url for url in locations if not url.startswith("https://schoolsout.agipodcast.ai/")]
    if redirected:
        fail(f"sitemap contains non-canonical URLs: {', '.join(redirected)}")

    old_canonical_pattern = re.compile(
        r'(?:rel="canonical" href|property="og:url" content)="https://agipodcast\.ai/'
    )
    for path in ROOT.rglob("*.html"):
        if old_canonical_pattern.search(path.read_text(encoding="utf-8")):
            fail(f"{path.relative_to(ROOT)} declares the redirecting apex as canonical/og:url")


def validate_forms_and_pdf() -> None:
    searchable = [
        path
        for path in ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in {".html", ".json", ".txt", ".xml"}
    ]
    for path in searchable:
        if DEAD_FIELD_NOTES_FORM in path.read_text(encoding="utf-8"):
            fail(f"{path.relative_to(ROOT)} still links to the retired Field Notes form")

    homepage = (ROOT / "index.html").read_text(encoding="utf-8")
    if 'id="subscribe"' not in homepage or FIELD_NOTES_FORM_ID not in homepage:
        fail("homepage does not expose the canonical embedded Field Notes form")
    if CONTACT_FORM_ID not in homepage:
        fail("homepage does not link to the canonical contact form")

    guide = ROOT / "resources" / "notebooklm-guide.pdf"
    if not guide.is_file() or guide.stat().st_size < 10_000:
        fail("NotebookLM PDF is missing or implausibly small")
    elif not guide.read_bytes().startswith(b"%PDF-"):
        fail("NotebookLM download does not have a PDF header")


def main() -> int:
    validate_links()
    validate_episode_catalog()
    validate_public_metadata()
    validate_forms_and_pdf()
    if errors:
        print(f"FAILED: {len(errors)} validation error(s)")
        for message in errors:
            print(f"- {message}")
        return 1
    print("PASS: links, catalog, schema, canonical metadata, forms, and PDF validated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
