"use server";

import {
  getInstagramUsersListInstagramUsers,
  postInstagramUsersUpdateInstagramUserExtra,
} from "@/api/generated/instagram_users";
import { ok, fail } from "@/actions/internal/action-result";
import { instagramUserFiltersToQuery, withRaw } from "@/utils/instagram-filters";
import { normalizePaging } from "@/utils";
import type {
  InstagramUserFilters,
  ExtraDataRunParams,
  ExtraDataRunItemResult,
} from "@/types/api";
import { createLogger } from "@/lib/logger";
import { fetchProfileExtraData } from "@/app/extra-data/_services/profile-extra-data";

const logger = createLogger("extra-data-actions");

/**
 * 分页查询信息富集后的用户数据
 * @param params.page - 目标页码
 * @param params.page_size - 每页大小
 * @param params.filters - 筛选条件对象
 * @returns 包含 items 和分页信息的响应
 */
export async function listExtraDataUsersAction(params: {
  page: number;
  page_size: number;
  filters?: InstagramUserFilters;
}) {
  try {
    const { page, pageSize } = normalizePaging(params.page, params.page_size);
    const res = await getInstagramUsersListInstagramUsers({
      query: {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        ...instagramUserFiltersToQuery(params.filters),
      },
    });
    const items = (res.items ?? []).map(withRaw);
    return ok({
      items,
      page,
      page_size: pageSize,
      total: res.total ?? 0,
      total_pages: Math.ceil((res.total ?? 0) / pageSize),
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * 启动批量数据富集任务
 * 包含分页拉取、调用 Playwright 抓取单点数据，并写回数据库
 * @param params - 批量富集任务的参数（端口、分页范围、过滤条件等）
 * @returns 富集任务的统计结果
 */
export async function runExtraDataEnrichBatchAction(
  params: ExtraDataRunParams,
) {
  try {
    const { page_size: pageSize, page, filters } = params;
    const offset = (Math.max(1, page) - 1) * Math.max(1, pageSize);

    const res = await getInstagramUsersListInstagramUsers({
      query: { limit: pageSize, offset, ...instagramUserFiltersToQuery(filters) },
    });
    const rows = res.items ?? [];

    const results: ExtraDataRunItemResult[] = [];

    for (const row of rows) {
      const username = String(row.username ?? "").trim();
      if (!username) {
        const errorItem: ExtraDataRunItemResult = {
          id: row.id,
          username: "",
          success: false,
          followers_count: "",
          ip_location: "",
          error: "username 为空",
        };
        logger.warn(
          `[ExtraData Batch] 处理失败: (空用户名 ID=${row.id}) | Error=username 为空`,
        );
        results.push(errorItem);
        continue;
      }

      try {
        const pRes = await fetchProfileExtraData(
          row.id,
          username,
          row.is_private ?? undefined,
        );

        await postInstagramUsersUpdateInstagramUserExtra({
          body: {
            id: row.id,
            followers_count: pRes.followersCount,
            ip_location: pRes.ipLocation || "未知",
            biography: pRes.biography,
          },
        });

        const success = pRes.errors.length === 0 && !!pRes.followersCount;
        const errorMsg =
          pRes.errors.length > 0 ? pRes.errors.join(" ; ") : undefined;

        const resultItem: ExtraDataRunItemResult = {
          id: row.id,
          username,
          success,
          followers_count: pRes.followersCount,
          ip_location: pRes.ipLocation,
          biography: pRes.biography,
          ...(errorMsg && { error: errorMsg }),
        };

        const bioLog = pRes.biography
          ? pRes.biography.length > 20
            ? pRes.biography.substring(0, 20) + "..."
            : pRes.biography
          : "无";
        logger.info(
          `[ExtraData Batch] 处理成功: ${username} | 粉丝数=${pRes.followersCount} | 归属地=${pRes.ipLocation} | 简介=${bioLog} | 错误=${errorMsg || "无"}`,
        );
        results.push(resultItem);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorItem: ExtraDataRunItemResult = {
          id: row.id,
          username,
          success: false,
          followers_count: "",
          ip_location: "",
          error: errorMsg,
        };
        logger.warn(
          `[ExtraData Batch] 处理失败: ${username} | Error=${errorMsg}`,
        );
        results.push(errorItem);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return ok({
      processed: rows.length,
      success: successCount,
      failed: rows.length - successCount,
      output_file: "db://instagram_users",
      items: results,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * 导出信息富集后的用户数据
 * @param params.filters - 筛选条件对象
 * @param params.limit - 导出的最大数量，默认 10000
 * @returns 包含 items 和建议文件名的响应
 */
export async function exportExtraDataAction(params: {
  filters?: InstagramUserFilters;
  limit?: number;
}) {
  try {
    const res = await getInstagramUsersListInstagramUsers({
      query: {
        limit: params.limit ?? 10_000,
        offset: 0,
        ...instagramUserFiltersToQuery(params.filters),
      },
    });
    const items = (res.items ?? []).map(withRaw);
    return ok({ items, file_name: "extra-data-users" });
  } catch (e) {
    return fail(e);
  }
}
