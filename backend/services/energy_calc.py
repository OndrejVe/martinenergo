from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Dict, Optional

NUMBER_RE = r"(\d+(?:[\s\u00a0.,]\d+)*)"


def _to_float(raw: str | None) -> Optional[float]:
    if not raw:
        return None
    cleaned = raw.replace("\u00a0", " ").replace(" ", "")
    cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalize(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text or "") if not unicodedata.combining(c)
    ).lower()


@dataclass
class ParsedEnergyMessage:
    q_mwh: Optional[float] = None
    p_mwh: Optional[float] = None
    f_month: Optional[float] = None
    months: Optional[int] = None
    total_kc: Optional[float] = None

    def as_dict(self) -> Dict[str, Optional[float]]:
        return {
            "q_mwh": self.q_mwh,
            "p_mwh": self.p_mwh,
            "f_month": self.f_month,
            "months": self.months,
            "total_kc": self.total_kc,
        }


def parse_energy_message(text: str) -> Dict[str, Optional[float]]:
    """
    Heuristicky vytáhne spotřebu (MWh), cenu komodity (Kč/MWh),
    stálý plat (Kč/měs) a počet měsíců z volného textu.
    """
    normalized = _normalize(text)
    parsed = ParsedEnergyMessage()

    # Spotřeba
    for pattern, factor in [
        (rf"{NUMBER_RE}\s*(?:mwh|m[\s-]?wh)", 1.0),
        (rf"{NUMBER_RE}\s*(?:kwh|k[\s-]?wh)", 1 / 1000.0),
    ]:
        match = re.search(pattern, normalized)
        if match:
            val = _to_float(match.group(1))
            if val is not None:
                parsed.q_mwh = val * factor
                break

    # Cena komodity
    price_match = re.search(rf"{NUMBER_RE}\s*(?:kc|kč)\s*/\s*(mwh|kwh)", normalized)
    if price_match:
        val = _to_float(price_match.group(1))
        if val is not None:
            unit = price_match.group(2)
            parsed.p_mwh = val if unit == "mwh" else val * 1000.0

    # Stálý měsíční plat
    monthly_match = re.search(
        rf"{NUMBER_RE}\s*(?:kc|kč)\s*(?:/|za)?\s*(?:mes|mes\.|mesic|mesicne|m[ěe]s|m[ěe]s[íi]cne|m[ěe]s[íi][cč])",
        normalized,
    )
    if monthly_match:
        parsed.f_month = _to_float(monthly_match.group(1))

    # Počet měsíců
    months_match = re.search(rf"{NUMBER_RE}\s*(?:mesicu|mesic[eůu]?|m[ěe]s[íi]cu?)", normalized)
    if months_match:
        val = _to_float(months_match.group(1))
        if val is not None:
            parsed.months = int(val)
    elif "roc" in normalized and "spotreb" in normalized:
        parsed.months = 12

    # Celková částka za komoditu
    total_keywords = [
        "c kom",
        "ckom",
        "cena kom",
        "komod",
        "celkem",
        "rocni naklad",
        "rocni platba",
        "naklad",
        "platba",
        "cena celkem",
    ]
    currency_matches = list(re.finditer(rf"{NUMBER_RE}\s*(?:kc|kč)\b", normalized))
    for match in currency_matches:
        val = _to_float(match.group(1))
        if val is None:
            continue
        window = normalized[max(0, match.start() - 25) : match.end() + 10]
        if any(keyword in window for keyword in total_keywords):
            parsed.total_kc = val
            break

    return parsed.as_dict()


def compute_commodity_cost(
    q_mwh: Optional[float],
    p_mwh: Optional[float],
    f_month: Optional[float] = None,
    months: Optional[int] = None,
    total_kc: Optional[float] = None,
) -> Dict[str, object]:
    """
    Pokud máme spotřebu a cenu, vrátí výsledný náklad.
    Pokud máme cenu a celkovou částku, vrátí dopočtenou spotřebu.
    Jinak identifikuje chybějící vstupy.
    """
    provided_fixed = f_month
    f_month = f_month if f_month is not None else 0.0
    provided_months = months
    months = int(months or 12)
    breakdown = {
        "spotreba_mwh": q_mwh,
        "cena_kc_mwh": p_mwh,
        "staly_mesic_kc": f_month,
        "mesicu": months,
        "celkem_kc": total_kc,
    }

    if q_mwh and p_mwh:
        result = q_mwh * p_mwh + f_month * months
        breakdown["celkem_kc"] = result
        return {"status": "cost", "result_kc": result, "breakdown": breakdown}

    if total_kc and p_mwh:
        variable_part = total_kc - f_month * months
        if variable_part > 0 and p_mwh > 0:
            q_calc = variable_part / p_mwh
            breakdown["spotreba_mwh"] = q_calc
            return {"status": "consumption", "result_kc": total_kc, "breakdown": breakdown}

    missing = []
    if not (q_mwh or total_kc):
        missing.append("roční spotřebu nebo celkovou platbu")
    if not p_mwh:
        missing.append("cenu komodity v Kč/MWh nebo Kč/kWh")
    if provided_months is None:
        missing.append("období v měsících")
    if provided_fixed is None:
        missing.append("stálý měsíční plat")
    return {"status": "need_input", "missing": missing, "breakdown": breakdown}
