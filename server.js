const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.json());

const YT_STREAM_KEY = process.env.YT_STREAM_KEY;
const YT_URL = `rtmp://a.rtmp.youtube.com/live2/${YT_STREAM_KEY}`;

let playlist = [];
let currentIndex = 0;
let ffmpegProcess;

// Load all media files
function loadPlaylist() {
  const files = fs.readdirSync(path.join(__dirname, "media"))
    .filter(f => f.endsWith(".mp4") || f.endsWith(".mp3"))
    .map(f => path.join(__dirname, "media", f));
  playlist = files;
}
loadPlaylist();

// Start FFmpeg for current media
function streamMedia(filePath) {
  if (!YT_STREAM_KEY) {
    console.error("Set YT_STREAM_KEY in environment variables!");
    return;
  }

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
    console.log("Media ended, playing next...");
    playNext();
  });
}

// Play next in playlist
function playNext() {
  currentIndex = (currentIndex + 1) % playlist.length;
  streamMedia(playlist[currentIndex]);
}

// Start streaming first media
function startStreaming() {
  if (playlist.length === 0) return console.error("No media files found!");
  streamMedia(playlist[currentIndex]);
}

// Dashboard APIs
app.get("/playlist", (req, res) => {
  res.json({ playlist: playlist.map(p => path.basename(p)), current: path.basename(playlist[currentIndex]) });
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

app.listen(PORT, () => {
  console.log(`Playlist Dashboard running on port ${PORT}`);
  startStreaming();
});
