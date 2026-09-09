const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GETIMG_API_KEY = process.env.GETIMG_API_KEY;

app.use(express.json({ limit: "2mb" }));

// index.html находится в КОРНЕ репозитория, а не в /public.
app.use(express.static(__dirname));

const GETIMG_BASE = "https://api.getimg.ai/v1";

async function getimg(pathname, options = {}) {
  if (!GETIMG_API_KEY) {
    throw new Error("GETIMG_API_KEY is not configured in Render Environment Variables.");
  }

  const response = await fetch(`${GETIMG_BASE}${pathname}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GETIMG_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.error ||
      `getimg.ai returned HTTP ${response.status}`;
    throw new Error(String(message));
  }

  return data;
}

app.post("/api/generate-image", async (req, res) => {
  try {
    const {
      prompt,
      model = process.env.DEFAULT_IMAGE_MODEL || "gpt-image-2.5-flare",
      ratio = "1:1",
      resolution = "1024x1024"
    } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const data = await getimg("/images/generations", {
      method: "POST",
      body: JSON.stringify({
        model,
        prompt: String(prompt).trim(),
        aspect_ratio: ratio,
        size: resolution
      })
    });

    res.json(data);
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-video", async (req, res) => {
  try {
    const {
      prompt,
      model = process.env.DEFAULT_VIDEO_MODEL || "wan-3-0",
      ratio = "16:9",
      duration = 5
    } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const data = await getimg("/videos/generations", {
      method: "POST",
      body: JSON.stringify({
        model,
        prompt: String(prompt).trim(),
        aspect_ratio: ratio,
        duration: Number(duration)
      })
    });

    res.json(data);
  } catch (error) {
    console.error("Video generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/video/:id", async (req, res) => {
  try {
    const data = await getimg(`/videos/generations/${encodeURIComponent(req.params.id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    res.json(data);
  } catch (error) {
    console.error("Video status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Для SPA: отдаём корневой index.html.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Nova AI Studio running on port ${PORT}`);
});
