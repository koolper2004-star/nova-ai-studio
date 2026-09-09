import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GETIMG_API_KEY || "";
const IMAGE_MODEL = process.env.DEFAULT_IMAGE_MODEL || "gpt-image-2.5-flare";
const VIDEO_MODEL = process.env.DEFAULT_VIDEO_MODEL || "wan-3-0";

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/api/config", (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(API_KEY),
    defaultImageModel: IMAGE_MODEL,
    defaultVideoModel: VIDEO_MODEL
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(API_KEY) });
});

function requireKey(res) {
  if (!API_KEY) {
    res.status(500).json({
      error: "GETIMG_API_KEY is not configured. Add it in Render Environment Variables."
    });
    return false;
  }
  return true;
}

async function getimg(path, options = {}) {
  const response = await fetch(`https://api.getimg.ai${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.error || `getimg.ai HTTP ${response.status}`;
    throw new Error(String(message));
  }
  return data;
}

app.post("/api/generate/image", async (req, res) => {
  if (!requireKey(res)) return;
  try {
    const {
      prompt,
      model = IMAGE_MODEL,
      aspect_ratio = "1:1",
      resolution = "1024"
    } = req.body || {};

    if (!prompt?.trim()) return res.status(400).json({ error: "Prompt is required." });

    const data = await getimg("/v1/images/generations", {
      method: "POST",
      body: JSON.stringify({
        model,
        prompt: prompt.trim(),
        aspect_ratio,
        resolution,
        output_format: "png"
      })
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate/video", async (req, res) => {
  if (!requireKey(res)) return;
  try {
    const {
      prompt,
      model = VIDEO_MODEL,
      aspect_ratio = "16:9",
      resolution = "720p",
      duration = 5
    } = req.body || {};

    if (!prompt?.trim()) return res.status(400).json({ error: "Prompt is required." });

    const data = await getimg("/v1/videos/generations", {
      method: "POST",
      body: JSON.stringify({
        model,
        prompt: prompt.trim(),
        aspect_ratio,
        resolution,
        duration: Number(duration)
      })
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/generate/video/:id", async (req, res) => {
  if (!requireKey(res)) return;
  try {
    const data = await getimg(`/v1/videos/generations/${encodeURIComponent(req.params.id)}`, {
      method: "GET",
      headers: { "Content-Type": undefined }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(PORT, () => {
  console.log(`Nova AI Studio running on port ${PORT}`);
});