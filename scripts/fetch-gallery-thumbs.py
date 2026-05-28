#!/usr/bin/env python3
"""GAS の getThumbBatch を叩いて Drive サムネ PNG を取得、
sips で JPEG 600px に圧縮して web-tools/gallery-thumbs/{id}.jpg に保存する。

Drive ファイルが「限定共有」で iframe 経由でログイン要求が出る問題を、
同一オリジンの静的ミラーで回避する。
"""
import json
import base64
import subprocess
import urllib.request
import urllib.parse
import pathlib
import sys
import time

GAS_URL = "https://script.google.com/macros/s/AKfycbznw_g7tliRFwN_hhrseunZSoFqiXE3g8hge6e2xEHCUQF2WLRi5fPnAo33aO70T-fSFA/exec"
REPO = pathlib.Path("/Users/koutayamakawa/web-tools")
DATA = REPO / "gallery-data.json"
OUT  = REPO / "gallery-thumbs"
OUT.mkdir(exist_ok=True)
TMP  = pathlib.Path("/tmp/aicare-thumb-fetch")
TMP.mkdir(exist_ok=True)

BATCH = 8  # GAS 6分タイムアウト対策

def fetch_batch(ids):
    url = f"{GAS_URL}?action=getThumbBatch&ids={','.join(ids)}"
    req = urllib.request.Request(url, headers={"User-Agent": "thumb-fetcher"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())

def png_to_jpeg(png_bytes, out_path):
    tmp_png = TMP / "tmp.png"
    tmp_png.write_bytes(png_bytes)
    subprocess.run(
        ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "75",
         "-Z", "600", str(tmp_png), "--out", str(out_path)],
        check=True, capture_output=True
    )

def main():
    data = json.loads(DATA.read_text())
    all_pdfs = [(p["id"], p["name"]) for g in data["gallery"] for p in g["pdfs"]]
    print(f"Total: {len(all_pdfs)}")

    # 既に local Drive 経由で生成済みのものは skip
    todo = [(i, n) for (i, n) in all_pdfs if not (OUT / f"{i}.jpg").exists()]
    print(f"Already cached: {len(all_pdfs) - len(todo)}  /  To fetch: {len(todo)}")

    ok = 0
    miss = 0
    err = 0
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i+BATCH]
        ids = [pid for (pid, _) in chunk]
        names = {pid: n for (pid, n) in chunk}
        print(f"  [{i+1}-{i+len(chunk)}/{len(todo)}] fetching {len(ids)}...", end=" ", flush=True)
        try:
            res = fetch_batch(ids)
        except Exception as e:
            print(f"BATCH FAIL: {e}")
            err += len(ids)
            continue
        thumbs = res.get("thumbs", {})
        for pid in ids:
            t = thumbs.get(pid)
            if not t or t.get("error") or not t.get("b64"):
                miss += 1
                continue
            try:
                png = base64.b64decode(t["b64"])
                png_to_jpeg(png, OUT / f"{pid}.jpg")
                ok += 1
            except Exception as e:
                print(f"\n    JPEG conv failed for {names.get(pid)}: {e}")
                err += 1
        print(f"ok={ok} miss={miss} err={err}")
        time.sleep(0.5)

    print("---")
    print(f"Done. ok={ok} miss={miss} err={err} / total to fetch={len(todo)}")
    print(f"Cache dir: {sum(1 for _ in OUT.iterdir())} files")

if __name__ == "__main__":
    main()
