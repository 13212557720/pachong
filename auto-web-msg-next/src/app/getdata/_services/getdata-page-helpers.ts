import type { ConfigItem } from "@/types/config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseHeaderConfig(
  selectedHeaderKey: string,
  availableHeaders: ConfigItem[]
): { headers: Record<string, string> | null; error?: string } {
  if (!selectedHeaderKey || availableHeaders.length === 0) {
    return { headers: null, error: "没有可用的 Headers 配置" };
  }

  const target = availableHeaders.find((item) => item.key === selectedHeaderKey);
  if (!target) {
    return { headers: null, error: "所选 Headers 配置不存在" };
  }

  try {
    const jsonValue: unknown = typeof target.value === "string" ? JSON.parse(target.value) : target.value;
    if (!isRecord(jsonValue)) {
      return { headers: null, error: "Headers 配置必须是 JSON 对象" };
    }

    // 如果这个 JSON 来源于 extraDataTemplates（拥有 following 对象），则提取 following.headers
    let rawHeaders: Record<string, unknown> = {};
    if ("following" in jsonValue) {
      const following = jsonValue.following;
      if (isRecord(following) && isRecord(following.headers)) {
        rawHeaders = following.headers;
      }
    } else {
      // 兼容老的数据结构（直接包含 headers 键值对）
      rawHeaders = jsonValue as Record<string, unknown>;
    }

    return {
      headers: Object.fromEntries(
        Object.entries(rawHeaders).map(([key, value]) => [
          String(key),
          String(value ?? ""),
        ])
      ),
    };
  } catch {
    return { headers: null, error: "Headers JSON 格式无效" };
  }
}
