// 脚本自动生成，不要手动修改
import { request } from '@/api/client'
import type { paths } from './schemas'
import type { JsonResponse } from './helpers'

/** 获取PostgreSQL状态 */
export type GetPgMetaGetPgStatusResponse = JsonResponse<'/api/v1/pg_meta/getPgStatus', 'get'>
export async function getPgMetaGetPgStatus() {
  const response = await request<GetPgMetaGetPgStatusResponse>({
    method: 'get',
    url: '/pg_meta/getPgStatus',
  })
  return response.data
}

/** 获取表列信息 */
export type GetPgMetaGetPgTableColumnsQuery = paths['/api/v1/pg_meta/getPgTableColumns']['get']['parameters']['query']
export interface GetPgMetaGetPgTableColumnsArgs {
  query?: GetPgMetaGetPgTableColumnsQuery
}
export type GetPgMetaGetPgTableColumnsResponse = JsonResponse<'/api/v1/pg_meta/getPgTableColumns', 'get'>
export async function getPgMetaGetPgTableColumns(args: GetPgMetaGetPgTableColumnsArgs) {
  const response = await request<GetPgMetaGetPgTableColumnsResponse>({
    method: 'get',
    url: '/pg_meta/getPgTableColumns',
    params: args.query,
  })
  return response.data
}

/** 获取表行数 */
export type GetPgMetaGetPgTableCountQuery = paths['/api/v1/pg_meta/getPgTableCount']['get']['parameters']['query']
export interface GetPgMetaGetPgTableCountArgs {
  query?: GetPgMetaGetPgTableCountQuery
}
export type GetPgMetaGetPgTableCountResponse = JsonResponse<'/api/v1/pg_meta/getPgTableCount', 'get'>
export async function getPgMetaGetPgTableCount(args: GetPgMetaGetPgTableCountArgs) {
  const response = await request<GetPgMetaGetPgTableCountResponse>({
    method: 'get',
    url: '/pg_meta/getPgTableCount',
    params: args.query,
  })
  return response.data
}

/** 分页查询表数据 */
export type GetPgMetaGetPgTableRowsQuery = paths['/api/v1/pg_meta/getPgTableRows']['get']['parameters']['query']
export interface GetPgMetaGetPgTableRowsArgs {
  query?: GetPgMetaGetPgTableRowsQuery
}
export type GetPgMetaGetPgTableRowsResponse = JsonResponse<'/api/v1/pg_meta/getPgTableRows', 'get'>
export async function getPgMetaGetPgTableRows(args: GetPgMetaGetPgTableRowsArgs) {
  const response = await request<GetPgMetaGetPgTableRowsResponse>({
    method: 'get',
    url: '/pg_meta/getPgTableRows',
    params: args.query,
  })
  return response.data
}

/** 获取所有表名 */
export type GetPgMetaListPgTablesResponse = JsonResponse<'/api/v1/pg_meta/listPgTables', 'get'>
export async function getPgMetaListPgTables() {
  const response = await request<GetPgMetaListPgTablesResponse>({
    method: 'get',
    url: '/pg_meta/listPgTables',
  })
  return response.data
}
