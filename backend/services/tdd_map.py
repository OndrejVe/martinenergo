from __future__ import annotations
import os
import unicodedata, re
from pathlib import Path
from typing import Optional, Dict, Any

import pandas as pd  # vyžaduje "pandas" a "openpyxl"

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIRS = [
    PROJECT_ROOT / "rag" / "docs" / "data",
    PROJECT_ROOT / "rag" / "data",
]


def _default_excel_path() -> Path:
    explicit = os.getenv("TDD_XLSX")
    if explicit:
        explicit_path = Path(explicit).expanduser()
        if explicit_path.exists():
            return explicit_path
    for base in DATA_DIRS:
        candidate = base / "D_sazba_TDD vazby.xlsx"
        if candidate.exists():
            return candidate
    return DATA_DIRS[0] / "D_sazba_TDD vazby.xlsx"


EXCEL_PATH = _default_excel_path()


def _norm(s: str) -> str:
    s = (s or "").strip().lower()
    s = "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))
    s = re.sub(r"\s+", " ", s)
    return s


def load_tdd_map(path: Path = EXCEL_PATH) -> Dict[tuple, Dict[str, Any]]:
    if not path.exists():
        return {}
    # vezmeme první list; pokud máš pojmenovaný „Sazby“, dej sheet_name="Sazby"
    df = pd.read_excel(path)
    # tolerantní mapování názvů sloupců
    cols = {_norm(c): c for c in df.columns}
    col_sazba = cols.get("sazba") or cols.get("tarif") or list(df.columns)[0]
    col_tdd = cols.get("tdd") or cols.get("diagram") or list(df.columns)[1]
    col_dist = cols.get("distributor") or cols.get("distribuce")  # volitelný

    out: Dict[tuple, Dict[str, Any]] = {}
    for _, row in df.iterrows():
        sazba = _norm(str(row[col_sazba]))
        tdd = str(row[col_tdd]).strip()
        dist = _norm(str(row[col_dist])) if col_dist else None
        out[(sazba, dist)] = {"sazba": sazba, "tdd": tdd, "distributor": dist, "raw": row.to_dict()}
        # fallback bez distributora
        out.setdefault((sazba, None), {"sazba": sazba, "tdd": tdd, "distributor": None, "raw": row.to_dict()})
    return out


_TDD_MAP = None  # lazy load


def _ensure_loaded():
    global _TDD_MAP
    if _TDD_MAP is None:
        _TDD_MAP = load_tdd_map()


def resolve_tdd(sazba: str, distributor: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Vrátí dict s klíči: sazba, tdd, distributor, raw; nebo None."""
    _ensure_loaded()
    if not _TDD_MAP:
        return None
    key_exact = (_norm(sazba), _norm(distributor) if distributor else None)
    if key_exact in _TDD_MAP:
        return _TDD_MAP[key_exact]
    key_any = (_norm(sazba), None)
    return _TDD_MAP.get(key_any)
