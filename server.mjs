import { exec } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 8080);

const MIME_BY_EXT = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
]);

const openBrowser = (url) => {
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(command, () => {});
};

const safeResolve = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const requested = normalized === path.sep || normalized === "." ? "/index.html" : normalized;
  const filePath = path.resolve(ROOT, `.${requested}`);
  const allowedRoot = `${ROOT}${path.sep}`;
  if (filePath !== ROOT && !filePath.startsWith(allowedRoot)) {
    return null;
  }
  return filePath;
};

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  let filePath = safeResolve(requestUrl.pathname);

  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT.get(ext) || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, max-age=0",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`SERVER_READY ${url}`);
  console.log("[run] Ctrl+C to stop.");
  openBrowser(url);
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`[run] Port ${PORT} is busy. Use PORT=8081 node server.mjs`);
    process.exit(1);
  }
  console.error("[run] Failed to start server:", error);
  process.exit(1);
});
