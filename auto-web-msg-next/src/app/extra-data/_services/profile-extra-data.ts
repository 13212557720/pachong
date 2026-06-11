import { getExtraDataTemplate } from "@/actions/internal/config-file";
import { createLogger } from "@/lib/logger";

const logger = createLogger("profile-extra-data");

export interface ProfileExtraDataResult {
  followersCount: string;
  ipLocation: string;
  biography: string;
  errors: string[];
}

/**
 * 将模板中的 body 对象转为 URL-encoded 字符串，同时替换占位符
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBodyParams(bodyObj: Record<string, any>, targetUserId: string): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(bodyObj)) {
    let val: string;
    if (typeof v === "object" && v !== null) {
      val = JSON.stringify(v).replace(/\{\{TARGET_USER_ID\}\}/g, targetUserId);
    } else {
      val = String(v).replace(/\{\{TARGET_USER_ID\}\}/g, targetUserId);
    }
    params.append(k, val);
  }
  return params.toString();
}

/** 剔除 content-length，让 fetch 根据实际 body 自动计算 */
function cleanHeaders(headers: Record<string, string>, extra?: Record<string, string>): Record<string, string> {
  const merged = { ...headers, ...extra };
  delete merged["content-length"];
  return merged;
}

/**
 * 使用预存模板直连 Instagram 获取额外数据
 *
 * @param targetUserId 目标账号数字 ID
 * @param username 目标账号用户名
 * @param isPrivateFromData 私密账号标记
 * @returns 抓取结果
 */
export async function fetchProfileExtraData(
  targetUserId: string,
  username: string,
  isPrivateFromData?: boolean
): Promise<ProfileExtraDataResult> {
  const logPrefix = `[extra-data][${username}]`;
  const errors: string[] = [];

  try {
    logger.info(`${logPrefix} 开始抓取, id=${targetUserId}, is_private=${String(isPrivateFromData)}`);

    const template = getExtraDataTemplate();
    if (!template?.graphql || !template?.wbloks) {
      throw new Error("未找到额外数据发包模板，请先使用 '提取参数模板' 功能");
    }

    let followersCount = "";
    let biography = "";
    let ipLocation = "未知";

    const referer = `https://www.instagram.com/${username}/`;

    // 1. 获取 GraphQL 数据 (粉丝数、简介)
    try {
      const gHeaders = cleanHeaders(template.graphql.headers, { "Referer": referer });
      const gBody = buildBodyParams(template.graphql.body, targetUserId);

      const gRes = await fetch("https://www.instagram.com/graphql/query", {
        method: template.graphql.method || "POST",
        headers: gHeaders,
        body: gBody,
        cache: "no-store",
      });

      if (!gRes.ok) {
        errors.push(`graphql request error: ${gRes.status} ${gRes.statusText}`);
      } else {
        const json = await gRes.json();
        const user = json?.data?.user;
        if (user) {
          followersCount = user.follower_count != null ? String(user.follower_count) : "";
          biography = user.biography ?? "";
          logger.debug(`${logPrefix} GraphQL 成功: followers=${followersCount}`);
        } else {
          errors.push("graphql: 未从 PolarisProfilePageContentQuery 中解析到 user 对象");
        }
      }
    } catch (err) {
      errors.push(`graphql request failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (isPrivateFromData === true && !followersCount) {
      errors.push("followers: is_private=true 从 GraphQL 获取粉丝数失败");
      return { followersCount, ipLocation: "未知", biography, errors };
    }

    // 2. 获取 IP 属地 (wbloks) - 仅当可能是公开账号时
    if (isPrivateFromData !== true) {
      try {
        const wHeaders = cleanHeaders(template.wbloks.headers, { "Referer": referer });
        const wBody = buildBodyParams(template.wbloks.body, targetUserId);
        const bkv = template.wbloks.bkv || "ad0f1f5e41c2d9fcde83dfd68eea4def768b66bc3029c58e846d7c1dda44ba2a";

        const wRes = await fetch(`https://www.instagram.com/async/wbloks/fetch/?appid=com.bloks.www.ig.about_this_account&type=app&__bkv=${bkv}`, {
          method: template.wbloks.method || "POST",
          headers: wHeaders,
          body: wBody,
          cache: "no-store",
        });

        if (!wRes.ok) {
          errors.push(`wbloks request error: ${wRes.status} ${wRes.statusText}`);
        } else {
          const text = await wRes.text();
          const jsonText = text.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, "");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any = JSON.parse(jsonText);
          
          const items = data?.payload?.layout?.bloks_payload?.data || [];
          for (const item of items) {
            if (item?.data?.initial && typeof item.data.initial === "string") {
              ipLocation = item.data.initial;
              logger.debug(`${logPrefix} wBloks 成功: ipLocation=${ipLocation}`);
              break;
            }
          }
          if (ipLocation === "未知") {
            errors.push("ip_location: 从 about_this_account 响应中未找到属地文本");
          }
        }
      } catch (err) {
        errors.push(`ip_location request failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      followersCount,
      ipLocation,
      biography,
      errors,
    };
  } catch (e) {
    errors.push(`fetchProfileExtraData exception: ${e instanceof Error ? e.message : String(e)}`);
    return { followersCount: "", ipLocation: "未知", biography: "", errors };
  }
}
