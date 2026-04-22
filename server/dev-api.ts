import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { handleApiRequest } from "./api-handler";

const port = Number(process.env.LOCAL_API_PORT ?? "8787");

function readBody(req: import("node:http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Missing URL");
    return;
  }

  if (!req.url.startsWith("/api")) {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  const body = await readBody(req);
  const targetUrl = new URL(req.url.replace(/^\/api/, "") || "/", `http://localhost:${port}`);

  const request = new Request(targetUrl, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: body.length > 0 ? body : undefined,
  });

  try {
    const response = await handleApiRequest(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.end(await response.text());
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(port, () => {
  console.log(`Local Prisma API listening on http://localhost:${port}`);
});
