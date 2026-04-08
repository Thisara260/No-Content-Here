#!/bin/bash

STREAM_KEY=$YT_STREAM_KEY

# install fonts (safe)
apt-get update -y
apt-get install -y fonts-dejavu

while true
do
  FILE=$(ls *.mp3 | shuf -n 1)

  TITLE=$(echo "$FILE" | sed 's/_/ /g' | sed 's/.mp3//')

  echo "Now Playing: $TITLE" > now.txt

  echo "Streaming: $TITLE"

  ffmpeg -re -stream_loop -1 -i background.mp4 -i "$FILE" \
  -filter_complex "\
  drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=now.txt:reload=1:fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h-80:box=1:boxcolor=black@0.5,\
  drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=chat.txt:reload=1:fontcolor=white:fontsize=24:x=w-400:y=50:box=1:boxcolor=black@0.5" \
  -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k \
  -pix_fmt yuv420p -g 50 \
  -c:a aac -b:a 160k \
  -shortest \
  -f flv rtmp://a.rtmp.youtube.com/live2/$STREAM_KEY

done
