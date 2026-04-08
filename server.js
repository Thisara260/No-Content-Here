const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 8080;
const YT_STREAM_KEY = process.env.YT_STREAM_KEY;
const YT_URL = `rtmp://a.rtmp.youtube.com/live2/fbqz-xzx2-zpvm-7fbp-74j3`;

let playlist = [];
let currentIndex = 0;
let ffmpegProcess;

app.use(express.static("public"));
app.use(bodyParser.json());

// Load media files
function loadPlaylist() {
  const mediaPath = path.join(__dirname, "media");
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath);
    console.log("Created /media folder. Add media files to start streaming!");
  }

  playlist = fs.readdirSync(mediaPath)
    .filter(f => f.endsWith(".mp4") || f.endsWith(".mp3"))
    .map(f => path.join(mediaPath, f));

  if (playlist.length === 0) console.warn("No media files found in /media!");
}

// Start streaming a file via FFmpeg
function streamMedia(filePath) {
  if (!YT_STREAM_KEY) {
    console.error("Set YT_STREAM_KEY environment variable!");
    return;
  }

  console.log("Streaming:", path.basename(filePath));

  ffmpegProcess = spawn("ffmpeg", [
    "-re",
    "-i", filePath,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-b:v", "3000k",
    "-maxrate", "3000k",
    "-bufsize", "6000k",
    "-pix_fmt", "yuv420p",
    "-g", "50",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "44100",
    "-f", "flv",
    YT_URL
  ]);

  ffmpegProcess.stdout.on("data", data => console.log(`FFmpeg: ${data}`));
  ffmpegProcess.stderr.on("data", data => console.log(`FFmpeg Error: ${data}`));
  ffmpegProcess.on("close", () => {
    playNext();
  });
}

// Play next media in playlist
function playNext() {
  currentIndex = (currentIndex + 1) % playlist.length;
  streamMedia(playlist[currentIndex]);
}

// Dashboard APIs
app.get("/playlist", (req, res) => {
  res.json({
    playlist: playlist.map(f => path.basename(f)),
    current: playlist.length ? path.basename(playlist[currentIndex]) : null
  });
});

app.post("/change-media", (req, res) => {
  const { media } = req.body;
  const mediaPath = path.join(__dirname, "media", media);
  if (fs.existsSync(mediaPath)) {
    currentIndex = playlist.indexOf(mediaPath);
    if (ffmpegProcess) ffmpegProcess.kill("SIGINT");
    streamMedia(mediaPath);
    return res.json({ status: "success" });
  }
  res.status(400).json({ status: "error", message: "Media not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dashboard running on port ${PORT}`);
  loadPlaylist();
  if (playlist.length) streamMedia(playlist[currentIndex]);
});
