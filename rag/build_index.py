import os, glob, argparse, json, numpy as np
from pypdf import PdfReader
import boto3, re

REG = os.getenv("AWS_REGION","eu-central-1")
EMB_ID = os.getenv("EMBEDDINGS_MODEL_ID","amazon.titan-embed-text-v2:0")
br = boto3.client("bedrock-runtime", region_name=REG)

def chunk_text(t, size=900, overlap=180):
    t = re.sub(r"\s+"," ", t).strip()
    out=[]; i=0
    while i < len(t):
        out.append(t[i:i+size]); i += size - overlap
    return [c for c in out if c]

def load_docs(src):
    docs=[]
    for p in glob.glob(os.path.join(src,"**","*.*"), recursive=True):
        pl = p.lower()
        if pl.endswith((".md",".txt")):
            docs.append((p, open(p,"r",encoding="utf-8",errors="ignore").read()))
        elif pl.endswith(".pdf"):
            try:
                reader = PdfReader(p)
                text = "\n".join([pg.extract_text() or "" for pg in reader.pages])
                docs.append((p, text))
            except Exception as e:
                print("[WARN] PDF:", p, e)
    return docs

def embed_many(chunks):
    vecs=[]
    for c in chunks:
        body = json.dumps({"inputText": c})
        r = br.invoke_model(modelId=EMB_ID, body=body)
        vecs.append(json.loads(r["body"].read())["embedding"])
    V = np.array(vecs, dtype="float32")
    V /= (np.linalg.norm(V, axis=1, keepdims=True) + 1e-9)
    return V

def main(src, out):
    os.makedirs(out, exist_ok=True)
    docs = load_docs(src)
    if not docs: raise SystemExit(f"No docs in {src}")
    chunks=[]
    for _,t in docs: chunks += chunk_text(t)
    V = embed_many(chunks)
    np.savez_compressed(os.path.join(out,"index.npz"), vectors=V, chunks=np.array(chunks, dtype=object))
    print(f"Built {len(chunks)} chunks -> {os.path.join(out,'index.npz')} (Bedrock)")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    main(a.src, a.out)
