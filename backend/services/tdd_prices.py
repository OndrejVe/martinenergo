from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, Optional, Tuple

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIRS = [
    PROJECT_ROOT / "rag" / "docs" / "data",
    PROJECT_ROOT / "rag" / "data",
]
PRICE_FILENAME = "tddskutecne_2024_15min.xlsx"


def _candidate_paths(path_override: Optional[str] = None):
    if path_override:
        yield Path(path_override).expanduser()
    env_path = os.getenv("TDD_PRICES_XLSX")
    if env_path:
        yield Path(env_path).expanduser()
    for base in DATA_DIRS:
        yield base / PRICE_FILENAME


def _resolve_price_path(path_override: Optional[str] = None) -> Path:
    for candidate in _candidate_paths(path_override):
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        f"Soubor s TDD cenami ({PRICE_FILENAME}) nebyl nalezen v žádném z očekávaných umístění."
    )


def _is_tdd_column(name: str) -> bool:
    return isinstance(name, str) and name.upper().startswith("TDD")


def _base_tdd(label: str) -> str:
    return str(label).split()[0].upper()


def _prepare_dataframe(path: Path) -> Tuple[pd.DataFrame, list[str]]:
    df = pd.read_excel(path, sheet_name="koef TDD", header=1)
    df = df.rename(
        columns={
            df.columns[0]: "datetime",
            "mesic": "month",
            "Cena DA": "spot_price",
        }
    )
    df["spot_price"] = pd.to_numeric(df["spot_price"], errors="coerce")
    df["month"] = pd.to_numeric(df["month"], errors="coerce")
    df = df.dropna(subset=["spot_price", "month"])
    df["month"] = df["month"].astype(int)
    tdd_cols = [col for col in df.columns if _is_tdd_column(col)]
    if not tdd_cols:
        raise ValueError("V sešitě nebyly nalezeny žádné TDD sloupce.")
    for col in tdd_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    return df, tdd_cols


def _aggregate_prices(frame: pd.DataFrame, tdd_cols: list[str]) -> Dict[str, float]:
    price_series = frame["spot_price"]
    buckets: Dict[str, Dict[str, float]] = {}
    for col in tdd_cols:
        weights = frame[col]
        weight_sum = float(weights.sum())
        if weight_sum <= 0:
            continue
        cost_sum = float((weights * price_series).sum())
        base = _base_tdd(col)
        bucket = buckets.setdefault(base, {"weight": 0.0, "cost": 0.0})
        bucket["weight"] += weight_sum
        bucket["cost"] += cost_sum
    return {
        base: bucket["cost"] / bucket["weight"]
        for base, bucket in buckets.items()
        if bucket["weight"]
    }


@lru_cache(maxsize=4)
def load_tdd_price_summary(path_override: Optional[str] = None) -> Dict[str, Dict]:
    """
    Vrátí slovník se dvěma úrovněmi agregace:
      - ``year``: vážené průměrné ceny (Kč/MWh) pro každé TDD za celý rok
      - ``monthly``: totéž po jednotlivých měsících (1–12)
    """
    path = _resolve_price_path(path_override)
    frame, tdd_cols = _prepare_dataframe(path)
    yearly = _aggregate_prices(frame, tdd_cols)
    monthly = {
        int(month): _aggregate_prices(group, tdd_cols)
        for month, group in frame.groupby("month")
    }
    return {"path": str(path), "year": yearly, "monthly": monthly}


def get_yearly_tdd_prices(path_override: Optional[str] = None) -> Dict[str, float]:
    """Snadno dostupná mapovací funkce (TDD -> Kč/MWh)."""
    summary = load_tdd_price_summary(path_override)
    return dict(summary.get("year", {}))


def get_monthly_tdd_prices(path_override: Optional[str] = None) -> Dict[int, Dict[str, float]]:
    """Vrací přehled cen pro jednotlivé měsíce (1–12)."""
    summary = load_tdd_price_summary(path_override)
    return dict(summary.get("monthly", {}))


__all__ = ["get_yearly_tdd_prices", "get_monthly_tdd_prices", "load_tdd_price_summary"]
