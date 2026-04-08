async function loadPlaylist() {
  const res = await fetch("/playlist");
  const data = await res.json();

  const container = document.getElementById("mediaList");
  const current = document.getElementById("currentMedia");
  current.textContent = data.current || "No media";

  container.innerHTML = "";
  data.playlist.forEach(media => {
    const btn = document.createElement("button");
    btn.textContent = media;
    btn.onclick = async () => {
      await fetch("/change-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media })
      });
      loadPlaylist();
    };
    container.appendChild(btn);
  });
}

loadPlaylist();
