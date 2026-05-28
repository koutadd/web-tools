#!/usr/bin/env bash
# build-gallery-thumbs.sh
# gallery-data.json の PDF をローカル Google Drive マウントから探し、
# qlmanage で 1ページ目サムネを生成、sips で 600px JPEG に圧縮して
# web-tools/gallery-thumbs/{id}.jpg に書き出す。
#
# Drive ファイルが共有非公開で iframe ログイン要求が出るので、
# 同一オリジンの静的画像にミラーすることで ORB / 認証を回避する。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_JSON="$REPO_ROOT/gallery-data.json"
OUT_DIR="$REPO_ROOT/gallery-thumbs"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

DRIVE_ROOTS=(
  "/Users/koutayamakawa/Library/CloudStorage/GoogleDrive-koutayamakawa.dd@gmail.com/マイドライブ"
  "/Users/koutayamakawa/Library/CloudStorage/GoogleDrive-koutayamakawa.ddd@gmail.com/マイドライブ"
)

mkdir -p "$OUT_DIR"

# JSON から (id\tname) を 1 行ずつ出す
python3 - <<'PY' > "$TMP_DIR/list.tsv"
import json, sys, pathlib
data = json.loads(pathlib.Path("/Users/koutayamakawa/web-tools/gallery-data.json").read_text())
for g in data["gallery"]:
    for p in g["pdfs"]:
        sys.stdout.write(f"{p['id']}\t{p['name']}\n")
PY

total=$(wc -l < "$TMP_DIR/list.tsv" | tr -d ' ')
echo "Target PDFs: $total"

ok=0; miss=0; fail=0
i=0
while IFS=$'\t' read -r id name; do
  i=$((i+1))
  out="$OUT_DIR/${id}.jpg"
  if [[ -f "$out" ]]; then
    ok=$((ok+1))
    continue
  fi

  # name でローカル Drive を検索
  found=""
  for root in "${DRIVE_ROOTS[@]}"; do
    [[ -d "$root" ]] || continue
    found=$(find "$root" -type f -name "$name" -print -quit 2>/dev/null || true)
    [[ -n "$found" ]] && break
  done

  if [[ -z "$found" ]]; then
    miss=$((miss+1))
    echo "  [$i/$total] MISS  $name"
    continue
  fi

  # qlmanage で PNG, sips で JPEG
  qldir="$TMP_DIR/ql_$i"
  mkdir -p "$qldir"
  if ! qlmanage -t -s 1200 -o "$qldir" "$found" >/dev/null 2>&1; then
    fail=$((fail+1))
    echo "  [$i/$total] FAIL ql $name"
    continue
  fi
  png=$(find "$qldir" -maxdepth 1 -name "*.png" -print -quit)
  if [[ -z "$png" ]]; then
    fail=$((fail+1))
    echo "  [$i/$total] FAIL no-png $name"
    continue
  fi
  if ! sips -s format jpeg -s formatOptions 75 -Z 600 "$png" --out "$out" >/dev/null 2>&1; then
    fail=$((fail+1))
    echo "  [$i/$total] FAIL sips $name"
    continue
  fi
  ok=$((ok+1))
  echo "  [$i/$total] OK    $name"
done < "$TMP_DIR/list.tsv"

echo "---"
echo "Done. ok=$ok miss=$miss fail=$fail / total=$total"
echo "Output dir size: $(du -sh "$OUT_DIR" | cut -f1)"
