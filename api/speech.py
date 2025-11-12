import re

def tts_prepare(text: str) -> str:
    if not text:
        return "Dobrý den."
    cleaned = re.sub(r"\s+", " ", text).strip()
    replacements = {
        "%": "procent", "kWh": "kilowatthodiny", "MWh": "megawatthodiny", " Kč": " korun",
    }
    for src, dst in replacements.items():
        cleaned = cleaned.replace(src, dst)
    return cleaned
