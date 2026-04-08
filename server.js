const { exec } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 10000;

// Keep Render alive
http.createServer((req, res) => {
  res.end("24/7 Stream Running 🔴");
}).listen(PORT, () => console.log("Server started"));

// Start chat listener
exec("node chat.js");

// Start stream
exec("bash stream.sh");
