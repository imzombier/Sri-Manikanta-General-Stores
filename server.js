const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 10000;
const ROOT = __dirname;

app.use(express.static(ROOT, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("manifest.webmanifest")) {
      res.setHeader("Content-Type", "application/manifest+json");
    }
    if (filePath.endsWith("sw.js")) {
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

app.get("*", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`General Store Manager listening on port ${PORT}`);
});
