"""KSA phone normalization. Returns an E.164 number (``+9665XXXXXXXX``) or
empty string when the input is not a valid KSA mobile.
"""

from __future__ import annotations

import re

KSA_LOCAL_PATTERN = re.compile(r"^5(5|0|3|6|4|9|1|8|7)[0-9]{7}$")


def normalize_phone(raw: str) -> str:
    digits = "".join(c for c in (raw or "") if c.isdigit())
    if not digits:
        return ""
    # Strip country code if present
    if digits.startswith("00966"):
        digits = digits[5:]
    elif digits.startswith("966"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    if not KSA_LOCAL_PATTERN.fullmatch(digits):
        return ""
    return f"+966{digits}"
