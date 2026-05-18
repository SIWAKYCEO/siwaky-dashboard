"""File-backed store for Web Push subscriptions and seen order IDs (push dedupe)."""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Any

_lock = threading.RLock()


def _data_dir() -> Path:
    raw = os.getenv("PUSH_DATA_DIR", "").strip()
    if raw:
        return Path(raw)
    # Default: backend/data next to package root (app/../data)
    here = Path(__file__).resolve()
    return here.parents[2] / "data"


def _ensure_dir() -> Path:
    d = _data_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d


def _subscriptions_path() -> Path:
    return _ensure_dir() / "push_subscriptions.json"


def _seen_path() -> Path:
    return _ensure_dir() / "push_seen_order_ids.json"


def load_subscriptions() -> list[dict[str, Any]]:
    with _lock:
        path = _subscriptions_path()
        if not path.is_file():
            return []
        try:
            raw = path.read_text(encoding="utf-8")
            data = json.loads(raw)
            subs = data.get("subscriptions")
            if not isinstance(subs, list):
                return []
            return [s for s in subs if isinstance(s, dict) and s.get("endpoint")]
        except (OSError, json.JSONDecodeError):
            return []


def save_subscriptions(subs: list[dict[str, Any]]) -> None:
    path = _subscriptions_path()
    with _lock:
        _ensure_dir()
        path.write_text(
            json.dumps({"subscriptions": subs}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )


def upsert_subscription(sub: dict[str, Any]) -> None:
    """Merge subscription by endpoint (PushSubscription JSON shape)."""
    endpoint = sub.get("endpoint")
    if not endpoint or not isinstance(endpoint, str):
        return
    with _lock:
        current = load_subscriptions()
        out: list[dict[str, Any]] = [s for s in current if s.get("endpoint") != endpoint]
        out.append(sub)
        save_subscriptions(out)


def load_seen_state() -> dict[str, Any]:
    path = _seen_path()
    if not path.is_file():
        return {"bootstrapped": False, "seen": []}
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        if not isinstance(data, dict):
            return {"bootstrapped": False, "seen": []}
        seen = data.get("seen")
        if not isinstance(seen, list):
            seen = []
        boot = bool(data.get("bootstrapped"))
        return {"bootstrapped": boot, "seen": [str(x) for x in seen if x]}
    except (OSError, json.JSONDecodeError):
        return {"bootstrapped": False, "seen": []}


def save_seen_state(*, bootstrapped: bool, seen: set[str]) -> None:
    path = _seen_path()
    with _lock:
        _ensure_dir()
        path.write_text(
            json.dumps({"bootstrapped": bootstrapped, "seen": sorted(seen)}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
