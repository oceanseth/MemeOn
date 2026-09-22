#!/usr/bin/env bash
# gen.sh NN — generate ONE logo variation on Higgsfield (idempotent).
# Assembles base-prompt.md + variation delta (+ reference clause), submits to
# nano_banana_pro, downloads the PNG and writes 16/32/64/256 previews.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
NN="${1:?usage: gen.sh NN}"
MODEL="${MODEL:-$(jq -r .model "$DIR/variations.json")}"
RES="${RES:-$(jq -r .resolution "$DIR/variations.json")}"
entry="$(jq -c --arg id "$NN" '.variations[] | select(.id==$id)' "$DIR/variations.json")"
[ -n "$entry" ] || { echo "no variation $NN" >&2; exit 2; }
slug="$(jq -r .slug <<<"$entry")"
ref="$(jq -r .ref <<<"$entry")"
out="$DIR/results/$NN-$slug"
mkdir -p "$out"
{
  cat "$DIR/base-prompt.md"
  echo
  jq -r .delta <<<"$entry"
  if [ "$ref" = "true" ]; then echo; cat "$DIR/reference-clause.md"; fi
} > "$out/prompt.txt"

if [ -s "$out/source.png" ]; then
  echo "exists: $out/source.png (skipping generation)"
else
  args=(generate create "$MODEL" --prompt "$(cat "$out/prompt.txt")" --aspect_ratio 1:1 --resolution "$RES" --wait --wait-timeout 10m --json)
  if [ "$ref" = "true" ]; then args+=(--image-references "$(cat "$DIR/reference-upload-id.txt")"); fi
  echo "submitting $NN-$slug to $MODEL ($RES, ref=$ref)"
  higgsfield "${args[@]}" > "$out/job.json"
  url="$(jq -r '[.. | .result_url? // empty] | first // empty' "$out/job.json")"
  if [ -z "$url" ]; then
    id="$(jq -r '[.. | .id? // empty] | first // empty' "$out/job.json")"
    [ -n "$id" ] || { echo "no result_url or id in job.json" >&2; exit 3; }
    higgsfield generate wait "$id" --quiet --timeout 10m >/dev/null || true
    higgsfield generate get "$id" --json > "$out/job.json"
    url="$(jq -r '[.. | .result_url? // empty] | first // empty' "$out/job.json")"
  fi
  [ -n "$url" ] || { echo "job finished without result_url; see $out/job.json" >&2; exit 4; }
  curl -fsSL "$url" -o "$out/source.png"
fi

cd "$out"
magick source.png -filter Lanczos -resize 256x256 preview-256.png
for s in 64 32 16; do
  magick source.png -filter Lanczos -resize "${s}x${s}" "preview-$s.png"
  magick "preview-$s.png" -filter point -resize "$((256 * 100 / s))%" "preview-$s-zoom.png"
done
jq -r '{id: ([.. | .id? // empty] | first), status: ([.. | .status? // empty] | first), job_type: ([.. | .job_type? // empty] | first)}' job.json > meta.json 2>/dev/null || true
echo "ok: $out"
