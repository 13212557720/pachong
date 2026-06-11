"use server";

/**
 * PostgreSQL 元数据查询模块（Python API 代理）
 */

import type { PgStatusBody, PgColumnInfo, PgTableFilters } from "@/types/api";
import {
  getPgMetaGetPgStatus,
  getPgMetaListPgTables,
  getPgMetaGetPgTableColumns,
  getPgMetaGetPgTableCount,
  getPgMetaGetPgTableRows,
} from "@/api/generated/pg_meta";

function extractKeyword(filters?: PgTableFilters): string {
  if (!filters || typeof filters !== "object") return "";
  for (const val of Object.values(filters)) {
    if (val && typeof val === "object" && "keyword" in val && val.keyword) {
      return String(val.keyword);
    }
  }
  return "";
}

export async function listPgTables(): Promise<string[]> {
  const result = await getPgMetaListPgTables();
  return result?.tables ?? [];
}

export async function getPgStatus(): Promise<PgStatusBody> {
  const result = await getPgMetaGetPgStatus();
  if (!result) {
    return { version: "", active_connections: 0, max_connections: 0, database: "", database_size: "0 bytes" };
  }
  const { version, active_connections, max_connections, database, database_size } = result;
  return { version, active_connections, max_connections, database, database_size };
}

async function getPgTableColumns(table: string): Promise<PgColumnInfo[]> {
  const result = await getPgMetaGetPgTableColumns({ query: { table } });
  return (result?.columns ?? []) as PgColumnInfo[];
}

async function getPgTableCount(table: string, filters?: PgTableFilters): Promise<number> {
  const keyword = extractKeyword(filters);
  const result = await getPgMetaGetPgTableCount({
    query: { table, keyword: keyword || undefined },
  });
  return result?.total ?? 0;
}

async function getPgTableRows(
  table: string,
  page: number,
  pageSize: number,
  filters?: PgTableFilters
): Promise<Record<string, unknown>[]> {
  const keyword = extractKeyword(filters);
  const result = await getPgMetaGetPgTableRows({
    query: {
      table,
      page,
      page_size: pageSize,
      keyword: keyword || undefined,
    },
  });
  return result?.rows ?? [];
}

export async function fetchPgTableData(
  table: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: PgTableFilters
): Promise<import("@/types/api").PgTableDataResult> {
  const safePageSize = pageSize > 0 ? pageSize : 20;
  const safePage = page > 0 ? page : 1;

  const [columns, rows, total] = await Promise.all([
    getPgTableColumns(table),
    getPgTableRows(table, safePage, safePageSize, filters),
    getPgTableCount(table, filters),
  ]);

  const total_pages = Math.max(1, Math.ceil(total / safePageSize));

  return {
    table,
    columns,
    rows,
    total,
    page: safePage,
    page_size: safePageSize,
    total_pages,
  };
}
