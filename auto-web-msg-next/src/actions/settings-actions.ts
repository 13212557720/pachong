"use server";

import { ok, fail } from "@/actions/internal/action-result";
import { readConfig, writeConfig, getActiveToken, hasToken } from "@/actions/internal/config-file";
import type { SimpleConfig } from "@/types/config";

const BASE_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

/** 检查 token 是否为超级密钥（可访问 token 管理接口） */
export async function checkIsSuperKey(token: string): Promise<boolean | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/token/getTokenList`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok)             return true;
    if (res.status === 403) return false;
    if (res.status === 401) return false;
    return null;
  } catch { return null; }
}

/**
 * 获取当前服务端的 JSON 配置
 * @returns 完整的配置文件对象
 */
export async function getServerConfigAction() {
  try { return ok(readConfig()); }
  catch (e) { return fail(e); }
}

/**
 * 全量保存服务端的 JSON 配置
 * @param config - 完整的配置对象
 */
export async function saveServerConfigAction(config: SimpleConfig) {
  try { writeConfig(config); return ok<void>(undefined); }
  catch (e) { return fail(e); }
}



/**
 * 检查当前是否有配置并激活了 Token
 * @returns 布尔值，表示是否有 Token
 */
export async function checkHasTokenAction() {
  try { return ok(hasToken()); }
  catch (e) { return fail(e); }
}

/**
 * 检查当前激活的 Token 是否拥有超级管理员权限
 * @returns true(是), false(否), null(未知或请求失败)
 */
export async function checkIsSuperKeyAction() {
  try {
    const token = getActiveToken();
    if (!token) return ok<boolean | null>(false);
    return ok(await checkIsSuperKey(token));
  } catch (e) { return fail(e); }
}

// ─── Token 管理 Actions（供 TokenAdmin.tsx 调用，取代客户端直接 fetch）───

import {
  getTokenGetTokenList,
  postTokenCreateToken,
  postTokenDeleteToken,
  postTokenUpdateToken,
} from "@/api/generated/token";

/** 
 * 获取所有 Token 列表
 * @returns Token 列表数据
 */
export async function listTokensAction() {
  try { return ok(await getTokenGetTokenList()); }
  catch (e) { return fail(e); }
}

/** 
 * 创建新的 Token
 * @param body.remark - 备注信息
 * @param body.valid_days - 有效天数
 * @param body.username - 关联的用户名
 * @returns 创建成功的 Token 数据
 */
export async function createTokenAction(body: { remark?: string; valid_days?: number; username?: string }) {
  try { return ok(await postTokenCreateToken({ body })); }
  catch (e) { return fail(e); }
}

/** 
 * 删除指定的 Token
 * @param tokenId - 要删除的 Token ID
 * @returns 包含状态消息的响应
 */
export async function deleteTokenAction(tokenId: string) {
  try { return ok(await postTokenDeleteToken({ body: { token_id: tokenId } })); }
  catch (e) { return fail(e); }
}

/** 
 * 更新指定 Token 的黑名单状态
 * @param tokenId - 目标 Token ID
 * @param isBlacklisted - 是否拉入黑名单
 * @returns 更新后的 Token 数据
 */
export async function updateTokenAction(tokenId: string, isBlacklisted: boolean) {
  try { return ok(await postTokenUpdateToken({ body: { token_id: tokenId, is_blacklisted: isBlacklisted } })); }
  catch (e) { return fail(e); }
}
