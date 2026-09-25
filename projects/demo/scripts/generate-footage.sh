#!/usr/bin/env bash
set -euo pipefail

# macOS: turn the original SVG into a gently moving, silent WebM sample.
root="$(cd "$(dirname "$0")/../../.." && pwd)"
source_svg="$root/projects/demo/assets/images/cover.svg"
output="$root/projects/demo/assets/footage/sample-motion.webm"
compositor="$root/remotion/node_modules/@remotion/compositor-darwin-arm64"

if [[ ! -x "$compositor/ffmpeg" ]]; then
  echo "Run 'npm install' in remotion/ first." >&2
  exit 1
fi

scratch="$(mktemp -d)"
trap 'rm -f "$scratch/cover.png"; rmdir "$scratch"' EXIT
sips -s format png "$source_svg" --out "$scratch/cover.png" >/dev/null
DYLD_LIBRARY_PATH="$compositor" "$compositor/ffmpeg" -hide_banner -loglevel error \
  -loop 1 -framerate 24 -i "$scratch/cover.png" -t 8 \
  -vf 'scale=2048:1152,crop=1920:1080:64+45*sin(n/24):36+24*cos(n/27)' \
  -an -c:v libvpx-vp9 -b:v 0 -crf 38 -pix_fmt yuv420p -y "$output"
echo "$output"
