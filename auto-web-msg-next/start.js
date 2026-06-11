/**
 * Standalone 启动脚本
 *
 * 功能：
 * 1. 从 3333 开始检测可用端口
 * 2. 若端口占用则自动 +1
 * 3. 设置 PORT 并启动 .next/standalone/server.js
 */
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * 判断端口是否可用。
 *
 * @param {number} port - 目标端口
 * @returns {Promise<boolean>} 端口可用返回 true，否则返回 false
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

/**
 * 从起始端口开始查找可用端口。
 *
 * @param {number} startPort - 起始端口
 * @returns {Promise<number>} 可用端口号
 */
async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port += 1;
  }
  return port;
}

/**
 * 启动 standalone server。
 *
 * @returns {Promise<void>}
 */
async function main() {
  const currentDir = fileURLToPath(new URL(".", import.meta.url));
  const standaloneServerPath = path.resolve(currentDir, "server.js");
  const port = await findAvailablePort(3333);

  process.env.PORT = String(port);
  console.log(`[start.js] using port: ${port}`);
  console.log(`[start.js] server: ${standaloneServerPath}`);

  await import(pathToFileURL(standaloneServerPath).href);
}

main().catch((error) => {
  console.error("[start.js] failed:", error);
  process.exit(1);
});
