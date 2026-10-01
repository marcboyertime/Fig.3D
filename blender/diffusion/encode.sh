#!/bin/sh
# Put the transparent Blender frames on the page colour and encode the loop.
#   sh encode.sh frames/ ../../site/assets/diffusion-film
set -e
IN=$1; OUT=$2; FPS=24; POSTER=72
mkdir -p "$OUT"
BG="color=c=0x080a12:s=960x960:r=$FPS"
COMMON="-c:v libx264 -preset slow -pix_fmt yuv420p -profile:v high -movflags +faststart -an -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"
ffmpeg -y -loglevel error -f lavfi -i "$BG" -framerate $FPS -i "$IN/f%04d.png" \
  -filter_complex "[0][1]overlay=shortest=1,format=yuv420p" $COMMON -crf 23 -tune animation "$OUT/diffusion-960.mp4"
ffmpeg -y -loglevel error -f lavfi -i "$BG" -framerate $FPS -i "$IN/f%04d.png" \
  -filter_complex "[0][1]overlay=shortest=1,scale=640:640:flags=lanczos,format=yuv420p" $COMMON -crf 25 -tune animation "$OUT/diffusion-640.mp4"
ffmpeg -y -loglevel error -f lavfi -i "$BG" -framerate $FPS -i "$IN/f%04d.png" \
  -filter_complex "[0][1]overlay=shortest=1,scale=640:640:flags=lanczos,format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -an "$OUT/diffusion-640.webm"
ffmpeg -y -loglevel error -f lavfi -i "$BG" -framerate $FPS -i "$IN/f%04d.png" \
  -filter_complex "[0][1]overlay=shortest=1,format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -an "$OUT/diffusion-960.webm"
ffmpeg -y -loglevel error -f lavfi -i "color=c=0x080a12:s=960x960" -i "$IN/f$(printf %04d $POSTER).png" \
  -filter_complex "[0][1]overlay" -frames:v 1 -c:v libwebp -quality 82 "$OUT/poster.webp"
ls -la "$OUT"
