
import os
import re
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import requests
from fastapi import Body, FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.chat_handler import lambda_handler, compute_tariff_stats
from api.tts import synthesize

PROJECT_ROOT = Path(__file__).resolve().parent
STATIC_DIR = PROJECT_ROOT
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
FRONTEND_DIST = FRONTEND_ROOT / "EnergySageAI" / "dist" / "public"
UPLOAD_DIR = PROJECT_ROOT / "uploads"
WEB_DIR = PROJECT_ROOT / "web"
UPLOAD_DIR.mkdir(exist_ok=True)
WEB_DIR.mkdir(exist_ok=True)
FRONTEND_ROOT.mkdir(exist_ok=True)
FRONTEND_SERVE_DIR = FRONTEND_DIST if FRONTEND_DIST.exists() else FRONTEND_ROOT

HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
HEYGEN_AVATAR_ID = os.getenv("HEYGEN_AVATAR_ID", "Anna_public_3_20240108")
HEYGEN_VOICE_ID = os.getenv("HEYGEN_VOICE_ID", "1bd001e7e50f421d891986aad5158bc8")

CHAT_MESSAGES: List[Dict] = []
CONTACTS: List[Dict] = []

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/web", StaticFiles(directory=WEB_DIR, html=True), name="web")


def _chart_to_calculation(chart: Dict | None):
    if not chart or not isinstance(chart, dict):
        return None
    meta = chart.get("meta") or {}
    consumption = meta.get("consumption_mwh")
    if consumption is None:
        match = re.search(r"(\d+(?:[\.,]\d+)?)\s*MWh", chart.get("title", ""))
        if match:
            consumption = float(match.group(1).replace(",", "."))
    if not consumption:
        return None
    data = chart.get("data") or []
    if len(data) < 2:
        return None
    fix_total, spot_total = data[0], data[1]
    denom = consumption * 1000.0 or 1
    result = {
        "averagePricePerKWh": round(spot_total / denom, 4),
        "totalCostPerYear": round(spot_total, 2),
        "input": {
            "tddCode": meta.get("tdd", "TDD5"),
            "yearlyConsumption": int(consumption * 1000),
            "year": meta.get("year", datetime.now().year),
        },
    }
    comparison = {
        "fixedPrice": round(fix_total / denom, 4),
        "savingsPerYear": round(fix_total - spot_total, 2),
        "savingsPercentage": round(((fix_total - spot_total) / fix_total) * 100, 2) if fix_total else 0,
        "isSpotCheaper": fix_total > spot_total,
    }
    return {"result": result, "comparison": comparison}


def _record_message(payload: Dict):
    entry = {
        "sessionId": payload.get("sessionId"),
        "role": payload.get("role"),
        "content": payload.get("content"),
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    CHAT_MESSAGES.append(entry)
    return entry


def _save_contact(payload: Dict):
    entry = {**payload, "createdAt": datetime.utcnow().isoformat() + "Z"}
    CONTACTS.append(entry)
    return entry


def _ensure_heygen_key() -> str:
    if not HEYGEN_API_KEY:
        raise HTTPException(status_code=500, detail="HEYGEN_API_KEY není nastaven")
    return HEYGEN_API_KEY


def _heygen_request(method: str, url: str, payload: Dict | None = None):
    key = _ensure_heygen_key()
    headers = {"x-api-key": key}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(method, url, headers=headers, json=payload, timeout=30)
    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@app.post("/chat")
async def chat(req: Request):
    body = await req.json()
    event = {"body": json.dumps(body)}
    resp = lambda_handler(event, None)
    return json.loads(resp["body"])


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    dest = UPLOAD_DIR / file.filename
    with dest.open("wb") as fh:
        fh.write(data)
    rel_path = dest.relative_to(PROJECT_ROOT)
    return {"saved_as": str(rel_path), "url": f"/static/{rel_path.as_posix()}"}


@app.post("/speak")
async def speak(payload: dict = Body(...)):
    text = (payload or {}).get("text", "").strip()
    if not text:
        return {"ok": False, "error": "Prázdný text"}
    return synthesize(text)


@app.post("/api/ai/chat")
async def api_ai_chat(payload: dict = Body(...)):
    message = (payload or {}).get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    event = {"body": json.dumps({"q": message})}
    resp = lambda_handler(event, None)
    body = json.loads(resp["body"])
    chart = body.get("chart")
    data = {
        "response": body.get("answer", ""),
        "context": body.get("sources", []),
        "hasContext": bool(body.get("sources")),
        "showLeadForm": bool(chart),
        "calculationResult": _chart_to_calculation(chart),
        "chart": chart,
    }
    return {"success": True, "data": data}


@app.post("/api/messages")
def save_message(payload: dict = Body(...)):
    if not payload.get("sessionId"):
        raise HTTPException(status_code=400, detail="sessionId is required")
    entry = _record_message(payload)
    return {"success": True, "data": entry}


@app.get("/api/messages/{session_id}")
def get_messages(session_id: str):
    items = [m for m in CHAT_MESSAGES if m.get("sessionId") == session_id]
    return {"success": True, "data": items}


@app.get("/api/messages")
def list_messages():
    return {"success": True, "data": CHAT_MESSAGES[-100:]}


@app.post("/api/contacts")
def create_contact(payload: dict = Body(...)):
    if not payload.get("email"):
        raise HTTPException(status_code=400, detail="email je povinný")
    entry = _save_contact(payload)
    return {"success": True, "data": entry}


@app.get("/api/contacts")
def list_contacts():
    return {"success": True, "data": CONTACTS}


@app.post("/api/calculate")
def calculate_spot(payload: dict = Body(...)):
    tdd = payload.get("tddCode") or payload.get("sazba") or "D25D"
    yearly = float(payload.get("yearlyConsumption") or 0)
    year = int(payload.get("year") or datetime.now().year)
    fixed_price = payload.get("fixedPrice")
    stats = compute_tariff_stats(tdd, yearly / 1000.0, fixed_price)
    denom = stats["consumption_mwh"] * 1000.0 or 1
    result = {
        "averagePricePerKWh": round(stats["spot_price_per_mwh"] / 1000.0, 4),
        "totalCostPerYear": round(stats["spot_total"], 2),
        "input": {
            "tddCode": stats["sazba"],
            "yearlyConsumption": int(yearly or stats["consumption_mwh"] * 1000),
            "year": year,
        },
    }
    comparison = {
        "fixedPrice": round(stats["fix_price_per_mwh"] / 1000.0, 4),
        "savingsPerYear": round(stats["fix_total"] - stats["spot_total"], 2),
        "savingsPercentage": round(((stats["fix_total"] - stats["spot_total"]) / stats["fix_total"]) * 100, 2) if stats["fix_total"] else 0,
        "isSpotCheaper": stats["fix_total"] > stats["spot_total"],
    }
    return {"success": True, "data": {"result": result, "comparison": comparison}}


@app.post("/api/tts")
async def api_tts(payload: dict = Body(...)):
    text = (payload or {}).get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text je povinný")
    return synthesize(text)


@app.get("/api/avatar/list")
def avatar_list():
    data = _heygen_request("GET", "https://api.heygen.com/v2/avatars")
    avatars = data.get("data", {}).get("avatars", [])
    streaming = [a for a in avatars if a.get("is_streaming") or a.get("avatar_type") == "streaming" or a.get("preview_video_url")]
    return {"success": True, "data": {"total": len(avatars), "streaming_count": len(streaming), "all": avatars[:20], "streaming": streaming[:20]}}


@app.get("/api/avatar/session")
def avatar_session():
    payload = {
        "quality": "high",
        "avatar_name": HEYGEN_AVATAR_ID,
        "voice": {"voice_id": HEYGEN_VOICE_ID},
    }
    data = _heygen_request("POST", "https://api.heygen.com/v1/streaming.new", payload)
    return {"success": True, "data": data.get("data", data)}


@app.post("/api/avatar/start")
def avatar_start(payload: dict = Body(...)):
    if not payload.get("sessionId") or not payload.get("sdp"):
        raise HTTPException(status_code=400, detail="sessionId a sdp jsou povinné")
    data = _heygen_request(
        "POST",
        "https://api.heygen.com/v1/streaming.start",
        {"session_id": payload["sessionId"], "sdp": payload["sdp"]},
    )
    return {"success": True, "data": data}


@app.post("/api/avatar/speak")
def avatar_speak(payload: dict = Body(...)):
    if not payload.get("sessionId") or not payload.get("text"):
        raise HTTPException(status_code=400, detail="sessionId a text jsou povinné")
    data = _heygen_request(
        "POST",
        "https://api.heygen.com/v1/streaming.task",
        {
            "session_id": payload["sessionId"],
            "text": payload["text"],
            "task_type": payload.get("taskType", "repeat"),
        },
    )
    return {"success": True, "data": data}


@app.post("/api/avatar/ice")
def avatar_ice(payload: dict = Body(...)):
    session_id = payload.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId je povinný")
    candidate = payload.get("candidate")
    sdp = payload.get("sdp")
    if not candidate and not sdp:
        raise HTTPException(status_code=400, detail="candidate nebo sdp je povinné")
    data = _heygen_request(
        "POST",
        "https://api.heygen.com/v1/streaming.ice",
        {k: v for k, v in {"session_id": session_id, "candidate": candidate, "sdp": sdp}.items() if v},
    )
    return {"success": True, "data": data}


@app.post("/api/avatar/stop")
def avatar_stop(payload: dict = Body(...)):
    session_id = payload.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId je povinný")
    data = _heygen_request(
        "POST",
        "https://api.heygen.com/v1/streaming.stop",
        {"session_id": session_id},
    )
    return {"success": True, "data": data}


# Mount frontend last so that /api routes stay accessible
app.mount("/", StaticFiles(directory=FRONTEND_SERVE_DIR, html=True), name="frontend")
