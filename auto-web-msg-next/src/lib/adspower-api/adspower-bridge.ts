/**
 * AdsPower Bridge
 *
 * 封装 AdsPower Local API 的核心操作，端点统一从配置文件读取。
 * 供 browser-actions.ts 调用，不对外暴露 ApiClient 细节。
 */

import { getDeviceClient } from "./client";
import { getAdsPowerEndpoint } from "@/actions/internal/config-file";
import "./generated/v2";
import "./generated/v2";
import type { GetV1UserListResponse, GetV1BrowserActiveResponse } from "./generated/v1";

export type AdsPowerActiveData = NonNullable<GetV1BrowserActiveResponse["data"]>;
export type AdsPowerProfile = NonNullable<NonNullable<GetV1UserListResponse["data"]>["list"]>[number];

function getClient(endpoint?: string) {
  return getDeviceClient(endpoint || getAdsPowerEndpoint());
}

/**
 * 获取配置文件列表（来自 AdsPower /api/v1/user/list）
 */
export async function listAdsPowerProfiles(args?: {
  page?: number;
  pageSize?: number;
  groupId?: string;
  endpoint?: string;
}): Promise<AdsPowerProfile[]> {
  const client = getClient(args?.endpoint);
  const query: Record<string, string> = {
    page: String(args?.page ?? 1),
    page_size: String(args?.pageSize ?? 100),
  };
  if (args?.groupId && args.groupId !== "all") {
    query.group_id = args.groupId;
  }
  const res = await client.getV1UserList({ query });
  if (res.code !== 0) throw new Error(res.msg || "获取列表失败");
  return res.data?.list || [];
}

