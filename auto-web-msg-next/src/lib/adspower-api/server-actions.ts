"use server";

/**
 * 这是一个专供离岸代理请求的服务端 Server Action。
 * 它可以在 Node.js 后端执行真实的 fetch，从而彻底绕过浏览器侧的 CORS 限制。
 */
export async function serverSideFetch(
  fullPath: string,
  method: string,
  headers: Record<string, string>,
  body?: string
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 默认 30s 超时

  try {
    const res = await fetch(fullPath, {
      method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    const status = res.status;
    const ok = res.ok;
    const contentType = res.headers.get("content-type") || "";
    // 将整个 payload 取为字符串，传回给前端解析
    const text = await res.text().catch(() => "");

    return {
      status,
      ok,
      contentType,
      text,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`服务端请求超时 (30s): ${fullPath}`);
    }
    throw new Error(`服务端代理 fetch 失败: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
