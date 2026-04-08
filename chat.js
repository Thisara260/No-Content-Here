const { LiveChat } = require("youtube-chat");
const fs = require("fs");

const chat = new LiveChat({
  liveId: process.env.YT_VIDEO_ID
});

let messages = [];

chat.start();

chat.on("chat", (item) => {
  const msg = `${item.author.name}: ${item.message}`;

  messages.push(msg);
  if (messages.length > 5) messages.shift();

  fs.writeFileSync("chat.txt", messages.join("\n"));

  console.log(msg);
});
